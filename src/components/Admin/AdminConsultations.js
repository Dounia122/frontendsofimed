import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './AdminConsultations.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faSearch,
  faFilter,
  faFile,
  faUser,
  faSpinner,
  faExclamationCircle,
  faInbox,
  faEye,
  faTimes,
  faDownload
} from '@fortawesome/free-solid-svg-icons';

// Composants séparés pour une meilleure maintenabilité
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

const AdminConsultations = () => {
  // États
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalFileUrl, setModalFileUrl] = useState(null);
  const [modalFileName, setModalFileName] = useState('');
  const [selectedCommercials, setSelectedCommercials] = useState({});
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [commercials, setCommercials] = useState([]);
  const [loadingCommercials, setLoadingCommercials] = useState(true);

  // Constantes
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

  // Formatage des statuts pour l'affichage
  const formatStatus = useCallback((status) => {
    const statusMap = {
      'EN_ATTENTE': 'En attente',
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé',
      'ANNULE': 'Annulé'
    };
    return statusMap[status] || status.replace('_', ' ');
  }, []);

  // Mémoization des données filtrées
  const filteredConsultations = useMemo(() => {
    return consultations.filter(consultation => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        consultation.userName?.toLowerCase().includes(searchLower) || 
        consultation.subject?.toLowerCase().includes(searchLower) ||
        consultation.message?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || 
                          consultation.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });
  }, [consultations, searchTerm, statusFilter]);

  // Fonctions memoizées
  // Remplacer la fonction getUserInitials
  const getUserInitials = useCallback((name) => {
  if (!name) return '??';
  
  const words = name.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  
  // Prendre la première lettre du prénom et du nom
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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

  // Effets
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingCommercials(true);
        setError(null);
        
        const [consultationsRes, commercialsRes] = await Promise.all([
          fetch(`${API_URL}/api/consultations`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/api/commercials`)
        ]);

        if (!consultationsRes.ok) {
          const errorData = await consultationsRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Erreur lors du chargement des consultations');
        }

        if (!commercialsRes.ok) {
          throw new Error('Erreur lors du chargement des commerciaux');
        }

        const [consultationsData, commercialsData] = await Promise.all([
          consultationsRes.json(),
          commercialsRes.json()
        ]);

        // Mise à jour du state avec les données des consultations
        setConsultations(consultationsData);
        setCommercials(commercialsData);
      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message || 'Une erreur est survenue');
        setConsultations([]);
        setCommercials([]);
      } finally {
        setLoading(false);
        setLoadingCommercials(false);
      }
    };

    fetchData();
  }, [API_URL]);

  // Handlers
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

  const handleAssignCommercial = async (consultationId) => {
    const selectedCommercial = selectedCommercials[consultationId];
    if (!selectedCommercial) {
      alert('Veuillez sélectionner un commercial');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/consultations/${consultationId}/assign-commercial/${selectedCommercial}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'affectation');
      }

      const selectedCommercialObj = commercials.find(c => c.id === parseInt(selectedCommercial));
      const commercialName = selectedCommercialObj 
        ? `${selectedCommercialObj.firstName} ${selectedCommercialObj.lastName}`
        : 'Commercial inconnu';

      setConsultations(prev => 
        prev.map(cons => 
          cons.id === consultationId 
            ? { ...cons, commercial: commercialName, status: 'EN_COURS' } 
            : cons
        )
      );

      setSelectedCommercials(prev => ({ ...prev, [consultationId]: '' }));
    } catch (error) {
      console.error('Erreur :', error);
      alert(error.message || 'Erreur lors de l\'affectation du commercial');
    }
  };

  const renderCommercialOptions = useMemo(() => {
    if (loadingCommercials) {
      return <option value="">Chargement des commerciaux...</option>;
    }

    return [
      <option key="default" value="">Sélectionner un commercial</option>,
      ...commercials.map(commercial => (
        <option key={commercial.id} value={commercial.id}>
          {commercial.firstName} {commercial.lastName}
        </option>
      ))
    ];
  }, [commercials, loadingCommercials]);

  return (
    <div className="admin-consultations-wrapper">
      <div className="admin-consultations-container">
        <header className="admin-consultations-header">
          <div className="title-section">
            <FontAwesomeIcon icon={faComments} className="title-icon" />
            <h1>Gestion des Consultations</h1>
          </div>
          
          <div className="filter-controls">
            <div className="search-input-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher par nom, objet ou message..."
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
                <option value="EN_ATTENTE">En attente</option>
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
                selectedCommercial={selectedCommercials[consultation.id]}
                onCommercialChange={(value) => 
                  setSelectedCommercials(prev => ({
                    ...prev,
                    [consultation.id]: value
                  }))
                }
                onAssign={() => handleAssignCommercial(consultation.id)}
                onViewMessage={() => openMessageModal(consultation.message)}
                onViewFile={() => consultation.fileName && openModal(consultation.fileName)}
                commercialOptions={renderCommercialOptions}
                loadingCommercials={loadingCommercials}
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
    </div>
  );
};

// Composant ConsultationCard séparé pour une meilleure lisibilité
const ConsultationCard = ({
  consultation,
  getUserInitials,
  formatDate,
  formatStatus,
  selectedCommercial,
  onCommercialChange,
  onAssign,
  onViewMessage,
  onViewFile,
  commercialOptions,
  loadingCommercials
}) => {
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
      
        <div className="action-buttons">
          {consultation.fileName && (
            <button
              className="document-button"
              onClick={onViewFile}
              aria-label="Voir le document"
            >
              <FontAwesomeIcon icon={faFile} />
              Voir le document
            </button>
          )}
          
          {consultation.status === 'EN_ATTENTE' && (
            <div className="assign-section">
              <select
                value={selectedCommercial || ''}
                onChange={(e) => onCommercialChange(e.target.value)}
                className="commercial-select"
                disabled={loadingCommercials}
                aria-label="Sélectionner un commercial"
              >
                {commercialOptions}
              </select>
      
              <button
                className="action-button assign-button"
                onClick={onAssign}
                disabled={!selectedCommercial}
                aria-label="Affecter le commercial"
              >
                <FontAwesomeIcon icon={faUser} />
                Affecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ConsultationCard.propTypes = {
  consultation: PropTypes.shape({
    id: PropTypes.number.isRequired,
    user: PropTypes.shape({
      fullName: PropTypes.string,
      email: PropTypes.string,
      phoneNumber: PropTypes.string
    }),
    userName: PropTypes.string,
    createdAt: PropTypes.string,
    status: PropTypes.oneOf(['EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ANNULE']),
    subject: PropTypes.string,
    message: PropTypes.string,
    fileName: PropTypes.string,
    filePath: PropTypes.string,
    commercial: PropTypes.string
  }).isRequired,
  getUserInitials: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
  formatStatus: PropTypes.func.isRequired,
  selectedCommercial: PropTypes.string,
  onCommercialChange: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  onViewMessage: PropTypes.func.isRequired,
  onViewFile: PropTypes.func.isRequired,
  commercialOptions: PropTypes.array.isRequired,
  loadingCommercials: PropTypes.bool.isRequired
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

export default AdminConsultations;