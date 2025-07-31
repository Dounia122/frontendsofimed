import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import { Home, FileText, MessageCircle, Users, History, Settings, HelpCircle, LogOut, ChartBar, Bell } from "lucide-react";
import logo from '../../assets/logosofi1.png';
import './CommercialDashboard.css';
import CommercialDevis from './CommercialDevis';
import CommercialClients from './CommercialClients';
import CommercialStatistiques from './CommercialStatistiques';
import CommercialHistorique from './CommercialHistorique';
import CommercialConsultations from './CommercialConsultations';
import notificationService from '../../services/notificationService';

const CommercialDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/login');
    setUserData(user);

    if (user) {
      fetchUnreadMessages(user.id);
      fetchNotifications(user.id);
    }
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Récupération du nombre de messages non lus
  const fetchUnreadMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/messages/unread/count?userId=${userId}&userType=commercial`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadMessagesCount(data.total || 0);
      }
    } catch (error) {
      setUnreadMessagesCount(0);
    }
  };

  // Récupération des notifications
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
        
        // Calculer le nombre de notifications non lues
        const unreadCount = data.filter(notif => !notif.isRead).length;
        setUnreadNotificationsCount(unreadCount);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  // Marquer une notification comme lue
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
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notifId ? { ...notif, isRead: true } : notif
          )
        );
        
        // Décrémenter le compteur si la notification était non lue
        setUnreadNotificationsCount(prev => {
          const notif = notifications.find(n => n.id === notifId);
          return (notif && !notif.isRead) ? prev - 1 : prev;
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = async () => {
    if (!userData) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/user/${userData.id}/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Mettre à jour toutes les notifications en local
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        // Réinitialiser le compteur
        setUnreadNotificationsCount(0);
      }
    } catch (error) {
      console.error("Erreur lors du marquage des notifications comme lues:", error);
    }
  };

  // Ouvrir/fermer le dropdown des notifications
  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    
    if (newState && unreadNotificationsCount > 0) {
      markAllNotificationsAsRead();
    }
  };

  // WebSocket pour les notifications en temps réel
  useEffect(() => {
    if (!userData) return;
  
    console.log('🔌 Connexion WebSocket commercial pour userId:', userData.id);
    
    const handleNotification = (notification) => {
      console.log('📬 Notification commerciale reçue:', notification);
      
      // Ajouter la notification en tête de liste
      setNotifications(prev => [notification, ...prev]);
      
      // Mettre à jour les compteurs
      if (!notification.isRead) {
        setUnreadNotificationsCount(prev => prev + 1);
      }
      
      if (notification.type === 'new_message') {
        setUnreadMessagesCount(prev => prev + 1);
        
        // Notification système du navigateur
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      }
    };
    
    // Connexion au service de notifications
    notificationService.connect(userData.id, handleNotification);
    
    // Demander les permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('🔌 Déconnexion WebSocket commercial');
      notificationService.disconnect();
    };
  }, [userData]);

  return (
    <div className="sofi-dashboard commercial-dashboard">
      <aside className="sofi-sidebar commercial-sidebar">
        <div className="sofi-sidebar-header commercial-sidebar-header">
          <div className="sofi-logo-container">
            <img src={logo} alt="SOFIMED Logo" className="sofi-logo" />
          </div>
          <p className="sofi-subtitle">Espace Commercial</p>
        </div>

        <nav className="sofi-sidebar-nav">
          <ul className="sofi-nav-list">
            {[
              { icon: Home, label: "Tableau de bord", path: "/commercial/dashboard" },
              { icon: Users, label: "Gestion Clients", path: "/commercial/dashboard/clients" },
              { icon: FileText, label: "Devis", path: "/commercial/dashboard/devis" },
              { icon: MessageCircle, label: "Consultations", path: "/commercial/dashboard/consultations" },
              { icon: ChartBar, label: "Statistiques", path: "/commercial/dashboard/statistiques" },
            ].map((item, index) => (
              <li
                key={index}
                className={`sofi-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={18} className="sofi-nav-icon" />
                <span>{item.label}</span>
                {item.label === "Consultations" && unreadMessagesCount > 0 && (
                  <span className="sofi-badge">{unreadMessagesCount}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sofi-sidebar-footer">
          <div className="sofi-user-profile">
            <div className="sofi-avatar">
              {userData?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="sofi-user-info">
              <p className="sofi-user-name">{userData?.username}</p>
              <p className="sofi-user-email">{userData?.email}</p>
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

      <main className="sofi-main">
        {location.pathname === "/commercial/dashboard" && (
          <header className="sofi-main-header commercial-header">
            <h2 className="sofi-page-title">Tableau de bord</h2>
            <div className="sofi-header-actions">
              <button 
                className="sofi-notif-btn" 
                aria-label="Notifications" 
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="sofi-notif-badge">{unreadNotificationsCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="sofi-notif-dropdown">
                  <div className="sofi-notif-dropdown-title">
                    Notifications
                    {unreadNotificationsCount > 0 && (
                      <span className="mark-all-read" onClick={markAllNotificationsAsRead}>
                        Tout marquer comme lu
                      </span>
                    )}
                  </div>
                  <ul className="sofi-notif-list">
                    {notifications.length === 0 ? (
                      <li className="sofi-notif-item empty">Aucune notification</li>
                    ) : (
                      notifications.map((notif) => (
                        <li
                          key={notif.id}
                          className={`sofi-notif-item ${notif.isRead ? "" : "unread"}`}
                          onClick={() => notif.link && navigate(notif.link)}
                        >
                          <div className="notif-content">
                            <div className="notif-header">
                              <span className="notif-type">
                                {notif.type === 'new_message' && '💬'}
                                {notif.type === 'devis_update' && '📄'}
                                {notif.type === 'system' && '🔔'}
                                {notif.title || 'Notification'}
                              </span>
                              <span className="notif-time">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </span>
                            </div>
                            <div className="notif-message">{notif.message}</div>
                            {notif.senderName && (
                              <div className="notif-sender">De: {notif.senderName}</div>
                            )}
                          </div>
                          {!notif.isRead && (
                            <button 
                              className="mark-read-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notif.id);
                              }}
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </header>
        )}

        <div className="sofi-content">
          <Routes>
            <Route path="/" element={
              <>
                <div className="sofi-welcome-card commercial-welcome-card">
                  <div className="sofi-card-content">
                    <h1 className="sofi-welcome-title">Bienvenue dans votre espace Commercial</h1>
                    <p className="sofi-welcome-text">
                      Gérez vos clients, consultez les devis et suivez vos performances.
                    </p>
                    <div className="sofi-card-actions">
                      <button className="sofi-btn sofi-btn-primary" onClick={() => navigate('/commercial/dashboard/clients')}>
                        <Users size={16} />
                        <span>Gérer mes clients</span>
                      </button>
                      <button className="sofi-btn sofi-btn-secondary" onClick={() => navigate('/commercial/dashboard/devis')}>
                        <FileText size={16} />
                        <span>Voir les devis</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sofi-stats-grid">
                  {[ 
                    { 
                      icon: Users, 
                      label: "Clients actifs", 
                      value: "45", 
                      change: "+3 ce mois", 
                      positive: true,
                      iconColor: "#1D4ED8"
                    },
                    { 
                      icon: FileText, 
                      label: "Devis en attente", 
                      value: "12", 
                      change: "À traiter",
                      iconColor: "#10B981"
                    },
                    { 
                      icon: ChartBar, 
                      label: "Taux de conversion", 
                      value: "68%", 
                      change: "+5% ce mois", 
                      positive: true,
                      iconColor: "#6366F1"
                    },
                    { 
                      icon: MessageCircle, 
                      label: "Consultations", 
                      value: unreadMessagesCount.toString(), 
                      change: unreadMessagesCount > 0 ? "Messages non lus" : "Aucun message",
                      iconColor: "#EC4899"
                    }
                  ].map((stat, index) => (
                    <div key={index} className="sofi-stat-card commercial-stat-card">
                      <div className="sofi-stat-icon" style={{ backgroundColor: `rgba(${stat.iconColor.replace('#', '').match(/.{2}/g).map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` }}>
                        <stat.icon size={24} color={stat.iconColor} />
                      </div>
                      <div className="sofi-stat-info">
                        <p className="sofi-stat-label">{stat.label}</p>
                        <p className="sofi-stat-value">{stat.value}</p>
                        <p className={`sofi-stat-change ${stat.positive ? 'positive' : ''}`}>
                          {stat.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            } />
            <Route path="/clients" element={<CommercialClients />} />
            <Route path="/devis" element={<CommercialDevis />} />
            <Route path="/statistiques" element={<CommercialStatistiques />} />
            <Route path="/historique" element={<CommercialHistorique />} />
            <Route path="/consultations" element={<CommercialConsultations />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default CommercialDashboard;