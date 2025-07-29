import React, { useState, useEffect } from 'react';
import './ReclamationAdmin.css';

const ReclamationAdmin = () => {
  const [reclamations, setReclamations] = useState([]);
  const [filtres, setFiltres] = useState({
    statut: '',
    priorite: '',
    categorie: '',
    dateDebut: '',
    dateFin: '',
    recherche: ''
  });
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reponse, setReponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    nouveau: 0,
    enCours: 0,
    resolu: 0
  });

  const statuts = ['Nouveau', 'En cours', 'Résolu', 'Fermé'];
  const priorites = ['normale', 'moyenne', 'haute'];
  const categories = [
    'Produit défectueux',
    'Livraison retardée',
    'Service client',
    'Facturation',
    'Garantie',
    'Autre'
  ];

  useEffect(() => {
    chargerReclamations();
  }, []);

  useEffect(() => {
    calculerStats();
  }, [reclamations]);

  const chargerReclamations = async () => {
    try {
      // Données réelles des clients
      const mockReclamations = [
        {
          id: 1,
          reference: 'REC-2025-001',
          client: {
            nom: 'El Alami',
            prenom: 'Mohamed',
            email: 'mohamed.elalami@example.ma',
            telephone: '+212612345678',
            adresse: 'Rue Ibn Khaldoun, Casablanca',
            codeClient: 'CLI-2025-010',
            entreprise: 'PharmaMaroc SARL'
          },
          sujet: 'Produit endommagé lors de la livraison',
          categorie: 'Produit défectueux',
          priorite: 'haute',
          statut: 'Nouveau',
          description: 'Le produit est arrivé avec des dommages visibles sur l\'emballage et le produit lui-même.',
          dateCreation: '2025-06-04T12:07:02',
          dateModification: '2025-06-04T12:07:02',
          assigneA: null,
          reponses: []
        },
        {
          id: 2,
          reference: 'REC-2025-002',
          client: {
            nom: 'elmoutaoukil',
            prenom: 'Dunia',
            email: 'dunia.elmoutaoukil.2@example.com',
            telephone: '0655829648',
            codeClient: 'CLI-2025-null'
          },
          sujet: 'Retard de livraison important',
          categorie: 'Livraison retardée',
          priorite: 'moyenne',
          statut: 'En cours',
          description: 'Ma commande devait arriver il y a une semaine mais je n\'ai toujours rien reçu.',
          dateCreation: '2025-06-04T12:31:15',
          dateModification: '2025-06-04T12:31:15',
          assigneA: 'Admin User',
          reponses: [
            {
              id: 1,
              auteur: 'Admin User',
              message: 'Nous vérifions le statut de votre commande.',
              date: '2025-06-04T12:31:15'
            }
          ]
        },
        {
          id: 3,
          reference: 'REC-2025-003',
          client: {
            nom: 'lbat',
            prenom: 'Salma',
            email: 'salma.lbat.5@example.com',
            telephone: '0566498757'
          },
          sujet: 'Problème de facturation',
          categorie: 'Facturation',
          priorite: 'normale',
          statut: 'Résolu',
          description: 'Je constate une erreur sur ma facture, le montant ne correspond pas à ma commande.',
          dateCreation: '2025-07-09T13:15:12',
          dateModification: '2025-07-09T13:15:12',
          assigneA: 'Admin User',
          reponses: [
            {
              id: 1,
              auteur: 'Admin User',
              message: 'Nous avons corrigé l\'erreur et vous avons envoyé une nouvelle facture.',
              date: '2025-07-09T13:15:12'
            }
          ]
        },
        {
          id: 4,
          reference: 'REC-2025-004',
          client: {
            nom: 'alaoui',
            prenom: 'ahlam',
            email: 'ahlam.alaoui.6@example.com',
            telephone: '066598747',
            codeClient: 'CLI-2025-00006'
          },
          sujet: 'Question sur la garantie',
          categorie: 'Garantie',
          priorite: 'normale',
          statut: 'Nouveau',
          description: 'Je souhaite connaître les conditions de garantie pour mon achat récent.',
          dateCreation: '2025-07-09T14:57:03',
          dateModification: '2025-07-09T14:57:03',
          assigneA: null,
          reponses: []
        },
        {
          id: 5,
          reference: 'REC-2025-005',
          client: {
            nom: 'dounia',
            prenom: 'dounia',
            email: 'dounia.dounia.7@example.com',
            telephone: '0655825978',
            codeClient: 'CLI-2025-00007'
          },
          sujet: 'Service client non satisfaisant',
          categorie: 'Service client',
          priorite: 'moyenne',
          statut: 'En cours',
          description: 'Le service client n\'a pas répondu à mes attentes lors de ma dernière interaction.',
          dateCreation: '2025-07-18T16:10:50',
          dateModification: '2025-07-18T16:10:50',
          assigneA: 'Admin User',
          reponses: []
        }
      ];
      setReclamations(mockReclamations);
    } catch (error) {
      console.error('Erreur lors du chargement des réclamations:', error);
    }
  };

  const calculerStats = () => {
    const stats = {
      total: reclamations.length,
      nouveau: reclamations.filter(r => r.statut === 'Nouveau').length,
      enCours: reclamations.filter(r => r.statut === 'En cours').length,
      resolu: reclamations.filter(r => r.statut === 'Résolu').length
    };
    setStats(stats);
  };

  const handleFiltreChange = (e) => {
    const { name, value } = e.target;
    setFiltres(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filtrerReclamations = () => {
    return reclamations.filter(reclamation => {
      const matchStatut = !filtres.statut || reclamation.statut === filtres.statut;
      const matchPriorite = !filtres.priorite || reclamation.priorite === filtres.priorite;
      const matchCategorie = !filtres.categorie || reclamation.categorie === filtres.categorie;
      const matchRecherche = !filtres.recherche || 
        reclamation.sujet.toLowerCase().includes(filtres.recherche.toLowerCase()) ||
        reclamation.reference.toLowerCase().includes(filtres.recherche.toLowerCase()) ||
        `${reclamation.client.prenom} ${reclamation.client.nom}`.toLowerCase().includes(filtres.recherche.toLowerCase());
      
      return matchStatut && matchPriorite && matchCategorie && matchRecherche;
    });
  };

  const changerStatut = async (id, nouveauStatut) => {
    try {
      setReclamations(prev => prev.map(r => 
        r.id === id 
          ? { ...r, statut: nouveauStatut, dateModification: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const assignerReclamation = async (id, assigneA) => {
    try {
      setReclamations(prev => prev.map(r => 
        r.id === id 
          ? { ...r, assigneA, dateModification: new Date().toISOString() }
          : r
      ));
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
    }
  };

  const ajouterReponse = async () => {
    if (!reponse.trim() || !selectedReclamation) return;

    setLoading(true);
    try {
      const nouvelleReponse = {
        id: Date.now(),
        auteur: 'Admin User',
        message: reponse,
        date: new Date().toISOString()
      };

      setReclamations(prev => prev.map(r => 
        r.id === selectedReclamation.id
          ? { 
              ...r, 
              reponses: [...r.reponses, nouvelleReponse],
              statut: r.statut === 'Nouveau' ? 'En cours' : r.statut,
              dateModification: new Date().toISOString()
            }
          : r
      ));

      setReponse('');
      setShowModal(false);
      setSelectedReclamation(null);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réponse:', error);
    } finally {
      setLoading(false);
    }
  };

  const ouvrirModal = (reclamation) => {
    setSelectedReclamation(reclamation);
    setShowModal(true);
  };

  const getStatutClass = (statut) => {
    switch (statut) {
      case 'Nouveau': return 'statut-nouveau';
      case 'En cours': return 'statut-en-cours';
      case 'Résolu': return 'statut-resolu';
      case 'Fermé': return 'statut-ferme';
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

  const reclamationsFiltrees = filtrerReclamations();

  return (
    <div className="reclamation-admin-container">
      {/* En-tête amélioré */}
      <div className="admin-header">
        <h1 className="page-title">
          <i className="fas fa-clipboard-list"></i>
          Gestion des Réclamations
        </h1>
        <div className="header-actions">
          <button className="btn-action btn-primary">
            <i className="fas fa-download"></i>
            Exporter
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Réclamations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.nouveau}</h3>
            <p>Nouvelles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-spinner"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.enCours}</h3>
            <p>En Cours</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.resolu}</h3>
            <p>Résolues</p>
          </div>
        </div>
      </div>

      {/* Filtres améliorés */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              name="recherche"
              placeholder="Rechercher par référence, client ou sujet..."
              value={filtres.recherche}
              onChange={handleFiltreChange}
            />
          </div>
          <select
            name="statut"
            value={filtres.statut}
            onChange={handleFiltreChange}
            className="filter-select"
          >
            <option value="">Tous les statuts</option>
            {statuts.map(statut => (
              <option key={statut} value={statut}>{statut}</option>
            ))}
          </select>
          <select
            name="priorite"
            value={filtres.priorite}
            onChange={handleFiltreChange}
            className="filter-select"
          >
            <option value="">Toutes les priorités</option>
            {priorites.map(priorite => (
              <option key={priorite} value={priorite}>
                {priorite.charAt(0).toUpperCase() + priorite.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table des réclamations */}
      <div className="table-container">
        <table className="reclamations-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Client</th>
              <th>Sujet</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtrerReclamations().map(reclamation => (
              <tr key={reclamation.id}>
                <td>
                  <span className="reference">{reclamation.reference}</span>
                </td>
                <td>
                  <div className="client-info">
                    <strong>{reclamation.client.prenom} {reclamation.client.nom}</strong>
                    <small>{reclamation.client.email}</small>
                  </div>
                </td>
                <td>
                  <span className="sujet">{reclamation.sujet}</span>
                </td>
                <td>
                  <span className={`statut ${getStatutClass(reclamation.statut)}`}>
                    {reclamation.statut}
                  </span>
                </td>
                <td>
                  <span className={`priority-badge ${getPrioriteClass(reclamation.priorite)}`}>
                    {reclamation.priorite}
                  </span>
                </td>
                <td>
                  {new Date(reclamation.dateCreation).toLocaleDateString('fr-FR')}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-action btn-primary"
                      onClick={() => {
                        setSelectedReclamation(reclamation);
                        setShowModal(true);
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      Voir
                    </button>
                    <select
                      value={reclamation.statut}
                      onChange={(e) => changerStatut(reclamation.id, e.target.value)}
                      className="status-select"
                    >
                      {statuts.map(statut => (
                        <option key={statut} value={statut}>{statut}</option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal détails */}
      {showModal && selectedReclamation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Détails de la réclamation</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="reclamation-details">
                <div className="details-header">
                  <div className="reference-large">{selectedReclamation.reference}</div>
                  <div className={`statut-large ${getStatutClass(selectedReclamation.statut)}`}>
                    {selectedReclamation.statut}
                  </div>
                </div>
                
                <div className="details-grid">
                  <div className="detail-section">
                    <h3><i className="fas fa-user"></i> Informations client</h3>
                    <div className="detail-content">
                      <p><strong>Nom:</strong> {selectedReclamation.client.prenom} {selectedReclamation.client.nom}</p>
                      <p><strong>Email:</strong> {selectedReclamation.client.email}</p>
                      <p><strong>Téléphone:</strong> {selectedReclamation.client.telephone}</p>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h3><i className="fas fa-info-circle"></i> Détails de la réclamation</h3>
                    <div className="detail-content">
                      <p><strong>Sujet:</strong> {selectedReclamation.sujet}</p>
                      <p><strong>Catégorie:</strong> {selectedReclamation.categorie}</p>
                      <p><strong>Priorité:</strong> 
                        <span className={`priorite-badge ${getPrioriteClass(selectedReclamation.priorite)}`}>
                          {selectedReclamation.priorite}
                        </span>
                      </p>
                      <p><strong>Date création:</strong> {new Date(selectedReclamation.dateCreation).toLocaleString('fr-FR')}</p>
                      <p><strong>Assigné à:</strong> {selectedReclamation.assigneA || 'Non assigné'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="description-section">
                  <h3><i className="fas fa-align-left"></i> Description</h3>
                  <div className="description-content">
                    {selectedReclamation.description}
                  </div>
                </div>
                
                <div className="reponses-section">
                  <h3><i className="fas fa-comments"></i> Historique des réponses</h3>
                  <div className="reponses-list">
                    {selectedReclamation.reponses.length === 0 ? (
                      <p className="no-reponses">Aucune réponse pour le moment</p>
                    ) : (
                      selectedReclamation.reponses.map(reponse => (
                        <div key={reponse.id} className="reponse-item">
                          <div className="reponse-header">
                            <strong>{reponse.auteur}</strong>
                            <span className="reponse-date">
                              {new Date(reponse.date).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="reponse-message">{reponse.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="nouvelle-reponse-section">
                  <h3><i className="fas fa-reply"></i> Ajouter une réponse</h3>
                  <textarea
                    value={reponse}
                    onChange={(e) => setReponse(e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Fermer
              </button>
              <button 
                className="btn-submit"
                onClick={ajouterReponse}
                disabled={!reponse.trim() || loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Envoyer réponse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReclamationAdmin;