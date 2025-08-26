import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, faExclamationCircle, faTimes, faShoppingBag, 
  faClock, faCheckCircle, faTimesCircle, 
  faSearch, faFilter, faCalendarAlt, faListOl, 
  faSyncAlt, faEye, faCheck, faFileInvoice, 
  faUser, faIdCard, faEnvelope, faPhone, 
  faMapMarkerAlt, faBriefcase, faUserTie, faIdBadge, 
  faShoppingCart, faCalculator, faTruck, faCalendarDay,
  faMoneyBill
} from '@fortawesome/free-solid-svg-icons';
import './DevisAdmin.css';
import noImage from '../../assets/no-image.png';
import notificationService from '../../services/notificationService';

const API_BASE_URL = 'http://localhost:8080/api';

const DevisAdmin = () => {
  // Fonction de formatage MAD
  const formatMAD = (value) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
  
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
  
  // Nouveaux états pour la gestion de la date de livraison
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateLivraisonAdmin, setDateLivraisonAdmin] = useState('');

  // Helper pour récupérer l'userId du client via l'endpoint dédié
  const getClientUserId = async (clientId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/clients/${clientId}/user-id`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      });
      const userId = response.data;
      if (!userId) {
        throw new Error('userId du client introuvable');
      }
      return userId;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du userId client:', error);
      return null;
    }
  };

  const sendCommandeStatusNotification = async (commande, newStatus, additionalInfo = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Token d\'authentification manquant');
        return false;
      }

      // Récupérer l'ID utilisateur du client (priorité à la propriété déjà présente)
      let clientUserId = commande.client?.userId;
      if (!clientUserId) {
        clientUserId = await getClientUserId(commande.client?.id);
        if (!clientUserId) {
          console.error('❌ ID utilisateur du client non trouvé');
          return false;
        }
      }

      // Définir le message selon le statut
      const getStatusMessage = (status) => {
        switch (status) {
          case 'EN_COURS':
            return {
              title: 'Commande validée',
              message: `Votre commande ${commande.reference} a été validée et est maintenant en cours de préparation.${additionalInfo.dateLivraison ? ` Date de livraison prévue : ${new Date(additionalInfo.dateLivraison).toLocaleDateString('fr-FR')}` : ''}`,
              type: 'COMMANDE_VALIDEE'
            };
          case 'PRETE_LIVRAISON':
            return {
              title: 'Commande prête pour livraison',
              message: `Votre commande ${commande.reference} est prête et sera bientôt livrée.`,
              type: 'COMMANDE_PRETE_LIVRAISON'
            };
          case 'LIVREE':
            return {
              title: 'Commande livrée',
              message: `Votre commande ${commande.reference} a été livrée avec succès. Merci pour votre confiance !`,
              type: 'COMMANDE_LIVREE'
            };
          case 'ANNULEE':
            return {
              title: 'Commande annulée',
              message: `Votre commande ${commande.reference} a été annulée. Contactez-nous pour plus d'informations.`,
              type: 'COMMANDE_ANNULEE'
            };
          default:
            return {
              title: 'Mise à jour de commande',
              message: `Le statut de votre commande ${commande.reference} a été mis à jour.`,
              type: 'COMMANDE_UPDATE'
            };
        }
      };

      const statusInfo = getStatusMessage(newStatus);
      const adminName = 'Administration Sofimed';

      const notification = {
        userId: parseInt(clientUserId, 10),
        type: statusInfo.type,
        title: statusInfo.title,
        message: statusInfo.message,
        senderName: adminName,
        commandeId: commande.id,
        link: `/client/commandes/${commande.id}`
      };

      console.log('📤 Envoi de notification de changement de statut:', notification);

      // 1) REST: utiliser l’URL avec slash final + withCredentials
      const restResponse = await axios.post(`${API_BASE_URL}/notifications/`, notification, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      console.log('✅ Notification REST envoyée:', restResponse.data);

      // 2) WebSocket: envoi + tentative de reconnexion si nécessaire
      try {
        if (notificationService.isConnected()) {
          notificationService.sendNotification(`/topic/notifications/${clientUserId}`, {
            ...notification,
            timestamp: new Date().toISOString()
          });
          console.log('✅ Notification WebSocket envoyée');
        } else {
          console.warn('⚠️ WebSocket non connecté, tentative de reconnexion...');
          const currentUser = JSON.parse(localStorage.getItem('user'));
          if (currentUser?.id) {
            notificationService.connect(currentUser.id, () => {
              notificationService.sendNotification(`/topic/notifications/${clientUserId}`, {
                ...notification,
                timestamp: new Date().toISOString()
              });
              console.log('✅ Notification WebSocket envoyée après reconnexion');
            });
          }
        }
      } catch (wsError) {
        console.error('❌ Erreur WebSocket:', wsError);
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification de changement de statut:', error);
      return false;
    }
  };

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

      const token = localStorage.getItem('token');
      
      // Tableau des statuts disponibles
      const statutsDisponibles = ['EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ANNULEE'];
      
      let endpoint;
      let params = {
        page: currentPage,
        size: itemsPerPage
      };
      
      // Logique simplifiée pour les endpoints DTO
      if (selectedStatus !== 'all' && statutsDisponibles.includes(selectedStatus)) {
        endpoint = `${API_BASE_URL}/commandes/status/${selectedStatus}`;
        console.log('🚀 Filtrage par statut:', selectedStatus);
      } else if (dateRange.startDate && dateRange.endDate) {
        endpoint = `${API_BASE_URL}/commandes/dates`;
        params.startDate = dateRange.startDate;
        params.endDate = dateRange.endDate;
        console.log('🚀 Filtrage par dates:', dateRange);
      } else {
        endpoint = `${API_BASE_URL}/commandes`;
        console.log('🚀 Récupération de toutes les commandes');
      }

      console.log('🔍 Endpoint appelé:', endpoint);
      console.log('🔍 Paramètres:', params);

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: params
      });

      console.log('✅ Réponse reçue:', response.data);

      // Traitement simplifié des DTOs
      let commandesData = [];
      let totalElements = 0;

      if (response.data && response.data.content) {
        // Format paginé (DTOs)
        commandesData = response.data.content;
        totalElements = response.data.totalElements;
      } else if (Array.isArray(response.data)) {
        // Format tableau direct (DTOs)
        commandesData = response.data;
        totalElements = response.data.length;
      } else if (response.data) {
        // Format objet unique (DTO)
        commandesData = [response.data];
        totalElements = 1;
      }

      // Transformation minimale car les DTOs sont déjà propres
      const transformedData = commandesData.map(commande => ({
        ...commande,
        // Les DTOs ont déjà les bonnes propriétés, juste quelques ajustements
        client: {
          ...commande.client,
          nom: commande.client?.nom || `${commande.client?.firstName || ''} ${commande.client?.lastName || ''}`.trim()
        },
        reference: commande.reference || `CMD-${commande.id}`,
        status: commande.status || 'EN_ATTENTE',
        // Ajouter le mapping des dates
        createdAt: commande.dateCreation || commande.createdAt,
        dateCreation: commande.dateCreation || commande.createdAt
      }));

      setCommandes(transformedData);
      setTotalCommandes(totalElements);

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

  // Fonction modifiée pour gérer les changements de statut
  const handleStatusChange = async (commandeId, newStatus) => {
    try {
      setProcessingId(commandeId);
      const token = localStorage.getItem('token');
      const commande = commandes.find(c => c.id === commandeId);

      if (newStatus === 'VALIDEE') {
        // Préparer la validation avec date de livraison
        setActiveCommande(commande);
        setShowDateModal(true);
        return;
      }

      // Pour l'annulation
      await axios.patch(`${API_BASE_URL}/commandes/${commandeId}/status`, null, {
        params: { newStatus },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour l'état local
      setCommandes(prevCommandes =>
        prevCommandes.map(commande =>
          commande.id === commandeId
            ? { ...commande, status: newStatus }
            : commande
        )
      );
      
      // Envoyer la notification au client
      if (commande) {
        await sendCommandeStatusNotification(commande, newStatus);
      }
      
      // Recharger toute la page
      window.location.reload();
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          err.message || 
                          'Erreur lors de la modification du statut';
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };


  // Nouvelle fonction pour gérer la validation avec date
  const handleValidateWithDate = async () => {
    if (!dateLivraisonAdmin) {
      alert('Veuillez sélectionner une date de livraison');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Valider la commande avec date de livraison
      await axios.put(
        `${API_BASE_URL}/commandes/${activeCommande.id}/valider`,
        { dateAdmin: dateLivraisonAdmin },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Mettre à jour l'état local
      setCommandes(prevCommandes =>
        prevCommandes.map(commande =>
          commande.id === activeCommande.id
            ? { ...commande, status: 'EN_COURS', dateLivraisonAdmin: dateLivraisonAdmin }
            : commande
        )
      );

      // Envoyer la notification au client avec la date de livraison
      await sendCommandeStatusNotification(activeCommande, 'EN_COURS', {
        dateLivraison: dateLivraisonAdmin
      });

      setShowDateModal(false);
      setDateLivraisonAdmin('');
      setActiveCommande(null);
      fetchCommandes();
      alert('Commande validée avec succès');
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation de la commande');
    }
  };

  // Fonction pour confirmer la livraison
  const handleConfirmDelivery = async (commandeId) => {
    try {
      setProcessingId(commandeId);
      const token = localStorage.getItem('token');
      const commande = commandes.find(c => c.id === commandeId);
      
      await axios.patch(`${API_BASE_URL}/commandes/${commandeId}/confirm-delivery`, null, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour l'état local
      setCommandes(prevCommandes =>
        prevCommandes.map(commande =>
          commande.id === commandeId
            ? { ...commande, status: 'LIVREE' }
            : commande
        )
      );
      
      // Envoyer la notification au client
      if (commande) {
        await sendCommandeStatusNotification(commande, 'LIVREE');
      }
      
      fetchCommandes();
      alert('Livraison confirmée avec succès');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          err.message || 
                          'Erreur lors de la confirmation de livraison';
      setError(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  // Simplifier le filtrage local pour ne garder que la recherche texte
  const filteredCommandes = useMemo(() => {
    return commandes.filter(commande => {
      const searchLower = searchTerm.toLowerCase().trim();
      return !searchTerm || [
        commande.reference,
        commande.client?.nom,
        commande.client?.email,
        commande.commercial?.firstName,
        commande.commercial?.lastName,
        commande.commercial?.employeeCode
      ].some(field => field?.toLowerCase().includes(searchLower));
    });
  }, [commandes, searchTerm]);
  const stats = useMemo(() => ({
    total: totalCommandes,
    enAttente: commandes.filter(c => c?.status === 'EN_ATTENTE').length,
    enCours: commandes.filter(c => c?.status === 'EN_COURS').length,
    livree: commandes.filter(c => c?.status === 'LIVREE').length,
    annulee: commandes.filter(c => c?.status === 'ANNULEE').length,
    montantTotal: commandes.reduce((sum, c) => sum + (c?.totalHT || 0), 0),
  }), [commandes, totalCommandes]);

  const paginatedCommandes = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredCommandes.slice(start, end);
  }, [filteredCommandes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage);

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
          lastName: commande.client?.lastName || commande?.client?.nom?.split(' ').slice(1).join(' ') || '',
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

  return (
    <div className="commandes-admin-container">
      <header className="admin-header">
        <h2 className="page-title">
          <FontAwesomeIcon icon={faClipboardList} className="title-icon" />
          Gestion des Commandes
        </h2>
      </header>

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
          title="En Cours" 
          value={stats.enCours} 
          icon={faCheckCircle}
          className="stat-card-info"
        />
        <StatCard 
          title="Livrées" 
          value={stats.livree} 
          icon={faTruck}
          className="stat-card-success"
        />
        <StatCard 
          title="Annulées" 
          value={stats.annulee} 
          icon={faTimesCircle}
          className="stat-card-danger"
        />
        <StatCard 
          title="CA (MAD)" 
          value={formatMAD(stats.montantTotal)}
          icon={faMoneyBill}
          className="stat-card-info"
        />
      </div>

      <div className="filters-section">
        {/* Filtre existant de recherche */}
        <div className="search-filter">
          <input
            type="text"
            placeholder="Référence, nom client, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
        </div>

        {/* Filtre de statut amélioré */}
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
            <option value="all">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="LIVREE">Livrée</option>
            <option value="ANNULEE">Annulée</option>
          </select>
        </div>

        {/* Filtre de date amélioré */}
        <div className="filter-group date-filter">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
            Période :
          </label>
          <div className="date-inputs">
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
            <button 
              className="clear-dates"
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setCurrentPage(0);
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
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
              <th>Date Livraison Souhaitée</th>
              <th>Date Livraison </th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCommandes.length === 0 ? (
              <tr><td colSpan="8" className="no-data">Aucune commande trouvée</td></tr>
            ) : paginatedCommandes.map((commande) => (
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
                <td className="date-cell">{formatDate(commande.dateLivraisonAdmin)}</td>
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
                          onClick={() => handleStatusChange(commande.id, 'ANNULEE')}
                          disabled={processingId === commande.id}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          {processingId === commande.id ? '...' : 'Annuler'}
                        </button>
                      </>
                    )}
                    
                    {commande.status === 'PRETE_LIVRAISON' && (
                    <button
                    className="btn-confirm-delivery"
                    onClick={() => handleConfirmDelivery(commande.id)}
                    disabled={processingId === commande.id}
                    title="Confirmer la livraison"
                    >
                    <FontAwesomeIcon icon={faCheck} />
                    {processingId === commande.id ? 'Confirmation...' : 'Confirmer Livraison'}
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmation de date */}
      {showDateModal && activeCommande && (
        <div className="modal-overlay">
          <div className="modal-content date-modal">
            <div className="modal-header">
              <h3>Confirmation de validation</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowDateModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              <p>
                Vous êtes sur le point de valider la commande : 
                <strong> {activeCommande.reference}</strong>
              </p>
              
              <div className="date-picker-container">
                <label>
                  <FontAwesomeIcon icon={faCalendarDay} className="icon" />
                  Date de livraison administrative:
                </label>
                <input
                  type="date"
                  value={dateLivraisonAdmin}
                  onChange={(e) => setDateLivraisonAdmin(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="client-info-summary">
                <p><strong>Client:</strong> {activeCommande.client?.nom}</p>
                <p><strong>Date souhaitée:</strong> {formatDate(activeCommande.dateLivraisonSouhaitee)}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowDateModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-confirm"
                onClick={handleValidateWithDate}
                disabled={!dateLivraisonAdmin}
              >
                Confirmer avec date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Détails de la commande */}
      {showConfirmModal && activeCommande && (
        <div className="modal-overlay">
          <div className="modal-content commande-details">
            <button className="modal-close" onClick={() => setShowConfirmModal(false)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <h2><FontAwesomeIcon icon={faShoppingCart} /> Détails de la Commande</h2>
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
                      <th>Prix unitaire (MAD)</th>
                      <th>Remise</th>
                      <th>Total HT (MAD)</th>
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
                        <td className="product-price">{formatMAD(item.prixUnitaire)}</td>
                        <td className="product-discount">{item.remisePourcentage}%</td>
                        <td className="product-total">{formatMAD(item.totalItem)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        
            <div className="confirm-section totals-section">
              <h4><FontAwesomeIcon icon={faMoneyBill} /> Récapitulatif financier (MAD)</h4>
              <div className="totals-grid">
                <div className="total-item">
                  <span className="total-label">Total HT:</span>
                  <span className="total-value">{formatMAD(activeCommande.totalHT)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">TVA (20%):</span>
                  <span className="total-value">{formatMAD(activeCommande.tva)}</span>
                </div>
                <div className="total-item grand-total">
                  <span className="total-label">Total TTC:</span>
                  <span className="total-value">{formatMAD(activeCommande.totalTTC)}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn modal-btn-close" onClick={() => setShowConfirmModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
                Fermer
              </button>
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
      case 'EN_COURS':
        return { className: 'status-progress', text: 'En cours' };
      case 'PRETE_LIVRAISON':
        return { className: 'status-ready', text: 'Prête à livrer' };
      case 'LIVREE':
        return { className: 'status-delivered', text: 'Livrée' };
      case 'ANNULEE':
        return { className: 'status-rejected', text: 'Annulée' };
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



