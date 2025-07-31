import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Book, ShoppingCart, FileText, Truck, MessageCircle,
  Settings, HelpCircle, LogOut, Heart
} from 'react-feather';
import logo from '../../assets/logosofi1.png'; 
import '../../styles/dashboard-unified.css';
import './ClientDashboard.css';
import { Routes, Route } from 'react-router-dom';
import CatalogueProduits from './CatalogueProduits';
// Import the Panier component
import Panier from './Panier';
import DemandeConsultation from './DemandeConsultation';
import DemandeDevis from './DemandeDevis';
import ReclamationClient from './ReclamationClient';
import Favorites from './Favorites'; // Ajouter l'import du composant Favorites
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';
import CommandeSuivi from './CommandeSuivi';
import axios from 'axios';

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  // Add state for cart items
  const [cartItems, setCartItems] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [stompClient, setStompClient] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sessionId, setSessionId] = useState(null); // <-- Add state for session ID
  const [sessionDuration, setSessionDuration] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0); // Add favoritesCount state

  useEffect(() => {
    // Get user data from navigation state or localStorage
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setUserData(user);

    // Start session tracking
    const startUserSession = async () => {
      if (user?.id) {
        try {
          const response = await axios.post(`http://localhost:8080/api/sessions/start?userId=${user.id}`);
          setSessionId(response.data.id);
        } catch (error) {
          console.error("Error starting session:", error);
        }
      }
    };

    startUserSession();

    // Load cart data from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }

    if (user) {
      fetchUnreadMessages(user.id);
    }

    // Cleanup function to end the session
    return () => {
      const endUserSession = async (id) => {
        if (id) {
          try {
            // Use navigator.sendBeacon for reliability on page unload
            const data = new FormData(); // Though not strictly needed, it's a common pattern
            navigator.sendBeacon(`http://localhost:8080/api/sessions/${id}/end`, data);
          } catch (error) {
            console.error("Error ending session:", error);
          }
        }
      };
      // The session ID from state might be stale in the cleanup function,
      // so we pass it directly.
      endUserSession(sessionId);
    };

  }, [navigate, location, sessionId]); // sessionId is added to dependencies

  // Add effect to update cart count when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        setCartItems([]);
      }
    };

    // Listen for storage events (when cart is updated from other components)
    window.addEventListener('storage', handleStorageChange);
    
    // Check for cart updates every second (for same-tab updates)
    const interval = setInterval(() => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (JSON.stringify(parsedCart) !== JSON.stringify(cartItems)) {
          setCartItems(parsedCart);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cartItems]);

  const handleLogout = async () => {
    if (sessionId) {
        try {
            await axios.put(`http://localhost:8080/api/sessions/${sessionId}/end`);
        } catch (error) {
            console.error("Error ending session on logout:", error);
        }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart'); // Also clear cart on logout
    navigate('/login');
  };

  // Calculate total items in cart
  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Fonction pour récupérer le nombre de messages non lus au chargement
  const fetchUnreadMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/messages/unread/count?userId=${userId}&userType=client`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.total || 0);
      }
    } catch (error) {
      setUnreadMessages(0);
    }
  };

  // Ajout : WebSocket pour notification en temps réel
  useEffect(() => {
    if (!userData) return;
    
    // Configuration des headers pour WebSocket
    const socket = new SockJS('http://localhost:8080/ws');
    const token = localStorage.getItem('token');
    
    const client = new StompClient({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      onConnect: () => {
        // S'abonner au topic des messages pour ce client
        client.subscribe(`/topic/messages/${userData.id}`, () => {
          fetchUnreadMessages(userData.id);
        });
      },
      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [userData]);

  // Fonction pour récupérer les notifications
  const fetchNotifications = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchNotifications(userData.id);
    }
  }, [userData]);

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notifId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
    }
  };

  // Quand on ouvre le menu, marquer toutes les notifications non lues comme lues
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      notifications
        .filter((notif) => !notif.isRead)
        .forEach((notif) => markNotificationAsRead(notif.id));
    }
  };

  // Ajouter cette fonction pour formater la durée
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  // Ajouter cette fonction pour mettre à jour la durée
  const updateSessionDuration = () => {
    if (sessionId) {
      const token = localStorage.getItem('token');
      axios.get(`http://localhost:8080/api/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(response => {
        if (response.data.sessionDuration) {
          setSessionDuration(response.data.sessionDuration);
        }
      })
      .catch(error => console.error("Erreur lors de la récupération de la durée de session:", error));
    }
  };

  // Ajouter cet effet pour mettre à jour la durée périodiquement
  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(updateSessionDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  // Dans le rendu, ajouter une nouvelle carte statistique
  return (
    <div className="sofi-dashboard client-dashboard">
      {/* Sidebar */}
      <aside className="sofi-sidebar client-sidebar">
        <div className="sofi-sidebar-header client-sidebar-header">
          <div className="sofi-logo-container">
            <img src={logo} alt="SOFIMED Logo" className="sofi-logo" />
          </div>
          <p className="sofi-subtitle">Espace Client Professionnel</p>
        </div>
        
        <nav className="sofi-sidebar-nav">
          <ul className="sofi-nav-list">
            <li className="sofi-nav-item" onClick={() => navigate('')}>
              <Home className="sofi-nav-icon" size={18} />
              <span>Accueil</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('catalogue')}>
              <Book className="sofi-nav-icon" size={18} />
              <span>Catalogue Produits</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('panier')}>
              <ShoppingCart className="sofi-nav-icon" size={18} />
              <span>Mon Panier</span>
              {cartItems.length > 0 && (
                <span className="sofi-badge">{getTotalCartItems()}</span>
              )}
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('consultation')}>
              <FileText className="sofi-nav-icon" size={18} />
              <span>Demande de consultation</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('devis')}>
              <FileText className="sofi-nav-icon" size={18} />
              <span>Demande de devis</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('reclamations')}>
              <MessageCircle className="sofi-nav-icon" size={18} />
              <span>Réclamations</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('suivi-commandes')}>
              <Truck className="sofi-nav-icon" size={18} />
              <span>Suivi de commande</span>
            </li>
            <li className="sofi-nav-item" onClick={() => navigate('favoris')}>
              <Heart className="sofi-nav-icon" size={18} />
              <span>Mes Favoris</span>
              {favoritesCount > 0 && (
                <span className="sofi-badge">{favoritesCount}</span>
              )}
            </li>
          </ul>
        </nav>
        
        <div className="sofi-sidebar-footer">
          <div className="sofi-user-profile">
            <div className="sofi-avatar">
              {userData?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="sofi-user-info">
              <p className="sofi-user-name">{userData?.username}</p>
            </div>
          </div>
          <ul className="sofi-footer-menu">
            <li className="sofi-footer-item">
              <Settings size={16} className="sofi-footer-icon" />
              <span>Paramètres</span>
            </li>
            <li className="sofi-footer-item">
              <HelpCircle size={16} className="sofi-footer-icon" />
              <span>Aide & Support</span>
            </li>
            <li className="sofi-footer-item" onClick={handleLogout}>
              <LogOut size={16} className="sofi-footer-icon" />
              <span>Déconnexion</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="sofi-main client-main">
        <Routes>
          <Route path="/catalogue" element={<CatalogueProduits />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/consultation" element={<DemandeConsultation />} />
          <Route path="/devis" element={<DemandeDevis />} />
          <Route path="/suivi-commandes" element={<CommandeSuivi clientId={userData?.id} />} />
          <Route path="/reclamations" element={<ReclamationClient />} />
          <Route path="/favoris" element={<Favorites />} />
          <Route path="/" element={
            <>
              <header className="sofi-main-header client-header">
                <h2 className="sofi-page-title">Tableau de Bord</h2>
                <div className="sofi-header-actions" style={{ position: "relative" }}>
                  <button className="sofi-notif-btn" aria-label="Notifications" onClick={toggleNotifications}>
                    <span className="sofi-notif-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    {unreadMessages > 0 && (
                      <span className="sofi-notif-badge">{unreadMessages}</span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="sofi-notif-dropdown">
                      <div className="sofi-notif-dropdown-title">Notifications</div>
                      <ul className="sofi-notif-list">
                        {notifications.length === 0 && (
                          <li className="sofi-notif-item">Aucune notification</li>
                        )}
                        {notifications.map((notif) => (
                          <li
                            key={notif.id}
                            className={`sofi-notif-item ${notif.isRead ? "" : "unread"}`}
                          >
                            {notif.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </header>
              
              <div className="sofi-content client-content">
                <div className="sofi-welcome-card client-welcome-card">
                  <div className="sofi-card-content">
                    <h1 className="sofi-welcome-title">Bienvenue dans votre espace SOFIMED</h1>
                    <p className="sofi-welcome-text">
                      Découvrez notre catalogue complet de produits industriels et médicaux.
                      Commandez en ligne et profitez de nos offres exclusives.
                    </p>
                    <div className="sofi-card-actions">
                      <button className="sofi-btn sofi-btn-primary" onClick={() => navigate('catalogue')}>
                        <Book size={16} style={{ marginRight: 8 }} />
                        Parcourir le catalogue
                      </button>
                      <button className="sofi-btn sofi-btn-secondary" onClick={() => navigate('panier')}>
                        <ShoppingCart size={16} style={{ marginRight: 8 }} />
                        Voir mon panier
                      </button>
                    </div>
                  </div>
                  <div className="sofi-card-illustration">
                    <svg width="180" height="180" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="80" fill="rgba(255, 255, 255, 0.1)" />
                      <path d="M70 120L90 140L130 100" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                      <path d="M60 80C60 68.9543 68.9543 60 80 60" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                      <path d="M140 60C140 48.9543 148.954 40 160 40" stroke="#FFFFFF" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                
                <div className="sofi-stats-grid">
                  <div className="sofi-stat-card client-stat-card">
                    <div className="sofi-stat-icon" style={{ backgroundColor: '#F0F9FF' }}>
                      <ShoppingCart size={20} color="#0EA5E9" />
                    </div>
                    <div className="sofi-stat-info">
                      <p className="sofi-stat-label">Panier actuel</p>
                      <p className="sofi-stat-value">{getTotalCartItems()} article{getTotalCartItems() !== 1 ? 's' : ''}</p>
                      <p className="sofi-stat-change">
                        {cartItems.length > 0 ? 'Cliquez pour voir' : 'Panier vide'}
                      </p>
                    </div>
                  </div>
                  <div className="sofi-stat-card client-stat-card">
                    <div className="sofi-stat-icon" style={{ backgroundColor: '#EFF6FF' }}>
                      <FileText size={20} color="#3B82F6" />
                    </div>
                    <div className="sofi-stat-info">
                      <p className="sofi-stat-label">Demandes en cours</p>
                      <p className="sofi-stat-value">5</p>
                      <p className="sofi-stat-change positive">+2 cette semaine</p>
                    </div>
                  </div>
                  
                  <div className="sofi-stat-card client-stat-card">
                    <div className="sofi-stat-icon" style={{ backgroundColor: '#ECFDF5' }}>
                      <Truck size={20} color="#10B981" />
                    </div>
                    <div className="sofi-stat-info">
                      <p className="sofi-stat-label">Commandes actives</p>
                      <p className="sofi-stat-value">2</p>
                      <p className="sofi-stat-change">En traitement</p>
                    </div>
                  </div>
                  
                  <div className="sofi-stat-card client-stat-card">
                    <div className="sofi-stat-icon" style={{ backgroundColor: '#FEF2F2' }}>
                      <MessageCircle size={20} color="#EF4444" />
                    </div>
                    <div className="sofi-stat-info">
                      <p className="sofi-stat-label">Messages non lus</p>
                      <p className="sofi-stat-value">{unreadMessages}</p>
                      <p className="sofi-stat-change negative">{unreadMessages > 0 ? 'Réponse urgente' : 'Aucun message'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default ClientDashboard;