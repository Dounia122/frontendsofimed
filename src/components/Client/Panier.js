import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Panier.css';
import noImage from '../../assets/no-image.png';
import axios from 'axios';

const Panier = () => {
  // États du composant
  const [cart, setCart] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [isLoading, setIsLoading] = useState({
    cart: true,
    action: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Configuration de l'instance Axios
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Intercepteur pour gérer les erreurs globales
  axiosInstance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login', { state: { sessionExpired: true } });
      }
      return Promise.reject(error);
    }
  );

  // Effet pour initialiser le panier au chargement du composant
  useEffect(() => {
    const initializeCart = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || !user) {
        navigate('/login');
        return;
      }

      try {
        setIsLoading(prev => ({ ...prev, cart: true }));
        setError('');

        // Récupération du panier actif
        const cartResponse = await axiosInstance.get(`/carts/current/${user.id}`);
        const cartId = cartResponse.data;
        setCartId(cartId);

        if (cartId) {
          // Utilisation du nouvel endpoint pour récupérer les articles
          const itemsResponse = await axiosInstance.get(`/carts/${cartId}/itemss`);
          // Traitement des images comme dans CatalogueProduits
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
        console.error("Erreur d'initialisation du panier:", err);
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

  // Fonction pour mettre à jour la quantité d'un article (POST)
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(
        `/carts/${cartId}/items/${productId}/update`,
        { quantity: newQuantity }
      );

      // Mise à jour optimiste de l'interface
      const updatedCart = cart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Erreur de mise à jour:', error);
      setError("Erreur lors de la mise à jour de la quantité");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Fonction pour supprimer un article du panier (POST)
  const removeItem = async (productId) => {
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(`/carts/${cartId}/items/${productId}/remove`);

      // Mise à jour optimiste de l'interface
      const updatedCart = cart.filter(item => item.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Erreur de suppression:', error);
      setError("Erreur lors de la suppression de l'article");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Fonction pour vider complètement le panier (POST)
  const clearCart = async () => {
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post(`/carts/${cartId}/items/clear`);
      
      setCart([]);
      localStorage.removeItem('cart');
      setSuccess("Le panier a été vidé avec succès");
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur:', error);
      setError("Erreur lors de la suppression du panier");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Ajout de l'état pour le mode de paiement
  const [paymentMethod, setPaymentMethod] = useState('');
  const paymentOptions = [
    { value: 'virement', label: 'Virement bancaire' },
    { value: 'cheque', label: 'Chèque' },
    { value: 'espece', label: 'Espèces' }
  ];

  // Ajout de l'état pour le commentaire
  const [commentaire, setCommentaire] = useState('');

  // Fonction pour demander un devis
  const handleDevisRequest = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner un mode de paiement avant de demander un devis.");
      return;
    }
    try {
      setIsLoading(prev => ({ ...prev, action: true }));
      setError('');
      
      await axiosInstance.post('/devis/create', {
        cartId,
        paymentMethod,
        commentaire
      });

      setCart([]);
      localStorage.removeItem('cart');
      navigate('/client/dashboard/catalogue', { 
        state: { success: "Votre demande de devis a été envoyée avec succès" } 
      });
    } catch (err) {
      console.error('Erreur:', err.response?.data || err.message);
      setError(err.response?.data?.message || "Erreur lors de la demande de devis");
    } finally {
      setIsLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Fonction pour gérer les erreurs d'image
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = noImage;
  };

  // Calcul du nombre total d'articles
  const getTotalItems = () => {
    if (!cart || !Array.isArray(cart)) return 0;
    return cart.reduce((total, item) => {
      const quantity = parseInt(item.quantity, 10);
      return total + (isNaN(quantity) ? 0 : quantity);
    }, 0);
  };

  // Affichage du composant
  return (
    <div className="panier-container">
      <div className="panier-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/client/dashboard/catalogue')}
          disabled={isLoading.action}
        >
          <ArrowLeft size={20} />
          Retour au catalogue
        </button>
        
        <h1>
          <ShoppingCart size={28} className="cart-icon" />
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
            {/* Affichage amélioré des modes de paiement */}
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
            {/* Champ commentaire avant d'envoyer le panier */}
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
            {/* Commentaire affichage : Ici, le client doit choisir un mode de paiement et peut ajouter un commentaire avant de demander un devis. */}
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
      
      {/* Affichage des messages d'erreur et de succès */}
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
