import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './CommercialConsultations.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faSearch,
  faFilter,
  faFile,
  faSpinner,
  faExclamationCircle,
  faInbox,
  faEye,
  faTimes,
  faDownload,
  faReply
} from '@fortawesome/free-solid-svg-icons';

// Composants d'état
const LoadingView = () => (
  <div className="cc-loading">
    <FontAwesomeIcon icon={faSpinner} spin className="cc-loading-icon" />
    <p>Chargement des consultations...</p>
  </div>
);

const ErrorView = ({ error }) => (
  <div className="cc-empty">
    <FontAwesomeIcon icon={faExclamationCircle} className="cc-error-icon" />
    <p>Une erreur est survenue : {error}</p>
  </div>
);

const EmptyView = () => (
  <div className="cc-empty">
    <FontAwesomeIcon icon={faInbox} className="cc-empty-icon" />
    <p>Aucune consultation trouvée</p>
  </div>
);

// Modals
const MessageViewer = ({ message, onClose }) => (
  <div className="cc-modal-overlay" onClick={onClose}>
    <div className="cc-modal cc-message-modal" onClick={(e) => e.stopPropagation()}>
      <button className="cc-modal-close" onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <div className="cc-modal-header">
        <h3>Message complet</h3>
      </div>
      <div className="cc-modal-body">
        {message}
      </div>
    </div>
  </div>
);

const FileViewer = ({ fileUrl, fileName, onClose }) => {
  const fileExtension = useMemo(() => fileName?.split('.').pop().toLowerCase(), [fileName]);
  const isImage = useMemo(() => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension), [fileExtension]);
  const isPDF = useMemo(() => fileExtension === 'pdf', [fileExtension]);

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cc-modal-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <div className="cc-modal-header">
          <h3>{fileName}</h3>
        </div>
        <div className="cc-modal-body">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="cc-modal-img" />
          ) : isPDF ? (
            <iframe src={fileUrl} title="Document PDF" className="cc-modal-pdf" />
          ) : (
            <div className="cc-unsupported-file">
              <FontAwesomeIcon icon={faFile} size="3x" />
              <p>Prévisualisation non disponible pour ce type de fichier</p>
            </div>
          )}
        </div>
        <div className="cc-modal-footer">
          <a href={fileUrl} className="cc-modal-dl" download>
            <FontAwesomeIcon icon={faDownload} />
            Télécharger
          </a>
        </div>
      </div>
    </div>
  );
};

