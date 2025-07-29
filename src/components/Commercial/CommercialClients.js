import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, UserPlus, Mail, Phone, MapPin, Building, FileText, 
  Edit, Trash2, MessageSquare, Calendar, DollarSign, User,
  Filter, Package, BarChart2, TrendingUp, Clipboard, ShoppingCart, 
  Percent, Activity, RefreshCw, AlertCircle, Star, Clock, Award, ShoppingBag
} from 'lucide-react';

const CommercialClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    topClient: null
  });
  const [behaviorStats, setBehaviorStats] = useState(null);
  const [timePeriod, setTimePeriod] = useState('lastMonth');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [timePeriod]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        navigate('/login');
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError("Informations utilisateur non disponibles");
        setLoading(false);
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:8080/api/clients/commercial/${user.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setClients(response.data);
        setError('');
        calculateBehaviorPatterns(response.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des clients:', err);
      setError("Impossible de charger la liste des clients.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await axios.get(`http://localhost:8080/api/client-stats/commercial/${user.id}?period=${timePeriod}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setStats(response.data);
      }

      // Simuler l'activité récente (à remplacer par un appel API réel)
      const mockActivity = [
        { id: 1, clientName: "Jean Dupont", type: "Devis", date: "2023-11-15T14:30:00", amount: 4200 },
        { id: 2, clientName: "Marie Martin", type: "Commande", date: "2023-11-14T10:15:00", amount: 8900 },
        { id: 3, clientName: "Pierre Lambert", type: "Appel", date: "2023-11-13T16:45:00" },
        { id: 4, clientName: "Sophie Bernard", type: "Commande", date: "2023-11-12T09:30:00", amount: 3500 },
        { id: 5, clientName: "Thomas Leroy", type: "Email", date: "2023-11-11T11:20:00" }
      ];
      setRecentActivity(mockActivity);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
    }
  };

  // Analyse des comportements d'achat
  const calculateBehaviorPatterns = (clientsData) => {
    const patterns = {
      frequentBuyers: 0,
      bigSpenders: 0,
      inactiveClients: 0,
      proposalMakers: 0,
      loyalClients: 0,
      newClients: 0
    };

    clientsData.forEach(client => {
      // Clients avec + de 5 commandes
      if (client.totalOrders > 5) patterns.frequentBuyers++;
      
      // Clients avec + de 10 000 MAD dépensés
      if (client.totalSpent > 10000) patterns.bigSpenders++;
      
      // Clients inactifs depuis + de 6 mois
      if (client.status === 'INACTIF') patterns.inactiveClients++;
      
      // Clients avec plus de devis que de commandes
      if (client.totalProposals > client.totalOrders) patterns.proposalMakers++;
      
      // Clients fidèles (depuis plus d'un an)
      if (client.registrationDate && new Date(client.registrationDate) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
        patterns.loyalClients++;
      }
      
      // Nouveaux clients (moins de 3 mois)
      if (client.registrationDate && new Date(client.registrationDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) {
        patterns.newClients++;
      }
    });

    setBehaviorStats(patterns);
  };

  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  // Tri des clients
  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case 'orders':
        return b.totalOrders - a.totalOrders;
      case 'spent':
        return b.totalSpent - a.totalSpent;
      case 'engagement':
        // Score d'engagement = commandes + devis + montant dépensé
        const scoreA = (a.totalOrders || 0) + (a.totalProposals || 0) + (a.totalSpent || 0);
        const scoreB = (b.totalOrders || 0) + (b.totalProposals || 0) + (b.totalSpent || 0);
        return scoreB - scoreA;
      case 'recent':
        return new Date(b.lastOrderDate || b.createdAt) - new Date(a.lastOrderDate || a.createdAt);
      default:
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    }
  });

  // Filtrage
  const filteredClients = sortedClients.filter(client => {
    const matchesSearch = 
      client.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'TOUS' || client.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Catégorisation des clients par comportement
  const getClientBehavior = (client) => {
    if (!client.totalOrders && client.totalProposals > 0) 
      return 'Intéressé (devis seulement)';
    
    if (client.totalOrders > 5 && client.totalSpent > 10000) 
      return 'Client Premium';
    
    if (client.status === 'INACTIF' && client.totalOrders > 0)
      return 'Client dormant';
    
    if (client.totalOrders > 0 && client.totalOrders <= 3)
      return 'Nouveau client';
    
    if (client.totalProposals > client.totalOrders * 2)
      return 'Comparateur fréquent';
    
    if (client.registrationDate && new Date(client.registrationDate) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
      return 'Client fidèle';
    
    return 'Client régulier';
  };

  // Calcul du statut de valeur client
  const getClientValueStatus = (client) => {
    if (!client.totalSpent) return 'faible';
    if (client.totalSpent < 5000) return 'moyen';
    if (client.totalSpent < 20000) return 'élevé';
    return 'très élevé';
  };

  return (
    <div className="commercial-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Tableau de Bord Commercial</h1>
        <div className="period-selector">
          <select value={timePeriod} onChange={(e) => setTimePeriod(e.target.value)}>
            <option value="lastWeek">Cette semaine</option>
            <option value="lastMonth">Ce mois</option>
            <option value="lastQuarter">Ce trimestre</option>
            <option value="lastYear">Cette année</option>
          </select>
          <button onClick={() => { fetchClients(); fetchStats(); }} className="refresh-btn">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="overview-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Chiffre d'Affaires</h3>
            <p>{stats.totalRevenue?.toFixed(2) || '0.00'} MAD</p>
            <small>+12% vs période précédente</small>
          </div>
        </div>
        
        <div className="stat-card orders">
          <div className="stat-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <h3>Commandes</h3>
            <p>{stats.totalOrders || '0'}</p>
            <small>+8% vs période précédente</small>
          </div>
        </div>
        
        <div className="stat-card clients">
          <div className="stat-icon">
            <User size={24} />
          </div>
          <div className="stat-info">
            <h3>Clients Actifs</h3>
            <p>{stats.activeClients || '0'}/{stats.totalClients || '0'}</p>
            <small>Taux d'engagement: {stats.activeClients && stats.totalClients ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0}%</small>
          </div>
        </div>
        
        <div className="stat-card conversion">
          <div className="stat-icon">
            <Percent size={24} />
          </div>
          <div className="stat-info">
            <h3>Taux de Conversion</h3>
            <p>{stats.conversionRate?.toFixed(1) || '0.0'}%</p>
            <small>Moyenne secteur: 15%</small>
          </div>
        </div>
      </div>

      {/* Comportements d'achat */}
      <div className="section">
        <h2>Comportements Clients</h2>
        <div className="behavior-stats">
          <div className="behavior-card">
            <Award size={24} />
            <span>Clients Premium</span>
            <strong>{behaviorStats?.bigSpenders || 0}</strong>
          </div>
          <div className="behavior-card">
            <Activity size={24} />
            <span>Acheteurs fréquents</span>
            <strong>{behaviorStats?.frequentBuyers || 0}</strong>
          </div>
          <div className="behavior-card">
            <Clipboard size={24} />
            <span>Créateurs de devis</span>
            <strong>{behaviorStats?.proposalMakers || 0}</strong>
          </div>
          <div className="behavior-card">
            <Clock size={24} />
            <span>Clients dormants</span>
            <strong>{behaviorStats?.inactiveClients || 0}</strong>
          </div>
          <div className="behavior-card">
            <Star size={24} />
            <span>Clients fidèles</span>
            <strong>{behaviorStats?.loyalClients || 0}</strong>
          </div>
          <div className="behavior-card">
            <UserPlus size={24} />
            <span>Nouveaux clients</span>
            <strong>{behaviorStats?.newClients || 0}</strong>
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="section">
        <h2>Activité Récente</h2>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'Commande' && <ShoppingCart size={16} />}
                {activity.type === 'Devis' && <FileText size={16} />}
                {activity.type === 'Appel' && <Phone size={16} />}
                {activity.type === 'Email' && <Mail size={16} />}
              </div>
              <div className="activity-details">
                <div className="activity-client">{activity.clientName}</div>
                <div className="activity-type">{activity.type}</div>
                <div className="activity-date">
                  {new Date(activity.date).toLocaleDateString()} - 
                  {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              {activity.amount && (
                <div className="activity-amount">
                  {activity.amount.toFixed(2)} MAD
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gestion des clients */}
      <div className="section">
        <div className="section-header">
          <h2>Mes Clients</h2>
          <div className="client-controls">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <Filter size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="TOUS">Tous</option>
                <option value="ACTIF">Actifs</option>
                <option value="INACTIF">Inactifs</option>
              </select>
            </div>
            <div className="sort-box">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="name">Nom</option>
                <option value="orders">Commandes</option>
                <option value="spent">Montant dépensé</option>
                <option value="engagement">Engagement</option>
                <option value="recent">Récence</option>
              </select>
            </div>
            <button className="btn primary">
              <UserPlus size={16} /> Nouveau client
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">Chargement des clients...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredClients.length === 0 ? (
          <div className="no-results">
            <p>Aucun client trouvé avec les critères de recherche</p>
          </div>
        ) : (
          <div className="clients-grid">
            {filteredClients.map(client => (
              <div key={client.id} className="client-card" onClick={() => handleViewClient(client)}>
                <div className="client-header">
                  <div className="client-avatar">
                    {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                  </div>
                  <div className="client-meta">
                    <div className={`client-value ${getClientValueStatus(client)}`}>
                      Valeur: {getClientValueStatus(client)}
                    </div>
                    <div className={`client-status ${client.status?.toLowerCase()}`}>
                      {client.status}
                    </div>
                  </div>
                </div>
                
                <div className="client-info">
                  <h3>{client.firstName} {client.lastName}</h3>
                  <div className="client-behavior">
                    {getClientBehavior(client)}
                  </div>
                  <div className="client-details">
                    <p><Mail size={16} /> {client.email}</p>
                    <p><Phone size={16} /> {client.phone || 'Non renseigné'}</p>
                    <p><Building size={16} /> {client.companyName || 'Particulier'}</p>
                  </div>
                </div>
                
                <div className="client-stats">
                  <div className="stat-item">
                    <Package size={16} />
                    <span>{client.totalOrders || 0}</span>
                    <small>Commandes</small>
                  </div>
                  <div className="stat-item">
                    <FileText size={16} />
                    <span>{client.totalProposals || 0}</span>
                    <small>Devis</small>
                  </div>
                  <div className="stat-item">
                    <DollarSign size={16} />
                    <span>{client.totalSpent?.toFixed(2) || '0.00'}</span>
                    <small>MAD dépensés</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Détails du client */}
      {showClientDetails && selectedClient && (
        <div className="client-details-modal">
          <div className="modal-overlay" onClick={() => setShowClientDetails(false)}></div>
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowClientDetails(false)}>×</button>
            
            <div className="client-profile">
              <div className="profile-avatar">
                {selectedClient.firstName?.charAt(0)}{selectedClient.lastName?.charAt(0)}
              </div>
              <div className="profile-info">
                <h2>{selectedClient.firstName} {selectedClient.lastName}</h2>
                <p className="client-behavior">{getClientBehavior(selectedClient)}</p>
                <div className="profile-meta">
                  <span className={`client-value ${getClientValueStatus(selectedClient)}`}>
                    Valeur client: {getClientValueStatus(selectedClient)}
                  </span>
                  <span className={`client-status ${selectedClient.status?.toLowerCase()}`}>
                    {selectedClient.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="client-details-grid">
              <div className="detail-group">
                <h3>Informations Personnelles</h3>
                <div className="detail-item">
                  <User size={16} />
                  <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                </div>
                <div className="detail-item">
                  <Mail size={16} />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="detail-item">
                  <Phone size={16} />
                  <span>{selectedClient.phone || 'Non renseigné'}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{selectedClient.address || 'Adresse non renseignée'}</span>
                </div>
                <div className="detail-item">
                  <Building size={16} />
                  <span>{selectedClient.companyName || 'Particulier'}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>Inscrit le: {new Date(selectedClient.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="detail-group">
                <h3>Statistiques Commerciales</h3>
                <div className="stat-row">
                  <div className="stat-item">
                    <Package size={16} />
                    <div>
                      <strong>{selectedClient.totalOrders || 0}</strong>
                      <small>Commandes</small>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FileText size={16} />
                    <div>
                      <strong>{selectedClient.totalProposals || 0}</strong>
                      <small>Devis</small>
                    </div>
                  </div>
                </div>
                
                <div className="stat-row">
                  <div className="stat-item">
                    <DollarSign size={16} />
                    <div>
                      <strong>{selectedClient.totalSpent?.toFixed(2) || '0.00'}</strong>
                      <small>MAD dépensés</small>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Percent size={16} />
                    <div>
                      <strong>{(selectedClient.totalOrders && selectedClient.totalProposals) 
                        ? Math.round((selectedClient.totalOrders / selectedClient.totalProposals) * 100) 
                        : 0}%</strong>
                      <small>Taux de conversion</small>
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>Dernière commande: {
                    selectedClient.lastOrderDate 
                      ? new Date(selectedClient.lastOrderDate).toLocaleDateString() 
                      : 'Aucune'
                  }</span>
                </div>
              </div>
            </div>
            
            <div className="behavior-analysis">
              <h3>Analyse Comportementale</h3>
              <p>
                Ce client a un profil <strong>{getClientBehavior(selectedClient).toLowerCase()}</strong>. 
                {selectedClient.totalProposals > selectedClient.totalOrders && (
                  ` Il a créé ${selectedClient.totalProposals - selectedClient.totalOrders} devis supplémentaires sans commande.`
                )}
                {selectedClient.status === 'INACTIF' && selectedClient.totalOrders > 0 && (
                  ` Inactif depuis ${Math.floor((new Date() - new Date(selectedClient.lastOrderDate)) / (1000 * 60 * 60 * 24 * 30))} mois.`
                )}
                {selectedClient.totalOrders > 5 && (
                  ` Fidèle avec ${selectedClient.totalOrders} commandes.`
                )}
                {selectedClient.registrationDate && new Date(selectedClient.registrationDate) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) && (
                  ` Client depuis plus d'un an.`
                )}
              </p>
              
              <div className="recommendations">
                <h4>Recommandations:</h4>
                {getClientBehavior(selectedClient) === 'Client dormant' && (
                  <p>📧 Envoyer une offre spéciale pour le relancer</p>
                )}
                {getClientBehavior(selectedClient) === 'Comparateur fréquent' && (
                  <p>📞 Contacter pour comprendre ses besoins spécifiques</p>
                )}
                {getClientBehavior(selectedClient) === 'Intéressé (devis seulement)' && (
                  <p>💡 Proposer un rendez-vous pour présenter les avantages</p>
                )}
                {getClientBehavior(selectedClient) === 'Client Premium' && (
                  <p>🎁 Offrir un cadeau fidélité pour le remercier</p>
                )}
                {getClientBehavior(selectedClient) === 'Client fidèle' && (
                  <p>🌟 Proposer un programme de fidélité exclusif</p>
                )}
              </div>
            </div>
            
            <div className="action-buttons">
              <button className="btn outline">
                <Edit size={16} /> Modifier
              </button>
              <button className="btn outline">
                <MessageSquare size={16} /> Envoyer message
              </button>
              <button className="btn outline">
                <FileText size={16} /> Créer devis
              </button>
              <button className="btn primary">
                <ShoppingCart size={16} /> Nouvelle commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommercialClients;