import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


import './CommercialDevis.css'; // Ajoutez cette ligne
import { FileText, MessageCircle, User, Search, Filter, Download, Eye, AlertCircle, Loader, Home, Users, ChartBar, History, Settings, HelpCircle, LogOut, Bell, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './CommercialDashboard.css';
import logo from '../../assets/logosofi1.png';


const CommercialDevis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const [showChat, setShowChat] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showPrixModal, setShowPrixModal] = useState(false);
  const [selectedDevisForPrix, setSelectedDevisForPrix] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentCartId, setCurrentCartId] = useState(null);

  const UpdateSingleCartItem = () => {
    const handleUpdate = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Token manquant');
          return;
        }

        // Récupérer le cartId du devis sélectionné
        const cartIdResponse = await axios.get(
          `http://localhost:8080/api/devis/id/${selectedDevis.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const cartId = cartIdResponse.data;

        // Récupérer les items du devis sélectionné
        const itemsResponse = await axios.get(
          `http://localhost:8080/api/devis/${selectedDevis.id}/items`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (!itemsResponse.data?.length) {
          alert('Aucun produit trouvé dans ce devis');
          return;
        }

        // Mettre à jour chaque produit
        const updatePromises = itemsResponse.data.map(async (item) => {
          try {
            await updateCartItem(
              cartId,
              item.produit.id,
              item.prixUnitaire || 0.00,
              item.remisePourcentage || 0
            );
            console.log(`=== MISE À JOUR DU PRODUIT ${item.produit.reference} ===`);
            console.log('ID Produit:', item.produit.id);
            console.log('Nom:', item.produit.nom);
            console.log('Prix Unitaire:', item.prixUnitaire);
            console.log('Remise (%):', item.remisePourcentage);
            console.log('Quantité:', item.quantity);
          } catch (error) {
            console.error(`Erreur lors de la mise à jour du produit ${item.produit.id}:`, error);
            throw error;
          }
        });

        await Promise.all(updatePromises);
        alert('Tous les produits ont été mis à jour avec succès !');
        
      } catch (error) {
        console.error('Erreur:', error);
        alert(`Erreur : ${error.response?.data?.message || error.message}`);
      }
    };

    return (
      <div >
        
      </div>
    );
  };

  const handleApplyDiscount = async (devisId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    // 1. Récupérer les items du devis
    const itemsResponse = await axios.get(
      `http://localhost:8080/api/devis/${devisId}/items`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!itemsResponse.data?.length) {
      alert('Aucun produit trouvé dans ce devis');
      return;
    }

    // 2. Préparer les données pour la requête batch
    const batchUpdates = itemsResponse.data.map(item => ({
      cartId: item.cartId || 17,
      produitId: item.produit.id,
      prixUnitaire: item.prixUnitaire || item.produit.prix,
      remisePourcentage: item.remisePourcentage || 0,
      quantity: item.quantity || 1
    }));

    console.log('Données à envoyer:', JSON.stringify(batchUpdates, null, 2));

    // 3. Envoyer la requête batch
    const response = await axios.put(
      'http://localhost:8080/api/cart-items/batch-update',
      batchUpdates,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Réponse du serveur:', response.data);
    await fetchDevisList();
    alert('Remises appliquées avec succès à tous les produits');

  } catch (error) {
    console.error('Erreur:', error);
    alert(`Erreur: ${error.response?.data?.message || error.message}`);
  }
};

// Ajoute cette fonction utilitaire pour afficher une modale de sélection de produit
const updateCartItem = async (cartId, produitId, prixUnitaire, remisePourcentage) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const response = await axios.put(
      'http://localhost:8080/api/cart-items/update-by-cart-product',
      null,
      {
        params: {
          cartId,
          produitId,
          prixUnitaire: parseFloat(prixUnitaire).toFixed(2),
          remisePourcentage: parseFloat(remisePourcentage).toFixed(2)
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    throw error;
  }
};

const openProductSelectModal = (items) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'product-select-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Gestion des produits</h3>
          <p>Sélectionnez les produits à modifier</p>
        </div>
        <div class="product-list">
          ${items.map(item => `
            <div class="product-card">
              <div class="product-header">
                <span class="product-badge">${item.produit.reference}</span>
                <h4 class="product-title">${item.produit.nom}</h4>
              </div>
              <div class="product-details-grid">
                <div class="detail-item">
                  <span>Prix unitaire</span>
                  <span class="value">${parseFloat(item.prixUnitaire).toFixed(2)} €</span>
                </div>
                <div class="detail-item">
                  <span>Remise</span>
                  <span class="value">${parseFloat(item.remisePourcentage).toFixed(2)} %</span>
                </div>
                <div class="detail-item">
                  <span>Quantité</span>
                  <span class="value">${item.quantity}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary">Annuler</button>
          <button class="btn btn-primary">Appliquer les modifications</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const updateBtn = modal.querySelector('.btn-update');
    const cancelBtn = modal.querySelector('.btn-cancel');

    updateBtn.addEventListener('click', async () => {
      try {
        for (const item of items) {
          await updateCartItem(
            item.cartId,
            item.produit.id,
            item.prixUnitaire,
            item.remisePourcentage
          );
        }
        resolve(true);
        modal.remove();
      } catch (error) {
        alert('Erreur lors de la mise à jour: ' + error.message);
      }
    });

    cancelBtn.addEventListener('click', () => {
      resolve(false);
      modal.remove();
    });
  });
};




  const handleViewClient = async (devis) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }
  
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setSelectedClient({
          ...response.data,
          // Assurez-vous que ces champs existent dans la réponse
          firstName: response.data.firstName || 'Non spécifié',
          lastName: response.data.lastName || 'Non spécifié',
          email: response.data.email || 'Non spécifié',
          phone: response.data.phone || 'Non spécifié',
          orderCount: response.data.orderCount || 0,
          lastOrderDate: response.data.lastOrderDate || null
        });
        setShowClientDetails(true);
      }
    } catch (err) {
      console.error('Erreur client:', err.response?.data || err.message);
      setError(err.response?.data?.message || "Erreur lors de la récupération des informations client");
    }
  };

  const handleViewDevis = async (devis) => {
    try {
      console.log('Devis sélectionné:', devis);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Récupération du cartId
      console.log('Tentative de récupération du cartId...');
      const cartIdResponse = await axios.get(
        `http://localhost:8080/api/devis/id/${devis.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Logs détaillés
      console.log('Réponse complète de l\'API pour cartId:', cartIdResponse);
      console.log('Données brutes de la réponse:', cartIdResponse.data);
      
      // Modification ici : cartIdResponse.data est directement l'ID
      const cartId = cartIdResponse.data;
      
      if (!cartId) {
        console.error('Cart ID non trouvé dans la réponse');
      } else {
        console.log('=== Informations CartID ===');
        console.log('Devis ID:', devis.id);
        console.log('Cart ID récupéré:', cartId);
        console.log('========================');
      }

      // Affichage de la modale des prix
      setSelectedDevisForPrix(devis);
      setShowPrixModal(true);
    } catch (err) {
      console.error('Erreur lors de la récupération du cartId:', err);
      // On continue quand même à afficher la modale même si on n'a pas pu récupérer le cartId
      setSelectedDevisForPrix(devis);
      setShowPrixModal(true);
    }
  };

  useEffect(() => {
    fetchDevisList();
  }, []);

  const fetchDevisList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        navigate('/login');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError("Informations utilisateur non disponibles");
        setLoading(false);
        navigate('/login');
        return;
      }

      // Récupérer d'abord l'ID commercial
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!commercialResponse.data || !commercialResponse.data.id) {
        setError("Impossible de récupérer les informations du commercial");
        setLoading(false);
        return;
      }

      const commercialId = commercialResponse.data.id;
      
      // Utiliser l'endpoint /api/devis/commercial/{commercialId}
      const response = await axios.get(`http://localhost:8080/api/devis/commercial/${commercialId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setDevisList(response.data);
        setError('');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des devis:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError("Impossible de charger la liste des devis. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDevis = async (devisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/devis/download/${devisId}`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${devisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement du devis');
    }
  };

const openPriceEditModal = (items) => {
  const productsData = {
    timestamp: new Date().toISOString(),
    products: items.map(item => ({
      id: item.produit.id,
      name: item.produit.nom,
      reference: item.produit.reference,
      unitPrice: item.prixUnitaire,
      discount: item.remisePourcentage,
      quantity: item.quantity,
      total: (item.prixUnitaire * item.quantity * (1 - item.remisePourcentage/100)).toFixed(2)
    })),
    globalTotal: items.reduce((sum, item) => {
      return sum + (item.prixUnitaire * item.quantity * (1 - item.remisePourcentage/100));
    }, 0).toFixed(2)
  };

// Display as formatted JSON in console
console.log(JSON.stringify(productsData, null, 2));

  // Utiliser le premier item du tableau comme référence
  const firstItem = items[0] || {};
  
  // Définir les valeurs par défaut
  const defaultPrixUnitaire = firstItem?.prixUnitaire || 0;
  const defaultPourcentage = firstItem?.remisePourcentage || 0;
  const defaultQuantity = firstItem?.quantity || 1;

  console.log('Données des produits au format JSON:', JSON.stringify(productsData, null, 2));

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'price-edit-modal';

    modal.innerHTML = `
      <div class="modal-content">
        <h3>Modifier le prix pour ${firstItem?.produit?.nom || 'Produit'}</h3>
        <form id="priceEditForm">
          <div class="form-group">
            <label>Prix unitaire (MAD)</label>
            <input 
              type="number" 
              id="prixUnitaire" 
              value="${defaultPrixUnitaire}" 
              step="0.01"
              required
            >
          </div>
          <div class="form-group">
            <label>Remise (%)</label>
            <input 
              type="number" 
              id="pourcentage" 
              value="${defaultPourcentage}"
              min="0" 
              max="100"
              required
            >
          </div>
          <div class="form-group">
            <label>Quantité</label>
            <input 
              type="number" 
              id="quantity" 
              value="${defaultQuantity}"
              min="1"
              required
            >
          </div>
          <div class="prix-total">
            <strong>Prix après remise:</strong> 
            <span id="prixApresRemise">0</span> MAD
          </div>
          <div class="button-group">
            <button type="button" class="save-db-btn primary">Enregistrer en Base de Données</button>
            <button type="button" class="cancel-btn">Annuler</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const form = modal.querySelector('#priceEditForm');
    const prixUnitaireInput = form.querySelector('#prixUnitaire');
    const pourcentageInput = form.querySelector('#pourcentage');
    const quantityInput = form.querySelector('#quantity');
    const prixApresRemiseSpan = form.querySelector('#prixApresRemise');
    const cancelBtn = modal.querySelector('.cancel-btn');

    // Toujours réinitialiser les valeurs (sécurité)
    prixUnitaireInput.value = defaultPrixUnitaire;
    pourcentageInput.value = defaultPourcentage;
    quantityInput.value = defaultQuantity;

    // Fonction pour calculer et afficher le prix après remise
    const calculatePrixApresRemise = () => {
      const prixUnitaire = parseFloat(prixUnitaireInput.value || defaultPrixUnitaire);
      const pourcentage = parseFloat(pourcentageInput.value || defaultPourcentage);
      const quantity = parseInt(quantityInput.value || defaultQuantity);

      const reduction = (prixUnitaire * pourcentage) / 100;
      const prixReduit = (prixUnitaire - reduction) * quantity;
      prixApresRemiseSpan.textContent = prixReduit.toFixed(2);
    };

    calculatePrixApresRemise();

    prixUnitaireInput.addEventListener('input', calculatePrixApresRemise);
    pourcentageInput.addEventListener('input', calculatePrixApresRemise);
    quantityInput.addEventListener('input', calculatePrixApresRemise);

    // Ajouter le gestionnaire pour le nouveau bouton de sauvegarde en base de données
    const saveDbBtn = modal.querySelector('.save-db-btn');
    saveDbBtn.onclick = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Session expirée. Veuillez vous reconnecter.');
          return;
        }

        const prixUnitaire = parseFloat(prixUnitaireInput.value) || parseFloat(defaultPrixUnitaire);
        const remisePourcentage = parseFloat(pourcentageInput.value) || parseFloat(defaultPourcentage);

        // Mise à jour en base de données pour chaque item
        for (const item of items) {
          await axios.put(
            'http://localhost:8080/api/cart-items/update-by-cart-product',
            null,
            {
              params: {
                cartId: item.cart.id,
                produitId: item.produit.id,
                prixUnitaire: prixUnitaire,
                remisePourcentage: remisePourcentage
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`Mise à jour en base de données réussie pour le produit ${item.produit.id}`);
        }

        alert('Modifications enregistrées avec succès en base de données');
        document.body.removeChild(modal);
        await fetchDevisList(); // Rafraîchir la liste
      } catch (error) {
        console.error('Erreur lors de la mise à jour en base de données:', error);
        alert(`Erreur: ${error.response?.data?.message || error.message}`);
      }
    };

    cancelBtn.onclick = () => {
      document.body.removeChild(modal);
      resolve(null);
    };

    // Ajouter le gestionnaire d'événements pour le bouton de mise à jour
    const updatePriceBtn = modal.querySelector('#updatePriceBtn');
    updatePriceBtn.onclick = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Token manquant');
          return;
        }

        // Récupérer les valeurs actuelles du formulaire
        const prixUnitaire = parseFloat(prixUnitaireInput.value) || parseFloat(defaultPrixUnitaire);
        const remisePourcentage = parseFloat(pourcentageInput.value) || parseFloat(defaultPourcentage);

        // Mettre à jour chaque item
        for (const item of items) {
          const response = await axios.put(
            'http://localhost:8080/api/cart-items/cart-items/update-by-cart-product',
            null,
            {
              params: {
                cartId: 17,
                produitId: 2,
                prixUnitaire:11134,
                remisePourcentage: 23
              },
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`Mise à jour réussie pour l'item ${item.id}:`, response.data);
        }

        alert('Prix mis à jour avec succès');
        await fetchDevisList(); // Rafraîchir la liste des devis
        document.body.removeChild(modal);
        resolve(null);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        alert(`Erreur lors de la mise à jour: ${error.response?.data?.message || error.message}`);
      }
    };
  });
};

const handleOpenChat = async (devis) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Récupérer d'abord les informations du client
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        // Mettre à jour le devis avec les informations complètes du client
        const devisWithClient = {
          ...devis,
          client: response.data
        };
        setSelectedDevis(devisWithClient);
        setShowChat(true);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du client:', err);
      alert('Impossible de charger les informations du client');
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedDevis(null);
  };

  useEffect(() => {
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/login');
    setUserData(user);
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Keep only these single declarations
  const filteredDevis = devisList.filter(devis => {
    // Vérification de sécurité pour les propriétés
    const reference = devis?.reference?.toLowerCase() || '';
    const firstName = devis?.client?.firstName?.toLowerCase() || '';
    const lastName = devis?.client?.lastName?.toLowerCase() || '';
    const searchTermLower = searchTerm.toLowerCase();
  
    const matchesSearch = 
        reference.includes(searchTermLower) ||
        firstName.includes(searchTermLower) ||
        lastName.includes(searchTermLower);
    
    const matchesFilter = filterStatus === 'TOUS' || devis?.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-progress';
      case 'TERMINÉ': return 'status-completed';
      default: return '';
    }
  };

  // Ajout de la fonction pour déterminer le statut du client
  // Optimisation de la fonction getClientStatus
const getClientStatus = (client) => {
  const orderCount = client.orderCount || 0;
  
  if (client.isNew || orderCount === 0) {
    return { label: 'Nouveau Client', class: 'client-new' };
  } else if (orderCount > 10) {
    return { label: 'Client Fidèle', class: 'client-loyal' };
  } else if (orderCount > 5) {
    return { label: 'Client Potentiel', class: 'client-potential' };
  }
  return { label: 'Client Régulier', class: 'client-regular' };
};

// Ajout d'un loader plus élégant
const LoadingState = () => (
  <div className="loading-state">
    <div className="spinner"></div>
    <p>Chargement en cours...</p>
  </div>
);

  // Dans le rendu du tableau, modifiez la structure pour ajouter la nouvelle colonne
  return (
    <div className="commercial-devis-container">
      <UpdateSingleCartItem />
      <div className="devis-header">
        <h1>
         
          <span>Gestion des Devis</span>
        </h1>
        <div className="devis-actions">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher par référence ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINÉ">Terminé</option>
          </select>
        </div>
      </div>

      <div className="devis-content">
        {loading ? (
          <div className="loading-state">
            <Loader className="animate-spin" size={32} />
            <p>Chargement des devis...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} color="var(--danger)" />
            <p>{error}</p>
          </div>
        ) : filteredDevis.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="var(--text-light)" />
            <p>Aucun devis trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="devis-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Statut Client</th>
                  <th>Date de création</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map(devis => (
                  <tr key={devis.id}>
                    <td>{devis.reference}</td>
                    <td>
                      <div className="client-info clickable" onClick={() => handleViewClient(devis)}>
                        <User size={16} />
                        <span>
                          {devis.client ? `${devis.client.firstName || ''} ${devis.client.lastName || ''}` : 'Client '}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`client-status-badge ${devis.client ? getClientStatus(devis.client).class : 'client-unknown'}`}>
                        {devis.client ? getClientStatus(devis.client).label : 'Statut inconnu'}
                      </span>
                    </td>
                    <td>{new Date(devis.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(devis.status)}`}>
                        {devis.status ? devis.status.replace('_', ' ') : 'Status inconnu'}
                      </span>
                    </td>
                    <td>
                      <div className="devis-actions-buttons">
                        <button 
                          className="action-btn view" 
                          title="Voir le devis"
                          onClick={() => handleViewDevis(devis)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn download" 
                          title="Télécharger"
                          onClick={() => handleDownloadDevis(devis.id)}
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="contact-btn"
                          onClick={() => handleOpenChat(devis)}
                          disabled={!devis.id}
                        >
                          <MessageCircle size={16} />
                        </button>
                        {/* Nouveau bouton pour appliquer une remise */}
                        <button
                          className="action-btn"
                          title="Appliquer une remise"
                          onClick={() => handleApplyDiscount(devis.id)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showClientDetails && selectedClient && (
        <div className="client-details-modal">
          <div className="client-details-container">
            <div className="client-details-header">
              <h3>Détails du Client</h3>
              <button className="close-details-btn" onClick={() => setShowClientDetails(false)}>
                &times;
              </button>
            </div>
            
            <div className="client-info-section">
              <h4>
                <User size={24} /> 
                Informations Personnelles
              </h4>
              <div className="client-info-row">
                <span className="client-info-label">
                  <User size={18} /> 
                  Nom complet
                </span>
                <span className="client-info-value">
                  {selectedClient.firstName} {selectedClient.lastName}
                </span>
              </div>
              <div className="client-info-row">
                <span className="client-info-label">
                  <Mail size={18} /> 
                  Email
                </span>
                <span className="client-info-value">
                  {selectedClient.email || 'Non spécifié'}
                </span>
              </div>
              <div className="client-info-row">
                <span className="client-info-label">
                  <Phone size={18} /> 
                  Téléphone
                </span>
                <span className="client-info-value">
                  {selectedClient.phone || 'Non spécifié'}
                </span>
              </div>
            </div>
            
            <div className="client-info-section">
              <h4>
                <ChartBar size={24} /> 
                Statistiques Client
              </h4>
              <div className="client-info-row">
                <span className="client-info-label">
                  <FileText size={18} /> 
                  Nombre de commandes
                </span>
                <span className="client-info-value">
                  {selectedClient.orderCount || '0'}
                </span>
              </div>
              <div className="client-info-row">
                <span className="client-info-label">
                  <History size={18} /> 
                  Dernière commande
                </span>
                <span className="client-info-value">
                  {selectedClient.lastOrderDate ? new Date(selectedClient.lastOrderDate).toLocaleDateString('fr-FR') : 'Aucune commande'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrixModal && selectedDevisForPrix && (
        <PrixModal 
          devis={selectedDevisForPrix} 
          onClose={() => setShowPrixModal(false)}
          onUpdate={fetchDevisList}
        />
      )}

      {showChat && selectedDevis && (
        <ChatModal 
          devis={selectedDevis}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

// Fonction pour mettre à jour chaque item du panier d'un devis
const updateAllCartItems = async (devisId, updateData) => {
  try {
    const token = localStorage.getItem('token');
    // Ancienne logique remplacée par le nouvel endpoint dans handleApplyDiscount
    // Cette fonction peut être conservée pour d'autres usages si besoin
    // navigate n'est pas utilisé ici
  } catch (err) {
    console.error('Erreur lors de la mise à jour des items du panier:', err);
  }
};


export default CommercialDevis;

// Définition du composant ChatModal
const ChatModal = ({ devis, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem('user'));
  const [commercialId, setCommercialId] = useState(null);
  const [commercialName, setCommercialName] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchCommercialId();
  }, [devis.id]);

  useEffect(() => {
    // Scroll vers le bas des messages quand ils changent
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchCommercialId = async () => {
    try {
      const token = localStorage.getItem('token');
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (commercialResponse.data && commercialResponse.data.id) {
        setCommercialId(commercialResponse.data.id);
        // Récupérer aussi le nom du commercial pour l'envoi de messages
        setCommercialName(`${commercialResponse.data.firstName || ''} ${commercialResponse.data.lastName || ''}`.trim());
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des informations du commercial:', err);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`Récupération des messages pour le devis ${devis.id}`);
      
      const response = await axios.get(`http://localhost:8080/api/messages/devis/${devis.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Réponse API messages:', response.data);
      
      // S'assurer que messages est toujours un tableau et nettoyer les données circulaires
      const messagesData = Array.isArray(response.data) ? response.data.map(msg => {
        // Créer une copie propre du message sans références circulaires
        return {
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          senderName: msg.senderName,
          recipientId: msg.recipientId,
          read: msg.read,
          devisId: msg.devisId
        };
      }) : [];
      
      console.log('Messages formatés:', messagesData);
      setMessages(messagesData);
      
      // Marquer les messages comme lus
      await axios.put(`http://localhost:8080/api/messages/devis/${devis.id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setError("Impossible de charger les messages. Veuillez réessayer.");
      // Réinitialiser messages à un tableau vide en cas d'erreur
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!commercialId) {
        throw new Error("ID du commercial non disponible");
      }
      
      const messageData = {
        devisId: devis.id,
        senderId: commercialId,
        senderName: commercialName || 'Commercial',
        recipientId: devis.client.id,
        content: newMessage.trim()
      };
      
      console.log('Envoi du message:', messageData);
      
      const response = await axios.post('http://localhost:8080/api/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse après envoi:', response.data);
      
      // Ajouter le nouveau message à la liste en créant un objet propre
      if (response.data) {
        const newMsg = {
          id: response.data.id,
          content: response.data.content,
          timestamp: response.data.timestamp,
          senderId: response.data.senderId,
          senderName: response.data.senderName,
          recipientId: response.data.recipientId,
          read: response.data.read,
          devisId: response.data.devisId
        };
        
        setMessages(prevMessages => {
          // Vérifier que prevMessages est un tableau
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return [...currentMessages, newMsg];
        });
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Fonction sécurisée pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.log('Date invalide:', dateString);
        return '';
      }
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '';
    }
  };

  return (
    <div className="chat-modal">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {devis.client?.firstName?.charAt(0) || 'C'}
            </div>
            <div className="chat-header-text">
              <h3>{devis.client?.firstName} {devis.client?.lastName}</h3>
              <p className="devis-reference">Devis: {devis.reference}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="chat-messages">
          {loading ? (
            <div className="loading-messages">
              <Loader size={24} className="spinner" />
              <p>Chargement des messages...</p>
            </div>
          ) : error ? (
            <div className="error-messages">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button onClick={fetchMessages} className="retry-btn">Réessayer</button>
            </div>
          ) : !Array.isArray(messages) || messages.length === 0 ? (
            <div className="no-messages">
              <p>Aucun message dans cette conversation. Commencez à discuter avec {devis.client?.firstName}.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                // Déterminer si le message a été envoyé par le commercial connecté
                const isCommercial = msg.senderId === commercialId;
                
                return (
                  <div 
                    key={msg.id || index} 
                    className={`message ${isCommercial ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatDate(msg.timestamp)}
                        {isCommercial && (
                          <span className="message-status">
                            {msg.read ? (
                              <span className="read-status">
                                <CheckCircle size={12} />
                              </span>
                            ) : (
                              <span className="sent-status">
                                <CheckCircle size={12} opacity={0.5} />
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="chat-input-container">
          <textarea
            className="message-input"
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            className="send-message-btn" 
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? <Loader size={16} className="spinner" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Définition du composant PrixModal
const PrixModal = ({ devis, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [produits, setProduits] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [clientInfo, setClientInfo] = useState(null);
  const [savingPrices, setSavingPrices] = useState(false);
  const [remises, setRemises] = useState({});  // État pour stocker les remises par produit

  // Add the getStatusColor function here to make it available in this component
  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-progress';
      case 'TERMINÉ': return 'status-completed';
      default: return '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        // Récupérer les produits du devis
        const produitsResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Récupérer les informations du client
        const clientResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (produitsResponse.data) {
          const produitsData = produitsResponse.data;
          setProduits(produitsData);
          
          // Initialiser les remises à 0% pour chaque produit
          const remisesInitiales = {};
          produitsData.forEach(produit => {
            remisesInitiales[produit.id] = 0;
          });
          setRemises(remisesInitiales);
          
          // Calculer le prix total
          calculateTotal(produitsData, remisesInitiales);
        }

        if (clientResponse.data) {
          setClientInfo(clientResponse.data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError("Impossible de charger les données du devis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [devis.id]);

  const calculateTotal = (items, remisesObj) => {
    const total = items.reduce((sum, item) => {
      const prix = item.prix !== null ? parseFloat(item.prix).toFixed(2) : 0;
      const quantity = item.quantity || 0;
      const remise = remisesObj[item.id] || 0;
      
      // Calculer le prix après remise
      const prixApresRemise = (prix * (1 - remise / 100)).toFixed(2);
      
      return sum + (parseFloat(prixApresRemise) * quantity);
    }, 0);
    setTotalPrice(parseFloat(total.toFixed(2)));
  };

  const handlePriceChange = (id, newPrice) => {
    // Vérifier que le prix est un nombre valide ou zéro
    const parsedPrice = newPrice === '' ? 0 : parseFloat(newPrice);
    
    const updatedProduits = produits.map(produit => {
      if (produit.id === id) {
        return { ...produit, prix: parsedPrice };
      }
      return produit;
    });

    setProduits(updatedProduits);
    calculateTotal(updatedProduits, remises);
  };

  // Fonction pour gérer les changements de remise
  const handleRemiseChange = (id, newRemise) => {
    // Vérifier que la remise est un nombre valide entre 0 et 100
    let parsedRemise = newRemise === '' ? 0 : parseFloat(newRemise);
    parsedRemise = Math.min(Math.max(parsedRemise, 0), 100); // Limiter entre 0 et 100
    
    const updatedRemises = {
      ...remises,
      [id]: parsedRemise
    };
    
    setRemises(updatedRemises);
    calculateTotal(produits, updatedRemises);
  };

  // Fonction pour calculer le prix après remise
  const getPrixApresRemise = (produit) => {
    const prix = produit.prix !== null ? produit.prix : 0;
    const remise = remises[produit.id] || 0;
    return prix * (1 - remise / 100);
  };

  const formatNumber = (number) => {
    if (number === null || isNaN(number)) {
      return "0";
    }
    return new Intl.NumberFormat('fr-MA').format(number);
  };

  const formatTotalPrice = (price) => {
    if (price === null || isNaN(price)) {
      return "0 MAD";
    }
    return new Intl.NumberFormat('fr-MA').format(price) + " MAD";
  };

  // Fonction pour sauvegarder les modifications de prix et remises
  const handleFormSubmit = async () => {
    try {
      setSavingPrices(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Utiliser l'ID du devis passé en props
      const cartIdResponse = await axios.get(
        `http://localhost:8080/api/devis/id/${devis.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const cartId = cartIdResponse.data;
      console.log("CartId récupéré :", cartId);

      const updateRequests = produits.map(async (produit) => {
        const prixUnitaire = parseFloat(produit.prix ?? 0).toFixed(2);
        const remise = parseFloat(remises[produit.id] ?? 0).toFixed(2);

        if (parseFloat(prixUnitaire) <= 0) {
          throw new Error(`Prix unitaire invalide pour produit ID ${produit.id}`);
        }

        const reduction = (parseFloat(prixUnitaire) * parseFloat(remise) / 100).toFixed(2);
        const prixApresRemiseUnitaire = (parseFloat(prixUnitaire) - parseFloat(reduction)).toFixed(2);

        await axios.put(
          'http://localhost:8080/api/cart-items/update-by-cart-product',
          null,
          {
            params: {
              cartId: cartId,
              produitId: produit.id,
              prixUnitaire: parseFloat(prixApresRemiseUnitaire),
              remisePourcentage: parseFloat(remise),
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      });

      await Promise.all(updateRequests);

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la mise à jour des prix:', err);
      setError("Une erreur est survenue lors de la sauvegarde des modifications.");
    } finally {
      setSavingPrices(false);
    }
  };
  
  

  return (
    <div className="prix-modal">
      <div className="prix-modal-content">
        <div className="prix-modal-header">
          <h3>Détails du devis: {devis.reference}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        {/* Informations du client */}
        {clientInfo && (
          <div className="client-info-section">
            <h4>
              <User size={20} /> 
              Informations Client
            </h4>
            <div className="client-info-grid">
              <div className="client-info-item">
                <span className="client-info-label">Nom complet</span>
                <span className="client-info-value">{clientInfo.firstName} {clientInfo.lastName}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Email</span>
                <span className="client-info-value">{clientInfo.email || 'Non spécifié'}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Téléphone</span>
                <span className="client-info-value">{clientInfo.phone || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="devis-info-section">
          <div className="devis-info-row">
            <span className="devis-info-label">Date de création:</span>
            <span className="devis-info-value">
              {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="devis-info-row">
            <span className="devis-info-label">Statut:</span>
            <span className={`status-badge ${getStatusColor(devis.status)}`}>
              {devis.status ? devis.status.replace('_', ' ') : 'Status inconnu'}
            </span>
          </div>
        </div>

        <div className="produits-list-container">
          <h4>Produits</h4>
          
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" />
              <p>Chargement des produits...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle />
              <p>{error}</p>
            </div>
          ) : produits.length === 0 ? (
            <div className="empty-state">
              <p>Aucun produit associé à ce devis</p>
            </div>
          ) : (
            <>
              <table className="produits-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Référence</th>
                    <th>Prix unitaire</th>
                    <th>Remise (%)</th>
                    <th>Prix après remise</th>
                    <th>Quantité</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map(produit => (
                    <tr key={produit.id}>
                      <td>
                        <div className="produit-info">
                          {produit.imageUrl && (
                            <img 
                              src={produit.imageUrl.startsWith('http') ? produit.imageUrl : require(`../../assets/products/${produit.imageUrl}`)} 
                              alt={produit.nom} 
                              className="produit-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '../../assets/no-image.png';
                              }}
                            />
                          )}
                          <span>{produit.nom}</span>
                        </div>
                      </td>
                      <td>{produit.reference || 'N/A'}</td>
                      <td>
                        <input 
                          type="text" 
                          className="price-input" 
                          value={produit.prix !== undefined && produit.prix !== null ? produit.prix : ''} 
                          onChange={(e) => handlePriceChange(produit.id, e.target.value)}
                        />
                      </td>
                      <td className="remise-cell">
                        <input 
                          type="number" 
                          className="remise-input" 
                          value={remises[produit.id] || 0} 
                          onChange={(e) => handleRemiseChange(produit.id, e.target.value)}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="prix-remise">
                        {formatNumber(getPrixApresRemise(produit))}
                      </td>
                      <td>{produit.quantity || 0}</td>
                      <td>{formatNumber(getPrixApresRemise(produit) * produit.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="total-label">Total</td>
                    <td className="total-value">{formatTotalPrice(totalPrice)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {/* Section de calcul global */}
              <div className="calcul-global-section">
                <h4 className="calcul-global-title">Calcul Global</h4>
                <div className="calcul-global-grid">
                  <div className="calcul-item">
                    <span className="calcul-label">Sous-total HT</span>
                    <span className="calcul-value">{formatTotalPrice(totalPrice)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">TVA (20%)</span>
                    <span className="calcul-value">{formatTotalPrice(totalPrice * 0.2)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">Frais de livraison</span>
                    <span className="calcul-value">{formatTotalPrice(0)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">Remise globale</span>
                    <span className="calcul-value">{formatTotalPrice(0)}</span>
                  </div>
                  <div className="calcul-total">
                    <span className="calcul-total-label">Total TTC</span>
                    <span className="calcul-total-value">{formatTotalPrice(totalPrice * 1.2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Annuler
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleFormSubmit}
                  disabled={savingPrices}
                  
                >
                  {savingPrices ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};