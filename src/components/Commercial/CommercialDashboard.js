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
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <img src={logo} alt="SOFIMED Logo" />
          </div>
          <p className="brand-subtitle">Espace Commercial</p>
        </div>

        <nav className="sidebar-nav">
          {[
            { icon: Home, label: "Tableau de bord", path: "/commercial/dashboard" },
            { icon: Users, label: "Gestion Clients", path: "/commercial/dashboard/clients" },
            { icon: FileText, label: "Devis", path: "/commercial/dashboard/devis" },
            { icon: MessageCircle, label: "Consultations", path: "/commercial/dashboard/consultations" },
            { icon: ChartBar, label: "Statistiques", path: "/commercial/dashboard/statistiques" },
          ].map((item, index) => (
            <div
              key={index}
              className="nav-item"
              onClick={() => navigate(item.path)}
              style={{ position: 'relative' }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.label === "Consultations" && unreadMessagesCount > 0 && (
                <span className="message-badge">{unreadMessagesCount}</span>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {userData?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <p className="user-name">{userData?.username}</p>
              <p className="user-email">{userData?.email}</p>
            </div>
          </div>

          <div className="footer-menu">
            <div className="footer-item">
              <Settings size={16} />
              <span>Paramètres</span>
            </div>
            <div className="footer-item">
              <HelpCircle size={16} />
              <span>Aide & Support</span>
            </div>
            <div className="footer-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Déconnexion</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        {location.pathname === "/commercial/dashboard" && (
          <header className="main-header">
            <h2>Tableau de bord</h2>
            <div className="header-actions" style={{ position: "relative" }}>
              <button 
                className="notif-btn" 
                aria-label="Notifications" 
                onClick={toggleNotifications}
              >
                <Bell size={20} />
                {unreadNotificationsCount > 0 && (
                  <span className="notif-badge">{unreadNotificationsCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-title">
                    Notifications
                    {unreadNotificationsCount > 0 && (
                      <span className="mark-all-read" onClick={markAllNotificationsAsRead}>
                        Tout marquer comme lu
                      </span>
                    )}
                  </div>
                  <ul className="notif-dropdown-list">
                    {notifications.length === 0 ? (
                      <li className="notif-dropdown-item empty">Aucune notification</li>
                    ) : (
                      notifications.map((notif) => (
                        <li
                          key={notif.id}
                          className={`notif-dropdown-item${notif.isRead ? " read" : " unread"}`}
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

        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={
              <>
                <div className="welcome-card">
                  <div className="card-content">
                    <h1>Bienvenue dans votre espace Commercial</h1>
                    <p className="welcome-text">
                      Gérez vos clients, consultez les devis et suivez vos performances.
                    </p>
                    <div className="card-actions">
                      <button className="btn btn-primary" onClick={() => navigate('/commercial/dashboard/clients')}>
                        <Users size={16} />
                        <span>Gérer mes clients</span>
                      </button>
                      <button className="btn btn-secondary" onClick={() => navigate('/commercial/dashboard/devis')}>
                        <FileText size={16} />
                        <span>Voir les devis</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  {[ 
                    { 
                      icon: Users, 
                      label: "Clients actifs", 
                      value: "45", 
                      change: "+3 ce mois", 
                      positive: true,
                      bgColor: "rgba(29, 78, 216, 0.1)",
                      iconColor: "#1D4ED8"
                    },
                    { 
                      icon: FileText, 
                      label: "Devis en attente", 
                      value: "12", 
                      change: "À traiter",
                      bgColor: "rgba(16, 185, 129, 0.1)",
                      iconColor: "#10B981"
                    },
                    { 
                      icon: ChartBar, 
                      label: "Taux de conversion", 
                      value: "68%", 
                      change: "+5% ce mois", 
                      positive: true,
                      bgColor: "rgba(99, 102, 241, 0.1)",
                      iconColor: "#6366F1"
                    },
                    { 
                      icon: MessageCircle, 
                      label: "Consultations", 
                      value: unreadMessagesCount.toString(), 
                      change: unreadMessagesCount > 0 ? "Messages non lus" : "Aucun message",
                      bgColor: "rgba(236, 72, 153, 0.1)",
                      iconColor: "#EC4899"
                    }
                  ].map((stat, index) => (
                    <div key={index} className="stat-card">
                      <div className="stat-icon" style={{ background: stat.bgColor }}>
                        <stat.icon size={24} color={stat.iconColor} />
                      </div>
                      <div className="stat-info">
                        <p className="stat-label">{stat.label}</p>
                        <p className="stat-value">{stat.value}</p>
                        <p className={`stat-change ${stat.positive ? 'positive' : ''}`}>
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