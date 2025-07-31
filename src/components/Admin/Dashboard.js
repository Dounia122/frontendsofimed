import './Dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config'; // Importer API_BASE_URL depuis config.js
import logo from '../../assets/logosofi1.png';
import AdminConsultations from './AdminConsultations';
import DevisAdmin from './DevisAdmin';
import ProductManager from './ProductManager';
import UserManager from './UserManager';
import {
  Home, FileText, MessageCircle, Settings, LogOut,
  Users, Package, FileSpreadsheet, BarChart2,
  AlertTriangle, Bell
} from 'lucide-react';

import ReclamationAdmin from './ReclamationAdmin';

const navItems = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <Home size={18} /> },
  { key: 'users', label: 'Gestion Utilisateurs', icon: <Users size={18} /> },
  { key: 'products', label: 'Gestion Produits', icon: <Package size={18} /> },
  { key: 'devis', label: 'Demandes de devis', icon: <FileSpreadsheet size={18} /> },
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

  const notifications = {
    devis: 3,
    consultations: 5,
    reclamations: 2
  };

  const totalNotifications = notifications.devis + notifications.consultations + notifications.reclamations;

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    setActiveItem(path === 'dashboard' || path === '' ? 'dashboard' : path);
  }, [location]);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.log('Aucun userId trouvé dans localStorage');
        setUserPermissions([]);
        setLoading(false);
        return;
      }
      
      console.log('UserId récupéré:', userId);
      console.log('Tentative de récupération des permissions à:', `${API_BASE_URL}/api/admin/permissions/by-user/${userId}`);
      
      const permissionsResponse = await fetch(`${API_BASE_URL}/api/admin/permissions/by-user/${userId}`);
      console.log('Statut de la réponse permissions:', permissionsResponse.status);
      
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        console.log('Données permissions reçues:', permissionsData);
        // Extraire les permissions depuis la réponse
        const permissions = Array.isArray(permissionsData) ? permissionsData : permissionsData.permissions || [];
        setUserPermissions(permissions);
      } else {
        console.log('Erreur lors de la récupération des permissions:', permissionsResponse.status);
        setUserPermissions([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    console.log('Vérification permission:', permission);
    console.log('Permissions utilisateur:', userPermissions);
    console.log('AdminId:', localStorage.getItem('adminId'));
    return userPermissions.includes(permission);
  };

  const getFilteredNavItems = () => {
    return navItems.filter(item => {
      switch (item.key) {
        case 'dashboard':
          return hasPermission('DASHBOARD');
        case 'users':
          return hasPermission('USER_MANAGEMENT');
        case 'products':
          return hasPermission('PRODUCT_MANAGEMENT');
        case 'devis':
          return hasPermission('DEVIS_MANAGEMENT');
        case 'consultations':
          return hasPermission('CONSULTATIONS_MANAGEMENT');
        case 'reclamations':
          return hasPermission('RECLAMATIONS_MANAGEMENT');
        case 'stats':
          return hasPermission('STATISTICS_VIEW');
        default:
          return false;
      }
    });
  };

  const handleNavigation = useCallback((key) => {
    // Vérifier les permissions avant la navigation
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

  const renderDashboardContent = () => {
    return (
      <div className="content-wrapper">
        <div className="welcome-card">
          <div className="card-content">
            <h1>Bienvenue dans l'espace administrateur</h1>
            <p className="welcome-text">
              Gérez les utilisateurs, les produits et suivez l'activité de la plateforme.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {[
            {
              label: 'Utilisateurs actifs', value: '150', change: '+12 ce mois',
              icon: <Users size={24} color="#3B82F6" />, key: 'users', changeClass: 'positive'
            },
            {
              label: 'Produits', value: '1,240', change: 'En stock',
              icon: <Package size={24} color="#10B981" />, key: 'products'
            },
            {
              label: 'Devis en attente', value: notifications.devis, change: 'Nécessite attention',
              icon: <FileSpreadsheet size={24} color="#F59E0B" />, key: 'devis', changeClass: 'negative'
            },
            {
              label: 'Consultations', value: notifications.consultations, change: 'À traiter',
              icon: <MessageCircle size={24} color="#6366F1" />, key: 'consultations'
            }
          ].map((card) => (
            <div key={card.key} className="stat-card" onClick={() => handleNavigation(card.key)}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-info">
                <p className="stat-label">{card.label}</p>
                <p className="stat-value">{card.value}</p>
                <p className={`stat-change ${card.changeClass || ''}`}>{card.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <header className="main-header">
      <h2>Tableau de Bord Administrateur</h2>
      <div className="header-actions">
        <button 
          className="notif-btn" 
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="nav-icon" size={18} />
          {totalNotifications > 0 && (
            <span className="notif-badge">{totalNotifications}</span>
          )}
        </button>
      </div>
    </header>
  );

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
                {notifications[key] > 0 && ['devis', 'consultations', 'reclamations'].includes(key) && (
                  <span className="sofi-badge">{notifications[key]}</span>
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
            <div className="sofi-header-actions">
              <button 
                className="sofi-notif-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="sofi-nav-icon" size={18} />
                {totalNotifications > 0 && (
                  <span className="sofi-notif-badge">{totalNotifications}</span>
                )}
              </button>
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
                      label: 'Utilisateurs actifs', value: '150', change: '+12 ce mois',
                      icon: <Users size={24} color="#3B82F6" />, key: 'users', changeClass: 'positive'
                    },
                    {
                      label: 'Produits', value: '1,240', change: 'En stock',
                      icon: <Package size={24} color="#10B981" />, key: 'products'
                    },
                    {
                      label: 'Devis en attente', value: notifications.devis, change: 'Nécessite attention',
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
            <Route path="stats" element={hasPermission('STATISTICS_VIEW') ? <div>Statistiques</div> : <div>Accès refusé</div>} />
            <Route path="products" element={hasPermission('PRODUCT_MANAGEMENT') ? <ProductManager /> : <div>Accès refusé</div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
