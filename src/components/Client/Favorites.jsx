import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFavorites = () => {
      setIsLoading(true);
      const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
      setFavorites(savedFavorites);
      setIsLoading(false);
    };

    loadFavorites();

    // Écouter les changements de localStorage
    const handleStorageChange = () => {
      loadFavorites();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToCartFromFavorites = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    
    // Notification
    showCartNotification(product);
  };

  const removeFromFavorites = (productId) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== productId);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    window.dispatchEvent(new Event('storage'));
  };

  const clearAllFavorites = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
      setFavorites([]);
      localStorage.removeItem('favorites');
      window.dispatchEvent(new Event('storage'));
    }
  };

  const showCartNotification = (product) => {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div class="notification-message">
          <p class="notification-title">Produit ajouté au panier</p>
          <p class="notification-product">${product.nom}</p>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    });
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);
    
    setTimeout(() => notification.classList.add('notification-visible'), 10);
  };

  if (isLoading) {
    return (
      <div className="favorites-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div className="favorites-header-content">
          <div className="header-left">
            <button className="back-button" onClick={() => navigate('/client/dashboard/catalogue')}>
              <ArrowLeft size={18} />
              Retour au catalogue
            </button>
          </div>
          <h1>
            <Heart size={24} className="favorites-icon" />
            Mes Favoris
            {favorites.length > 0 && (
              <span className="favorites-badge">{favorites.length}</span>
            )}
          </h1>
          {favorites.length > 0 && (
            <button className="clear-favorites" onClick={clearAllFavorites}>
              <Trash2 size={16} />
              Vider les favoris
            </button>
          )}
        </div>
      </div>
      
      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <Heart size={64} className="empty-icon" />
          <h3>Aucun produit favori</h3>
          <p>Vous n'avez aucun produit favori pour le moment.</p>
          <p>Parcourez notre catalogue et ajoutez vos produits préférés !</p>
          <button 
            className="continue-shopping"
            onClick={() => navigate('/client/dashboard/catalogue')}
          >
            <ShoppingCart size={18} />
            Parcourir le catalogue
          </button>
        </div>
      ) : (
        <div className="favorites-content">
          <div className="favorites-list">
            {favorites.map((product) => (
              <div key={product.id} className="favorite-item">
                <div className="item-info">
                  <img 
                    src={product.imageUrl} 
                    alt={product.nom} 
                    className="item-image"
                    onClick={() => navigate(`/client/dashboard/catalogue?product=${product.id}`)}
                  />
                  <div className="item-details">
                    <h3>{product.nom}</h3>
                    <p className="item-reference">Ref: {product.reference}</p>
                    <p className="item-category">{product.categorie?.nom || 'Non catégorisé'}</p>
                    <p className="item-brand">{product.marque?.nom || 'Marque non spécifiée'}</p>
                  </div>
                </div>
                
                <div className="item-actions">
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCartFromFavorites(product)}
                    title="Ajouter au panier"
                  >
                    <ShoppingCart size={16} />
                    Ajouter au panier
                  </button>
                  <button 
                    className="remove-favorite-btn"
                    onClick={() => removeFromFavorites(product.id)}
                    title="Retirer des favoris"
                  >
                    <Heart size={16} />
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Favorites;