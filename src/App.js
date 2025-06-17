// App.js
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import ClientDashboard from './components/Client/ClientDashboard';
import Register from './components/Login/Register';
import CommercialDashboard from './components/Commercial/CommercialDashboard';
import CommercialDevis from './components/Commercial/CommercialDevis';
import CommercialClients from './components/Commercial/CommercialClients';
import CommercialStatistiques from './components/Commercial/CommercialStatistiques';
import CommercialHistorique from './components/Commercial/CommercialHistorique';
import AdminDashboard from './components/Admin/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/client/dashboard/*" element={<ClientDashboard />} />
        <Route path="/commercial/dashboard/*" element={<CommercialDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
// ...existing code ...
