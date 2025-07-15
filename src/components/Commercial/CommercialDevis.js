import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


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
    case 'en_cours':
      return 'status-en_cours';
    case 'termine':
      return 'status-termine';
    case 'en_attente':
      return 'status-en_attente';
    default:
      return 'status-unknown';
  }
};

  // Ajout de la fonction pour déterminer le statut du client
  // Optimisation de la fonction getClientStatus
const getClientStatus = (client) => {
  if (!client) return { label: 'Inconnu', class: 'client-unknown' };
  
  // Logique pour déterminer le statut du client
  const orderCount = client.orderCount || 0;
  const lastOrderDate = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
  
  if (orderCount === 0) {
    return { label: 'Nouveau', class: 'client-nouveau' };
  } else if (orderCount > 10) {
    return { label: 'Fidèle', class: 'client-fidele' };
  } else if (lastOrderDate && (new Date() - lastOrderDate) < 90 * 24 * 60 * 60 * 1000) {
    return { label: 'Régulier', class: 'client-regulier' };
  } else {
    return { label: 'Potentiel', class: 'client-potentiel' };
  }
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
        <header className="devis-header">
          <div className="devis-header-left">
            
            <h1 className="devis-title">Gestion des Devis</h1>
          </div>
          
          <div className="devis-filters">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher un devis..."
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
              <option value="EN_COURS">En cours</option>
              <option value="VALIDE">Validé</option>
              <option value="REFUSE">Refusé</option>
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
        {filteredDevis.map(devis => (
          <tr key={devis.id}>
            <td>{devis.reference}</td>
            <td>
              <div className="client-info clickable" onClick={() => handleViewClient(devis)}>
                <User size={16} />
                <span>
                  {devis.client ? `${devis.client.firstName || ''} ${devis.client.lastName || ''}` : 'Client inconnu'}
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
    {devis.status ? devis.status.replace('_', ' ') : 'Statut inconnu'}
  </span>
</td>
            <td>
              <div className="devis-actions-buttons">
                <button className="action-btn view" title="Voir le devis" onClick={() => handleViewDevis(devis)}>
                  <Eye size={16} />
                </button>
                <button className="action-btn download" title="Télécharger" onClick={() => handleDownloadDevis(devis.id)}>
                  <Download size={16} />
                </button>
                <button className="contact-btn" onClick={() => handleOpenChat(devis)} disabled={!devis.id}>
                  <MessageCircle size={16} />
                </button>
                <button className="action-btn" title="Appliquer une remise" onClick={() => handleApplyDiscount(devis.id)}>
                  <CheckCircle size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
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
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
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
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Get client statistics
    const clientStats = await axios.get(
      `http://localhost:8080/api/client-stats/${clientInfo.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    // Get total time spent in application
    const sessionResponse = await axios.get(
      `http://localhost:8080/api/sessions/totalDuration/${user.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const tempsPasseMinutes = Math.round(sessionResponse.data / (1000 * 60));
    const nbProduitsDevis = produits.length;
    const nbProduitsDejaPurchased = produits.filter(p => purchaseCounts[p.id] > 0).length;
    
    // Calcul simplifié du délai de traitement
    let delaiTraitementHeures = 0;
    
    if (devis && devis.createdAt) {
        const currentTime = new Date();
        const creationDate = new Date(devis.createdAt);
        console.log('Date de création:', creationDate.toLocaleDateString('fr-FR'));
        console.log('Date actuelle:', currentTime.toLocaleDateString('fr-FR'));
        delaiTraitementHeures = Math.floor((currentTime - creationDate) / (1000 * 60 * 60));
    } else {
        console.error('Date de création non définie');
    }
    
    console.log('Délai en heures:', delaiTraitementHeures);
    
    console.log('Délai en heures:', delaiTraitementHeures);
    
    const modelData = {
      totalCommandes: clientStats.data.totalCommandes,
      totalDevis: clientStats.data.totalDevis,
      totalMontantCommandes: clientStats.data.totalMontantCommandes,
      nb_produits_devis: nbProduitsDevis,
      nb_produits_deja_achetes: nbProduitsDejaPurchased,
      temps_dans_application_min: tempsPasseMinutes,
      temps_reponse_messagerie_min: 2,
      delai_traitement_devis_hrs: delaiTraitementHeures,
      taux_conversion: (clientStats.data.totalCommandes / clientStats.data.totalDevis) * 100,
      moyenne_montant_commande: clientStats.data.totalMontantCommandes / clientStats.data.totalCommandes,
      ratio_produits_achetes: nbProduitsDejaPurchased / nbProduitsDevis
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

    const modal = createModal('Analyse IA', `
      <div class="ai-analysis-result">
        <div class="prediction-score">
          <h2>${Math.round(response.data.pourcentageAcceptation)}%</h2>
          <p>Probabilité d'acceptation</p>
        </div>
        <div class="prediction-details">
          <div class="confidence-level">
            <span>Niveau de confiance: ${Math.round(response.data.details.confiance * 100)}%</span>
          </div>
          <div class="key-factors">
            <h4>Facteurs clés d'analyse :</h4>
            <div class="factors-grid">
              <div class="factor-item">
                <span class="factor-label">Taux de conversion</span>
                <span class="factor-value">${modelData.taux_conversion.toFixed(2)}%</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Produits déjà achetés</span>
                <span class="factor-value">${modelData.nb_produits_deja_achetes}/${modelData.nb_produits_devis}</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Temps de réponse messagerie</span>
                <span class="factor-value">${modelData.temps_reponse_messagerie_min} min</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Délai de traitement</span>
                <span class="factor-value">${delaiTraitementHeures} heures (${Math.round(delaiTraitementHeures/24)} jours)</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Montant moyen des commandes</span>
                <span class="factor-value">${modelData.moyenne_montant_commande.toFixed(2)} MAD</span>
              </div>
              <div class="factor-item">
                <span class="factor-label">Ratio produits achetés</span>
                <span class="factor-value">${(modelData.ratio_produits_achetes * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    // Ajouter les styles CSS
    const style = document.createElement('style');
    style.textContent = `
      .ai-analysis-result {
        padding: 20px;
        text-align: center;
      }
      .prediction-score h2 {
        font-size: 48px;
        color: #2196F3;
        margin: 0;
      }
      .prediction-score p {
        margin: 5px 0 20px;
        color: #666;
      }
      .confidence-level {
        margin: 15px 0;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
      }
      .factors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
        margin-top: 20px;
      }
      .factor-item {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        text-align: left;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .factor-label {
        display: block;
        color: #666;
        font-size: 0.9em;
        margin-bottom: 5px;
      }
      .factor-value {
        display: block;
        font-size: 1.2em;
        font-weight: bold;
        color: #2196F3;
      }
    `;
    document.head.appendChild(style);

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);
    createModal('Erreur', `
      <div class="error-message">
        <p>Une erreur est survenue lors de l'analyse :</p>
        <p>${error.response?.data?.message || error.message}</p>
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