import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, ChevronDown, Download, Filter, RefreshCw, Users, FileText, ShoppingCart, TrendingUp, DollarSign, Clock } from "lucide-react";
import axios from "axios";
import "./CommercialStatistiques.css";

const CommercialStatistiques = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    clientsTotal: 0,
    clientsNouveaux: 0,
    devisTotal: 0,
    devisAcceptes: 0,
    commandesTotal: 0,
    chiffreAffaires: 0,
    tauxConversion: 0,
    evolutionMensuelle: []
  });
  const [period, setPeriod] = useState("mois");
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

  // Données simulées pour les graphiques
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
    { id: 1, nom: 'Clinique Saint-Joseph', commandes: 12, montant: 36000 },
    { id: 2, nom: 'Laboratoire BioTech', commandes: 8, montant: 24000 },
    { id: 3, nom: 'Centre Hospitalier Régional', commandes: 6, montant: 18000 },
    { id: 4, nom: 'Pharmacie Centrale', commandes: 5, montant: 15000 },
    { id: 5, nom: 'Cabinet Médical Dupont', commandes: 4, montant: 12000 }
  ]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      navigate('/login');
      return;
    }
    
    // Vérifier si l'utilisateur est un commercial
    if (user.role !== 'COMMERCIAL') {
      navigate('/login');
      return;
    }
    
    setUserData(user);
    fetchStatistiques();
  }, [navigate, period]);

  const fetchStatistiques = async () => {
    setLoading(true);
    try {
      // Dans une application réelle, ceci serait un appel API
      // const token = localStorage.getItem('token');
      // const response = await axios.get(`http://localhost:8080/api/statistiques/commercial?period=${period}`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // setStats(response.data);
      
      // Simulation de données pour la démo
      setTimeout(() => {
        setStats({
          clientsTotal: 45,
          clientsNouveaux: period === "mois" ? 3 : period === "trimestre" ? 8 : 15,
          devisTotal: period === "mois" ? 22 : period === "trimestre" ? 65 : 120,
          devisAcceptes: period === "mois" ? 15 : period === "trimestre" ? 45 : 82,
          commandesTotal: period === "mois" ? 12 : period === "trimestre" ? 35 : 65,
          chiffreAffaires: period === "mois" ? 36000 : period === "trimestre" ? 105000 : 195000,
          tauxConversion: period === "mois" ? 68 : period === "trimestre" ? 70 : 65,
          evolutionMensuelle: evolutionVentes
        });
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError("Impossible de charger les statistiques");
      setLoading(false);
    }
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
                  <span className="neutral">{stats.devisAcceptes} acceptés</span>
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
                  <span className="neutral">En cours de traitement</span>
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
                  <span className="positive">+12% vs période précédente</span>
                </p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon conversion">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3>Taux de conversion</h3>
                <p className="stat-value">{stats.tauxConversion}%</p>
                <p className="stat-detail">
                  <span className="positive">+5% vs période précédente</span>
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
                    <Tooltip />
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
                    <Tooltip />
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="table-section">
            <div className="table-header">
              <h3>Top 5 Clients</h3>
              <button className="view-all-btn" onClick={() => navigate('/commercial/dashboard/clients')}>
                Voir tous les clients
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Commandes</th>
                    <th>Montant total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map(client => (
                    <tr key={client.id}>
                      <td>{client.nom}</td>
                      <td>{client.commandes}</td>
                      <td>{formatMontant(client.montant)}</td>
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

          <div className="activity-section">
            <div className="activity-header">
              <h3>Activités récentes</h3>
            </div>
            <div className="activity-list">
              {[
                { icon: FileText, color: '#4CAF50', text: 'Devis #D-2023-089 accepté par Clinique Saint-Joseph', time: 'Il y a 2 heures' },
                { icon: Users, color: '#2196F3', text: 'Nouveau client ajouté: Cabinet Médical Dupont', time: 'Il y a 1 jour' },
                { icon: ShoppingCart, color: '#FF9800', text: 'Nouvelle commande #C-2023-045 de Laboratoire BioTech', time: 'Il y a 2 jours' },
                { icon: Clock, color: '#F44336', text: 'Rappel: Suivi devis #D-2023-076 pour Centre Hospitalier Régional', time: 'Il y a 3 jours' }
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