import './Dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import logo from '../../assets/logosofi1.png';
import AdminConsultations from './AdminConsultations';
import DevisAdmin from './DevisAdmin';
import ProductManager from './ProductManager';
import UserManager from './UserManager';
import AdminDashboard from './AdminDashboard';
import {
  Home, MessageCircle, Settings, LogOut,
  Users, Package, FileSpreadsheet, BarChart2,
  AlertTriangle, Bell, X
} from 'lucide-react';
import ReclamationAdmin from './ReclamationAdmin';
import notificationService from '../../services/notificationService';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const navItems = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <Home size={18} /> },
  { key: 'users', label: 'Gestion Utilisateurs', icon: <Users size={18} /> },
  { key: 'products', label: 'Gestion Produits', icon: <Package size={18} /> },
  { key: 'devis', label: 'Commandes', icon: <FileSpreadsheet size={18} /> },
  { key: 'consultations', label: 'Consultations', icon: <MessageCircle size={18} /> },
  { key: 'reclamations', label: 'Réclamations', icon: <AlertTriangle size={18} /> },
  { key: 'stats', label: 'Statistiques', icon: <BarChart2 size={18} /> }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState({
    devis: 12,
    consultations: 2,
    reclamations: 3
  });
  const [notificationList, setNotificationList] = useState([]);
  // Ajout d'un état pour les messages non lus
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const totalNotifications = notifications.devis + notifications.consultations + notifications.reclamations;

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    setActiveItem(path === 'dashboard' || path === '' ? 'dashboard' : path);
  }, [location]);

  useEffect(() => {
    fetchUserPermissions();
    fetchNotifications();
    fetchUnreadMessagesCount();
    fetchUnreadNotificationsCount(); // Ajout de l'appel pour récupérer les notifications non lues

    // Rafraîchir les notifications et les messages non lus toutes les 60 secondes
    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchUnreadMessagesCount();
      fetchUnreadNotificationsCount();
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Nouvelle fonction pour récupérer le nombre de notifications non lues
  const fetchUnreadNotificationsCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;

      const response = await axios.get(`${API_BASE_URL}/api/notifications/user/${userId}/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data) {
        setUnreadNotifications(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications non lues:', error);
      setUnreadNotifications(0);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/notifications/user/${userId}/read-all`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications({ devis: 0, consultations: 0, reclamations: 0 });
      setNotificationList(prev => prev.map(notif => ({ ...notif, isRead: true })));
      setUnreadNotifications(0); // Réinitialiser le compteur de notifications non lues
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
    }
  };

  // Connexion WebSocket pour les notifications en temps réel
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (!userId || !token) return;
    
    console.log('🔌 Connexion WebSocket admin pour userId:', userId);
    
    const handleNotification = (notification) => {
      console.log('📬 Notification admin reçue:', notification);
      
      // Mettre à jour la liste des notifications
      fetchNotifications();
      
      // Si c'est un nouveau message, incrémenter le compteur
      if (notification.type === 'new_message') {
        setUnreadMessagesCount(prev => prev + 1);
      }
    };
    
    // Connexion au service de notifications
    if (!notificationService.isConnected()) {
      notificationService.connect(userId, handleNotification);
    }
    
    // Vérifier périodiquement la connexion WebSocket
    const checkConnectionInterval = setInterval(() => {
      if (!notificationService.isConnected()) {
        console.log('🔄 Tentative de reconnexion WebSocket admin');
        notificationService.connect(userId, handleNotification);
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => {
      clearInterval(checkConnectionInterval);
    };
  }, []);

  // Nouvelle fonction pour récupérer le nombre de messages non lus
  const fetchUnreadMessagesCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;

      const response = await fetch(`${API_BASE_URL}/api/messages/unread/count?userId=${userId}&userType=admin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadMessagesCount(data.total || 0);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages non lus:', error);
      setUnreadMessagesCount(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;

      const response = await axios.get(`${API_BASE_URL}/api/notifications/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data) {
        const notifCount = { devis: 0, consultations: 0, reclamations: 0 };
        const sortedNotifications = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setNotificationList(sortedNotifications);
        
        let unreadCount = 0;
        sortedNotifications.forEach(notification => {
          if (!notification.isRead) {
            unreadCount++;
            if (notification.type in notifCount) {
              notifCount[notification.type]++;
            }
          }
        });
        
        setNotifications(notifCount);
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      setNotifications({ devis: 0, consultations: 0, reclamations: 0 });
      setUnreadNotifications(0);
    }
  };

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) {
        setUserPermissions([]);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/permissions/by-user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        const permissions = Array.isArray(response.data) ? response.data : response.data.permissions || [];
        setUserPermissions(permissions);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => userPermissions.includes(permission);

  const getFilteredNavItems = () => {
    return navItems.filter(item => {
      switch (item.key) {
        case 'dashboard': return hasPermission('DASHBOARD');
        case 'users': return hasPermission('USER_MANAGEMENT');
        case 'products': return hasPermission('PRODUCT_MANAGEMENT');
        case 'devis': return hasPermission('DEVIS_MANAGEMENT');
        case 'consultations': return hasPermission('CONSULTATIONS_MANAGEMENT');
        case 'reclamations': return hasPermission('RECLAMATIONS_MANAGEMENT');
        case 'stats': return hasPermission('STATISTICS_VIEW');
        default: return false;
      }
    });
  };

  const handleNavigation = useCallback((key) => {
    const permissionMap = {
      'dashboard': 'DASHBOARD',
      'users': 'USER_MANAGEMENT',
      'products': 'PRODUCT_MANAGEMENT',
      'devis': 'DEVIS_MANAGEMENT',
      'consultations': 'CONSULTATIONS_MANAGEMENT',
      'reclamations': 'RECLAMATIONS_MANAGEMENT',
      'stats': 'STATISTICS_VIEW'
    };

    if (!hasPermission(permissionMap[key])) {
      alert('Vous n\'avez pas les permissions nécessaires pour accéder à cette section.');
      return;
    }

    setActiveItem(key);
    navigate(key === 'dashboard' ? '/admin/dashboard' : `/admin/dashboard/${key}`);
  }, [navigate, userPermissions]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Nouvelle fonction pour marquer une notification individuelle comme lue
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour la liste des notifications localement
      setNotificationList(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Décrémenter le compteur de notifications non lues
      setUnreadNotifications(prev => Math.max(0, prev - 1));
      
      // Mettre à jour les compteurs par type
      const notification = notificationList.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setNotifications(prev => ({
          ...prev,
          [notification.type]: Math.max(0, prev[notification.type] - 1)
        }));
      }
      
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  const handleNotificationClick = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    if (newState) {
      await fetchNotifications();
      
      // Marquer automatiquement toutes les notifications comme lues
      if (unreadNotifications > 0) {
        await markAllAsRead();
      }
    }
  };

  const renderNotificationPanel = () => {
    if (!showNotifications) return null;

    return (
      <div className="sofi-notif-dropdown">
        <div className="sofi-notif-dropdown-title">
          Notifications 
          {unreadNotifications > 0 && (
            <span className="sofi-unread-count">({unreadNotifications} non lues)</span>
          )}
        </div>
        <ul className="sofi-notif-list">
          {notificationList.length === 0 && (
            <li className="sofi-notif-item">Aucune notification</li>
          )}
          {notificationList.map((notif) => (
            <li
              key={notif.id}
              className={`sofi-notif-item ${notif.isRead ? "" : "unread"}`}
              onClick={() => !notif.isRead && markNotificationAsRead(notif.id)}
            >
              <div className="sofi-notif-content">
                {!notif.isRead && <span className="sofi-unread-dot"></span>}
                <div className="sofi-notif-text">
                  <strong>
                    {notif.type === 'devis' && 'Devis'}
                    {notif.type === 'consultations' && 'Consultation'}
                    {notif.type === 'reclamations' && 'Réclamation'}
                  </strong>
                  <p>{notif.message}</p>
                  {notif.createdAt && (
                    <small>{new Date(notif.createdAt).toLocaleDateString('fr-FR')}</small>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const isDashboardHome = location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/';
  const filteredNavItems = getFilteredNavItems();

  return (
    <div className="sofi-dashboard admin-dashboard">
      <aside className="sofi-sidebar admin-sidebar">
        <div className="sofi-sidebar-header admin-sidebar-header">
          <div className="sofi-logo-container">
            <img src={logo} alt="SOFIMED Logo" className="sofi-logo" />
          </div>
          <p className="sofi-subtitle">Espace Administrateur</p>
        </div>

        <nav className="sofi-sidebar-nav">
          <ul className="sofi-nav-list">
            {filteredNavItems.map(({ key, label, icon }) => (
              <li
                key={key}
                className={`sofi-nav-item ${activeItem === key ? 'active' : ''}`}
                onClick={() => handleNavigation(key)}
              >
                {icon}
                <span>{label}</span>
                {key === 'consultations' && unreadMessagesCount > 0 ? (
                  // Priorité au compteur de messages non lus pour les consultations
                  <span className="sofi-badge">{unreadMessagesCount}</span>
                ) : (
                  // Sinon, afficher le compteur de notifications si disponible
                  notifications[key] > 0 && ['devis', 'consultations', 'reclamations'].includes(key) && (
                    <span className="sofi-badge">{notifications[key]}</span>
                  )
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sofi-sidebar-footer">
          <div className="sofi-user-profile">
            <div className="sofi-avatar">A</div>
            <div className="sofi-user-info">
              <p className="sofi-user-name">Admin</p>
              <p className="sofi-user-email">admin@sofimed.com</p>
            </div>
          </div>
          <ul className="sofi-footer-menu">
            <li className="sofi-footer-item">
              <Settings size={16} className="sofi-footer-icon" />
              <span>Paramètres</span>
            </li>
            <li className="sofi-footer-item" onClick={handleLogout}>
              <LogOut size={16} className="sofi-footer-icon" />
              <span>Déconnexion</span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="sofi-main">
        {isDashboardHome && (
          <header className="sofi-main-header admin-header">
            <h2 className="sofi-page-title">Tableau de Bord Administrateur</h2>
            <div className="sofi-header-actions" style={{ position: "relative" }}>
              <button className="sofi-notif-btn" aria-label="Notifications" onClick={handleNotificationClick}>
                <span className="sofi-notif-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                {unreadNotifications > 0 && (
                  <span className="sofi-notif-badge">{unreadNotifications}</span>
                )}
              </button>
              {renderNotificationPanel()}
            </div>
          </header>
        )}

        <div className="sofi-content">
          <Routes>
            <Route path="/" element={
              <>
                <div className="sofi-welcome-card admin-welcome-card">
                  <div className="sofi-card-content">
                    <h1 className="sofi-welcome-title">Bienvenue dans l'espace administrateur</h1>
                    <p className="sofi-welcome-text">
                      Gérez les utilisateurs, les produits et suivez l'activité de la plateforme.
                    </p>
                  </div>
                </div>

                <div className="sofi-stats-grid">
                  {[
                    {
                      label: 'Utilisateurs actifs', value: '12', change: '+12 ce mois',
                      icon: <Users size={24} color="#3B82F6" />, key: 'users', changeClass: 'positive'
                    },
                    {
                      label: 'Produits', value: '54', change: 'total produits',
                      icon: <Package size={24} color="#10B981" />, key: 'products'
                    },
                    {
                      label: 'Commandes en attente', value: notifications.devis, change: 'Nécessite attention',
                      icon: <FileSpreadsheet size={24} color="#F59E0B" />, key: 'devis', changeClass: 'negative'
                    },
                    {
                      label: 'Consultations', value: notifications.consultations, change: 'À traiter',
                      icon: <MessageCircle size={24} color="#6366F1" />, key: 'consultations'
                    }
                  ].map((card) => (
                    <div key={card.key} className="sofi-stat-card admin-stat-card" onClick={() => handleNavigation(card.key)}>
                      <div className="sofi-stat-icon">{card.icon}</div>
                      <div className="sofi-stat-info">
                        <p className="sofi-stat-label">{card.label}</p>
                        <p className="sofi-stat-value">{card.value}</p>
                        <p className={`sofi-stat-change ${card.changeClass || ''}`}>{card.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            } />
            <Route path="devis" element={hasPermission('DEVIS_MANAGEMENT') ? <DevisAdmin /> : <div>Accès refusé</div>} />
            <Route path="consultations" element={hasPermission('CONSULTATIONS_MANAGEMENT') ? <AdminConsultations /> : <div>Accès refusé</div>} />
            <Route path="users" element={hasPermission('USER_MANAGEMENT') ? <UserManager /> : <div>Accès refusé</div>} />
            <Route path="reclamations" element={<ReclamationAdmin />} />
            <Route path="stats" element={hasPermission('STATISTICS_VIEW') ? <AdminDashboard /> : <div>Accès refusé</div>} />
            <Route path="products" element={hasPermission('PRODUCT_MANAGEMENT') ? <ProductManager /> : <div>Accès refusé</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;