const ConsultationItem = ({
  consultation,
  getUserInitials,
  formatDate,
  formatStatus,
  onViewMessage,
  onViewFile,
  onReply
}) => {
  const [replyText, setReplyText] = useState('');
  return (
    <div className="cc-card">
      <div className="cc-card-header">
        <div className="cc-client-info">
          <div className="cc-client-avatar">
            {getUserInitials(consultation.client?.firstName + ' ' + consultation.client?.lastName)}
          </div>
          <div>
            <h3>{consultation.client?.firstName || ''} {consultation.client?.lastName || ''}</h3>
            <small>{formatDate(consultation.createdAt)}</small>
          </div>
        </div>
        <span className={`cc-status cc-status-${consultation.status?.toLowerCase()}`}>
          {formatStatus(consultation.status)}
        </span>
      </div>
      
      <div className="cc-card-body">
        <div className="cc-meta">
          <div className="cc-meta-item">
            <strong>Objet :</strong>
            <span>{consultation.subject || 'Non spécifié'}</span>
          </div>
        </div>
      
        <div className="cc-message-preview">
          <p>{consultation.message?.substring(0, 200) || 'Aucun message'}...</p>
          <button
            className="cc-view-btn"
            onClick={onViewMessage}
            aria-label="Voir le message complet"
          >
            <FontAwesomeIcon icon={faEye} />
            Voir le message complet
          </button>
        </div>

        {consultation.fileName && (
          <div className="cc-file-section">
            <button
              className="cc-file-btn"
              onClick={onViewFile}
              aria-label="Voir le document"
            >
              <FontAwesomeIcon icon={faFile} />
              Voir le document
            </button>
          </div>
        )}

        {consultation.status === 'EN_COURS' && (
          <div className="cc-reply-section">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              rows={4}
              className="cc-reply-input"
            />
            <button
              className="cc-reply-btn"
              onClick={() => {
                onReply(consultation.id, replyText);
                setReplyText('');
              }}
              disabled={!replyText.trim()}
            >
              <FontAwesomeIcon icon={faReply} />
              Répondre
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const CommercialConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalFileUrl, setModalFileUrl] = useState(null);
  const [modalFileName, setModalFileName] = useState('');
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  const formatStatus = useCallback((status) => {
    const statusMap = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé'
    };
    return statusMap[status] || status.replace('_', ' ');
  }, []);

  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        consultation.client?.firstName?.toLowerCase().includes(searchLower) ||
        consultation.client?.lastName?.toLowerCase().includes(searchLower) ||
        consultation.subject?.toLowerCase().includes(searchLower) ||
        consultation.message?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || 
                          consultation.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchTerm, statusFilter]);

  const getUserInitials = useCallback((name) => {
    if (!name) return '';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user) {
          throw new Error('Non authentifié');
        }

        const commercialResponse = await fetch(`${API_URL}/api/commercials/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!commercialResponse.ok) {
          throw new Error('Erreur lors de la récupération des informations du commercial');
        }

        const commercialData = await commercialResponse.json();
        if (!commercialData || !commercialData.id) {
          throw new Error('ID du commercial non trouvé');
        }

        const response = await fetch(`${API_URL}/api/consultations/commercial/${commercialData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des consultations');
        }

        const data = await response.json();
        setConsultations(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [API_URL]);

  const handleReply = async (consultationId, replyText) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/consultations/${consultationId}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response: replyText })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la réponse');
      }

      const updatedConsultation = await response.json();
      setConsultations(prev =>
        prev.map(cons =>
          cons.id === consultationId ? updatedConsultation : cons
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'envoi de la réponse');
    }
  };

  const openModal = useCallback((fileName) => {
    if (!fileName) return;
    setModalFileUrl(`${API_URL}/api/consultations/download/${encodeURIComponent(fileName)}`);
    setModalFileName(fileName);
  }, [API_URL]);

  const closeModal = useCallback(() => {
    setModalFileUrl(null);
    setModalFileName('');
  }, []);

  const openMessageModal = useCallback((message) => {
    setSelectedMessage(message);
    setIsMessageModalOpen(true);
  }, []);

  const closeMessageModal = useCallback(() => {
    setSelectedMessage(null);
    setIsMessageModalOpen(false);
  }, []);

  return (
    <div className="cc-container">
      <header className="cc-header">
        <div className="cc-title-section">
          <FontAwesomeIcon icon={faComments} className="cc-title-icon" />
          <h1>Mes Consultations</h1>
        </div>
        
        <div className="cc-filters">
          <div className="cc-search-wrapper">
            <FontAwesomeIcon icon={faSearch} className="cc-search-icon" />
            <input
              type="text"
              className="cc-search-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Rechercher des consultations"
            />
          </div>
          <div className="cc-filter-wrapper">
            <FontAwesomeIcon icon={faFilter} className="cc-filter-icon" />
            <select
              className="cc-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrer par statut"
            >
              <option value="all">Tous les statuts</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINE">Terminé</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView error={error} />
      ) : filteredConsultations.length === 0 ? (
        <EmptyView />
      ) : (
        <div className="cc-grid">
          {filteredConsultations.map((consultation) => (
            <ConsultationItem
              key={consultation.id}
              consultation={consultation}
              getUserInitials={getUserInitials}
              formatDate={formatDate}
              formatStatus={formatStatus}
              onViewMessage={() => openMessageModal(consultation.message)}
              onViewFile={() => consultation.fileName && openModal(consultation.fileName)}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {modalFileUrl && (
        <FileViewer
          fileUrl={modalFileUrl}
          fileName={modalFileName}
          onClose={closeModal}
        />
      )}

      {isMessageModalOpen && (
        <MessageViewer
          message={selectedMessage}
          onClose={closeMessageModal}
        />
      )}
    </div>
  );
};

// PropTypes
ConsultationItem.propTypes = {
  consultation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    client: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string
    }),
    createdAt: PropTypes.string,
    status: PropTypes.string,
    subject: PropTypes.string,
    message: PropTypes.string,
    fileName: PropTypes.string
  }).isRequired,
  getUserInitials: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatStatus: PropTypes.func.isRequired,
  onViewMessage: PropTypes.func.isRequired,
  onViewFile: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired
};

MessageViewer.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

FileViewer.propTypes = {
  fileUrl: PropTypes.string,
  fileName: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

ErrorView.propTypes = {
  error: PropTypes.string.isRequired
};

export default CommercialConsultations;