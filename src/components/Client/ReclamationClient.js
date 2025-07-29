import React, { useState, useEffect, useRef } from 'react';
import './ReclamationClient.css';

const ReclamationClient = () => {
  const [formData, setFormData] = useState({
    sujet: '',
    categorie: '',
    priorite: 'normale',
    description: '',
    fichierJoint: null,
    email: '',
    telephone: ''
  });

  const [reclamations, setReclamations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreCategorie, setFiltreCategorie] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const categories = [
    'Produit défectueux',
    'Livraison retardée',
    'Service client',
    'Facturation',
    'Garantie',
    'Autre'
  ];

  const statuts = ['tous', 'NOUVEAU', 'EN_COURS', 'RESOLU', 'FERME'];

  // Données mockées pour les réclamations
  const mockReclamations = [
    {
      id: 1,
      reference: 'REC-2024-001',
      sujet: 'Produit endommagé lors de la livraison',
      categorie: 'Produit défectueux',
      priorite: 'haute',
      statut: 'NOUVEAU',
      description: 'Le produit est arrivé avec des dommages visibles.',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00'
    },
    {
      id: 2,
      reference: 'REC-2024-002',
      sujet: 'Retard de livraison important',
      categorie: 'Livraison retardée',
      priorite: 'moyenne',
      statut: 'EN_COURS',
      description: 'Ma commande devait arriver il y a une semaine.',
      createdAt: '2024-01-10T14:20:00',
      updatedAt: '2024-01-12T09:15:00'
    },
    {
      id: 3,
      reference: 'REC-2024-003',
      sujet: 'Problème de facturation',
      categorie: 'Facturation',
      priorite: 'normale',
      statut: 'RESOLU',
      description: 'Erreur sur ma facture, le montant ne correspond pas.',
      createdAt: '2024-01-08T16:45:00',
      updatedAt: '2024-01-14T11:30:00'
    }
  ];

  useEffect(() => {
    chargerReclamations();
  }, []);

  // Simulation du chargement des réclamations avec des données mockées
  const chargerReclamations = async () => {
    try {
      setLoading(true);
      // Simulation d'un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Chargement des réclamations mockées...');
      setReclamations(mockReclamations);
      console.log('Réclamations chargées:', mockReclamations);
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error);
      setMessage('Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage('Le fichier ne doit pas dépasser 5MB');
      return;
    }
    setFormData(prev => ({
      ...prev,
      fichierJoint: file
    }));
  };

  // Simulation de l'ajout d'une réclamation sans base de données
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulation d'un délai d'API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Création d'une nouvelle réclamation simulée
      const nouvelleReclamation = {
        id: Date.now(), // ID unique basé sur le timestamp
        reference: `REC-2024-${String(reclamations.length + 1).padStart(3, '0')}`,
        sujet: formData.sujet,
        categorie: formData.categorie,
        priorite: formData.priorite,
        statut: 'NOUVEAU',
        description: formData.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fichierJoint: formData.fichierJoint ? formData.fichierJoint.name : null
      };

      console.log('Nouvelle réclamation créée (simulation):', nouvelleReclamation);
      
      // Ajout de la nouvelle réclamation en tête de liste
      setReclamations(prev => [nouvelleReclamation, ...prev]);
      
      // Réinitialisation du formulaire
      setFormData({
        sujet: '',
        categorie: '',
        priorite: 'normale',
        description: '',
        fichierJoint: null,
        email: '',
        telephone: ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setShowForm(false);
      setMessage('✅ Réclamation ajoutée avec succès! (Simulation - non sauvegardée en base)');
      
      // Effacer le message après 5 secondes
      setTimeout(() => setMessage(''), 5000);
      
      console.log('Liste des réclamations mise à jour:', [nouvelleReclamation, ...reclamations]);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setMessage('❌ Erreur lors de la soumission de la réclamation.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'NOUVEAU': return 'statut-nouveau';
      case 'EN_COURS': return 'statut-en-cours';
      case 'RESOLU': return 'statut-resolu';
      case 'FERME': return 'statut-ferme';
      default: return 'statut-nouveau';
    }
  };

  const getPrioriteClass = (priorite) => {
    switch (priorite) {
      case 'haute': return 'priorite-haute';
      case 'moyenne': return 'priorite-moyenne';
      case 'normale': return 'priorite-normale';
      default: return 'priorite-normale';
    }
  };

  const filteredReclamations = reclamations.filter(reclamation => {
    const matchStatut = filtreStatut === 'tous' || reclamation.statut === filtreStatut;
    const matchCategorie = filtreCategorie === 'tous' || reclamation.categorie === filtreCategorie;
    const matchSearch = reclamation.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       reclamation.reference.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatut && matchCategorie && matchSearch;
  });

  // Fonction pour réinitialiser les données (utile pour les tests)
  const resetData = () => {
    setReclamations(mockReclamations);
    setMessage('🔄 Données réinitialisées aux valeurs par défaut');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="reclamation-client-container">
      <div className="client-header">
        <h1 className="page-title">
          <i className="fas fa-exclamation-triangle"></i>
          Mes Réclamations
        </h1>
        <div className="header-actions">
          <button 
            className="btn-reset"
            onClick={resetData}
            title="Réinitialiser les données"
          >
            <i className="fas fa-undo"></i>
            Reset
          </button>
          <button 
            className="btn-nouvelle-reclamation"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus"></i>
            Nouvelle Réclamation
          </button>
        </div>
      </div>

      {/* Compteur de réclamations */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-number">{reclamations.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{reclamations.filter(r => r.statut === 'NOUVEAU').length}</span>
          <span className="stat-label">Nouvelles</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{reclamations.filter(r => r.statut === 'EN_COURS').length}</span>
          <span className="stat-label">En cours</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{reclamations.filter(r => r.statut === 'RESOLU').length}</span>
          <span className="stat-label">Résolues</span>
        </div>
      </div>

      {/* Filtres améliorés */}
      <div className="filter-controls">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Rechercher par sujet ou référence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Effacer la recherche"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <select 
          className="filter-select"
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
        >
          <option value="tous">Tous les statuts</option>
          {statuts.slice(1).map(statut => (
            <option key={statut} value={statut}>{statut.replace('_', ' ')}</option>
          ))}
        </select>
        <select 
          className="filter-select"
          value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}
        >
          <option value="tous">Toutes les catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Grille des réclamations */}
      <div className="client-reclamations-grid">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Chargement des réclamations...</p>
          </div>
        ) : filteredReclamations.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>Aucune réclamation trouvée</h3>
            <p>Aucune réclamation ne correspond à vos critères de recherche.</p>
            {reclamations.length === 0 && (
              <button 
                className="btn-nouvelle-reclamation"
                onClick={() => setShowForm(true)}
              >
                <i className="fas fa-plus"></i>
                Créer votre première réclamation
              </button>
            )}
          </div>
        ) : (
          filteredReclamations.map(reclamation => (
            <div key={reclamation.id} className="client-reclamation-card">
              <div className="card-header">
                <span className="reference">{reclamation.reference}</span>
                <span className={`statut ${getStatutClass(reclamation.statut)}`}>
                  {reclamation.statut.replace('_', ' ')}
                </span>
              </div>
              <div className="card-body">
                <h3 className="sujet">{reclamation.sujet}</h3>
                <p className="description-preview">
                  {reclamation.description.length > 100 
                    ? `${reclamation.description.substring(0, 100)}...` 
                    : reclamation.description
                  }
                </p>
                <div className="meta-info">
                  <div className="meta-item">
                    <i className="fas fa-tag"></i>
                    <span>{reclamation.categorie}</span>
                  </div>
                  <div className="meta-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(reclamation.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {reclamation.fichierJoint && (
                    <div className="meta-item">
                      <i className="fas fa-paperclip"></i>
                      <span>Fichier joint</span>
                    </div>
                  )}
                </div>
                <span className={`priority-badge ${getPrioriteClass(reclamation.priorite)}`}>
                  {reclamation.priorite}
                </span>
              </div>
              <div className="card-actions">
                <button className="btn-details">
                  <i className="fas fa-eye"></i>
                  Voir détails
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`message ${message.includes('succès') || message.includes('✅') ? 'success' : 'error'}`}>
          <i className={`fas ${message.includes('succès') || message.includes('✅') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message}
          <button 
            className="message-close"
            onClick={() => setMessage('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Modal de formulaire */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-plus-circle"></i>
                Nouvelle Réclamation
              </h2>
              <button 
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="reclamation-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sujet">
                    <i className="fas fa-heading"></i>
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="sujet"
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleInputChange}
                    required
                    placeholder="Résumé de votre réclamation"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="categorie">
                    <i className="fas fa-tags"></i>
                    Catégorie *
                  </label>
                  <select
                    id="categorie"
                    name="categorie"
                    value={formData.categorie}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priorite">
                    <i className="fas fa-flag"></i>
                    Priorité
                  </label>
                  <select
                    id="priorite"
                    name="priorite"
                    value={formData.priorite}
                    onChange={handleInputChange}
                  >
                    <option value="normale">Normale</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <i className="fas fa-align-left"></i>
                  Description détaillée *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Décrivez votre problème en détail..."
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="fichierJoint">
                  <i className="fas fa-paperclip"></i>
                  Fichier joint (optionnel)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="fichierJoint"
                  name="fichierJoint"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                />
                <small>Formats acceptés: JPG, PNG, PDF, DOC (max 5MB)</small>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowForm(false)}
                >
                  <i className="fas fa-times"></i>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      Soumettre
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReclamationClient;