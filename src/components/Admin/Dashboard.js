import './Dashboard.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import logo from '../../assets/logosofi1.png';
import AdminConsultations from './AdminConsultations';
import DevisAdmin from './DevisAdmin';
import ProductManager from './ProductManager';
import {
  Home, FileText, MessageCircle, Settings, LogOut,
  Users, Package, FileSpreadsheet, BarChart2,
  AlertTriangle, Bell
} from 'lucide-react';

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

  const handleNavigation = useCallback((key) => {
    setActiveItem(key);
    navigate(key === 'dashboard' ? '/admin/dashboard' : `/admin/dashboard/${key}`);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderHeader = () => (
    <header className="main-header">
      <h2>Tableau de Bord Administrateur</h2>
      <div className="header-actions">
        <button className="notif-btn" onClick={() => setShowNotifications(!showNotifications)}>
          <Bell className="nav-icon" size={18} />
          {totalNotifications > 0 && (
            <span className="notif-badge">{totalNotifications}</span>
          )}
        </button>
      </div>
    </header>
  );

  const renderDashboardContent = () => (
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

  const isDashboardHome = location.pathname === '/admin/dashboard' || location.pathname === '/admin/dashboard/';

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="SOFIMED Logo" className="logo-img" />
          <p className="brand-subtitle">Espace Administrateur</p>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-menu">
            {navItems.map(({ key, label, icon }) => (
              <li
                key={key}
                className={`nav-item ${activeItem === key ? 'active' : ''}`}
                onClick={() => handleNavigation(key)}
              >
                {icon}
                <span>{label}</span>
                {notifications[key] > 0 && ['devis', 'consultations', 'reclamations'].includes(key) && (
                  <span className="badge">{notifications[key]}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">A</div>
            <div className="user-info">
              <p className="user-name">Admin</p>
              <p className="user-email">admin@sofimed.com</p>
            </div>
          </div>
          <ul className="footer-menu">
            <li className="footer-item">
              <Settings size={16} />
              <span>Paramètres</span>
            </li>
            <li className="footer-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Déconnexion</span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="dashboard-main">
        {isDashboardHome && renderHeader()}

        <Routes>
          <Route path="/" element={renderDashboardContent()} />
          <Route path="devis" element={<DevisAdmin />} />
          <Route path="consultations" element={<AdminConsultations />} />
          <Route path="users" element={<div>Gestion des utilisateurs</div>} />
          <Route path="reclamations" element={<div>Gestion des réclamations</div>} />
          <Route path="stats" element={<div>Statistiques</div>} />
          <Route path="products" element={<ProductManager />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
