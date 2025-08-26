import React, { useState, useEffect, useCallback } from 'react';
import {
  FileUp, Send, AlertCircle, CheckCircle, Loader, 
  MessageCircle, Clock, Download, ThumbsUp, 
  Calendar, RefreshCw, CheckCircle2, X, FileText
} from 'lucide-react';
import axios from 'axios';
import './DemandeConsultation.css';
import notificationService from '../../services/notificationService';

const DemandeConsultation = () => {
  // États
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    file: null
  });
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readResponses, setReadResponses] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Récupérer l'utilisateur au montage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) setUserData(user);
    fetchConsultations();
  }, []);

  // Rafraîchissement automatique
  useEffect(() => {
    const interval = setInterval(fetchConsultations, 30000); // 30s au lieu de 5s
    return () => clearInterval(interval);
  }, []);

  // Fonction pour récupérer les consultations
  const fetchConsultations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/consultations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const consultationsWithResponses = await Promise.all(
        response.data.map(async (consultation) => {
          try {
            const responseRes = await axios.get(
              `http://localhost:8080/api/consultations/${consultation.id}/response`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            return {
              ...consultation,
              response: responseRes.data.response,
              responseDate: responseRes.data.responseDate,
              status: responseRes.data.status || consultation.status || 'EN_ATTENTE'
            };
          } catch (error) {
            return { ...consultation, status: consultation.status || 'EN_ATTENTE' };
          }
        })
      );
      
      setConsultations(consultationsWithResponses);
    } catch (err) {
      console.error('Erreur lors du chargement des consultations:', err);
      setError('Impossible de charger les consultations. Veuillez réessayer.');
    }
  }, []);

  // Gestion des changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Gestion des fichiers
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validation du fichier
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux (max 5MB)');
      return;
    }
    
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Type de fichier non supporté (PDF, DOCX, JPG, PNG uniquement)');
      return;
    }
    
    setFormData(prev => ({ ...prev, file: selectedFile }));
    setFileName(selectedFile.name);
    setError('');
  };

  // Supprimer le fichier sélectionné
  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setFileName('');
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validation
    if (!formData.subject.trim()) {
      setError('Veuillez saisir un sujet');
      return;
    }
  
    if (!formData.message.trim()) {
      setError('Veuillez saisir un message');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const data = new FormData();
      data.append('subject', formData.subject);
      data.append('message', formData.message);
      if (formData.file) data.append('file', formData.file);
      
      if (userData) {
        data.append('userId', userData.id);
        data.append('username', userData.username);
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/consultations', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Envoi des notifications à l'administrateur
      try {
        const senderName = userData?.username || 'Client';
        
        // Notification via API REST
        await axios.post('http://localhost:8080/api/notifications/', {
          userId: 22, // ID de l'administrateur
          type: 'new_consultation',
          title: 'Nouvelle demande de consultation',
          message: `Nouvelle consultation créée : ${formData.subject}`,
          senderName: senderName,
          link: `/admin/consultations/${response.data.id}`
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Notification via WebSocket
        if (notificationService.isConnected()) {
          notificationService.sendNotification(
            `/topic/notifications/22`,
            {
              type: 'new_consultation',
              title: 'Nouvelle demande de consultation',
              message: `Nouvelle consultation créée : ${formData.subject}`,
              userId: 22,
              senderId: userData?.id,
              senderName: senderName,
              data: response.data
            }
          );
        }
      } catch (notifError) {
        console.error('Erreur lors de l\'envoi de la notification:', notifError);
      }
      
      // Réinitialisation et feedback
      setSuccess(true);
      setFormData({ subject: '', message: '', file: null });
      setFileName('');
      await fetchConsultations();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonctions utilitaires
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'TERMINE':
        return <CheckCircle2 size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'TERMINE':
        return 'Répondu';
      default:
        return 'En attente';
    }
  };

  const markResponseAsRead = (consultationId) => {
    setReadResponses(prev => new Set([...prev, consultationId]));
  };

  const isResponseNew = (consultationId) => {
    return consultationId && !readResponses.has(consultationId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchConsultations();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrage des consultations amélioré
  const filteredConsultations = consultations.filter(consultation => {
    const searchTermNormalized = searchTerm.toLowerCase().trim();
    const status = consultation.status?.toUpperCase() || 'PENDING';

    // Filtre par statut
    const matchesStatus = 
      activeTab === 'all' ||
      (activeTab === 'pending' && status !== 'COMPLETED' && status !== 'TERMINE') ||
      (activeTab === 'completed' && (status === 'COMPLETED' || status === 'TERMINE'));

    if (!matchesStatus) return false;

    // Si pas de terme de recherche, retourner le résultat du filtre par statut
    if (!searchTermNormalized) return true;

    // Recherche dans tous les champs pertinents
    const searchableFields = [
      consultation.subject?.toLowerCase() || '',
      consultation.message?.toLowerCase() || '',
      consultation.response?.toLowerCase() || '',
      formatDate(consultation.createdAt)?.toLowerCase() || '',
      formatDate(consultation.responseDate)?.toLowerCase() || ''
    ];

    return searchableFields.some(field => field.includes(searchTermNormalized));
  });

  // Tri des consultations par date
  const sortedConsultations = [...filteredConsultations].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Dans le rendu, remplacer filteredConsultations par sortedConsultations
  return (
    <div className="consultation-container">
      <header className="consultation-header">
        <h2>
          <MessageCircle size={24} />
          <span>Demandes de consultation</span>
        </h2>
        <div className="header-actions">
       
        </div>
      </header>
      
      <div className="consultation-content">
        <div className="consultation-form-container">
          <h3>Nouvelle demande</h3>
          
          {success && (
            <div className="alert success">
              <CheckCircle size={20} />
              <span>Demande envoyée avec succès!</span>
            </div>
          )}
          
          {error && (
            <div className="alert error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="consultation-form">
            <div className="form-group">
              <label htmlFor="subject">Sujet *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Ex: Demande d'information sur les pompes industrielles"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="file">Pièce jointe (optionnel)</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={loading}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="file" className="file-upload-button">
                  <FileUp size={18} />
                  <span>{fileName || 'Sélectionner un fichier'}</span>
                </label>
                {fileName && (
                  <button type="button" onClick={removeFile} className="file-remove">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="file-info">
                <small>Formats: PDF, DOCX, JPG, PNG (Max: 5MB)</small>
                {formData.file && (
                  <small>Taille: {(formData.file.size / 1024 / 1024).toFixed(2)} MB</small>
                )}
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Envoyer la demande</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="consultation-list-container">
          <div className="list-header">
            <h3>Historique des demandes</h3>
            <div className="list-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="tabs">
                <button 
                  className={activeTab === 'all' ? 'active' : ''}
                  onClick={() => setActiveTab('all')}
                >
                  Toutes
                </button>
                <button 
                  className={activeTab === 'pending' ? 'active' : ''}
                  onClick={() => setActiveTab('pending')}
                >
                  En attente
                </button>
                <button 
                  className={activeTab === 'completed' ? 'active' : ''}
                  onClick={() => setActiveTab('completed')}
                >
                  Répondues
                </button>
              </div>
            </div>
          </div>
          
          {filteredConsultations.length === 0 ? (
            <div className="empty-list">
              <FileText size={48} />
              <p>Aucune demande trouvée</p>
            </div>
          ) : (
            <div className="consultation-list">
              {filteredConsultations.map((consultation) => (
                <div 
                  key={consultation.id} 
                  className={`consultation-card ${consultation.status?.toLowerCase()}`}
                >
                  <div className="card-header">
                    <div className="card-title">
                      <h4>{consultation.subject}</h4>
                      <div className="card-meta">
                        <span className="date">
                          <Calendar size={14} />
                          {formatDate(consultation.createdAt)}
                        </span>
                        <span className={`status ${consultation.status?.toLowerCase()}`}>
                          {getStatusIcon(consultation.status)}
                          <span>{getStatusText(consultation.status)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="message">
                      <p className="label">Message :</p>
                      <p>{consultation.message}</p>
                    </div>
                    
                    {consultation.fileUrl && (
                      <div className="attachments">
                        <a 
                          href={`http://localhost:8080/api/consultations/files/${consultation.id}`}
                          className="attachment-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download size={14} />
                          <span>Télécharger la pièce jointe</span>
                        </a>
                      </div>
                    )}

                    {consultation.fileName && (
                      <div className="attachments">
                        <a 
                          href={`http://localhost:8080/api/consultations/download/${encodeURIComponent(consultation.fileName)}`}
                          className="attachment-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download size={14} />
                          <span>Télécharger la pièce jointe</span>
                        </a>
                      </div>
                    )}

                    {consultation.response ? (
                      <div 
                        className={`response ${isResponseNew(consultation.id) ? 'new' : ''}`}
                        onClick={() => markResponseAsRead(consultation.id)}
                      >
                        <div className="response-header">
                          <div className="response-title">
                            <div className="author">
                              <ThumbsUp size={14} />
                              <span>Réponse du commercial</span>
                            </div>
                            {isResponseNew(consultation.id) && (
                              <span className="badge">Nouveau</span>
                            )}
                          </div>
                          <span className="response-date">
                            {formatDate(consultation.responseDate)}
                          </span>
                        </div>
                        
                        <div className="response-content">
                          <p>{consultation.response}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="awaiting-response">
                        <Clock size={14} />
                        <span>En attente de réponse...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandeConsultation;