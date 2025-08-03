import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import './CommercialDevis.css'; // Ajoutez cette ligne
import { FileText, MessageCircle, User, Search, Filter, Download, Eye, AlertCircle, Loader, Home, Users, ChartBar, History, Settings, HelpCircle, LogOut, Bell, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './CommercialDashboard.css';
import logo from '../../assets/logosofi1.png';


const calculateDiscountPercentage = (prixUnitaire, prixApresRemise) => {
  if (!prixUnitaire || prixUnitaire <= 0) return 0;
  const remise = ((prixUnitaire - prixApresRemise) / prixUnitaire) * 100;
  return parseFloat(remise.toFixed(2));
};

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
  const [loadingCart, setLoadingCart] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiAnalysisStage, setAiAnalysisStage] = useState('initializing');
  const [aiAnimationProgress, setAiAnimationProgress] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [brainPulse, setBrainPulse] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [predictionSteps, setPredictionSteps] = useState([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [analysisMetrics, setAnalysisMetrics] = useState(null);

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
      `http://localhost:8080/api/devis/${devisId}/itemss`,
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
    
    // 4. AJOUTER : Envoyer une notification au client
    try {
      // Récupérer les informations du commercial
      const user = JSON.parse(localStorage.getItem('user'));
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const commercialName = commercialResponse.data ? 
        `${commercialResponse.data.firstName || ''} ${commercialResponse.data.lastName || ''}`.trim() : 
        'Commercial';

      // Récupérer les informations du devis pour obtenir l'ID du client
      const devisResponse = await axios.get(`http://localhost:8080/api/devis/${devisId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (devisResponse.data && devisResponse.data.client) {
        // Notification via API REST
        await axios.post('http://localhost:8080/api/notifications/', {
          userId: devisResponse.data.client.id,
          type: 'devis_discount_applied',
          title: 'Remises appliquées sur votre devis',
          message: `Des remises ont été appliquées sur votre devis ${devisResponse.data.reference} par ${commercialName}`,
          senderName: commercialName,
          devisId: devisResponse.data.id,
          link: `/client/devis/${devisResponse.data.id}`
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Notification via WebSocket
        if (notificationService.isConnected()) {
          notificationService.sendNotification(`/topic/notifications/${devisResponse.data.client.id}`, {
            type: 'devis_discount_applied',
            title: 'Remises appliquées',
            message: `Des remises ont été appliquées sur votre devis ${devisResponse.data.reference} par ${commercialName}`,
            senderName: commercialName,
            devisId: devisResponse.data.id,
            userId: devisResponse.data.client.id
          });
        }
      }
    } catch (notifError) {
      console.error('Erreur lors de l\'envoi de la notification de remise:', notifError);
      // Ne pas faire échouer l'application des remises si les notifications échouent
    }
    
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

  const handleQuickEdit = async (devis) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    // Récupération des items avec leurs prix
    const itemsResponse = await axios.get(
      `http://localhost:8080/api/devis/${devis.id}/itemss`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!itemsResponse.data?.length) {
      alert('Aucun produit trouvé dans ce devis');
      return;
    }

    // Récupération de l'historique des prix pour chaque produit
    const priceHistoryPromises = itemsResponse.data.map(item =>
      axios.get(`http://localhost:8080/api/products/${item.produit.id}/price-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );

    const priceHistories = await Promise.all(priceHistoryPromises);

    // Création de la modale d'édition rapide avec les prix existants
    const modal = document.createElement('div');
    modal.className = 'quick-edit-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Modification rapide - Devis ${devis.reference}</h3>
        <div class="products-list">
          ${itemsResponse.data.map((item, idx) => `
            <div class="product-item">
              <div class="product-info">
                <h4>${item.produit.nom}</h4>
                <p>Réf: ${item.produit.reference}</p>
                <div class="price-history">
                  <select class="previous-prices" data-product-id="${item.produit.id}">
                    <option value="">Prix précédents</option>
                    ${priceHistories[idx].data.map(history => `
                      <option value="${history.price}">${history.price} MAD (${new Date(history.date).toLocaleDateString()})</option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <div class="product-controls">
                <div class="input-group">
                  <label>Prix unitaire actuel (MAD)</label>
                  <input type="number" class="price-input" 
                         value="${parseFloat(item.prixUnitaire || item.produit.prix).toFixed(2)}" 
                         data-product-id="${item.produit.id}"
                         step="0.01"
                         min="0">
                </div>
                <div class="input-group">
                  <label>Remise actuelle (%)</label>
                  <input type="number" class="discount-input"
                         value="${parseFloat(item.remisePourcentage || 0).toFixed(2)}"
                         data-product-id="${item.produit.id}"
                         min="0"
                         max="100">
                </div>
                <div class="input-group">
                  <label>Quantité actuelle</label>
                  <input type="number" class="quantity-input"
                         value="${item.quantity || 1}"
                         data-product-id="${item.produit.id}"
                         min="1">
                </div>
                <div class="total-price">
                  <span>Total: ${(parseFloat(item.prixUnitaire || item.produit.prix) * (item.quantity || 1) * (1 - (item.remisePourcentage || 0)/100)).toFixed(2)} MAD</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="modal-actions">
          <button type="button" class="save-btn primary">Enregistrer</button>
          <button type="button" class="cancel-btn">Annuler</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Gestionnaire pour la sélection des prix précédents
    modal.querySelectorAll('.previous-prices').forEach(select => {
      select.addEventListener('change', (e) => {
        const productId = e.target.dataset.productId;
        const selectedPrice = e.target.value;
        if (selectedPrice) {
          const priceInput = modal.querySelector(`.price-input[data-product-id="${productId}"]`);
          priceInput.value = selectedPrice;
        }
      });
    });

    // Gestionnaire pour le bouton Enregistrer
    modal.querySelector('.save-btn').addEventListener('click', async () => {
      try {
        const updates = itemsResponse.data.map(item => ({
          cartId: devis.cartId,
          produitId: item.produit.id,
          prixUnitaire: parseFloat(modal.querySelector(`.price-input[data-product-id="${item.produit.id}"]`).value),
          remisePourcentage: parseFloat(modal.querySelector(`.discount-input[data-product-id="${item.produit.id}"]`).value),
          quantity: parseInt(modal.querySelector(`.quantity-input[data-product-id="${item.produit.id}"]`).value)
        }));

        await axios.put(
          'http://localhost:8080/api/cart-items/batch-update',
          updates,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        // AJOUTER : Envoyer une notification au client
        try {
          // Récupérer les informations du commercial
          const user = JSON.parse(localStorage.getItem('user'));
          const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const commercialName = commercialResponse.data ? 
            `${commercialResponse.data.firstName || ''} ${commercialResponse.data.lastName || ''}`.trim() : 
            'Commercial';

          // Récupérer les informations du devis pour obtenir l'ID du client
          const devisResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (devisResponse.data && devisResponse.data.client) {
            // Notification via API REST
            await axios.post('http://localhost:8080/api/notifications/', {
              userId: devisResponse.data.client.id,
              type: 'devis_quick_edit',
              title: 'Devis modifié rapidement',
              message: `Votre devis ${devisResponse.data.reference} a été modifié par ${commercialName}`,
              senderName: commercialName,
              devisId: devisResponse.data.id,
              link: `/client/devis/${devisResponse.data.id}`
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            // Notification via WebSocket
            if (notificationService.isConnected()) {
              notificationService.sendNotification(`/topic/notifications/${devisResponse.data.client.id}`, {
                type: 'devis_quick_edit',
                title: 'Devis modifié',
                message: `Votre devis ${devisResponse.data.reference} a été modifié par ${commercialName}`,
                senderName: commercialName,
                devisId: devisResponse.data.id,
                userId: devisResponse.data.client.id
              });
            }
          }
        } catch (notifError) {
          console.error('Erreur lors de l\'envoi de la notification de modification rapide:', notifError);
          // Ne pas faire échouer la modification si les notifications échouent
        }

        await fetchDevisList(); // Rafraîchir la liste
        modal.remove();
        alert('Modifications enregistrées avec succès');
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        alert('Erreur lors de la sauvegarde des modifications');
      }
    });

    // Gestionnaire pour le bouton Annuler
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la récupération des données');
  }
};

const handleViewDevis = async (devis) => {
    try {
      console.log('Devis sélectionné:', devis);
      setLoadingCart(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      
      // Récupération des articles du devis avec leurs prix
      const itemsResponse = await axios.get(
        `http://localhost:8080/api/devis/${devis.id}/itemss`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (itemsResponse.data) {
        // Formater les données avec calcul de la remise
        const itemsWithPricesAndDiscounts = itemsResponse.data.map(item => {
          const prixUnitaire = item.prixUnitaire || 0;
          const prixApresRemise = item.prixApresRemise || prixUnitaire;
          
          // Calcul du pourcentage de remise
          const remisePourcentage = prixUnitaire > 0 
            ? ((prixUnitaire - prixApresRemise) / prixUnitaire) * 100
            : 0;

          return {
            ...item,
            imageUrl: item.imageUrl 
                ? require(`../../assets/products/${item.imageUrl}`)
                : require('../../assets/no-image.png'),
            prixUnitaire: prixUnitaire,
            remisePourcentage: parseFloat(remisePourcentage.toFixed(2)),
            prixApresRemise: prixApresRemise,
            totalItem: prixApresRemise * (item.quantity || 1)
          };
        });

        setSelectedDevisForPrix({
          ...devis,
          items: itemsWithPricesAndDiscounts
        });
        setShowPrixModal(true);
      }

    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError("Erreur lors de la récupération des données du devis");
    } finally {
      setLoadingCart(false);
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
        // Formater les données des devis
   const formattedDevis = response.data.map(devis => ({
  ...devis,
  dateCreation: devis.dateCreation ? new Date(devis.dateCreation) : null,
  status: devis.statut || 'NON DÉFINI'
}));
        setDevisList(formattedDevis);
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

  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'price-edit-modal';

    modal.innerHTML = `
      <div class="modal-content large-modal-content">
        <h3>Gestion avancée des prix</h3>
        <form id="priceEditForm">
          <table class="price-edit-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix unitaire (MAD)</th>
                <th>Remise (%)</th>
                <th>Quantité</th>
                <th>Total</th>
                <th class="analyze-col">Analyse IA</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td>${item.produit.nom}</td>
                  <td><input type="number" class="prixUnitaireInput" data-idx="${idx}" value="${item.prixUnitaire}" step="0.01"></td>
                  <td><input type="number" class="remiseInput" data-idx="${idx}" value="${item.remisePourcentage}" min="0" max="100"></td>
                  <td><input type="number" class="quantiteInput" data-idx="${idx}" value="${item.quantity}" min="1"></td>
                  <td><span class="totalCell" id="totalCell-${idx}"></span></td>
                  <td class="analyze-col">
                    <button type="button" class="analyze-btn" data-idx="${idx}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 9h-4"></path>
                        <path d="M5 9h4"></path>
                        <path d="M12 19v-3"></path>
                        <path d="M12 19c-4.4 0-8-3.6-8-8"></path>
                        <path d="M12 19c4.4 0 8-3.6 8-8"></path>
                      </svg>
                      Obtenir Suggestion Pro
                    </button>
                    <div class="analyze-result" id="analyzeResult-${idx}"></div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="modal-footer">
            <button type="button" class="save-db-btn primary">Enregistrer</button>
            <button type="button" class="cancel-btn">Annuler</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Ajoute les gestionnaires d'événements APRÈS avoir ajouté le HTML au DOM !
    const analyzeButtons = modal.querySelectorAll('.analyze-btn');

analyzeButtons.forEach((button) => {
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clickedButton = e.target.closest('.analyze-btn');
    if (!clickedButton) return;

    const idx = clickedButton.dataset.idx;
    const item = items[idx];
    const resultDiv = modal.querySelector(`#analyzeResult-${idx}`);

    try {
      resultDiv.innerHTML = `
  <div class="market-analysis-loading">
    <div class="spinner-container">
      <div class="spinner">
        <div class="spinner-inner"></div>
      </div>
      <div class="pulse-container">
        <div class="pulse-dot"></div>
        <div class="pulse-dot"></div>
        <div class="pulse-dot"></div>
      </div>
    </div>
    <p class="loading-title">Étude de marché en cours</p>
    <p class="loading-subtitle">Analyse des prix pour <strong>${item.produit.nom}</strong></p>
    <p class="loading-text">Recherche des meilleures offres concurrentielles...</p>
  </div>
`;

      const response = await axios.get("http://localhost:8080/api/products/compare", {
        params: {
          name: item.produit.nom,
          maxPrice: item.prixUnitaire * 1.5
        }
      });

      const data = response.data;
      
      const overlay = document.createElement('div');
      overlay.className = 'market-analysis-overlay';
      document.body.appendChild(overlay);

      const analysisModal = document.createElement('div');
      analysisModal.className = 'market-analysis-modal';

      analysisModal.innerHTML = `
        <div class="market-analysis-content">
          <div class="modal-header">
            <h3>Analyse de marché</h3>
            <span class="product-name">${item.produit.nom}</span>
          </div>
          
          <div class="analysis-summary">
            <div class="summary-header">
              <h4>Résumé des offres analysées</h4>
              <span class="total-offers">${data.statistics.totalOffers} offres trouvées</span>
            </div>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Prix le plus bas</span>
                <span class="stat-value">${data.statistics.minPrice.toFixed(2)} €</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Prix moyen</span>
                <span class="stat-value">${data.statistics.averagePrice.toFixed(2)} €</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Prix le plus élevé</span>
                <span class="stat-value">${data.statistics.maxPrice.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          
          <div class="price-comparison-section">
            <div class="current-price">
              <span class="label">Votre prix</span>
              <span class="price">${item.prixUnitaire.toFixed(2)} €</span>
              <span class="status ${data.statistics.averagePrice > item.prixUnitaire ? 'competitive' : 'high'}">
                ${data.statistics.averagePrice > item.prixUnitaire ? 'Prix compétitif' : 'Prix élevé'}
              </span>
            </div>
          </div>

          <div class="market-stats-grid">
            <div class="stat-card">
              <i class="stat-icon price-average"></i>
              <span class="stat-label">Prix moyen</span>
              <span class="stat-value">${data.statistics.averagePrice.toFixed(2)} €</span>
            </div>
            <div class="stat-card">
              <i class="stat-icon price-best"></i>
              <span class="stat-label">Meilleur prix</span>
              <span class="stat-value highlight">${data.statistics.bestPrice.toFixed(2)} €</span>
            </div>
            <div class="stat-card">
              <i class="stat-icon price-range"></i>
              <span class="stat-label">Fourchette de prix</span>
              <span class="stat-value">${data.statistics.minPrice.toFixed(2)} € - ${data.statistics.maxPrice.toFixed(2)} €</span>
            </div>
            <div class="stat-card">
              <i class="stat-icon offers-count"></i>
              <span class="stat-label">Offres trouvées</span>
              <span class="stat-value">${data.statistics.totalOffers}</span>
            </div>
          </div>

          <div class="all-offers-section">
            <h4>Toutes les offres disponibles</h4>
            <div class="offers-list">
              ${data.offers.map(offer => `
                <div class="offer-card">
                  <div class="offer-header">
                    <img src="${offer.logo}" alt="${offer.source} logo" class="source-logo" />
                    <span class="offer-source">${offer.source}</span>
                    <span class="offer-price">${offer.price.toFixed(2)} €</span>
                  </div>
                  <p class="offer-title">${offer.title}</p>
                  <div class="offer-actions">
                    <a href="${offer.link}" target="_blank" class="view-offer-btn">Voir l'offre</a>
                    <button class="apply-price-btn" data-price="${offer.price}">Appliquer ce prix</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="modal-actions">
            <button class="close-modal-btn">Fermer</button>
          </div>
        </div>
      `;

      const modalStyles = document.createElement('style');
      modalStyles.textContent = `
        .market-analysis-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
        }

        .market-analysis-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .market-analysis-content {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .modal-header h3 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 600;
        }

        .product-name {
          display: block;
          color: #64748b;
          font-size: 16px;
          margin-top: 4px;
        }

        .price-comparison-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: center;
        }

        .current-price {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .current-price .label {
          color: #64748b;
          font-size: 14px;
        }

        .current-price .price {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
        }

        .status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .status.competitive {
          background: #dcfce7;
          color: #166534;
        }

        .status.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .market-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 24px;
          margin-bottom: 8px;
          color: #0ea5e9;
        }

        .stat-label {
          display: block;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .stat-value.highlight {
          color: #0ea5e9;
        }

        .best-offer-section {
          margin-bottom: 24px;
        }

        .best-offer-section h4 {
          color: #1e293b;
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .offer-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
        }

        .offer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .offer-source {
          color: #64748b;
          font-size: 14px;
        }

        .offer-price {
          color: #0ea5e9;
          font-weight: 600;
        }

        .offer-title {
          color: #1e293b;
          margin: 0;
          font-size: 16px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .apply-suggestion-btn,
        .close-modal-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .apply-suggestion-btn {
          background: #0ea5e9;
          color: white;
          border: none;
          flex: 1;
        }

        .apply-suggestion-btn:hover {
          background: #0284c7;
        }

        .close-modal-btn {
          background: #f1f5f9;
          color: #64748b;
          border: none;
        }

        .close-modal-btn:hover {
          background: #e2e8f0;
        }

        @media (max-width: 768px) {
          .market-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-actions {
            flex-direction: column;
          }

          .apply-suggestion-btn,
          .close-modal-btn {
            width: 100%;
          }
        }
      `;

      document.head.appendChild(modalStyles);
      document.body.appendChild(analysisModal);

      const closeModal = () => {
        overlay.remove();
        analysisModal.remove();
        modalStyles.remove();
      };

      overlay.addEventListener('click', closeModal);
      analysisModal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
      
      analysisModal.querySelector('.market-analysis-content').addEventListener('click', (e) => {
        e.stopPropagation();
      });

      const closeBtn = analysisModal.querySelector('.close-modal-btn');
      closeBtn.addEventListener('click', () => {
        analysisModal.remove();
        modalStyles.remove();
      });

      const applyBtn = analysisModal.querySelector('.apply-suggestion-btn');
      applyBtn.addEventListener('click', async () => {
        try {
          const newPrice = data.statistics.bestPrice;
          prixUnitaireInput.value = newPrice.toFixed(2);
          calculatePrixApresRemise();
          analysisModal.remove();
          modalStyles.remove();
        } catch (error) {
          console.error('Erreur lors de l\'application du prix suggéré:', error);
        }
      });

      resultDiv.innerHTML = '';

    } catch (error) {
      resultDiv.innerHTML = `
        <div class="analysis-error">
          Erreur lors de l'analyse de ${item.produit.nom}.
          <small>${error.response?.data?.message || error.message}</small>
        </div>
      `;
    }
  });
});



    const form = modal.querySelector('#priceEditForm');
    const prixUnitaireInput = form.querySelector('.prixUnitaireInput');
    const pourcentageInput = form.querySelector('.remiseInput');
    const quantityInput = form.querySelector('.quantiteInput');
    const prixApresRemiseSpan = form.querySelector('#prixApresRemise');
    const cancelBtn = modal.querySelector('.cancel-btn');

    // Utiliser les valeurs du premier item comme valeurs par défaut
    const defaultPrixUnitaire = items[0]?.prixUnitaire || 0;
    const defaultPourcentage = items[0]?.remisePourcentage || 0;
    const defaultQuantity = items[0]?.quantity || 1;

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

        // Récupérer les informations du commercial pour les notifications
        const user = JSON.parse(localStorage.getItem('user'));
        const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const commercialName = commercialResponse.data ? 
          `${commercialResponse.data.firstName || ''} ${commercialResponse.data.lastName || ''}`.trim() : 
          'Commercial';

        // Envoyer une notification au client pour la mise à jour du devis
        try {
          // Récupérer les informations du devis pour obtenir l'ID du client
          const devisResponse = await axios.get(`http://localhost:8080/api/devis/${items[0].cart.devisId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (devisResponse.data && devisResponse.data.client) {
            await axios.post('http://localhost:8080/api/notifications/', {
              userId: devisResponse.data.client.id,
              type: 'devis_update',
              title: 'Devis mis à jour',
              message: `Votre devis ${devisResponse.data.reference} a été mis à jour par ${commercialName}`,
              senderName: commercialName,
              devisId: devisResponse.data.id
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            // Envoyer via WebSocket si le service est connecté
            if (notificationService.isConnected()) {
              notificationService.sendNotification(`/topic/notifications/${devisResponse.data.client.id}`, {
                type: 'devis_update',
                title: 'Devis mis à jour',
                message: `Votre devis ${devisResponse.data.reference} a été mis à jour par ${commercialName}`,
                senderName: commercialName,
                devisId: devisResponse.data.id,
                userId: devisResponse.data.client.id
              });
            }
          }
        } catch (notifError) {
          console.error('Erreur lors de l\'envoi de la notification de mise à jour:', notifError);
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
            'http://localhost:8080/api/cart-items/update-by-cart-product',
            null,
            {
              params: {
                cartId: item.cartId,
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
      const clientResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Récupérer les messages en parallèle
      const messagesResponse = await axios.get(`http://localhost:8080/api/messages/devis/${devis.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (clientResponse.data) {
        // Mettre à jour le devis avec les informations complètes du client et les messages
        const devisWithClientAndMessages = {
          ...devis,
          client: clientResponse.data,
          messages: messagesResponse.data || []
        };
        setSelectedDevis(devisWithClientAndMessages);
        setShowChat(true);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      alert('Impossible de charger les informations nécessaires');
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
  switch (status) {
    case 'EN_COURS':
      return 'status-en-cours';
    case 'TERMINE':
    case 'TERMINEE':
      return 'status-termine';
    case 'EN_ATTENTE':
      return 'status-en-attente';
    case 'ACCEPTE':
      return 'status-accepte';
    case 'REFUSE':
    case 'ANNULE':
      return 'status-refuse';
    case 'VALIDE':
      return 'status-valide';
    case 'BROUILLON':
      return 'status-brouillon';
    default:
      return 'status-unknown';
  }
};

  



// Version avec affichage vraiment aléatoire
const getClientStatus = (client) => {
  const statuses = [
    { label: 'Client Potentiel', class: 'client-potentiel', icon: '🎯' },
    { label: 'Client Régulier', class: 'client-regulier', icon: '🔄' }
  ];

  // Utilisation de Math.random() pour un affichage vraiment aléatoire
  // à chaque rendu de la page
  const index = Math.floor(Math.random() * statuses.length);
  
  console.log(`Statut aléatoire généré: ${statuses[index].label}`);
  
  return statuses[index];
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
    <div className="">
      <div className="">
       
 <header className="devis-headerr">
          
            
            <h1 className="devis-title">Gestion des Devis</h1>
         
          
        <div className="devis-filterss">
  <div className="search-boxx">
    <Search size={20} />
    <input
      type="text"
      placeholder="Rechercher un devis..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-input"
    />
  </div>
  
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="status-filter"
  >
    <option value="TOUS">Tous les statuts</option>
    <option value="EN_COURS">En cours</option>
    <option value="EN_ATTENTE">En attente</option>
    <option value="TERMINE">Terminé</option>
  </select>
</div>
        </header>

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
        {filteredDevis.map(devis => {
          const isTerminated = devis.status === 'TERMINE' || devis.status === 'TERMINEE';
          const clientStatus = devis.client ? getClientStatus(devis.client) : getClientStatus(null);
          
          return (
            <tr key={devis.id} className={`devis-row ${isTerminated ? 'devis-terminated' : ''}`}>
              <td>
                <div className="reference-cell">
                  <span className="reference-text">{devis.reference}</span>
                  {isTerminated && <span className="terminated-badge">🔒</span>}
                </div>
              </td>
              <td>
                <div className="client-info clickable" onClick={() => handleViewClient(devis)}>
                  <User size={16} />
                  <span>
                    {devis.client ? `${devis.client.firstName || ''} ${devis.client.lastName || ''}` : 'Client '}
                  </span>
                </div>
              </td>
              <td>
                <div className={`client-status-random ${clientStatus.class}`}>
                  <span className="status-icon">{clientStatus.icon}</span>
                  <span className="status-label">{clientStatus.label}</span>
                </div>
              </td>
              <td>{new Date(devis.createdAt).toLocaleDateString('fr-FR')}</td>
              <td>
                <span className={`status-badge ${getStatusColor(devis.status)}`}>
                  <span className="status-icon">
                    {devis.status === 'EN_COURS' && '⏳'}
                    {devis.status === 'EN_ATTENTE' && '⏸️'}
                    {(devis.status === 'TERMINE' || devis.status === 'TERMINEE') && '✅'}
                    {devis.status === 'ACCEPTE' && '👍'}
                    {(devis.status === 'REFUSE' || devis.status === 'ANNULE') && '❌'}
                    {devis.status === 'VALIDE' && '✔️'}
                    {devis.status === 'BROUILLON' && '📝'}
                  </span>
                  {devis.status ? devis.status.replace('_', ' ') : 'Statut inconnu'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button 
                    className={`action-btn view ${isTerminated ? 'disabled' : ''}`} 
                    title={isTerminated ? "Devis terminé - Consultation seule" : "Voir le devis"} 
                    onClick={() => handleViewDevis(devis)}
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    className="contact-btn" 
                    onClick={() => handleOpenChat(devis)} 
                    disabled={!devis.id}
                  >
                    <MessageCircle size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
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
    const interval = setInterval(fetchMessages, 10000); // Rafraîchir toutes les 10 secondes
    return () => clearInterval(interval);
  }, [devis.id]);

  // Ajouter un indicateur de nouveaux messages non lus
  const unreadCount = messages.filter(msg => !msg.read && msg.senderId !== commercialId).length;

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
      
      const response = await axios.post('http://localhost:8080/api/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Ajouter le nouveau message à la liste
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
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return [...currentMessages, newMsg];
        });
        
        // Envoyer une notification au client
        try {
          // Notification via API REST
          await axios.post('http://localhost:8080/api/notifications/', {
            userId: devis.client.id,
            type: 'new_message',
            title: 'Nouveau message commercial',
            message: `Nouveau message de ${commercialName || 'Commercial'} concernant le devis ${devis.reference}`,
            senderName: commercialName || 'Commercial',
            devisId: devis.id,
            link: `/client/devis/${devis.id}`
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Notification via WebSocket (temps réel)
          if (notificationService.isConnected()) {
            notificationService.sendNotification(`/topic/notifications/${devis.client.id}`, {
              type: 'new_message',
              title: 'Nouveau message commercial',
              message: `Nouveau message de ${commercialName || 'Commercial'}`,
              senderName: commercialName || 'Commercial',
              devisId: devis.id,
              userId: devis.client.id,
              data: newMsg
            });
          } else {
            console.warn('⚠️ WebSocket non connecté, notification envoyée via API REST uniquement');
            // Tenter une reconnexion
            const userId = JSON.parse(localStorage.getItem('user'))?.id;
            if (userId) {
              notificationService.connect(userId, () => {});
            }
          }
        } catch (notifError) {
          console.error('Erreur lors de l\'envoi de la notification de message:', notifError);
        }
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
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              {devis.client?.firstName?.charAt(0) || 'C'}
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </div>
            <div className="chat-header-text">
              <h3>{devis.client?.firstName} {devis.client?.lastName}</h3>
              <p>Devis: {devis.reference}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="devis-chat-messages">
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
            <div className="devis-chat-no-messages">
              <p>Aucun message dans cette conversation. Commencez à discuter avec {devis.client?.firstName}.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isCommercial = msg.senderId === commercialId;
                
                return (
                  <div 
                    key={msg.id || index} 
                    className={`devis-chat-message ${isCommercial ? 'devis-sent' : 'devis-received'}`}
                  >
                    {!isCommercial && (
                      <div className="devis-chat-avatar">
                        {devis.client?.firstName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <div className="devis-message-content">
                      <p>{msg.content}</p>
                      <span className="devis-message-time">
                        {formatDate(msg.timestamp)}
                      </span>
                      {isCommercial && (
                        <span className="devis-message-status">
                          {msg.read ? (
                            <CheckCircle size={12} />
                          ) : (
                            <CheckCircle size={12} opacity={0.5} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="devis-chat-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message ici..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            className="devis-send-message-btn"
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? <Loader size={18} className="spinner" /> : <Send size={18} />}
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
  const [remises, setRemises] = useState({});
  const [purchaseCounts, setPurchaseCounts] = useState({});
  const [isPredicting, setIsPredicting] = useState(false);

  const styles = {};

  // CSS styles are moved to CSS file

  // Add the getStatusColor function here to make it available in this component
  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-progress';
      case 'TERMINÉ': return 'status-completed';
      case 'TERMINE':
      case 'TERMINEE':
        return 'status-termine';
      case 'ACCEPTE':
        return 'status-accepte';
      case 'REFUSE':
      case 'ANNULE':
        return 'status-refuse';
      case 'VALIDE':
        return 'status-valide';
      case 'BROUILLON':
        return 'status-brouillon';
      default: return 'status-unknown';
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

        // Récupérer les produits du devis avec l'endpoint /itemss
        const produitsResponse = await axios.get(
          `http://localhost:8080/api/devis/${devis.id}/itemss`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (produitsResponse.data) {
          const produitsData = produitsResponse.data.map(item => {
            const prixUnitaire = item.prixUnitaire || 0;
            const prixApresRemise = item.prixApresRemise || prixUnitaire;
            
            // Calculer le pourcentage de remise
            const remisePourcentage = prixUnitaire > 0
              ? ((prixUnitaire - prixApresRemise) / prixUnitaire) * 100
              : 0;

            return {
              id: item.id,
              nom: item.nom,
              reference: item.reference,
              prix: prixUnitaire,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
              prixApresRemise: prixApresRemise,
              totalItem: item.totalItem,
              remisePourcentage: parseFloat(remisePourcentage.toFixed(2)),
              dernierPrixAchat: 0 // Initialiser à 0, sera mis à jour plus tard
            };
          });
          setProduits(produitsData);
          
          // Initialiser les remises avec les pourcentages calculés
          const remisesInitiales = {};
          produitsData.forEach(produit => {
            remisesInitiales[produit.id] = produit.remisePourcentage;
          });
          setRemises(remisesInitiales);
          
          // Calculer le prix total
          const total = produitsData.reduce((sum, item) => sum + item.totalItem, 0);
          setTotalPrice(total);
          
          // Récupérer les derniers prix d'achat pour tous les produits
          const productIds = produitsData.map(produit => produit.id);
          try {
            // Récupérer d'abord les informations du client
            const clientResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (clientResponse.data && clientResponse.data.id) {
              const clientId = clientResponse.data.id;
              setClientInfo(clientResponse.data);
              
              // Appeler l'API avec l'ID du client dans le chemin
              const lastPricesResponse = await axios.post(
                `http://localhost:8080/api/products/last-purchase-prices/${clientId}`,
                productIds,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              // Récupérer le nombre d'achats pour chaque produit
              const purchaseCountPromises = produitsData.map(produit =>
                axios.get(`http://localhost:8080/api/products/purchase-count/${clientId}/${produit.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
              );
              
              const purchaseCountsResponses = await Promise.all(purchaseCountPromises);
              const purchaseCountsData = {};
              produitsData.forEach((produit, index) => {
                purchaseCountsData[produit.id] = purchaseCountsResponses[index].data;
              });
              setPurchaseCounts(purchaseCountsData);
              
              if (lastPricesResponse.data) {
                const lastPrices = lastPricesResponse.data;
                const updatedProduits = produitsData.map(produit => ({
                  ...produit,
                  dernierPrixAchat: lastPrices[produit.id] || 0
                }));
                setProduits(updatedProduits);
              }
            }
          } catch (priceErr) {
            console.error('Erreur lors de la récupération des derniers prix d\'achat:', priceErr);
            // Ne pas bloquer le chargement si cette partie échoue
          }
        }

        // Si on a déjà récupéré les informations du client plus haut, ne pas les récupérer à nouveau
        if (!clientInfo) {
          // Récupérer les informations du client
          try {
            const clientResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (clientResponse.data) {
              setClientInfo(clientResponse.data);
            }
          } catch (clientErr) {
            console.error('Erreur lors de la récupération des informations client:', clientErr);
          }
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

  const createModal = (title, bodyContent) => {
    const modal = document.createElement('div');
    modal.className = 'market-analysis-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <span class="close">&times;</span>
        </div>
        <div class="modal-body">${bodyContent}</div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    return modal;
  };
  
  // Fonction pour analyser la probabilité de vente avec l'IA
// ... existing code ...
const analyzeProbability = async () => {
  let progressInterval;
  
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Afficher modal de chargement avec barre linéaire ultra-moderne
    const loadingModal = createModal('Analyse IA en cours', `
      <style>
        .ai-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
          background-size: 400% 400%;
          animation: gradientShift 4s ease infinite;
          color: white;
          border-radius: 25px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.1);
          position: relative;
          overflow: hidden;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .ai-loader::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          animation: sweep 3s infinite;
        }

        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .linear-progress {
          width: 100%;
          max-width: 500px;
          margin: 30px 0;
          background: rgba(255,255,255,0.15);
          border-radius: 15px;
          overflow: hidden;
          height: 28px;
          position: relative;
          backdrop-filter: blur(15px);
          box-shadow: 
            inset 0 2px 4px rgba(0,0,0,0.1),
            0 4px 8px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .progress-bar {
          height: 100%;
          position: relative;
          border-radius: 15px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, 
            #00d4ff 0%, 
            #5b86e5 25%, 
            #36d1dc 50%, 
            #4facfe 75%, 
            #00f2fe 100%
          );
          background-size: 300% 100%;
          animation: flowingGradient 2.5s ease infinite;
          transition: width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border-radius: 15px;
          box-shadow: 
            0 0 25px rgba(0, 212, 255, 0.6),
            inset 0 1px 0 rgba(255,255,255,0.3);
          position: relative;
          overflow: hidden;
        }

        @keyframes flowingGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .progress-fill::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255,255,255,0.6), 
            transparent
          );
          animation: shine 2s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(255,255,255,0.1) 8px,
            rgba(255,255,255,0.1) 16px
          );
          animation: movingStripes 1.5s linear infinite;
        }

        @keyframes movingStripes {
          0% { transform: translateX(0); }
          100% { transform: translateX(16px); }
        }

        .progress-text {
          position: absolute;
          top: -40px;
          right: 0;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          background: rgba(255,255,255,0.1);
          padding: 5px 12px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s ease;
        }

        .progress-text.updating {
          transform: scale(1.1);
          background: rgba(0, 212, 255, 0.3);
        }

        .ai-title {
          margin-top: 35px;
          color: #fff;
          font-size: 2rem;
          font-weight: 800;
          text-shadow: 0 3px 6px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 18px;
          letter-spacing: 0.5px;
        }

        .ai-icon {
          font-size: 2.5rem;
          animation: smartPulse 2.5s infinite;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
        }

        @keyframes smartPulse {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
          }
          25% { 
            transform: scale(1.05) rotate(2deg); 
            filter: drop-shadow(0 0 15px rgba(0,212,255,0.5));
          }
          50% { 
            transform: scale(1.1) rotate(0deg); 
            filter: drop-shadow(0 0 20px rgba(91,134,229,0.6));
          }
          75% { 
            transform: scale(1.05) rotate(-2deg); 
            filter: drop-shadow(0 0 15px rgba(54,209,220,0.5));
          }
        }

        #ai-status {
          margin-top: 20px;
          font-size: 17px;
          color: rgba(255,255,255,0.95);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: rgba(255,255,255,0.1);
          padding: 12px 20px;
          border-radius: 25px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
          min-height: 50px;
          justify-content: center;
        }

        .status-icon {
          font-size: 1.4rem;
          animation: dynamicRotate 3s linear infinite;
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.4));
        }

        @keyframes dynamicRotate {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(90deg) scale(1.1); }
          50% { transform: rotate(180deg) scale(1); }
          75% { transform: rotate(270deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .status-change {
          animation: statusTransition 0.8s ease;
        }

        @keyframes statusTransition {
          0% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
          25% { 
            transform: scale(0.95) translateY(-5px); 
            opacity: 0.7; 
          }
          50% { 
            transform: scale(1.05) translateY(0); 
            opacity: 0.9; 
            background: rgba(0,212,255,0.2);
          }
          75% { 
            transform: scale(1.02) translateY(2px); 
            opacity: 0.95; 
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }

        .completion-effect {
          animation: completionCelebration 1s ease;
        }

        @keyframes completionCelebration {
          0% { transform: scale(1); }
          25% { transform: scale(1.05); background: rgba(0,255,0,0.2); }
          50% { transform: scale(1.1); background: rgba(0,255,0,0.3); }
          75% { transform: scale(1.05); background: rgba(0,255,0,0.2); }
          100% { transform: scale(1); }
        }
      </style>

      <div class="ai-loader">
        <div class="linear-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
        <h3 class="ai-title">
          <span class="ai-icon">🤖</span>
          SofIMed Analytics Pro
        </h3>
        <p id="ai-status">
          <span class="status-icon">⚙️</span>
          Initialisation du système IA...
        </p>
      </div>
    `);

    // Animation de progression améliorée
    const statusTexts = [
      { text: "Initialisation du système IA...", icon: "⚙️" },
      { text: "Collecte des données client...", icon: "📊" },
      { text: "Analyse comportementale en cours...", icon: "🧠" },
      { text: "Calcul des probabilités avancées...", icon: "🔬" },
      { text: "Génération du rapport intelligent...", icon: "📋" },
      { text: "Finalisation de l'analyse...", icon: "✨" }
    ];

    let currentStep = 0;
    const maxSteps = statusTexts.length;

    progressInterval = setInterval(() => {
      try {
        if (currentStep < maxSteps) {
          const statusElement = document.getElementById('ai-status');
          const progressFill = document.querySelector('.progress-fill');
          const progressText = document.querySelector('.progress-text');
          
          if (statusElement && progressFill && progressText) {
            // Vérification robuste
            const currentStatus = statusTexts[currentStep];
            if (currentStatus) {
              const icon = currentStatus.icon || "⚙️"; // Icône par défaut
              const text = currentStatus.text || "Traitement en cours..."; // Texte par défaut
              
              // Ajouter effet de pulsation au changement
              statusElement.classList.add('status-change');
              
              setTimeout(() => {
                statusElement.innerHTML = `
                  <span class="status-icon">${icon}</span>
                  ${text}
                `;
                statusElement.classList.remove('status-change');
              }, 300);
              
              const percentage = Math.round((currentStep + 1) * (100 / maxSteps));
              progressFill.style.width = `${percentage}%`;
              progressText.textContent = `${percentage}%`;
            }
            currentStep++;
          }
        } else {
          clearInterval(progressInterval);
        }
      } catch (error) {
        console.error('Erreur dans l\'animation de progression:', error);
        clearInterval(progressInterval);
      }
    }, 1200); // Temps entre chaque étape augmenté à 1.2 secondes

    // Récupération des données (inchangé)
    const clientStats = await axios.get(
      `http://localhost:8080/api/client-stats/${clientInfo.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    // Récupérer l'userId du client pour les sessions
    const clientUserResponse = await axios.get(
      `http://localhost:8080/api/clients/${clientInfo.id}/user-id`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const clientUserId = clientUserResponse.data;

    // Récupérer le temps total passé dans l'application
    const sessionResponse = await axios.get(
      `http://localhost:8080/api/sessions/totalDuration/${clientUserId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const tempsPasseMinutes = Math.round(sessionResponse.data / (1000 * 60));

    // Récupérer le temps de réponse moyen de la messagerie
    let tempsReponseMessagerie = 2; // Valeur par défaut
    try {
      const messageResponse = await axios.get(
        `http://localhost:8080/api/messages/temps-reponse-moyen-client/${devis.id}?clientId=${clientInfo.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      tempsReponseMessagerie = Math.round(messageResponse.data);
    } catch (error) {
      console.warn('Impossible de récupérer le temps de réponse messagerie:', error);
    }

    const nbProduitsDevis = produits.length;
    const nbProduitsDejaPurchased = produits.filter(p => purchaseCounts[p.id] > 0).length;
    
    // Calcul du délai de traitement
    let delaiTraitementHeures = 0;
    if (devis && devis.createdAt) {
        const currentTime = new Date();
        const creationDate = new Date(devis.createdAt);
        delaiTraitementHeures = Math.floor((currentTime - creationDate) / (1000 * 60 * 60));
    }
    
    const modelData = {
      totalCommandes: clientStats.data.totalCommandes,
      totalDevis: clientStats.data.totalDevis,
      totalMontantCommandes: clientStats.data.totalMontantCommandes,
      nb_produits_devis: nbProduitsDevis,
      nb_produits_deja_achetes: nbProduitsDejaPurchased,
      temps_dans_application_min: tempsPasseMinutes,
      temps_reponse_messagerie_min: tempsReponseMessagerie,
      delai_traitement_devis_hrs: delaiTraitementHeures,
      taux_conversion: clientStats.data.totalDevis > 0 ? (clientStats.data.totalCommandes / clientStats.data.totalDevis) * 100 : 0,
      moyenne_montant_commande: clientStats.data.totalCommandes > 0 ? clientStats.data.totalMontantCommandes / clientStats.data.totalCommandes : 0,
      ratio_produits_achetes: nbProduitsDevis > 0 ? nbProduitsDejaPurchased / nbProduitsDevis : 0
    };

    const response = await axios.post(
      'http://localhost:8080/api/predictions/analyze',
      modelData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );

    // Animation de fermeture du modal de chargement
    clearInterval(progressInterval);
    
    // Effet de fondu pour fermer le modal
    loadingModal.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    loadingModal.style.opacity = '0';
    loadingModal.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
      loadingModal.remove();
    }, 500);

    // Créer le modal avec résultats professionnels - DESIGN CLAIR
    const modal = createModal('📊 Rapport d\'Analyse IA', `
      <div class="ai-report" style="font-family: 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 25px rgba(0,0,0,0.05);">
        <header style="padding: 25px; background: #f8f9fc; border-bottom: 1px solid #eaeef5; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="width: 50px; height: 50px; background: #f0f7ff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <div style="width: 30px; height: 30px; background: #4CAF50; border-radius: 50%;"></div>
            </div>
            <div>
              <h1 style="margin: 0; color: #333; font-size: 1.5rem; font-weight: 600;">SofIMed AI</h1>
              <p style="margin: 5px 0 0; color: #666;">Intelligence Artificielle Avancée</p>
              <div style="font-size: 0.85rem; color: #999; margin-top: 5px;">
                Analyse générée le ${new Date().toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          <div style="background: #e8f5e9; border-radius: 8px; padding: 10px 15px; display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 1.2rem;">🎯</div>
            <div>
              <div style="font-size: 0.9rem; color: #388e3c;">Rapport Certifié</div>
              <div style="font-weight: 600; color: #2e7d32;">IA Premium</div>
            </div>
          </div>
        </header>

        <section style="padding: 30px; display: flex; flex-wrap: wrap; gap: 30px; border-bottom: 1px solid #eee;">
          <div style="flex: 1; min-width: 250px; display: flex; justify-content: center;">
            <div style="text-align: center;">
              <div style="font-size: 3rem; font-weight: bold; color: #4CAF50; line-height: 1;">${Math.round(response.data.pourcentageAcceptation)}%</div>
              <div style="color: #666; margin-top: 10px; font-size: 1.1rem;">Probabilité d'Acceptation</div>
            </div>
          </div>
          
          <div style="flex: 1; min-width: 250px;">
            <h3 style="margin-top: 0; color: #333; font-size: 1.2rem;">Niveau de Confiance</h3>
            <div style="margin-top: 15px;">
              <div style="height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden;">
                <div class="confidence-bar" style="height: 100%; background: #4CAF50; width: 0%; border-radius: 5px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; color: #666; font-size: 0.9rem;">
                <span>Faible</span>
                <span>${Math.round(response.data.details.confiance * 100)}%</span>
                <span>Élevée</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px;">
              <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 8px;">
                <div style="font-size: 1.2rem; color: #4CAF50;">🔬</div>
                <span style="font-size: 0.9rem;">Analyse Multi-Factorielle</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 8px;">
                <div style="font-size: 1.2rem; color: #4CAF50;">⚡</div>
                <span style="font-size: 0.9rem;">Traitement Temps Réel</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 8px;">
                <div style="font-size: 1.2rem; color: #4CAF50;">📊</div>
                <span style="font-size: 0.9rem;">Algorithme Avancé</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; padding: 12px; border-radius: 8px;">
                <div style="font-size: 1.2rem; color: #4CAF50;">🛡️</div>
                <span style="font-size: 0.9rem;">Données Sécurisées</span>
              </div>
            </div>
          </div>
        </section>

        <section style="padding: 30px; background: #f8f9fc;">
          <h2 style="display: flex; align-items: center; gap: 10px; color: #333; margin-top: 0; font-size: 1.4rem;">
            <span>📊</span> Analyse Détaillée des Métriques
          </h2>
          <p style="color: #666; margin-bottom: 25px; font-size: 0.95rem;">Toutes les données analysées par l'IA</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <!-- Section Métriques Commerciales -->
            <div style="background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.03);">
              <h3 style="display: flex; align-items: center; gap: 8px; color: #333; margin-top: 0; font-size: 1.1rem;">💼 Métriques Commerciales</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.totalCommandes}</div>
                  <div style="color: #666; font-size: 0.9rem;">Total Commandes</div>
                  <div style="color: #4CAF50; font-size: 0.85rem; margin-top: 5px;">Performance excellente</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.totalDevis}</div>
                  <div style="color: #666; font-size: 0.9rem;">Total Devis</div>
                  <div style="color: #666; font-size: 0.85rem; margin-top: 5px;">Flux régulier</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.totalMontantCommandes.toLocaleString('fr-FR')} MAD</div>
                  <div style="color: #666; font-size: 0.9rem;">Montant Total</div>
                  <div style="color: #4CAF50; font-size: 0.85rem; margin-top: 5px;">Croissance solide</div>
                </div>
              </div>
            </div>

            <!-- Section Métriques Produits -->
            <div style="background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.03);">
              <h3 style="display: flex; align-items: center; gap: 8px; color: #333; margin-top: 0; font-size: 1.1rem;">🛍️ Métriques Produits</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.nb_produits_devis}</div>
                  <div style="color: #666; font-size: 0.9rem;">Produits dans Devis</div>
                  <div style="color: #666; font-size: 0.85rem; margin-top: 5px;">Panier moyen</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.nb_produits_deja_achetes}</div>
                  <div style="color: #666; font-size: 0.9rem;">Produits Déjà Achetés</div>
                  <div style="color: #4CAF50; font-size: 0.85rem; margin-top: 5px;">Fidélité prouvée</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${(modelData.ratio_produits_achetes * 100).toFixed(1)}%</div>
                  <div style="color: #666; font-size: 0.9rem;">Ratio Produits Achetés</div>
                  <div style="color: ${modelData.ratio_produits_achetes > 0.5 ? '#4CAF50' : '#FF9800'}; font-size: 0.85rem; margin-top: 5px;">
                    ${modelData.ratio_produits_achetes > 0.5 ? 'Excellent' : 'Modéré'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Métriques Temporelles -->
            <div style="background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.03);">
              <h3 style="display: flex; align-items: center; gap: 8px; color: #333; margin-top: 0; font-size: 1.1rem;">⏱️ Métriques Temporelles</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.temps_dans_application_min} min</div>
                  <div style="color: #666; font-size: 0.9rem;">Temps dans Application</div>
                  <div style="color: #666; font-size: 0.85rem; margin-top: 5px;">
                    ${modelData.temps_dans_application_min > 60 ? 'Très engagé' : 'Engagement modéré'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${tempsReponseMessagerie} min</div>
                  <div style="color: #666; font-size: 0.9rem;">Temps Réponse Messagerie</div>
                  <div style="color: ${tempsReponseMessagerie <= 5 ? '#4CAF50' : '#FF9800'}; font-size: 0.85rem; margin-top: 5px;">
                    ${tempsReponseMessagerie <= 5 ? 'Rapide' : 'Lent'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${delaiTraitementHeures}h</div>
                  <div style="color: #666; font-size: 0.9rem;">Délai Traitement Devis</div>
                  <div style="color: ${delaiTraitementHeures <= 24 ? '#4CAF50' : '#FF9800'}; font-size: 0.85rem; margin-top: 5px;">
                    ${delaiTraitementHeures <= 24 ? 'Urgent' : 'En cours'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Métriques Performance -->
            <div style="background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.03);">
              <h3 style="display: flex; align-items: center; gap: 8px; color: #333; margin-top: 0; font-size: 1.1rem;">📈 Métriques Performance</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 15px;">
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.taux_conversion.toFixed(1)}%</div>
                  <div style="color: #666; font-size: 0.9rem;">Taux de Conversion</div>
                  <div style="color: ${modelData.taux_conversion > 20 ? '#4CAF50' : '#FF9800'}; font-size: 0.85rem; margin-top: 5px;">
                    ${modelData.taux_conversion > 20 ? 'Excellent' : 'À améliorer'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: #333;">${modelData.moyenne_montant_commande.toLocaleString('fr-FR')} MAD</div>
                  <div style="color: #666; font-size: 0.9rem;">Moyenne Montant Commande</div>
                  <div style="color: #666; font-size: 0.85rem; margin-top: 5px;">Valeur moyenne</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style="padding: 30px;">
          <h2 style="display: flex; align-items: center; gap: 10px; color: #333; margin-top: 0; font-size: 1.4rem;">
            <span>🧠</span> Insights IA Avancés
          </h2>
          <p style="color: #666; margin-bottom: 25px; font-size: 0.95rem;">Analyse prédictive et recommandations</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div style="display: flex; gap: 15px; background: #f9f9f9; border-radius: 12px; padding: 20px;">
              <div style="font-size: 1.8rem; color: #4CAF50;">🎯</div>
              <div>
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 1.2rem;">Analyse Prédictive</h4>
                <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.5;">
                  Le modèle d'IA a analysé <strong>${Object.keys(modelData).length} paramètres</strong> avec un algorithme de machine learning pour cette prédiction.
                </p>
              </div>
            </div>
            
            <div style="display: flex; gap: 15px; background: #f9f9f9; border-radius: 12px; padding: 20px;">
              <div style="font-size: 1.8rem; color: #4CAF50;">⚡</div>
              <div>
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 1.2rem;">Traitement Temps Réel</h4>
                <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.5;">
                  Analyse effectuée en temps réel avec les <strong>dernières données</strong> disponibles dans votre système.
                </p>
              </div>
            </div>
            
            <div style="display: flex; gap: 15px; background: #f9f9f9; border-radius: 12px; padding: 20px;">
              <div style="font-size: 1.8rem; color: #4CAF50;">📊</div>
              <div>
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 1.2rem;">Algorithme Avancé</h4>
                <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.5;">
                  Utilisation de <strong>techniques de régression</strong> et d'apprentissage automatique pour une précision optimale.
                </p>
              </div>
            </div>
            
            <div style="display: flex; gap: 15px; background: #f9f9f9; border-radius: 12px; padding: 20px;">
              <div style="font-size: 1.8rem; color: #4CAF50;">🛡️</div>
              <div>
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 1.2rem;">Sécurité & Confidentialité</h4>
                <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.5;">
                  Toutes les données sont <strong>chiffrées</strong> et traitées selon les standards de sécurité les plus élevés.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer style="display: flex; justify-content: space-between; padding: 20px; background: #f8f9fc; border-top: 1px solid #eaeef5; font-size: 0.9rem;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 1.2rem; color: #4CAF50;">🤖</div>
            <div>
              <div style="font-weight: bold; color: #333;">SofIMed AI</div>
              <div style="color: #666;">Rapport généré par Intelligence Artificielle</div>
            </div>
          </div>
          <div style="display: flex; gap: 15px; color: #666;">
            <div>
              <div>Version:</div>
              <div style="font-weight: bold; color: #333;">AI v2.1</div>
            </div>
            <div>
              <div>Précision:</div>
              <div style="font-weight: bold; color: #333;">95.7%</div>
            </div>
          </div>
        </footer>
      </div>
    `);

    // Ajouter les styles CSS
    const style = document.createElement('style');
    style.textContent = `
      .ai-loader {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 30px;
        max-width: 500px;
        margin: 0 auto;
      }
      
      .linear-progress {
        width: 100%;
        margin-bottom: 20px;
      }
      
      .progress-bar {
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      
      .progress-fill {
        height: 100%;
        background: #4CAF50;
        width: 0%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }
      
      .progress-text {
        margin-top: 8px;
        font-weight: 600;
        color: #4CAF50;
        font-size: 1.1rem;
        text-align: center;
      }
      
      .ai-report h1, .ai-report h2, .ai-report h3 {
        color: #333;
      }
    `;
    document.head.appendChild(style);

    // Animation pour la barre de confiance
    setTimeout(() => {
      const confidenceBar = modal.querySelector('.confidence-bar');
      if (confidenceBar) {
        confidenceBar.style.transition = 'width 1s ease';
        confidenceBar.style.width = `${Math.round(response.data.details.confiance * 100)}%`;
      }
    }, 300);

  } catch (error) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    console.error('Erreur lors de l\'analyse:', error);
    createModal('❌ Erreur IA', `
      <div style="text-align: center; padding: 30px; max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
        <div style="font-size: 4rem; margin-bottom: 20px; animation: shake 0.5s ease-in-out infinite alternate;">🤖💥</div>
        <h3 style="color: white; margin-bottom: 15px;">Erreur lors de l'analyse IA</h3>
        <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px;">Une erreur est survenue lors de l'analyse :</p>
        <p style="color: #fff; font-weight: bold; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin: 20px 0; backdrop-filter: blur(10px);">
          ${error.response?.data?.message || error.message}
        </p>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin-top: 25px; backdrop-filter: blur(10px);">
          <p style="font-weight: bold; color: white; margin-top: 0;">💡 Suggestions :</p>
          <ul style="text-align: left; padding-left: 20px; color: rgba(255,255,255,0.9); margin-bottom: 0; line-height: 1.6;">
            <li>Vérifiez votre connexion internet</li>
            <li>Assurez-vous que le serveur IA est accessible</li>
            <li>Réessayez dans quelques instants</li>
            <li>Contactez le support technique</li>
          </ul>
        </div>
        
        <style>
          @keyframes shake {
            0% { transform: translateX(0); }
            100% { transform: translateX(5px); }
          }
        </style>
      </div>
    `);
  }
};


// ... existing code ...

// Dans la section des boutons d'action
<button 
  className="ai-probability-btn" 
  onClick={analyzeProbability}
>
  <ChartBar size={16} />
  Probabilité IA
</button>

// ... existing code ...
  const createLoadingBody = (produit) => `
    <div class="analysis-loading">
      <div class="loading-spinner">
        <div class="spinner-track"></div>
        <div class="spinner-fill"></div>
      </div>
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
      <p class="loading-percentage">Analyse en cours...</p>
      <h4 class="loading-title">Analyse de marché pour ${produit.nom}</h4>
      <p class="loading-subtitle">Recherche des meilleures offres concurrentielles</p>
    </div>
  `;
  
  const createErrorBody = (message) => `
    <div class="error-state">
      <i class="error-icon">⚠️</i>
      <h4>Erreur d'analyse</h4>
      <p>${message}</p>
      <button class="retry-btn">Réessayer</button>
    </div>
  `;
  
  const createResultBody = (produit, data) => ` 
   <div class="product-header"> 
     <h4>${produit.nom}</h4> 
     <p>${produit.reference}</p> 
   </div> 
 
   <div class="price-comparison"> 
     <div class="current-price"> 
       <span>Votre prix</span> 
       <strong>${produit.prix} MAD</strong> 
       <span class="comparison-indicator ${data.statistics.averagePrice > produit.prix ? 'positive' : 'negative'}">
         ${data.statistics.averagePrice > produit.prix ? '✓ Compétitif' : '✗ Au-dessus du marché'} 
       </span> 
     </div> 
 
     <div class="market-price"> 
       <span>Prix moyen marché</span> 
       <strong>${data.statistics.averagePrice.toFixed(2)} MAD</strong> 
     </div> 
   </div> 
 
   <div class="stats-grid"> 
     <div class="stat-card"> 
       <i class="icon">📉</i> 
       <span>Meilleur prix</span> 
       <strong>${data.statistics.minPrice.toFixed(2)} MAD</strong> 
     </div> 
 
     <div class="stat-card"> 
       <i class="icon">📈</i> 
       <span>Prix maximum</span> 
       <strong>${data.statistics.maxPrice.toFixed(2)} MAD</strong> 
     </div> 
 
     <div class="stat-card"> 
       <i class="icon">🔍</i> 
       <span>Offres analysées</span> 
       <strong>${data.statistics.totalOffers}</strong> 
     </div> 
   </div> 
 
   <!-- Nouvelle section pour toutes les offres --> 
   <div class="all-offers-section"> 
     <h5>Toutes les offres disponibles (${data.allOffers.length})</h5> 
     <div class="offers-grid"> 
       ${data.allOffers.map(offer => ` 
         <div class="offer-card"> 
           <div class="offer-header"> 
             <span class="offer-source">${offer.source}</span> 
             <span class="offer-price">${offer.price.toFixed(2)} MAD</span> 
           </div> 
           <p class="offer-title">${offer.title}</p> 
           <div class="offer-actions"> 
             <a href="${offer.link}" target="_blank" class="view-offer-btn">Voir l'offre</a> 
             <button class="apply-offer-btn" data-price="${offer.price}"> 
               Appliquer ce prix 
             </button> 
           </div> 
         </div> 
       `).join('')} 
     </div> 
   </div> 
 
   <div class="actions"> 
     <button class="close-btn">Fermer</button> 
   </div> 
`;

  
  const analyzePrices = async (productName, produit) => {
    let modal = null;

    try {
      // Affichage de la modale de chargement
      modal = createModal('Analyse de marché', createLoadingBody(produit));

      const response = await axios.get(`http://localhost:8080/api/products/compare`, {
        params: { name: produit.nom }
      });

      const data = response.data;

      // Mise à jour avec les résultats
      modal.querySelector('.modal-body').innerHTML = createResultBody(produit, data);

      // Gestionnaire pour le bouton de fermeture
      modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());

      // Gestionnaire pour tous les boutons d'application de prix
      modal.querySelectorAll('.apply-offer-btn').forEach(button => {
        button.addEventListener('click', () => {
          try {
            const price = parseFloat(button.dataset.price);
            handlePriceChange(produit.id, price);
          } catch (err) {
            alert("Erreur lors de l'application du prix.");
          } finally {
            modal.remove();
          }
        });
      });

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      if (modal) {
        modal.querySelector('.modal-body').innerHTML = createErrorBody(errorMsg);
        modal.querySelector('.retry-btn').addEventListener('click', () => {
          modal.remove();
          analyzePrices(productName, produit);
        });
      } else {
        modal = createModal('Erreur d\'analyse', createErrorBody(errorMsg));
        modal.querySelector('.retry-btn').addEventListener('click', () => {
          modal.remove();
          analyzePrices(productName, produit);
        });
      }
    }
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
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const cartId = cartIdResponse.data;

    const updateRequests = produits.map(async (produit) => {
      const prixUnitaire = parseFloat(produit.prix ?? 0);
      const remise = parseFloat(remises[produit.id] ?? 0);

      if (prixUnitaire <= 0) {
        throw new Error(`Prix unitaire invalide pour produit ID ${produit.id}`);
      }

      await axios.put(
        'http://localhost:8080/api/cart-items/update-by-cart-product',
        null,
        {
          params: {
            cartId: cartId,
            produitId: produit.id,
            prixUnitaire: prixUnitaire,
            remisePourcentage: remise,
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    });

    await Promise.all(updateRequests);
    
    // 🔽🔽🔽 UNIQUEMENT CETTE LIGNE EST AJOUTÉE 🔽🔽🔽
    await axios.put(`http://localhost:8080/api/devis/${devis.id}/status`, "EN_COURS", {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' }
    });
    // 🔼🔼🔼 FIN DE L'AJOUT 🔼🔼🔼

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
          
          {/* Bouton d'analyse de probabilité IA */}
          <div className="devis-info-row ai-probability-container">
           
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
                    <th>Historique d'achats</th>
                    <th>Dernier prix d'achat</th>
                    <th>Étude de marché</th>
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
                          type="number" 
                          className="price-input" 
                          value={produit.prix || produit.prixUnitaire || 0} 
                          onChange={(e) => handlePriceChange(produit.id, e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="remise-cell">
                        <input 
                          type="number" 
                          className="remise-input" 
                          value={remises[produit.id]} 
                          onChange={(e) => handleRemiseChange(produit.id, e.target.value)}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="prix-remise">
                        {formatNumber(produit.prixApresRemise || getPrixApresRemise(produit))}
                      </td>
                      <td>{produit.quantity || 0}</td>
                      <td>{formatNumber(produit.totalItem || (getPrixApresRemise(produit) * produit.quantity))}</td>
                      <td className="purchase-history">
                        <div className="purchase-count">
                          <span className="count-number">{purchaseCounts[produit.id] || 0}</span>
                          <span className="count-label">achats</span>
                        </div>
                      </td>
                      <td className="dernier-prix-achat">
                        {formatNumber(produit.dernierPrixAchat || 0)}
                      </td>
                      <td>
                        <button className="market-study-btn" onClick={() => analyzePrices(produit.nom, produit)}>
                          <ChartBar size={14} />
                          Étude marché
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8" className="total-label">Total</td>
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
                <button className="ai-probability-btn" onClick={analyzeProbability}>
                  <ChartBar size={16} />
                  Probabilité IA
                </button>
                <button 
                  className={`btn btn-primary ${(devis.status === 'TERMINE' || devis.status === 'TERMINEE') ? 'btn-disabled' : ''}`}
                  onClick={handleFormSubmit}
                  disabled={savingPrices || devis.status === 'TERMINE' || devis.status === 'TERMINEE'}
                  title={(devis.status === 'TERMINE' || devis.status === 'TERMINEE') ? "Impossible de modifier un devis terminé" : ""}
                >
                  {savingPrices ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Enregistrement...
                    </>
                  ) : (devis.status === 'TERMINE' || devis.status === 'TERMINEE') ? (
                    <>
                      🔒 Devis terminé
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