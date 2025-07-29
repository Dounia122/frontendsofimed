import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faClock, faCheckCircle, 
  faTimesCircle, faTruck, faSearch, faEye,
  faSort, faSortUp, faSortDown, faFilter,
  faSync, faFileExport, faChevronLeft, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import './CommandeSuivi.css';

const COMMANDES_API_URL = 'http://localhost:8080/api/commandes';
const CLIENTS_API_URL = 'http://localhost:8080/api/clients';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Erreur de parsing du token:', e);
    return null;
  }
};

const CommandeSuivi = () => {
  const [clientId, setClientId] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');
  const [sortConfig, setSortConfig] = useState({ 
    field: 'dateCreation',
    direction: 'desc' 
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pagination, setPagination] = useState({ 
    currentPage: 1,
    pageSize: 10, 
    totalPages: 0, 
    totalElements: 0 
  });
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  const statusOptions = [
    { value: 'TOUS', label: 'Tous les statuts', icon: faFilter },
    { value: 'EN_ATTENTE', label: 'En attente', icon: faClock },
    { value: 'EN_COURS', label: 'En cours', icon: faTruck },
    { value: 'LIVREE', label: 'Livrée', icon: faCheckCircle },
    { value: 'ANNULEE', label: 'Annulée', icon: faTimesCircle }
  ];

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token) throw new Error('Token d\'authentification non trouvé');
        if (!user || !user.id) throw new Error('Informations utilisateur non trouvées');
        
        const userId = user.id;
        const response = await axios.get(`${CLIENTS_API_URL}/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data && response.data.id) {
          setClientId(response.data.id);
        } else {
          throw new Error('Client non trouvé pour cet utilisateur');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du client:', err);
        setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des informations client');
        setLoading(false);
      }
    };
    
    fetchClientId();
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const handler = setTimeout(() => {
      console.log('Debounced search term:', searchTerm);
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [debouncedSearchTerm, statusFilter, sortConfig]);

  // Fetch commandes
  useEffect(() => {
    const fetchCommandes = async () => {
      if (!clientId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.append('page', pagination.currentPage - 1);
        params.append('size', pagination.pageSize);
        
        params.append('sort', `${sortConfig.field},${sortConfig.direction}`);
        
        if (statusFilter && statusFilter !== 'TOUS') {
          params.append('status', statusFilter);
          console.log('Applied status filter:', statusFilter);
        }
        
        if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
          params.append('reference', debouncedSearchTerm.trim());
          console.log('Applied search term:', debouncedSearchTerm.trim());
        }
        
        const apiUrl = `${COMMANDES_API_URL}/client/${clientId}?${params.toString()}`;
        console.log('API Request URL:', apiUrl);
        
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Token d\'authentification non trouvé');
        
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API Response:', response.data);
        
        if (response.data) {
          setCommandes(response.data.content || []);
          setPagination(prev => ({
            ...prev,
            currentPage: (response.data.number || 0) + 1,
            totalPages: response.data.totalPages || 0,
            totalElements: response.data.totalElements || 0
          }));
          setLastUpdated(new Date());
        } else {
          throw new Error('Réponse invalide du serveur');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des commandes:', err);
        setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };
  
    fetchCommandes();
  }, [clientId, pagination.currentPage, pagination.pageSize, sortConfig, statusFilter, debouncedSearchTerm]);

  const handleSort = (field) => {
    const direction = sortConfig.field === field && sortConfig.direction === 'desc' 
      ? 'asc' 
      : 'desc';
    setSortConfig({ field, direction });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      if (dateString.length === 10) dateString += 'T00:00:00';
      const dateObj = new Date(dateString);
      if (isNaN(dateObj)) return 'Format invalide';
      return dateObj.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Erreur';
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      console.error('Erreur de formatage monétaire:', e);
      return '0,00 MAD';
    }
  };

  const getStatusLabel = (status) => {
    const statusInfo = statusOptions.find(opt => opt.value === status);
    return statusInfo ? statusInfo.label : status;
  };

  const getStatusIcon = (status) => {
    const statusInfo = statusOptions.find(opt => opt.value === status);
    return statusInfo ? <FontAwesomeIcon icon={statusInfo.icon} /> : null;
  };

  const toggleRowDetails = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const exportData = () => {
    try {
      const headers = "Référence,Statut,Date création,Montant,Livraison,Commercial\n";
      
      const csvRows = commandes.map(c => {
        const statutLabel = getStatusLabel(c.status);
        
        return `"${c.reference || 'N/A'}","${statutLabel}","${formatDate(c.dateCreation)}","${c.totalTTC || 'N/A'}","${formatDate(c.dateLivraisonSouhaitee)}","${c.commercial?.fullName || 'N/A'}"`
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + headers + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `commandes_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Erreur lors de l\'export:', e);
      alert('Erreur lors de l\'export des données');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      currentPage: 1
    }));
  };

  const resetFilters = () => {
    console.log('Resetting filters');
    setSearchTerm('');
    setStatusFilter('TOUS');
    setSortConfig({ field: 'dateCreation', direction: 'desc' });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilterChange = (newStatus) => {
    console.log('Status filter changed to:', newStatus);
    setStatusFilter(newStatus);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('Search term changed to:', value);
    setSearchTerm(value);
  };

  if (loading && !clientId) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement de vos informations...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn-retry"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="commande-suivi-container">
      <div className="page-header">
        <div className="header-content">
          <h2>
            <FontAwesomeIcon icon={faClipboardList} />
            Suivi de mes commandes
          </h2>
          <p>Consultez l'état de vos commandes en temps réel</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-refresh"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
            aria-label="Actualiser les données"
          >
            <FontAwesomeIcon icon={faSync} />
            Actualiser
          </button>
          
          <button 
            className="btn-export"
            onClick={exportData}
            disabled={commandes.length === 0}
          >
            <FontAwesomeIcon icon={faFileExport} />
            Exporter
          </button>
        </div>
      </div>

      {lastUpdated && (
        <div className="last-updated">
          Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
        </div>
      )}

      <div className="controls-section">
        <div className="search-bar">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input 
            type="text" 
            placeholder="Rechercher par référence..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Rechercher des commandes"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Effacer la recherche"
            >
              ×
            </button>
          )}
        </div>
        
        <div className="filters">
          <div className="status-filters">
            {statusOptions.map(option => (
              <button
                key={option.value}
                className={`status-filter ${
                  statusFilter === option.value ? 'active' : ''
                }`}
                onClick={() => handleStatusFilterChange(option.value)}
                aria-label={`Filtrer par ${option.label}`}
              >
                <FontAwesomeIcon icon={option.icon} />
                <span>{option.label}</span>
                {statusFilter === option.value && (
                  <span className="active-indicator">✓</span>
                )}
              </button>
            ))}
          </div>
    
        </div>
      </div>

      <div className="results-info">
        {pagination.totalElements} commande{pagination.totalElements !== 1 ? 's' : ''} trouvée{pagination.totalElements !== 1 ? 's' : ''}
      </div>

      <div className="table-and-pagination">
        {loading && clientId && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
        
        <div className="commandes-table">
          <div className="table-header">
            <div 
              className="header-cell sortable" 
              onClick={() => handleSort('reference')}
            >
              Référence
              {sortConfig.field === 'reference' ? (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} 
                  className="sort-icon"
                />
              ) : (
                <FontAwesomeIcon icon={faSort} className="sort-icon inactive" />
              )}
            </div>
            <div className="header-cell">Statut</div>
            <div 
              className="header-cell sortable" 
              onClick={() => handleSort('dateCreation')}
            >
              Date création
              {sortConfig.field === 'dateCreation' ? (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} 
                  className="sort-icon"
                />
              ) : (
                <FontAwesomeIcon icon={faSort} className="sort-icon inactive" />
              )}
            </div>
            <div 
              className="header-cell sortable" 
              onClick={() => handleSort('totalTTC')}
            >
              Montant
              {sortConfig.field === 'totalTTC' ? (
                <FontAwesomeIcon 
                  icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} 
                  className="sort-icon"
                />
              ) : (
                <FontAwesomeIcon icon={faSort} className="sort-icon inactive" />
              )}
            </div>
            <div className="header-cell">Livraison</div>
            <div className="header-cell">Actions</div>
          </div>

          <div className="table-body">
            {commandes.length === 0 ? (
              <div className="no-commandes">
                <div className="empty-state-icon">📭</div>
                <p>Aucune commande correspondante</p>
                <button 
                  className="btn-reset"
                  onClick={resetFilters}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              commandes.map(commande => (
                <React.Fragment key={commande.id}>
                  <div className="commande-row">
                    <div className="data-cell reference-cell">
                      <span className="mobile-label">Référence:</span>
                      {commande.reference || 'N/A'}
                    </div>
                    <div className="data-cell">
                      <span className="mobile-label">Statut:</span>
                      <span className={`status-badge ${commande.status?.toLowerCase() || 'unknown'}`}>
                        {getStatusIcon(commande.status)}
                        {getStatusLabel(commande.status)}
                      </span>
                    </div>
                    <div className="data-cell">
                      <span className="mobile-label">Création:</span>
                      {formatDate(commande.dateCreation)}
                    </div>
                    <div className="data-cell amount-cell">
                      <span className="mobile-label">Montant:</span>
                      <span className="amount">
                        {commande.totalTTC ? formatCurrency(commande.totalTTC) : 'N/A'}
                      </span>
                    </div>
                    <div className="data-cell">
                      <span className="mobile-label">Livraison:</span>
                      {formatDate(commande.dateLivraisonSouhaitee)}
                    </div>
                    <div className="data-cell action-cell">
                      <button 
                        className={`btn-view ${expandedRow === commande.id ? 'active' : ''}`}
                        onClick={() => toggleRowDetails(commande.id)}
                      >
                        <FontAwesomeIcon icon={faEye} />
                        <span>{expandedRow === commande.id ? 'Fermer' : 'Détails'}</span>
                      </button>
                    </div>
                  </div>

                  {expandedRow === commande.id && (
                    <div className="commande-details">
                      <div className="detail-section">
                        <h4>Informations client</h4>
                        <p>
                          <strong>Client:</strong> 
                          {commande.client?.firstName} {commande.client?.lastName}
                        </p>
                        <p><strong>Téléphone:</strong> {commande.client?.phone || 'N/A'}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h4>Informations commercial</h4>
                        <p><strong>Commercial:</strong> {commande.commercial?.fullName || 'N/A'}</p>
                        <p><strong>Email:</strong> {commande.commercial?.email || 'N/A'}</p>
                        <p><strong>Téléphone:</strong> {commande.commercial?.phone || 'N/A'}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h4>Détails de la commande</h4>
                        <p><strong>Référence:</strong> {commande.reference || 'N/A'}</p>
                        <p><strong>Statut:</strong> {getStatusLabel(commande.status)}</p>
                        <p><strong>Date création:</strong> {formatDate(commande.dateCreation)}</p>
                        <p><strong>Total HT:</strong> {commande.totalHT ? formatCurrency(commande.totalHT) : 'N/A'}</p>
                        <p><strong>TVA:</strong> {commande.montantTVA ? formatCurrency(commande.montantTVA) : 'N/A'}</p>
                        <p><strong>Total TTC:</strong> {commande.totalTTC ? formatCurrency(commande.totalTTC) : 'N/A'}</p>
                      </div>
                      
                      {commande.devis && (
                        <div className="detail-section">
                          <h4>Détails du devis</h4>
                          <p><strong>Référence:</strong> {commande.devis.reference || 'N/A'}</p>
                          <p><strong>Méthode de paiement:</strong> {commande.devis.paymentMethod || 'N/A'}</p>
                          <p><strong>Commentaire:</strong> {commande.devis.commentaire || 'Aucun'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Page {pagination.currentPage} sur {pagination.totalPages}
              <span className="total-info"> - {pagination.totalElements} résultats</span>
            </div>
            
            <div className="pagination-buttons">
              <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="pagination-btn"
              >
                  <FontAwesomeIcon icon={faChevronLeft} />
                  Précédent
              </button>
              
              <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="pagination-btn"
              >
                  Suivant
                  <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
            
            <div className="page-size-selector">
              <label>Afficher :</label>
              <select
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                aria-label="Nombre de résultats par page"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandeSuivi;