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
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const CommercialDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [stompClient, setStompClient] = useState(null);
  const [notifications, setNotifications] = useState([]);
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
        setUnreadMessages(data.total || 0);
      }
    } catch (error) {
      setUnreadMessages(0);
    }
  };

  // Récupération des notifications (optionnel)
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

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      notifications
        .filter((notif) => !notif.isRead)
        .forEach((notif) => markNotificationAsRead(notif.id));
    }
  };

  // WebSocket pour mise à jour en temps réel des messages non lus
  useEffect(() => {
    if (!userData) return;

    const socket = new SockJS('http://localhost:8080/ws');
    const token = localStorage.getItem('token');

    const client = new StompClient({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      onConnect: () => {
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
            { icon: History, label: "Historique", path: "/commercial/dashboard/historique" }
          ].map((item, index) => (
            <div
              key={index}
              className="nav-item"
              onClick={() => navigate(item.path)}
              style={{ position: 'relative' }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {/* Afficher badge de messages non lus uniquement sur "Consultations" */}
              {item.label === "Consultations" && unreadMessages > 0 && (
                <span className="message-badge">{unreadMessages}</span>
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
              <button className="notif-btn" aria-label="Notifications" onClick={toggleNotifications}>
                <Bell size={20} />
                {unreadMessages > 0 && (
                  <span className="notif-badge">{unreadMessages}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notif-dropdown">
                  <div className="notif-dropdown-title">Notifications</div>
                  <ul className="notif-dropdown-list">
                    {notifications.length === 0 && (
                      <li className="notif-dropdown-item empty">Aucune notification</li>
                    )}
                    {notifications.map((notif) => (
                      <li
                        key={notif.id}
                        className={`notif-dropdown-item${notif.isRead ? " read" : " unread"}`}
                      >
                        {notif.message}
                      </li>
                    ))}
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
                    { icon: Users, label: "Clients actifs", value: "45", change: "+3 ce mois", positive: true },
                    { icon: FileText, label: "Devis en attente", value: "12", change: "À traiter" },
                    { icon: ChartBar, label: "Taux de conversion", value: "68%", change: "+5% ce mois", positive: true },
                    { icon: MessageCircle, label: "Consultations", value: unreadMessages.toString(), change: unreadMessages > 0 ? "Messages non lus" : "Aucun message" }
                  ].map((stat, index) => (
                    <div key={index} className="stat-card">
                      <div className="stat-icon">
                        <stat.icon size={20} color={stat.color} />
                      </div>
                      <div className="stat-info">
                        <p className="stat-label">{stat.label}</p>
                        <p className="stat-value">{stat.value}</p>
                        <p className={`stat-change ${stat.positive ? 'positive' : ''}`}>{stat.change}</p>
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
            {/* Ajouter la route consultations si besoin */}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default CommercialDashboard;
