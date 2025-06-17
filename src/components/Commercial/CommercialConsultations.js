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
const LoadingState = () => (
  <div className="loading-state">
    <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
    <p>Chargement des consultations...</p>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="empty-state">
    <FontAwesomeIcon icon={faExclamationCircle} className="error-icon" />
    <p>Une erreur est survenue : {error}</p>
  </div>
);

const EmptyState = () => (
  <div className="empty-state">
    <FontAwesomeIcon icon={faInbox} className="empty-icon" />
    <p>Aucune consultation trouvée</p>
  </div>
);

// Modals
const MessageModal = ({ message, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content message-modal" onClick={(e) => e.stopPropagation()}>
      <button className="modal-close-button" onClick={onClose}>
        <FontAwesomeIcon icon={faTimes} />
      </button>
      <div className="modal-header">
        <h3>Message complet</h3>
      </div>
      <div className="modal-body message-body">
        {message}
      </div>
    </div>
  </div>
);

const FilePreviewModal = ({ fileUrl, fileName, onClose }) => {
  const fileExtension = useMemo(() => fileName?.split('.').pop().toLowerCase(), [fileName]);
  const isImage = useMemo(() => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension), [fileExtension]);
  const isPDF = useMemo(() => fileExtension === 'pdf', [fileExtension]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <div className="modal-header">
          <h3>{fileName}</h3>
        </div>
        <div className="modal-body">
          {isImage ? (
            <img src={fileUrl} alt={fileName} className="modal-image" />
          ) : isPDF ? (
            <iframe src={fileUrl} title="Document PDF" className="modal-pdf" />
          ) : (
            <div className="unsupported-file">
              <FontAwesomeIcon icon={faFile} size="3x" />
              <p>Prévisualisation non disponible pour ce type de fichier</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <a href={fileUrl} className="modal-download" download>
            <FontAwesomeIcon icon={faDownload} />
            Télécharger
          </a>
        </div>
      </div>
    </div>
  );
};

const ConsultationCard = ({
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
    <div className="consultation-card">
      <div className="consultation-header">
        <div className="user-info">
          <div className="user-avatar">
            {getUserInitials(consultation.client?.firstName + ' ' + consultation.client?.lastName)}
          </div>
          <div>
            <h3>{consultation.client?.firstName || ''} {consultation.client?.lastName || ''}</h3>
            <small>{formatDate(consultation.createdAt)}</small>
          </div>
        </div>
        <span className={`status ${consultation.status?.toLowerCase()}`}>
          {formatStatus(consultation.status)}
        </span>
      </div>
      
      <div className="consultation-content">
        <div className="consultation-meta">
          <div className="meta-item">
            <strong>Objet :</strong>
            <span>{consultation.subject || 'Non spécifié'}</span>
          </div>
        </div>
      
        <div className="consultation-message">
          <p>{consultation.message?.substring(0, 200) || 'Aucun message'}...</p>
          <button
            className="view-more-button"
            onClick={onViewMessage}
            aria-label="Voir le message complet"
          >
            <FontAwesomeIcon icon={faEye} />
            Voir le message complet
          </button>
        </div>

        {consultation.fileName && (
          <div className="file-section">
            <button
              className="document-button"
              onClick={onViewFile}
              aria-label="Voir le document"
            >
              <FontAwesomeIcon icon={faFile} />
              Voir le document
            </button>
          </div>
        )}

        {consultation.status === 'EN_COURS' && (
          <div className="reply-section">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              rows={4}
              className="reply-textarea"
            />
            <button
              className="reply-button"
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

        // Récupérer d'abord l'ID du commercial
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

        // Récupérer les consultations du commercial
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
    <div className="commercial-consultations-container">
      <header className="commercial-consultations-header">
        <div className="title-section">
          <FontAwesomeIcon icon={faComments} className="title-icon" />
          <h1>Mes Consultations</h1>
        </div>
        <div className="filter-controls">
          <div className="search-input-wrapper">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Rechercher des consultations"
            />
          </div>
          <div className="filter-select-wrapper">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select
              className="status-filter"
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
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : filteredConsultations.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="consultations-grid">
          {filteredConsultations.map((consultation) => (
            <ConsultationCard
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
        <FilePreviewModal
          fileUrl={modalFileUrl}
          fileName={modalFileName}
          onClose={closeModal}
        />
      )}

      {isMessageModalOpen && (
        <MessageModal
          message={selectedMessage}
          onClose={closeMessageModal}
        />
      )}
    </div>
  );
};

// PropTypes
ConsultationCard.propTypes = {
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

MessageModal.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

FilePreviewModal.propTypes = {
  fileUrl: PropTypes.string,
  fileName: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

ErrorState.propTypes = {
  error: PropTypes.string.isRequired
};

export default CommercialConsultations;