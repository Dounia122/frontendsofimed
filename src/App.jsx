import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
import DevisAdmin from './components/Admin/DevisAdmin';
import Dashboard from './components/Admin/Dashboard';
// Importez vos autres composants ici

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const App = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={250} theme="light" style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.06)' }}>
          <div className="logo" style={{ height: '64px', padding: '16px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, color: '#1e293b' }}>SOFIMED Admin</h1>
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard-devis']}
            defaultOpenKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <SubMenu key="dashboard" icon={<DashboardOutlined />} title="Tableau de bord">
              <Menu.Item key="dashboard-devis">
                <Link to="/admin/dashboard/devis">Gestion des Devis</Link>
              </Menu.Item>
              <Menu.Item key="dashboard-stats">
                <Link to="/admin/dashboard/stats">Statistiques</Link>
              </Menu.Item>
            </SubMenu>
            
            <Menu.Item key="devis" icon={<FileTextOutlined />}>
              <Link to="/admin/devis">Tous les Devis</Link>
            </Menu.Item>
            
            <Menu.Item key="clients" icon={<UserOutlined />}>
              <Link to="/admin/clients">Clients</Link>
            </Menu.Item>
            
            <Menu.Item key="commerciaux" icon={<TeamOutlined />}>
              <Link to="/admin/commerciaux">Commerciaux</Link>
            </Menu.Item>
            
            <Menu.Item key="produits" icon={<ShoppingOutlined />}>
              <Link to="/admin/produits">Produits</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}>
            {/* Vous pouvez ajouter des éléments d'en-tête ici */}
          </Header>
          <Content style={{ 
            margin: '24px',
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <Routes>
              {/* Redirection de la racine vers le dashboard */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Routes du dashboard */}
              <Route path="/admin/dashboard/*" element={<Dashboard />} />
              
              {/* Autres routes */}
              <Route path="/admin/devis" element={<DevisAdmin />} />
              <Route path="/admin/clients" element={<div>Clients</div>} />
              <Route path="/admin/commerciaux" element={<div>Commerciaux</div>} />
              <Route path="/admin/produits" element={<div>Produits</div>} />
              
              {/* Route de fallback pour les chemins invalides */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App; 