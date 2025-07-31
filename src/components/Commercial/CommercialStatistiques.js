import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, ChevronDown, Download, Filter, RefreshCw, Users, 
  FileText, ShoppingCart, TrendingUp, DollarSign, Clock, 
  Star, Activity, Package, BarChart2, Frown, Smile
} from "lucide-react";
import "./CommercialStatistiques.css";

const CommercialStatistiques = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("mois");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Données de base pour les périodes - basées sur vos clients réels
  const dataByPeriod = {
    mois: {
      clientsTotal: 5,
      clientsNouveaux: 2,
      devisTotal: 8,
      devisAcceptes: 5,
      commandesTotal: 4,
      chiffreAffaires: 15000,
      tauxConversion: 62,
      clientsInactifs: 1,
      panierMoyen: 3750,
      objectifCA: 20000,
      progressionObjectif: 75,
      satisfactionClient: 4.1,
      frequenceAchat: 0.8,
    },
    trimestre: {
      clientsTotal: 5,
      clientsNouveaux: 3,
      devisTotal: 18,
      devisAcceptes: 12,
      commandesTotal: 9,
      chiffreAffaires: 42000,
      tauxConversion: 67,
      clientsInactifs: 1,
      panierMoyen: 4667,
      objectifCA: 60000,
      progressionObjectif: 70,
      satisfactionClient: 4.2,
      frequenceAchat: 1.8,
    },
    annee: {
      clientsTotal: 5,
      clientsNouveaux: 5,
      devisTotal: 45,
      devisAcceptes: 28,
      commandesTotal: 22,
      chiffreAffaires: 98000,
      tauxConversion: 62,
      clientsInactifs: 1,
      panierMoyen: 4455,
      objectifCA: 150000,
      progressionObjectif: 65,
      satisfactionClient: 4.3,
      frequenceAchat: 4.4,
    }
  };

  const [stats, setStats] = useState(dataByPeriod[period]);

  // Données pour les graphiques
  const [devisParStatut, setDevisParStatut] = useState([
    { name: 'En attente', value: 12, color: '#FFB74D' },
    { name: 'Acceptés', value: 18, color: '#4CAF50' },
    { name: 'Refusés', value: 5, color: '#F44336' },
    { name: 'En négociation', value: 8, color: '#2196F3' }
  ]);

  const [evolutionVentes, setEvolutionVentes] = useState([
    { mois: 'Jan', devis: 10, commandes: 5, chiffreAffaires: 15000 },
    { mois: 'Fév', devis: 15, commandes: 8, chiffreAffaires: 24000 },
    { mois: 'Mar', devis: 12, commandes: 6, chiffreAffaires: 18000 },
    { mois: 'Avr', devis: 18, commandes: 10, chiffreAffaires: 30000 },
    { mois: 'Mai', devis: 20, commandes: 12, chiffreAffaires: 36000 },
    { mois: 'Juin', devis: 22, commandes: 15, chiffreAffaires: 45000 }
  ]);

  const [clientsParSecteur, setClientsParSecteur] = useState([
    { name: 'Médical', value: 35, color: '#3F51B5' },
    { name: 'Pharmaceutique', value: 25, color: '#009688' },
    { name: 'Laboratoire', value: 20, color: '#9C27B0' },
    { name: 'Clinique', value: 15, color: '#FF5722' },
    { name: 'Autre', value: 5, color: '#607D8B' }
  ]);

  const [topClients, setTopClients] = useState([
    { id: 1, nom: 'Clinique Saint-Joseph', commandes: 12, montant: 36000, derniereActivite: '2023-06-15', status: 'actif' },
    { id: 2, nom: 'Laboratoire BioTech', commandes: 8, montant: 24000, derniereActivite: '2023-06-18', status: 'actif' },
    { id: 3, nom: 'Centre Hospitalier Régional', commandes: 6, montant: 18000, derniereActivite: '2023-05-20', status: 'moyen' },
    { id: 4, nom: 'Pharmacie Centrale', commandes: 5, montant: 15000, derniereActivite: '2023-04-12', status: 'inactif' },
    { id: 5, nom: 'Cabinet Médical Dupont', commandes: 4, montant: 12000, derniereActivite: '2023-03-05', status: 'inactif' }
  ]);

  const [topProduits, setTopProduits] = useState([
    { id: 101, nom: 'Microscope Électronique', quantite: 18, montant: 54000, categorie: 'Équipement' },
    { id: 102, nom: 'Analyseur Biochimique', quantite: 12, montant: 36000, categorie: 'Équipement' },
    { id: 103, nom: 'Centrifugeuse Haute Vitesse', quantite: 9, montant: 27000, categorie: 'Équipement' },
    { id: 104, nom: 'Pipettes Automatiques', quantite: 24, montant: 7200, categorie: 'Consommables' },
    { id: 105, nom: 'Gants Stériles (100 paire)', quantite: 45, montant: 4500, categorie: 'Consommables' }
  ]);

  const [clientsInactifs, setClientsInactifs] = useState([
    { id: 6, nom: 'Hôpital Général', derniereCommande: '2023-01-10', joursInactifs: 160 },
    { id: 7, nom: 'Laboratoire Genetix', derniereCommande: '2023-02-15', joursInactifs: 130 },
    { id: 8, nom: 'Clinique Privée Bellecour', derniereCommande: '2022-12-05', joursInactifs: 200 }
  ]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'COMMERCIAL') {
      navigate('/login');
      return;
    }
    
    setUserData(user);
    fetchStatistiques();
  }, [navigate, period]);

  const fetchStatistiques = () => {
    setLoading(true);
    
    // Simulation de chargement avec des données locales
    setTimeout(() => {
      setStats(dataByPeriod[period]);
      
      // Ajuster les données en fonction de la période
      const multiplier = period === "mois" ? 1 : period === "trimestre" ? 3 : 12;
      
      setDevisParStatut([
        { name: 'En attente', value: 12 * multiplier, color: '#FFB74D' },
        { name: 'Acceptés', value: 18 * multiplier, color: '#4CAF50' },
        { name: 'Refusés', value: 5 * multiplier, color: '#F44336' },
        { name: 'En négociation', value: 8 * multiplier, color: '#2196F3' }
      ]);
      
      setTopClients(topClients.map(client => ({
        ...client,
        commandes: client.commandes * multiplier,
        montant: client.montant * multiplier
      })));
      
      setTopProduits(topProduits.map(produit => ({
        ...produit,
        quantite: produit.quantite * multiplier,
        montant: produit.montant * multiplier
      })));
      
      setLoading(false);
    }, 800);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setShowPeriodDropdown(false);
  };

  const handleClientClick = (clientId) => {
    navigate(`/commercial/dashboard/clients?id=${clientId}`);
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'actif': return '#4CAF50';
      case 'moyen': return '#FFC107';
      case 'inactif': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderStatusIndicator = (status) => (
    <div className="status-indicator" style={{ backgroundColor: getStatusColor(status) }} />
  );

  return (
    <div className="statistiques-container">
      <div className="stats-header">
        <h2>Tableau de Bord Commercial</h2>
        <div className="stats-actions">
          <div className="period-selector">
            <button 
              className="period-button" 
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
            >
              <Calendar size={16} />
              <span>
                {period === "mois" ? "Ce mois" : 
                 period === "trimestre" ? "Ce trimestre" : "Cette année"}
              </span>
              <ChevronDown size={16} />
            </button>
            {showPeriodDropdown && (
              <div className="period-dropdown">
                <div className="period-option" onClick={() => handlePeriodChange("mois")}>Ce mois</div>
                <div className="period-option" onClick={() => handlePeriodChange("trimestre")}>Ce trimestre</div>
                <div className="period-option" onClick={() => handlePeriodChange("annee")}>Cette année</div>
              </div>
            )}
          </div>
          <button className="refresh-button" onClick={fetchStatistiques}>
            <RefreshCw size={16} />
            <span>Actualiser</span>
          </button>
          <button className="export-button">
            <Download size={16} />
            <span>Exporter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Chargement des statistiques...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchStatistiques}>Réessayer</button>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon clients">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <h3>Clients</h3>
                <p className="stat-value">{stats.clientsTotal}</p>
                <p className="stat-detail">
                  <span className="positive">+{stats.clientsNouveaux} nouveaux</span>
                  <span className="neutral"> • {stats.clientsInactifs} inactifs</span>
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon devis">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <h3>Devis</h3>
                <p className="stat-value">{stats.devisTotal}</p>
                <p className="stat-detail">
                  <span className="positive">{stats.devisAcceptes} acceptés</span>
                  <span className="neutral"> • {stats.devisTotal - stats.devisAcceptes} en attente</span>
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon commandes">
                <ShoppingCart size={24} />
              </div>
              <div className="stat-content">
                <h3>Commandes</h3>
                <p className="stat-value">{stats.commandesTotal}</p>
                <p className="stat-detail">
                  <span className="neutral">Panier moyen: {formatMontant(stats.panierMoyen)}</span>
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ca">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <h3>Chiffre d'affaires</h3>
                <p className="stat-value">{formatMontant(stats.chiffreAffaires)}</p>
                <p className="stat-detail">
                  <span className="positive">Objectif: {formatMontant(stats.objectifCA)}</span>
                  <span className="neutral"> • Progression: {stats.progressionObjectif}%</span>
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon conversion">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3>Performance</h3>
                <p className="stat-value">{stats.tauxConversion}%</p>
                <p className="stat-detail">
                  <span className="neutral">Satisfaction: {stats.satisfactionClient}/5</span>
                  <span className="neutral"> • Fréquence: {stats.frequenceAchat}/mois</span>
                </p>
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Évolution des ventes</h3>
                <div className="chart-actions">
                  <button className="chart-action-btn">
                    <Filter size={14} />
                  </button>
                </div>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={evolutionVentes}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value) => new Intl.NumberFormat('fr').format(value)} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="devis" name="Devis" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line yAxisId="left" type="monotone" dataKey="commandes" name="Commandes" stroke="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="chiffreAffaires" name="CA (€)" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Répartition des devis</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={devisParStatut}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {devisParStatut.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => new Intl.NumberFormat('fr').format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Clients par secteur</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={clientsParSecteur}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {clientsParSecteur.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => new Intl.NumberFormat('fr').format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="tables-section">
            <div className="table-container">
              <div className="table-header">
                <h3>Top 5 Clients</h3>
                <button className="view-all-btn" onClick={() => navigate('/commercial/dashboard/clients')}>
                  Voir tous les clients
                </button>
              </div>
              <div className="table-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Commandes</th>
                      <th>Montant total</th>
                      <th>Activité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map(client => (
                      <tr key={client.id}>
                        <td>
                          <div className="client-info">
                            {renderStatusIndicator(client.status)}
                            {client.nom}
                          </div>
                        </td>
                        <td>{client.commandes}</td>
                        <td>{formatMontant(client.montant)}</td>
                        <td>{client.derniereActivite}</td>
                        <td>
                          <button 
                            className="table-action-btn"
                            onClick={() => handleClientClick(client.id)}
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="table-container">
              <div className="table-header">
                <h3>Top 5 Produits</h3>
                <button className="view-all-btn" onClick={() => navigate('/commercial/dashboard/produits')}>
                  Voir tous les produits
                </button>
              </div>
              <div className="table-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité vendue</th>
                      <th>Montant total</th>
                      <th>Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProduits.map(produit => (
                      <tr key={produit.id}>
                        <td>{produit.nom}</td>
                        <td>{produit.quantite}</td>
                        <td>{formatMontant(produit.montant)}</td>
                        <td>{produit.categorie}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="tables-section">
            <div className="table-container">
              <div className="table-header">
                <h3>Clients Inactifs</h3>
                <button className="view-all-btn" onClick={() => navigate('/commercial/dashboard/clients?filter=inactif')}>
                  Voir tous les inactifs
                </button>
              </div>
              <div className="table-content">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Dernière commande</th>
                      <th>Jours inactifs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientsInactifs.map(client => (
                      <tr key={client.id} className="inactive-row">
                        <td>{client.nom}</td>
                        <td>{client.derniereCommande}</td>
                        <td>
                          <div className="inactive-indicator">
                            <Frown size={16} />
                            <span>{client.joursInactifs} jours</span>
                          </div>
                        </td>
                        <td>
                          <button className="relance-btn">
                            Relancer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="kpi-container">
              <div className="kpi-card">
                <div className="kpi-header">
                  <Activity size={20} />
                  <h3>Engagement Client</h3>
                </div>
                <div className="kpi-content">
                  <div className="kpi-item">
                    <div className="kpi-label">Fréquence d'achat</div>
                    <div className="kpi-value">{stats.frequenceAchat}/mois</div>
                    <div className="kpi-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${Math.min(stats.frequenceAchat * 30, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="kpi-item">
                    <div className="kpi-label">Satisfaction client</div>
                    <div className="kpi-value">{stats.satisfactionClient}/5</div>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          size={16} 
                          key={i} 
                          fill={i < Math.floor(stats.satisfactionClient) ? "#FFC107" : "none"} 
                          strokeWidth={1}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="kpi-item">
                    <div className="kpi-label">Taux de fidélisation</div>
                    <div className="kpi-value">{period === "mois" ? 82 : period === "trimestre" ? 78 : 75}%</div>
                    <div className="kpi-progress">
                      <div 
                        className="progress-bar positive" 
                        style={{ 
                          width: `${period === "mois" ? 82 : period === "trimestre" ? 78 : 75}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="activity-section">
            <div className="activity-header">
              <h3>Activités récentes</h3>
              <button className="view-all-btn">Voir l'historique complet</button>
            </div>
            <div className="activity-list">
              {[
                { icon: FileText, color: '#4CAF50', text: 'Devis #D-2023-089 accepté par Clinique Saint-Joseph', time: 'Il y a 2 heures' },
                { icon: Users, color: '#2196F3', text: 'Nouveau client ajouté: Cabinet Médical Dupont', time: 'Il y a 1 jour' },
                { icon: ShoppingCart, color: '#FF9800', text: 'Nouvelle commande #C-2023-045 de Laboratoire BioTech', time: 'Il y a 2 jours' },
                { icon: Clock, color: '#F44336', text: 'Rappel: Suivi devis #D-2023-076 pour Centre Hospitalier Régional', time: 'Il y a 3 jours' },
                { icon: BarChart2, color: '#9C27B0', text: 'Rapport mensuel généré avec succès', time: 'Il y a 4 jours' }
              ].map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon" style={{ backgroundColor: activity.color }}>
                    <activity.icon size={16} color="#fff" />
                  </div>
                  <div className="activity-content">
                    <p>{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CommercialStatistiques;