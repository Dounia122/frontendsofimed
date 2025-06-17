import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faExclamationCircle, faTimes, faShoppingBag, 
  faClock, faCheckCircle, faTimesCircle, faEuroSign, 
  faSearch, faFilter, faCalendarAlt, faListOl, 
  faSyncAlt, faEye, faCheck, faFileInvoice, 
  faUser, faIdCard, faEnvelope, faPhone, 
  faMapMarkerAlt, faBriefcase, faUserTie, faIdBadge, 
  faShoppingCart, faCalculator, faTruck, faCalendarDay
} from '@fortawesome/free-solid-svg-icons';
import './DevisAdmin.css';
import noImage from '../../assets/no-image.png';

const API_BASE_URL = 'http://localhost:8080/api';

const DevisAdmin = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCommandes, setTotalCommandes] = useState(0);
  const [processingId, setProcessingId] = useState(null);

  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showCommandeDetails, setShowCommandeDetails] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [activeCommande, setActiveCommande] = useState(null);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const fetchCommandes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const formatDateForAPI = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).toISOString().split('T')[0];
      };

      const token = localStorage.getItem('token');
      let endpoint = `${API_BASE_URL}/commandes`;
      let params = new URLSearchParams({
        page: currentPage,
        size: itemsPerPage
      });

      if (selectedStatus !== 'all') {
        endpoint = `${API_BASE_URL}/commandes/status/${selectedStatus}`;
      } else if (dateRange.startDate && dateRange.endDate) {
        endpoint = `${API_BASE_URL}/commandes/dates`;
        params.append('startDate', formatDateForAPI(dateRange.startDate));
        params.append('endDate', formatDateForAPI(dateRange.endDate));
      }

      const response = await axios.get(endpoint, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        let commandesData;
        let totalElements;

        if (Array.isArray(response.data)) {
          commandesData = response.data;
          totalElements = response.data.length;
        } else if (response.data.content) {
          commandesData = response.data.content;
          totalElements = response.data.totalElements;
        } else {
          throw new Error('Format de réponse non reconnu');
        }

        const transformedData = commandesData.map(commande => ({
          ...commande,
          client: {
            ...commande.client,
            nom: `${commande.client?.firstName || ''} ${commande.client?.lastName || ''}`.trim(),
            telephone: commande.client?.phone || '',
            email: commande.client?.email || 'N/A',
            adresse: commande.client?.adresse || 'N/A'
          },
          reference: commande.reference || `CMD-${commande.id}`,
          status: commande.status || 'EN_ATTENTE',
          produits: commande.produits || [],
          totalHT: commande.totalHT || calculateTotalHT(commande.produits),
          tva: commande.montantTVA || (commande.totalHT * 0.2) || calculateTotalHT(commande.produits) * 0.2,
          totalTTC: commande.totalTTC || (commande.totalHT * 1.2) || calculateTotalHT(commande.produits) * 1.2,
          createdAt: commande.dateCreation || commande.devis?.createdAt,
          dateLivraisonSouhaitee: commande.dateLivraisonSouhaitee // Ajout de ce champ
        }));

        setCommandes(transformedData);
        setTotalCommandes(totalElements || 0);
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          err.message || 
                          'Erreur lors du chargement des commandes';
      setError(errorMessage);
      setCommandes([]);
      setTotalCommandes(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedStatus, dateRange]);

  const calculateTotalHT = (produits) => {
    if (!produits || produits.length === 0) return 0;
    return produits.reduce((sum, item) => sum + (item.totalItem || 0), 0);
  };

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const handleStatusChange = async (commandeId, newStatus) => {
    try {
      setProcessingId(commandeId);
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/commandes/${commandeId}/status`, null, {
        params: { newStatus },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setCommandes(prevCommandes =>
          prevCommandes.map(commande =>
            commande.id === commandeId
              ? { ...commande, status: newStatus }
              : commande
          )
        );
      }
      
      await fetchCommandes();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCommandes = useMemo(() => {
    if (!searchTerm) return commandes;
    const searchLower = searchTerm.toLowerCase();
    return commandes.filter(
      (commande) =>
        commande?.reference?.toLowerCase().includes(searchLower) ||
        commande?.client?.nom?.toLowerCase().includes(searchLower)
    );
  }, [commandes, searchTerm]);

  const stats = useMemo(() => ({
    total: totalCommandes,
    enAttente: commandes.filter(c => c?.status === 'EN_ATTENTE').length,
    valide: commandes.filter(c => c?.status === 'VALIDEE').length,
    rejetee: commandes.filter(c => c?.status === 'REJETEE').length,
    montantTotal: commandes.reduce((sum, c) => sum + (c?.totalHT || 0), 0),
  }), [commandes, totalCommandes]);

  const totalPages = Math.ceil(totalCommandes / itemsPerPage);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement des commandes...</p>
    </div>
  );

  const handleViewCommande = async (commande) => {
    try {
      if (!commande || !commande.id) {
        setError("Données de commande invalides");
        return;
      }

      const token = localStorage.getItem('token');
      const commandeResponse = await axios.get(`${API_BASE_URL}/commandes/${commande.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const commandeDetails = commandeResponse.data;
      
      if (!commandeDetails.devis || !commandeDetails.devis.id) {
        setError("Aucun devis associé à cette commande");
        return;
      }

      const devisId = commandeDetails.devis.id;
      const productsResponse = await axios.get(`${API_BASE_URL}/devis/${devisId}/itemss`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const cartItems = productsResponse.data.map(item => ({
        ...item,
        imageUrl: item.imageUrl 
          ? require(`../../assets/products/${item.imageUrl}`)
          : require('../../assets/no-image.png')
      }));
      
      const totalHT = cartItems.reduce((sum, item) => sum + (item.totalItem || 0), 0);
      const tva = totalHT * 0.2;
      const totalTTC = totalHT + tva;

      setActiveCommande({
        ...commande,
        clientDetails: {
          firstName: commande.client?.firstName || commande.client?.nom?.split(' ')[0] || '',
          lastName: commande.client?.lastName || commande.client?.nom?.split(' ').slice(1).join(' ') || '',
          email: commande.client?.email || 'N/A',
          phone: commande.client?.phone || commande.client?.telephone || '',
          address: commande.client?.address || commande.client?.adresse || 'N/A'
        },
        commercial: commandeDetails.commercial,
        devisId: devisId,
        produits: cartItems,
        totalHT: totalHT,
        tva: tva,
        totalTTC: totalTTC
      });
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de la commande:', err);
      if (err.response?.status === 404) {
        setError("Commande ou devis non trouvé");
      } else {
        setError("Erreur lors de la récupération des détails de la commande");
      }
    }
  };

  const handleConfirmCommande = async () => {
    if (!activeCommande || !deliveryDate) {
      alert('Veuillez sélectionner une date de livraison');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.patch(`${API_BASE_URL}/commandes/${activeCommande.id}/status`, null, {
        params: { newStatus: 'VALIDEE' },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      await axios.patch(`${API_BASE_URL}/commandes/${activeCommande.id}/delivery-date`, null, {
        params: { deliveryDate: deliveryDate },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setShowConfirmModal(false);
      setDeliveryDate('');
      setActiveCommande(null);
      fetchCommandes();
      alert('Commande validée avec succès');
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation de la commande');
    }
  };

  return (
    <div className="commandes-admin-container">
      <h2 className="page-title">
        <FontAwesomeIcon icon={faClipboardList} className="title-icon" />
        Gestion des Commandes
      </h2>

      {error && (
        <div className="alert alert-error">
          <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <div className="dashboard-stats">
        <StatCard 
          title="Total" 
          value={stats.total} 
          icon={faShoppingBag}
          className="stat-card-primary"
        />
        <StatCard 
          title="En Attente" 
          value={stats.enAttente} 
          icon={faClock}
          className="stat-card-warning"
        />
        <StatCard 
          title="Validées" 
          value={stats.valide} 
          icon={faCheckCircle}
          className="stat-card-success"
        />
        <StatCard 
          title="Rejetées" 
          value={stats.rejetee} 
          icon={faTimesCircle}
          className="stat-card-danger"
        />
        <StatCard 
          title="CA (HT)" 
          value={`${stats.montantTotal.toFixed(2)} €`} 
          icon={faEuroSign}
          className="stat-card-info"
        />
      </div>

      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
        </div>

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            Statut :
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
          >
            <option value="all">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDEE">Validée</option>
            <option value="REJETEE">Rejetée</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
            Période :
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, startDate: e.target.value }));
              setCurrentPage(0);
            }}
          />
          <span>à</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => {
              setDateRange(prev => ({ ...prev, endDate: e.target.value }));
              setCurrentPage(0);
            }}
          />
        </div>


       
      </div>

      <div className="table-responsive">
        <table className="commandes-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Commercial</th>
              <th>Date de création</th>
              <th>Date Livraison Souhaitée </th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommandes.length === 0 ? (
              <tr><td colSpan="7" className="no-data">Aucune commande trouvée</td></tr>
            ) : filteredCommandes.map((commande) => (
              <tr key={commande.id} className="table-row">
                <td className="reference-cell">
                  <span className="reference-badge">{commande.reference || 'N/A'}</span>
                </td>
                <td>
                  <div className="client-info">
                    <div className="client-name">{commande.client?.nom || 'N/A'}</div>
                    <div className="client-email">{commande.client?.email || ''}</div>
                  </div>
                </td>
                <td>
                  <div className="commercial-info">
                    <div className="commercial-name">
                      {commande.commercial
                        ? `${commande.commercial.firstName} ${commande.commercial.lastName}`
                        : 'N/A'}
                    </div>
                    <div className="commercial-code">Code: {commande.commercial?.employeeCode || ''}</div>
                  </div>
                </td>
                <td className="date-cell">{formatDate(commande.createdAt)}</td>
                <td className="date-cell">{formatDate(commande.dateLivraisonSouhaitee)}</td>
                <td><StatusBadge status={commande.status} /></td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-view" onClick={() => handleViewCommande(commande)}>
                      <FontAwesomeIcon icon={faEye} /> Détails
                    </button>
                    {commande.status === 'EN_ATTENTE' && (
                      <>
                        <button
                          className="btn-validate"
                          onClick={() => handleStatusChange(commande.id, 'VALIDEE')}
                          disabled={processingId === commande.id}
                        >
                          <FontAwesomeIcon icon={faCheck} /> 
                          {processingId === commande.id ? '...' : 'Valider'}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleStatusChange(commande.id, 'REJETEE')}
                          disabled={processingId === commande.id}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          {processingId === commande.id ? '...' : 'Rejeter'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCommandeDetails && selectedCommande && (
        <div className="modal-overlay">
          <div className="modal-content commande-details">
            <div className="modal-header">
              <div className="modal-title">
                <FontAwesomeIcon icon={faFileInvoice} className="modal-title-icon" />
                <h2>Détails de la Commande</h2>
                <span className="reference">{selectedCommande.reference}</span>
              </div>
              <button className="modal-close" onClick={() => setShowCommandeDetails(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-sections">
                <div className="modal-section client-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faUser} />
                    <h3>Informations Client</h3>
                  </div>
                  <div className="section-content">
                    <div className="info-grid">
                      <div className="info-item">
                        <FontAwesomeIcon icon={faIdCard} />
                        <span className="label">Nom complet</span>
                        <span className="value">{selectedCommande.client?.nom}</span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <span className="label">Email</span>
                        <span className="value">{selectedCommande.client?.email}</span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faPhone} />
                        <span className="label">Téléphone</span>
                        <span className="value">{selectedCommande.client?.telephone}</span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faMapMarkerAlt} />
                        <span className="label">Adresse</span>
                        <span className="value">{selectedCommande.client?.adresse}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section commercial-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faBriefcase} />
                    <h3>Informations Commercial</h3>
                  </div>
                  <div className="section-content">
                    <div className="info-grid">
                      <div className="info-item">
                        <FontAwesomeIcon icon={faUserTie} />
                        <span className="label">Nom complet</span>
                        <span className="value">
                          {selectedCommande.commercial?.firstName} {selectedCommande.commercial?.lastName}
                        </span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faEnvelope} />
                        <span className="label">Email</span>
                        <span className="value">{selectedCommande.commercial?.email}</span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faPhone} />
                        <span className="label">Téléphone</span>
                        <span className="value">{selectedCommande.commercial?.phone}</span>
                      </div>
                      <div className="info-item">
                        <FontAwesomeIcon icon={faIdBadge} />
                        <span className="label">Code employé</span>
                        <span className="value">{selectedCommande.commercial?.employeeCode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section products-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faShoppingCart} />
                    <h3>Produits</h3>
                  </div>
                  <div className="section-content">
                    <div className="products-table-container">
                      <table className="products-table">
                        <thead>
                          <tr>
                            <th>Image</th>
                            <th>Référence</th>
                            <th>Désignation</th>
                            <th>Prix unitaire</th>
                            <th>Quantité</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCommande.produits?.map((produit, index) => (
                            <tr key={index}>
                              <td>
                                <div className="product-image">
                                  <img src={produit.imageUrl || noImage} alt={produit.designation} />
                                </div>
                              </td>
                              <td>{produit.reference}</td>
                              <td>{produit.designation}</td>
                              <td>{produit.prixUnitaire?.toFixed(2)} €</td>
                              <td>{produit.quantite}</td>
                              <td>{produit.totalItem?.toFixed(2)} €</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="modal-section totals-section">
                  <div className="section-header">
                    <FontAwesomeIcon icon={faCalculator} />
                    <h3>Récapitulatif</h3>
                  </div>
                  <div className="section-content">
                    <div className="totals-grid">
                      <div className="total-item">
                        <span className="label">Total HT</span>
                        <span className="value">{selectedCommande.totalHT?.toFixed(2)} €</span>
                      </div>
                      <div className="total-item">
                        <span className="label">TVA (20%)</span>
                        <span className="value">{selectedCommande.tva?.toFixed(2)} €</span>
                      </div>
                      <div className="total-item total-ttc">
                        <span className="label">Total TTC</span>
                        <span className="value">{selectedCommande.totalTTC?.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


<div className="modal-footer">
  <div className="modal-actions">
    <button
      className="modal-btn modal-btn-close"
      onClick={() => setShowConfirmModal(false)}
    >
      <FontAwesomeIcon icon={faTimes} />
      Fermer
    </button>
    <button
      className="modal-btn modal-btn-validate"
      onClick={handleConfirmCommande}
      disabled={!deliveryDate}
    >
      <FontAwesomeIcon icon={faCheck} />
      Valider
    </button>
    <button
      className="modal-btn modal-btn-reject"
      onClick={() => handleStatusChange(activeCommande.id, 'REJETEE')}
    >
      <FontAwesomeIcon icon={faTimes} />
      Rejeter
    </button>
  </div>
</div>

          </div>
        </div>
      )}

      {showConfirmModal && activeCommande && (
        <div className="modal-overlay">
          <div className="modal-content commande-details">
            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <h2><FontAwesomeIcon icon={faShoppingCart} /> Confirmation de Commande</h2>
            <div className="commande-ref">{activeCommande.reference}</div>
            
            <div className="confirm-section client-section">
              <h4><FontAwesomeIcon icon={faUser} /> Informations Client</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nom complet:</span>
                  <span className="info-value">{activeCommande.clientDetails?.firstName} {activeCommande.clientDetails?.lastName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{activeCommande.clientDetails?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Téléphone:</span>
                  <span className="info-value">{activeCommande.clientDetails?.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Adresse:</span>
                  <span className="info-value">{activeCommande.clientDetails?.address}</span>
                </div>
              </div>
            </div>
        
            <div className="confirm-section commercial-section">
              <h4><FontAwesomeIcon icon={faUserTie} /> Commercial</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nom:</span>
                  <span className="info-value">
                    {activeCommande.commercial?.firstName} {activeCommande.commercial?.lastName}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{activeCommande.commercial?.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Téléphone:</span>
                  <span className="info-value">{activeCommande.commercial?.phone}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Code:</span>
                  <span className="info-value">{activeCommande.commercial?.employeeCode}</span>
                </div>
              </div>
            </div>
        
            <div className="confirm-section products-section">
              <h4><FontAwesomeIcon icon={faShoppingCart} /> Détails des produits</h4>
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Référence</th>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Remise</th>
                      <th>Total HT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCommande.produits?.map((item) => (
                      <tr key={item.id}>
                        <td className="product-image-cell">
                          <img
                            src={item.imageUrl || noImage}
                            alt={item.nom}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = noImage;
                            }}
                          />
                        </td>
                        <td className="product-ref">{item.reference}</td>
                        <td className="product-name">{item.nom}</td>
                        <td className="product-qty">{item.quantity}</td>
                        <td className="product-price">{item.prixUnitaire?.toFixed(2)} MAD</td>
                        <td className="product-discount">{item.remisePourcentage}%</td>
                        <td className="product-total">{item.totalItem?.toFixed(2)} MAD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        
            <div className="confirm-section totals-section">
              <h4><FontAwesomeIcon icon={faEuroSign} /> Récapitulatif financier</h4>
              <div className="totals-grid">
                <div className="total-item">
                  <span className="total-label">Total HT:</span>
                  <span className="total-value">{activeCommande.totalHT?.toFixed(2)} MAD</span>
                </div>
                <div className="total-item">
                  <span className="total-label">TVA (20%):</span>
                  <span className="total-value">{activeCommande.tva?.toFixed(2)} MAD</span>
                </div>
                <div className="total-item grand-total">
                  <span className="total-label">Total TTC:</span>
                  <span className="total-value">{activeCommande.totalTTC?.toFixed(2)} MAD</span>
                </div>
              </div>
            </div>
        
            <div className="confirm-section delivery-note">
              <h4><FontAwesomeIcon icon={faTruck} /> Livraison</h4>
              <p className="delivery-note-text">Livraison à nos soins SOFIMED</p>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-close" onClick={() => setShowConfirmModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
                Fermer
              </button>
              {activeCommande.status === 'EN_ATTENTE' && (
                <>
                  <button 
                    className="modal-btn modal-btn-validate" 
                    onClick={handleConfirmCommande}
                    disabled={!activeCommande.dateLivraisonSouhaitee}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Valider la commande
                  </button>
                  <button 
                    className="modal-btn modal-btn-reject"
                    onClick={() => handleStatusChange(activeCommande.id, 'REJETEE')}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Rejeter la commande
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, className }) => (
  <div className={`stat-card ${className}`}>
    <div className="stat-icon">
      <FontAwesomeIcon icon={icon} />
    </div>
    <div className="stat-content">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.object.isRequired,
  className: PropTypes.string.isRequired
};

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'EN_ATTENTE':
        return { className: 'status-pending', text: 'En attente' };
      case 'VALIDEE':
        return { className: 'status-validated', text: 'Validée' };
      case 'REJETEE':
        return { className: 'status-rejected', text: 'Rejetée' };
      default:
        return { className: 'status-unknown', text: status };
    }
  };

  const config = getStatusConfig(status);
  return <span className={`status-badge ${config.className}`}>{config.text}</span>;
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired
};

export default DevisAdmin;