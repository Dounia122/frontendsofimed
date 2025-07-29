import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Panier.css';
import noImage from '../../assets/no-image.png';
import axios from 'axios';
import notificationService from '../../services/notificationService';

const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    return null;
  }
  return user;
};

const Panier = () => {
  const [cart, setCart] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [isLoading, setIsLoading] = useState({
    cart: true,
    action: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  const [clientInfo, setClientInfo] = useState(null);
  const [userData, setUserData] = useState(null);

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login', { state: { sessionExpirée: true } });
      }
      return Promise.reject(error);
    }
  );

  // Fonction pour récupérer l'ID utilisateur du commercial
  const getCommercialUserId = async (commercialId) => {
    try {
      console.log('🔍 Récupération userID pour commercial ID:', commercialId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ Token manquant');
        return null;
      }
      
      const response = await axios.get(`http://localhost:8080/api/commercials/${commercialId}/user-id`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ UserID commercial récupéré:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'userId du commercial:', error);
      return null;
    }
  };

  // Récupérer l'ID du commercial du dernier devis inséré
  const getLatestCommercialId = async () => {
    try {
      console.log('🔍 Récupération du dernier ID commercial...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('❌ Token manquant');
        return null;
      }
      
      const response = await axios.get('http://localhost:8080/api/devis/latest-commercial-id', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Dernier ID commercial récupéré:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du dernier ID commercial:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeCart = async () => {
      const user = getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      setUserData(user);

      try {
        setIsLoading(prev => ({ ...prev, cart: true }));
        setError('');

        const token = localStorage.getItem('token');

        // Récupération des infos client
        const clientResponse = await axios.get(`http://localhost:8080/api/clients/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setClientInfo(clientResponse.data);

        // Récupération du panier actif
        const cartResponse = await axios.get(`http://localhost:8080/api/carts/current/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const cartId = cartResponse.data;
        setCartId(cartId);

        if (cartId) {
          // Récupération des articles du panier
          const itemsResponse = await axios.get(`http://localhost:8080/api/carts/${cartId}/itemss`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Traitement des images
          const processedItems = (itemsResponse.data || []).map(item => {
            let imageUrl;
            if (item.imageUrl) {
              try {
                imageUrl = require(`../../assets/products/${item.imageUrl}`);
              } catch {
                imageUrl = noImage;
              }
            } else {
              imageUrl = noImage;
            }
            return {
              ...item,
              imageUrl
            };
          });
          setCart(processedItems);
        }
      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        if (err.response?.status === 403) {
          setError("Session expirée. Veuillez vous reconnecter.");
          navigate('/login', { state: { sessionExpired: true } });
        } else {
          setError("Impossible de charger le panier. Veuillez réessayer.");
        }
      } finally {
        setIsLoading(prev => ({ ...prev, cart: false }));
      }
    };

    initializeCart();
  }, [navigate]);

  useEffect(() => {
    const checkWebSocketConnection = () => {
      if (userData?.id && !notificationService.isConnected()) {
        console.log('🔄 Reconnexion WebSocket nécessaire');
        notificationService.connect(userData.id, (notification) => {
          console.log('📬 Notification reçue:', notification);
        });
      }
    };
    
    checkWebSocketConnection();
    
    const connectionCheck = setInterval(checkWebSocketConnection, 30000);
    
    return () => {
      clearInterval(connectionCheck);
    };
  }, [userData]);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(
        `/carts/${cartId}/items/${productId}/update`,
        { quantity: newQuantity }
      );

      const updatedCart = cart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      setError("Erreur lors de la modification de la quantité");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  const removeItem = async (productId) => {
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(`/carts/${cartId}/items/${productId}/remove`);

      const updatedCart = cart.filter(item => item.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Erreur de suppression:', error);
      setError("Erreur lors de la suppression");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(`/carts/${cartId}/items/clear`);
      
      setCart([]);
      localStorage.removeItem('cart');
      setSuccess("Panier vidé avec succès");
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setError("Erreur lors du vidage du panier");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('');
  const paymentOptions = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'espece', label: 'Espèces' }
  ];

  const [commentaire, setCommentaire] = useState('');

  // Nouvelle fonction pour envoyer la notification
  const sendDevisNotification = async (commercialId, devisId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer l'userID du commercial
      const commercialUserId = await getCommercialUserId(commercialId);
      if (!commercialUserId) {
        console.error('❌ UserID commercial non trouvé');
        return false;
      }

      // Préparer les données de la notification
      const senderName = userData?.user?.firstName && userData?.user?.lastName 
        ? `${userData.user.firstName} ${userData.user.lastName}`
        : userData?.username || `${clientInfo.nom} ${clientInfo.prenom}`;
      
      const notificationData = {
        userId: commercialUserId,
        title: "Nouvelle demande de devis",
        message: `Nouvelle demande de devis de ${senderName}`,
        type: "devis_request",
        senderName: senderName,
        devisId: devisId,
        link: `/commercial/devis/details/${devisId}`
      };

      // Envoyer via API REST
      await axios.post('http://localhost:8080/api/notifications/', notificationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Notification API REST envoyée');

      // Envoyer via WebSocket si connecté
      if (notificationService.isConnected()) {
        const wsNotification = {
          ...notificationData,
          senderId: userData.id,
          data: { devisId }
        };
        notificationService.sendNotification(
          `/topic/notifications/${commercialUserId}`,
          wsNotification
        );
        console.log('✅ Notification WebSocket envoyée');
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', error);
      return false;
    }
  };

  // Gestion de la demande de devis avec notification
  const handleDevisRequest = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner un mode de paiement");
      return;
    }

    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      console.log('🚀 Début de la création du devis');
      const token = localStorage.getItem('token');
      
      // Création du devis
      const devisResponse = await axios.post('http://localhost:8080/api/devis/create', {
        cartId,
        paymentMethod,
        commentaire
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const devisId = devisResponse.data.id;
      console.log('✅ Devis créé avec ID:', devisId);

      // Récupération du dernier commercial ID assigné
      const commercialId = await getLatestCommercialId();
      if (!commercialId) {
        throw new Error("Commercial ID non trouvé pour le devis");
      }
      console.log('👤 Commercial ID récupéré:', commercialId);

      // Envoyer la notification
      await sendDevisNotification(commercialId, devisId);
      
      // Réinitialisation et redirection
      setCart([]);
      localStorage.removeItem('cart');
      
      navigate('/client/dashboard/catalogue', { 
        state: { 
          success: "Devis demandé! Un commercial vous contactera bientôt" 
        } 
      });
      
    } catch (err) {
      console.error('❌ Erreur lors de la création du devis:', err);
      const errorMsg = err.response?.data?.message || 
                      err.message || 
                      "Erreur lors de la demande";
      setError(errorMsg);
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = noImage;
  };

  const getTotalItems = () => {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => {
      const quantity = parseInt(item.quantity, 10);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);
  };

  return (
    <div className="panier-container">
      <div className="panier-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/client/dashboard/catalogue')}
          disabled={isLoading.action}
        >
          <ArrowLeft size={18} />
          Retour au catalogue
        </button>
        
        <h1>
          <ShoppingCart size={24} className="cart-icon" />
          Mon Panier
        </h1>
        
        {cart.length > 0 && (
          <button 
            className="clear-cart" 
            onClick={clearCart}
            disabled={isLoading.action}
          >
            {isLoading.action ? 'En cours...' : 'Vider le panier'}
          </button>
        )}
      </div>

      {isLoading.cart ? (
        <div className="loading-panier">
          <p>Chargement de votre panier...</p>
        </div>
      ) : cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCart size={64} />
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des produits à votre panier pour les retrouver ici.</p>
          <button 
            className="continue-shopping" 
            onClick={() => navigate('/client/dashboard/catalogue')}
          >
            Continuer mes achats
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-header">
              <span className="header-product">Produit</span>
              <span className="header-quantity">Quantité</span>
              <span className="header-actions">Actions</span>
            </div>
            
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <img 
                    src={item.imageUrl || noImage} 
                    alt={item.nom} 
                    className="item-image"
                    onError={handleImageError}
                  />
                  <div className="item-details">
                    <h3>{item.nom}</h3>
                    <p className="item-reference">Réf: {item.reference}</p>
                    <p className="item-category">{item.categorie?.nom || 'Non catégorisé'}</p>
                  </div>
                </div>
                
                <div className="item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={isLoading.action}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isLoading.action}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="item-actions">
                  <button 
                    className="remove-item"
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading.action}
                    title="Supprimer cet article"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary-panel">
            <h2>Résumé de la commande</h2>
            <div className="summary-row">
              <span>Nombre d'articles:</span>
              <span>{getTotalItems() || 0}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>Sur demande</span>
            </div>
            
            <div className="payment-method-row">
              <span>Mode de paiement :</span>
              <div className="payment-options">
                {paymentOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`payment-btn${paymentMethod === opt.value ? ' selected' : ''}`}
                    onClick={() => setPaymentMethod(opt.value)}
                    disabled={isLoading.action}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="commentaire-row">
              <label htmlFor="commentaire">Commentaire :</label>
              <textarea
                id="commentaire"
                className="commentaire-input"
                placeholder="Ajouter un commentaire pour votre demande de devis (optionnel)"
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                rows={3}
                disabled={isLoading.action}
              />
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleDevisRequest}
              disabled={isLoading.action || cart.length === 0}
            >
              {isLoading.action ? 'Envoi en cours...' : 'Demander un devis'}
            </button>
            <button 
              className="continue-shopping" 
              onClick={() => navigate('/client/dashboard/catalogue')}
              disabled={isLoading.action}
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="alert-message error">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="alert-message success">
          <p>{success}</p>
        </div>
      )}
    </div>
  );
};

export default Panier;