import React, { useState, useEffect } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader, MessageCircle, Clock, Download, ThumbsUp, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import './DemandeConsultation.css';

const DemandeConsultation = () => {
  const [userData, setUserData] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
    }
    
    // Fetch previous consultations
    fetchConsultations();

    // Configurer le rafraîchissement automatique
    const interval = setInterval(() => {
      fetchConsultations();
    }, 30000);

    // Cleanup function
    return () => {
      clearInterval(interval);
    };
  }, []); // Dépendances vides car nous voulons que cela se produise uniquement au montage

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setConsultations(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des consultations:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Vérification de la taille (limite à 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale: 5MB');
        return;
      }
      
      // Vérification du type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Type de fichier non supporté. Types acceptés: PDF, DOCX, JPG, PNG');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!subject.trim()) {
      setError('Veuillez saisir un sujet pour votre demande');
      return;
    }
  
    if (!message.trim()) {
      setError('Veuillez saisir un message pour votre demande');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      if (file) {
        formData.append('file', file);
      }
      
      // Ajout des infos utilisateur
      if (userData) {
        formData.append('userId', userData.id);
        formData.append('username', userData.username);
      }
  
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/consultations', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setSuccess(true);
      setSubject('');
      setMessage('');
      setFile(null);
      setFileName('');
  
      // Rafraîchir la liste des consultations
      await fetchConsultations();
  
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      setError(err.response?.data || 'Une erreur est survenue lors de l\'envoi de votre demande');
    } finally {
      setLoading(false);
    }
  };
  

  const formatDate = (dateString) => {
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
    switch (status) {
      case 'PENDING':
        return <Clock size={14} />;
      case 'IN_PROGRESS':
        return <RefreshCw size={14} />;
      case 'COMPLETED':
        return <CheckCircle2 size={14} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'IN_PROGRESS':
        return 'En traitement';
      case 'COMPLETED':
        return 'Complétée';
      default:
        return 'Fermée';
    }
  };

  // Ajouter un état pour gérer les réponses lues
  const [readResponses, setReadResponses] = useState(new Set());

  // Marquer une réponse comme lue
  const markResponseAsRead = (responseId) => {
    setReadResponses(prev => new Set([...prev, responseId]));
  };

  // Vérifier si une réponse est nouvelle (non lue)
  const isResponseNew = (responseId) => {
    return !readResponses.has(responseId);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshConsultations = async () => {
    setIsRefreshing(true);
    try {
      await fetchConsultations();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dans la section des consultations précédentes, ajouter le bouton de rafraîchissement
  return (
    <div className="consultation-container">
      <header className="consultation-header">
        <h2>Demande de Consultation</h2>
        <button 
          className="refresh-all-button" 
          onClick={handleRefreshConsultations}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader size={16} className="spinner" />
              <span>Rafraîchissement...</span>
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              <span>Rafraîchir les réponses</span>
            </>
          )}
        </button>
      </header>
      
      <div className="consultation-content">
        <div className="consultation-form-container">
          <h3>Nouvelle demande</h3>
          
          {success && (
            <div className="success-message">
              <CheckCircle size={20} />
              <span>Votre demande a été envoyée avec succès!</span>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="consultation-form">
            <div className="form-group">
              <label htmlFor="subject">Sujet</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Demande d'information sur les pompes industrielles"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                disabled={loading}
              />
            </div>
            
            // Dans le rendu du composant, modifier la section d'upload de fichier :
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
                  style={{ display: 'none' }}
                />
                <div 
                  className="file-upload-button"
                  onClick={() => document.getElementById('file').click()}
                >
                  <FileUp size={20} />
                  <span>Sélectionner un fichier</span>
                </div>
                {fileName && (
                  <div className="file-name">
                    <FileUp size={16} />
                    <span>{fileName}</span>
                  </div>
                )}
              </div>
              <p className="file-info">
                Formats acceptés: PDF, DOCX, JPG, PNG (Max: 5MB)
              </p>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spinner" />
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
        
        <div className="previous-consultations">
          <h3>Mes demandes précédentes</h3>
          
          {consultations.length === 0 ? (
            <div className="empty-consultations">
              <MessageCircle size={32} />
              <p>Vous n'avez pas encore effectué de demande de consultation.</p>
            </div>
          ) : (
            <div className="consultations-list">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="consultation-card">
                  <div className="consultation-card-header">
                    <div className="consultation-card-title">
                      {consultation.subject}
                    </div>
                    <span className={`status ${consultation.status.toLowerCase()}`}>
                      {getStatusIcon(consultation.status)}
                      <span>{getStatusText(consultation.status)}</span>
                    </span>
                  </div>
                  
                  <div className="consultation-card-content">
                    <div className="consultation-meta">
                      <div className="consultation-meta-item">
                        <Calendar size={14} />
                        <span>Créée le {formatDate(consultation.createdAt)}</span>
                      </div>
                      {consultation.updatedAt !== consultation.createdAt && (
                        <div className="consultation-meta-item">
                          <RefreshCw size={14} />
                          <span>Mise à jour le {formatDate(consultation.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="consultation-message">
                      {consultation.message}
                    </div>
                    
                    {consultation.fileUrl && (
                      <div className="consultation-attachments">
                        <a 
                          href={`http://localhost:8080/api/consultations/files/${consultation.id}`}
                          className="attachment-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileUp size={14} />
                          <span>Pièce jointe de la demande</span>
                        </a>
                      </div>
                    )}

                    {consultation.responses && consultation.responses.length > 0 ? (
                      <div className="consultation-responses">
                        <div className="responses-header">
                          <h4 className="responses-title">
                            <MessageCircle size={16} />
                            <span>Réponses ({consultation.responses.length})</span>
                          </h4>
                          <button 
                            className="refresh-button" 
                            onClick={() => fetchConsultations()}
                            title="Rafraîchir les réponses"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                        {consultation.responses.map((response, index) => (
                          <div 
                            key={response.id || index} 
                            className={`consultation-response ${isResponseNew(response.id) ? 'new-response' : ''}`}
                            onClick={() => markResponseAsRead(response.id)}
                          >
                            <div className="consultation-response-header">
                              <div className="consultation-response-title">
                                <div className="response-author">
                                  <ThumbsUp size={14} />
                                  <span>{response.author || 'Commercial'}</span>
                                </div>
                                {isResponseNew(response.id) && (
                                  <span className="new-response-badge">Nouveau</span>
                                )}
                              </div>
                              <span className="consultation-response-date">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                            
                            <div className="consultation-response-content">
                              <p>{response.content}</p>
                            </div>

                            {response.attachments && response.attachments.length > 0 && (
                              <div className="response-attachments">
                                <h5 className="attachments-title">
                                  <FileUp size={14} />
                                  <span>Pièces jointes</span>
                                </h5>
                                <div className="attachments-grid">
                                  {response.attachments.map((attachment, i) => (
                                    <a
                                      key={i}
                                      href={`http://localhost:8080/api/consultations/files/${attachment.id}`}
                                      className="attachment-card"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <div className="attachment-icon">
                                        <FileUp size={24} />
                                      </div>
                                      <div className="attachment-info">
                                        <span className="attachment-name">{attachment.name}</span>
                                        <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                                      </div>
                                      <Download size={16} className="download-icon" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : consultation.status === 'PENDING' ? (
                      <div className="awaiting-response">
                        <Clock size={14} />
                        <span>En attente d'une réponse de notre équipe...</span>
                      </div>
                    ) : null}
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

// Fonction utilitaire pour formater la taille des fichiers
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};
