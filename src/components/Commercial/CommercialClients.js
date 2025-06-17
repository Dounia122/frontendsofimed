import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, UserPlus, Mail, Phone, MapPin, Building, FileText, 
  Edit, Trash2, MessageSquare, Calendar, DollarSign, User
} from 'lucide-react';
import './CommercialClients.css';

const CommercialClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    companyName: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError("Informations utilisateur non disponibles");
        setLoading(false);
        return;
      }

      // Récupérer d'abord l'ID commercial
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!commercialResponse.data || !commercialResponse.data.id) {
        setError("Impossible de récupérer les informations du commercial");
        setLoading(false);
        return;
      }

      const commercialId = commercialResponse.data.id;
      
      // Récupérer les clients associés au commercial
      const response = await axios.get(`http://localhost:8080/api/clients/commercial/${commercialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        setClients(response.data);
        setError('');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      if (err.response?.status === 403) {
        setError("Accès refusé. Veuillez vérifier vos permissions.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError("Impossible de charger la liste des clients");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      companyName: ''
    });
    setShowAddModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      companyName: client.companyName || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Rafraîchir la liste des clients
      fetchClients();
    } catch (err) {
      console.error('Erreur lors de la suppression du client:', err);
      alert('Impossible de supprimer le client. Veuillez réessayer.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Récupérer l'ID commercial
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const commercialId = commercialResponse.data.id;
      
      // Créer le client
      await axios.post('http://localhost:8080/api/clients', {
        ...formData,
        commercialId
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShowAddModal(false);
      fetchClients();
    } catch (err) {
      console.error('Erreur lors de l\'ajout du client:', err);
      alert('Impossible d\'ajouter le client. Veuillez réessayer.');
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:8080/api/clients/${selectedClient.id}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShowEditModal(false);
      fetchClients();
    } catch (err) {
      console.error('Erreur lors de la modification du client:', err);
      alert('Impossible de modifier le client. Veuillez réessayer.');
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.firstName?.toLowerCase().includes(searchLower) || '') ||
      (client.lastName?.toLowerCase().includes(searchLower) || '') ||
      (client.email?.toLowerCase().includes(searchLower) || '') ||
      (client.companyName?.toLowerCase().includes(searchLower) || '')
    );
  });

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h2 className="clients-title">Gestion des Clients</h2>
        <div className="clients-actions">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-client-btn" onClick={handleAddClient}>
            <UserPlus size={18} />
            <span>Ajouter un client</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Chargement des clients...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : filteredClients.length === 0 ? (
        <div className="empty-state">
          <p>Aucun client trouvé. Commencez par en ajouter un nouveau.</p>
        </div>
      ) : (
        <div className="clients-grid">
          {filteredClients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <div className="client-avatar">
                  {getInitials(client.firstName, client.lastName)}
                </div>
                <div className="client-info">
                  <h3>{client.firstName} {client.lastName}</h3>
                  <p>{client.companyName || 'Client particulier'}</p>
                </div>
              </div>
              
              <div className="client-details">
                <div className="client-detail-item">
                  <Mail size={16} />
                  <span className="client-detail-label">Email:</span>
                  <span className="client-detail-value">{client.email || 'Non spécifié'}</span>
                </div>
                <div className="client-detail-item">
                  <Phone size={16} />
                  <span className="client-detail-label">Téléphone:</span>
                  <span className="client-detail-value">{client.phone || 'Non spécifié'}</span>
                </div>
                {client.address && (
                  <div className="client-detail-item">
                    <MapPin size={16} />
                    <span className="client-detail-label">Adresse:</span>
                    <span className="client-detail-value">{client.address}</span>
                  </div>
                )}
              </div>
              
              <div className="client-stats">
                <div className="client-stat">
                  <div className="client-stat-value">{client.devisCount || 0}</div>
                  <div className="client-stat-label">Devis</div>
                </div>
                <div className="client-stat">
                  <div className="client-stat-value">{client.orderCount || 0}</div>
                  <div className="client-stat-label">Commandes</div>
                </div>
                <div className="client-stat">
                  <div className="client-stat-value">{client.consultationCount || 0}</div>
                  <div className="client-stat-label">Consultations</div>
                </div>
              </div>
              
              <div className="client-actions">
                <button className="client-action-btn" onClick={() => handleEditClient(client)}>
                  <Edit size={16} />
                  <span>Modifier</span>
                </button>
                <button className="client-action-btn" onClick={() => navigate(`/commercial/devis?clientId=${client.id}`)}>
                  <FileText size={16} />
                  <span>Devis</span>
                </button>
                <button className="client-action-btn" onClick={() => handleDeleteClient(client.id)}>
                  <Trash2 size={16} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout de client */}
      {showAddModal && (
        <div className="client-modal">
          <div className="client-modal-content">
            <button className="close-modal-btn" onClick={() => setShowAddModal(false)}>×</button>
            <h3 className="client-form-title">Ajouter un nouveau client</h3>
            
            <form onSubmit={handleSubmitAdd}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    className="form-input" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    className="form-input" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="form-input" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input 
                  type="text" 
                  name="address" 
                  className="form-input" 
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <input 
                  type="text" 
                  name="companyName" 
                  className="form-input" 
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-submit">
                  Ajouter le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification de client */}
      {showEditModal && (
        <div className="client-modal">
          <div className="client-modal-content">
            <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>×</button>
            <h3 className="client-form-title">Modifier le client</h3>
            
            <form onSubmit={handleSubmitEdit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    className="form-input" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    className="form-input" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="form-input" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input 
                  type="text" 
                  name="address" 
                  className="form-input" 
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <input 
                  type="text" 
                  name="companyName" 
                  className="form-input" 
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-submit">
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialClients;