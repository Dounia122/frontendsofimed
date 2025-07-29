import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManager.css';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    telephone: '',
    permissions: []
  });
  const [newCommercial, setNewCommercial] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    telephone: '',
    departement: ''
  });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommercialModalOpen, setIsCommercialModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const availablePermissions = [
    { id: 'DASHBOARD', label: 'Accès au tableau de bord' },
    { id: 'USER_MANAGEMENT', label: 'Gestion des utilisateurs' },
    { id: 'PRODUCT_MANAGEMENT', label: 'Gestion des produits' },
    { id: 'DEVIS_MANAGEMENT', label: 'Gestion des devis' },
    { id: 'CONSULTATIONS_MANAGEMENT', label: 'Gestion des consultations' },
    { id: 'RECLAMATIONS_MANAGEMENT', label: 'Gestion des réclamations' },
    { id: 'STATISTICS_VIEW', label: 'Accès aux statistiques' }
  ];

  const departements = [
    'automatisation',
    'filtration',
    'électrique-ATEX',
    'PTE',
    'pompage'
  ];

  useEffect(() => {
    fetchUsers();
    fetchAdmins();
  }, []);

  useEffect(() => {
    // Filtrer les utilisateurs en fonction du terme de recherche
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/users');
      setUsers(response.data || []);
    } catch (err) {
      setError('Erreur lors de la récupération des utilisateurs');
      setUsers([]);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(user => user.id !== userId));
      setSuccess('Utilisateur supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/admin/permissions/all');
      setAdmins(response.data || []);
    } catch (err) {
      setError('Erreur lors de la récupération des administrateurs');
      setAdmins([]);
    }
  };

  // Fonction pour gérer les changements d'input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour gérer les changements d'input commercial
  const handleCommercialInputChange = (e) => {
    const { name, value } = e.target;
    setNewCommercial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fonction pour gérer les changements de permissions
  const handlePermissionChange = (permissionId) => {
    setNewAdmin(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  // Fonction pour gérer les changements de permissions lors de l'édition
  const handleEditPermissionChange = (permissionId) => {
    setEditingAdmin(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newAdminData = {
      ...newAdmin,
      id: Date.now(),
      role: 'ADMIN'
    };
    setAdmins(prev => [...prev, newAdminData]);
    setSuccess('Administrateur créé avec succès');
    setIsModalOpen(false);
    setNewAdmin({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      telephone: '',
      permissions: []
    });
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCommercialSubmit = async (e) => {
    e.preventDefault();
    const commercialData = {
      ...newCommercial,
      id: Date.now(),
      role: 'COMMERCIAL'
    };
    setUsers(prev => [...prev, commercialData]);
    setSuccess('Commercial créé avec succès');
    setIsCommercialModalOpen(false);
    setNewCommercial({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      telephone: '',
      departement: ''
    });
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setAdmins(admins.map(admin => 
      admin.id === editingAdmin.id 
        ? { ...admin, permissions: editingAdmin.permissions }
        : admin
    ));
    setSuccess('Permissions mises à jour avec succès');
    setIsEditModalOpen(false);
    setEditingAdmin(null);
    setTimeout(() => setSuccess(''), 3000);
  };

  const deleteAdmin = async (adminId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
      setAdmins(admins.filter(admin => admin.id !== adminId));
      setSuccess('Administrateur supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const openEditModal = (admin) => {
    setEditingAdmin({
      ...admin,
      permissions: [...(admin.permissions || [])]
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="user-manager-container">
      <div className="header">
        <h2>Gestion des Utilisateurs</h2>
        <div className="header-buttons">
          <button className="add-user-btn" onClick={() => setIsModalOpen(true)}>
            Ajouter un Administrateur
          </button>
          <button className="add-commercial-btn" onClick={() => setIsCommercialModalOpen(true)}>
            Ajouter un Commercial
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-list">
        <div className="section-header">
          <h3>Liste des Utilisateurs</h3>
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
            
              <th>Email</th>
             
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                
                <td>{user.email}</td>
                
                <td>{user.role || 'Utilisateur'}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteUser(user.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                  {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 
                   (error ? 'Erreur lors du chargement des utilisateurs' : 'Aucun utilisateur trouvé')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admins-list">
        <h3>Liste des Administrateurs</h3>
        <table>
          <thead>
            <tr>
              <th>Nom d'utilisateur</th>
              <th>Nom complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins && admins.length > 0 ? admins.map(admin => (
              <tr key={admin.id}>
                <td>{admin.username}</td>
                <td>{admin.firstName} {admin.lastName}</td>
                <td>{admin.email}</td>
                <td>{admin.telephone || 'N/A'}</td>
                <td>
                  {admin.permissions && admin.permissions.map(permission => (
                    <span key={permission} className="permission-badge">
                      {availablePermissions.find(p => p.id === permission)?.label}
                    </span>
                  ))}
                </td>
                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(admin)}
                  >
                    Modifier
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteAdmin(admin.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>
                  {error ? 'Erreur lors du chargement des administrateurs' : 'Aucun administrateur trouvé'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal pour ajouter un administrateur */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Ajouter un Administrateur</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newAdmin.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newAdmin.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom d'utilisateur:</label>
                  <input
                    type="text"
                    name="username"
                    value={newAdmin.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={newAdmin.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={newAdmin.telephone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mot de passe:</label>
                  <input
                    type="password"
                    name="password"
                    value={newAdmin.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={newAdmin.permissions.includes(permission.id)}
                        onChange={() => handlePermissionChange(permission.id)}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Créer l'administrateur
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un commercial */}
      {isCommercialModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Ajouter un Commercial</h3>
            <form onSubmit={handleCommercialSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom:</label>
                  <input
                    type="text"
                    name="firstName"
                    value={newCommercial.firstName}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom:</label>
                  <input
                    type="text"
                    name="lastName"
                    value={newCommercial.lastName}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nom d'utilisateur:</label>
                  <input
                    type="text"
                    name="username"
                    value={newCommercial.username}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    name="email"
                    value={newCommercial.email}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone:</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={newCommercial.telephone}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mot de passe:</label>
                  <input
                    type="password"
                    name="password"
                    value={newCommercial.password}
                    onChange={handleCommercialInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Département:</label>
                <select
                  name="departement"
                  value={newCommercial.departement}
                  onChange={handleCommercialInputChange}
                  required
                >
                  <option value="">Sélectionner un département</option>
                  {departements.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Créer le commercial
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsCommercialModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour modifier les permissions d'un administrateur */}
      {isEditModalOpen && editingAdmin && (
        <div className="modal">
          <div className="modal-content">
            <h3>Modifier les permissions de {editingAdmin.username}</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Permissions:</label>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={editingAdmin.permissions.includes(permission.id)}
                        onChange={() => handleEditPermissionChange(permission.id)}
                      />
                      {permission.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="submit-btn">
                  Mettre à jour les permissions
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;