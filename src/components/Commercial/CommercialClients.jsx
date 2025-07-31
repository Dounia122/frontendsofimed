import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Mail, Phone, MapPin, Building, FileText, 
  Edit, Trash2, MessageSquare, Calendar, DollarSign, User,
  Filter, Package, BarChart2, TrendingUp, Clipboard, ShoppingCart, 
  Percent, Activity, RefreshCw, AlertCircle, Star, Clock, Award, 
  ShoppingBag, ChevronDown, ChevronUp, Plus, X, Moon, Sun
} from 'lucide-react';
import './CommercialClients.css';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [clientsPerPage] = useState(5);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filterMinOrders, setFilterMinOrders] = useState(0);
  const [filterMinSpent, setFilterMinSpent] = useState(0);
  const [filterTerritory, setFilterTerritory] = useState('TOUS');
  const [filterClientType, setFilterClientType] = useState('TOUS');

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchData = async () => {
      try {
        if (darkMode) {
          document.documentElement.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
        }
        await fetchClients();
        await fetchStats();
      } catch (err) {
        console.error('Erreur de chargement:', err);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [timePeriod, darkMode]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      const mockClients = [
        {
          id: 1,
          firstName: "Mohamed",
          lastName: "El Alami",
          email: "m.elalami@pharmamaroc.ma",
          phone: "+212 5 22 45 67 89",
          companyName: "PharmaMaroc SARL",
          address: "Zone Industrielle Sidi Bernoussi, Casablanca",
          status: "ACTIF",
          registrationDate: "2023-03-15T09:30:00",
          totalOrders: 8,
          totalProposals: 4,
          totalSpent: 12500,
          lastOrderDate: "2024-12-18T14:22:00",
          specialty: "Pharmacie hospitalière",
          clientType: "Premium",
          preferredProducts: ["Équipements de stérilisation", "Dispositifs de perfusion", "Matériel de laboratoire"],
          avgOrderValue: 1562,
          loyaltyScore: 92,
          riskLevel: "Faible",
          nextFollowUp: "2024-12-28T10:00:00",
          salesRepNotes: "Client très fidèle, commandes régulières mensuelles. Intéressé par les nouveaux équipements de diagnostic.",
          paymentTerms: "30 jours",
          creditLimit: 25000,
          territory: "Grand Casablanca"
        },
        {
          id: 2,
          firstName: "Dunia",
          lastName: "Elmoutaoukil",
          email: "d.elmoutaoukil@cliniquemoderne.ma",
          phone: "+212 6 55 82 96 48",
          companyName: "Clinique Moderne",
          address: "Secteur 16, Hay Riad, Rabat",
          status: "ACTIF",
          registrationDate: "2023-08-22T11:15:00",
          totalOrders: 7,
          totalProposals: 3,
          totalSpent: 9800,
          lastOrderDate: "2024-12-15T16:45:00",
          specialty: "Chirurgie générale",
          clientType: "Enterprise",
          preferredProducts: ["Instruments chirurgicaux", "Équipements d'anesthésie", "Matériel de suture"],
          avgOrderValue: 1400,
          loyaltyScore: 88,
          riskLevel: "Faible",
          nextFollowUp: "2025-01-05T14:30:00",
          salesRepNotes: "Clinique en expansion, projets d'agrandissement prévus pour 2025. Opportunité pour équipements lourds.",
          paymentTerms: "45 jours",
          creditLimit: 20000,
          territory: "Rabat-Salé"
        },
        {
          id: 3,
          firstName: "Karim",
          lastName: "Benjelloun",
          email: "k.benjelloun@hopitalalazhar.ma",
          phone: "+212 6 78 45 12 36",
          companyName: "Hôpital Al Azhar",
          address: "Avenue Mohammed VI, Tanger",
          status: "ACTIF",
          registrationDate: "2022-11-10T14:20:00",
          totalOrders: 12,
          totalProposals: 5,
          totalSpent: 20500,
          lastOrderDate: "2024-12-20T11:15:00",
          specialty: "Cardiologie",
          clientType: "VIP",
          preferredProducts: ["Équipements cardiaques", "Moniteurs vitaux", "Matériel d'urgence"],
          avgOrderValue: 1708,
          loyaltyScore: 95,
          riskLevel: "Faible",
          nextFollowUp: "2025-01-10T09:00:00",
          salesRepNotes: "Client stratégique, représente 15% du chiffre d'affaires. Relations excellentes avec le directeur.",
          paymentTerms: "60 jours",
          creditLimit: 30000,
          territory: "Tanger-Tétouan"
        },
        {
          id: 4,
          firstName: "Leila",
          lastName: "Zahidi",
          email: "l.zahidi@polycliniquenour.ma",
          phone: "+212 6 99 88 77 66",
          companyName: "Polyclinique Nour",
          address: "Rue Ibn Sina, Agadir",
          status: "ACTIF",
          registrationDate: "2024-01-15T10:30:00",
          totalOrders: 5,
          totalProposals: 2,
          totalSpent: 4200,
          lastOrderDate: "2024-12-10T13:45:00",
          specialty: "Pédiatrie",
          clientType: "Standard",
          preferredProducts: ["Équipements pédiatriques", "Mobilier médical", "Consommables"],
          avgOrderValue: 840,
          loyaltyScore: 78,
          riskLevel: "Moyen",
          nextFollowUp: "2025-01-03T11:00:00",
          salesRepNotes: "Nouveau client prometteur. Intéressé par les solutions tout-en-un pour cliniques.",
          paymentTerms: "30 jours",
          creditLimit: 10000,
          territory: "Souss-Massa"
        },
        {
          id: 5,
          firstName: "Salma",
          lastName: "Lbat",
          email: "s.lbat@cabinetmedicalatlas.ma",
          phone: "+212 5 66 49 87 57",
          companyName: "Cabinet Médical Atlas",
          address: "Résidence Al Fath, Boulevard Zerktouni, Casablanca",
          status: "ACTIF",
          registrationDate: "2024-02-10T08:45:00",
          totalOrders: 6,
          totalProposals: 2,
          totalSpent: 5800,
          lastOrderDate: "2024-12-12T11:30:00",
          specialty: "Médecine générale",
          clientType: "Standard",
          preferredProducts: ["Matériel de consultation", "Équipements de diagnostic", "Consommables médicaux"],
          avgOrderValue: 967,
          loyaltyScore: 76,
          riskLevel: "Moyen",
          nextFollowUp: "2024-12-30T09:00:00",
          salesRepNotes: "Cabinet moderne, clientèle croissante. Intéressé par la télémédecine et les équipements connectés.",
          paymentTerms: "30 jours",
          creditLimit: 12000,
          territory: "Casablanca Centre"
        },
        {
          id: 6,
          firstName: "Ahlam",
          lastName: "Alaoui",
          email: "a.alaoui@pharmaciecentrale.ma",
          phone: "+212 6 65 98 74 47",
          companyName: "Pharmacie Centrale",
          address: "Avenue Hassan II, Médina, Fès",
          status: "ACTIF",
          registrationDate: "2023-11-05T13:20:00",
          totalOrders: 7,
          totalProposals: 3,
          totalSpent: 5200,
          lastOrderDate: "2024-12-08T15:15:00",
          specialty: "Pharmacie d'officine",
          clientType: "Standard",
          preferredProducts: ["Médicaments génériques", "Dispositifs médicaux", "Matériel de premiers secours"],
          avgOrderValue: 743,
          loyaltyScore: 82,
          riskLevel: "Faible",
          nextFollowUp: "2025-01-08T10:30:00",
          salesRepNotes: "Pharmacie familiale établie depuis 20 ans. Fidèle aux marques de confiance, commandes prévisibles.",
          paymentTerms: "15 jours",
          creditLimit: 10000,
          territory: "Fès-Meknès"
        },
        {
          id: 7,
          firstName: "Dounia",
          lastName: "Benali",
          email: "d.benali@labosanteplus.ma",
          phone: "+212 6 55 82 59 78",
          companyName: "Laboratoire Santé Plus",
          address: "Zone Industrielle Sidi Ghanem, Marrakech",
          status: "ACTIF",
          registrationDate: "2024-05-18T16:10:00",
          totalOrders: 4,
          totalProposals: 1,
          totalSpent: 3200,
          lastOrderDate: "2024-12-05T09:45:00",
          specialty: "Analyses médicales",
          clientType: "Nouveau",
          preferredProducts: ["Équipements de laboratoire", "Réactifs", "Automates d'analyse"],
          avgOrderValue: 800,
          loyaltyScore: 68,
          riskLevel: "Moyen",
          nextFollowUp: "2024-12-27T14:00:00",
          salesRepNotes: "Laboratoire récent avec forte croissance. Potentiel important pour équipements haut de gamme.",
          paymentTerms: "30 jours",
          creditLimit: 8000,
          territory: "Marrakech-Safi"
        }
      ];

      setClients(mockClients);
      setError('');
      calculateBehaviorPatterns(mockClients);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError("Impossible de charger la liste des clients.");
    } finally {
      setLoading(false);
    }
  };

  const getPeriodData = () => {
    const now = new Date();
    let startDate;
    
    switch(timePeriod) {
      case 'lastWeek':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'lastQuarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }
    
    return startDate;
  };

  const filterByPeriod = (dateString) => {
    const activityDate = new Date(dateString);
    const periodStart = getPeriodData();
    return activityDate >= periodStart;
  };

  const fetchStats = async () => {
    try {
      const periodStart = getPeriodData();
      
      // Statistiques basées sur la période
      const periodClients = clients.filter(client => 
        new Date(client.registrationDate) >= periodStart
      );
      
      const periodOrders = clients.reduce((sum, client) => 
  sum + (filterByPeriod(client.lastOrderDate) ? client.totalOrders : 0)
, 0);

const periodRevenue = clients.reduce((sum, client) => 
  sum + (filterByPeriod(client.lastOrderDate) ? client.totalSpent : 0)
, 0);
      
      const mockStats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'ACTIF').length,
        totalOrders: periodOrders,
        totalRevenue: periodRevenue,
        avgOrderValue: periodOrders > 0 ? Math.round(periodRevenue / periodOrders) : 0,
        conversionRate: 76.8,
        topClient: "Karim Benjelloun",
        monthlyGrowth: 12.3,
        quarterlyTarget: 120000,
        achievementRate: Math.min(100, Math.round((periodRevenue / 120000) * 100))
      };

      setStats(mockStats);

      // Activité récente filtrée par période
      const allActivity = [
        { 
          id: 1, 
          clientName: "Mohamed El Alami", 
          type: "Commande", 
          date: "2024-12-18T14:22:00", 
          amount: 875,
          description: "Équipements de stérilisation - Commande urgente"
        },
        { 
          id: 2, 
          clientName: "Dunia Elmoutaoukil", 
          type: "Devis", 
          date: "2024-12-17T10:15:00", 
          amount: 1520,
          description: "Devis pour équipements d'anesthésie"
        },
        { 
          id: 3, 
          clientName: "Karim Benjelloun", 
          type: "Commande", 
          date: "2024-12-20T11:15:00", 
          amount: 2100,
          description: "Équipements cardiaques de dernière génération"
        },
        { 
          id: 4, 
          clientName: "Leila Zahidi", 
          type: "Appel", 
          date: "2024-12-16T16:45:00",
          description: "Suivi commande matériel de consultation"
        },
        { 
          id: 5, 
          clientName: "Ahlam Alaoui", 
          type: "Commande", 
          date: "2024-12-15T09:30:00", 
          amount: 320,
          description: "Réapprovisionnement dispositifs médicaux"
        },
        { 
          id: 6, 
          clientName: "Dounia Benali", 
          type: "Email", 
          date: "2024-12-14T11:20:00",
          description: "Demande de formation sur nouveaux automates"
        },
        { 
          id: 7, 
          clientName: "Salma Lbat", 
          type: "Visite", 
          date: "2024-12-13T14:00:00",
          description: "Présentation nouveaux produits 2025"
        }
      ];
      
      const filteredActivity = allActivity.filter(activity => 
        filterByPeriod(activity.date)
      );
      
      setRecentActivity(filteredActivity);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
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
      if (client.totalOrders > 5) patterns.frequentBuyers++;
      if (client.totalSpent > 5000) patterns.bigSpenders++;
      if (client.status === 'INACTIF') patterns.inactiveClients++;
      if (client.totalProposals > client.totalOrders) patterns.proposalMakers++;
      
      const registrationDate = new Date(client.registrationDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (registrationDate < oneYearAgo) {
        patterns.loyalClients++;
      }
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (registrationDate > threeMonthsAgo) {
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
        const scoreA = (a.totalOrders || 0) + (a.totalProposals || 0);
        const scoreB = (b.totalOrders || 0) + (b.totalProposals || 0);
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
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'TOUS' || client.status === filterStatus;
    const matchesMinOrders = client.totalOrders >= filterMinOrders;
    const matchesMinSpent = client.totalSpent >= filterMinSpent;
    const matchesTerritory = filterTerritory === 'TOUS' || client.territory === filterTerritory;
    const matchesClientType = filterClientType === 'TOUS' || client.clientType === filterClientType;

    return matchesSearch && matchesFilter && matchesMinOrders && matchesMinSpent && matchesTerritory && matchesClientType;
  });

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Catégorisation avancée des clients
  const getClientBehavior = (client) => {
    const daysSinceLastOrder = client.lastOrderDate ? 
      Math.floor((new Date() - new Date(client.lastOrderDate)) / (1000 * 60 * 60 * 24)) : 999;
    
    if (client.clientType === 'VIP' && client.loyaltyScore > 90) 
      return 'Client Premium VIP';
    
    if (client.totalSpent > 15000 && client.loyaltyScore > 85) 
      return 'Client Premium';
    
    if (daysSinceLastOrder > 60 && client.totalOrders > 5)
      return 'Client dormant - Relance nécessaire';
    
    if (client.totalOrders <= 3 && client.loyaltyScore < 70)
      return 'Nouveau client - Potentiel';
    
    if (client.totalProposals > client.totalOrders && client.totalProposals > 2)
      return 'Prospect actif';
    
    if (client.loyaltyScore > 80)
      return 'Client fidèle';
    
    return 'Client standard';
  };
  
  // Fonction pour formater les montants en MAD
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="commercial-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
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
        <div className="header-right">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="dark-mode-toggle"
            aria-label={darkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="btn primary">
            <Plus size={16} /> Nouveau client
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
            <p>{formatCurrency(stats.totalRevenue || 0)}</p>
            <small>Période sélectionnée</small>
          </div>
        </div>
        
        <div className="stat-card orders">
          <div className="stat-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <h3>Commandes</h3>
            <p>{stats.totalOrders || '0'}</p>
            <small>Période sélectionnée</small>
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
            <h3>Objectif Trimestriel</h3>
            <p>{stats.achievementRate?.toFixed(0) || '0'}%</p>
            <small>Atteint sur {formatCurrency(stats.totalRevenue || 0)}</small>
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
        <div className="section-header">
          <h2>Activité Récente</h2>
          <button className="btn outline small">
            Voir tout
          </button>
        </div>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.type === 'Commande' && <ShoppingCart size={16} />}
                {activity.type === 'Devis' && <FileText size={16} />}
                {activity.type === 'Appel' && <Phone size={16} />}
                {activity.type === 'Email' && <Mail size={16} />}
                {activity.type === 'Visite' && <MapPin size={16} />}
              </div>
              <div className="activity-details">
                <div className="activity-client">{activity.clientName}</div>
                <div className="activity-type">{activity.type}</div>
                <div className="activity-description">{activity.description}</div>
                <div className="activity-date">
                  {new Date(activity.date).toLocaleDateString()} - 
                  {new Date(activity.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
              {activity.amount && (
                <div className="activity-amount">
                  {formatCurrency(activity.amount)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gestion des clients */}
      <div className="section">
        <div className="section-header">
          <h2>Mes Clients ({filteredClients.length})</h2>
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
            
            <button 
              className="btn outline" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} /> Filtres avancés {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        
        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Commandes min:</label>
              <input 
                type="number" 
                value={filterMinOrders} 
                onChange={(e) => setFilterMinOrders(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Montant min:</label>
              <input 
                type="number" 
                value={filterMinSpent} 
                onChange={(e) => setFilterMinSpent(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label>Région:</label>
              <select
                value={filterTerritory}
                onChange={(e) => setFilterTerritory(e.target.value)}
              >
                <option value="TOUS">Toutes</option>
                <option value="Grand Casablanca">Casablanca</option>
                <option value="Rabat-Salé">Rabat</option>
                <option value="Tanger-Tétouan">Tanger</option>
                <option value="Souss-Massa">Agadir</option>
                <option value="Fès-Meknès">Fès</option>
                <option value="Marrakech-Safi">Marrakech</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Type client:</label>
              <select
                value={filterClientType}
                onChange={(e) => setFilterClientType(e.target.value)}
              >
                <option value="TOUS">Tous</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
                <option value="VIP">VIP</option>
                <option value="Standard">Standard</option>
                <option value="Nouveau">Nouveau</option>
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <AlertCircle size={24} />
            <p>{error}</p>
            <button onClick={fetchClients} className="btn primary">Réessayer</button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="no-results">
            <p>Aucun client trouvé avec les critères de recherche</p>
            <button 
              className="btn outline" 
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('TOUS');
                setFilterMinOrders(0);
                setFilterMinSpent(0);
                setFilterTerritory('TOUS');
                setFilterClientType('TOUS');
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="clients-grid">
              {currentClients.map(client => (
                <div key={client.id} className="client-card" onClick={() => handleViewClient(client)}>
                  <div className="client-header">
                    <div className="client-avatar">
                      {client.firstName?.charAt(0)}{client.lastName?.charAt(0)}
                    </div>
                    <div className="client-meta">
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
                      <span>{formatCurrency(client.totalSpent || 0)}</span>
                      <small>MAD dépensés</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Précédent
              </button>
              
              {[...Array(totalPages).keys()].map(number => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`pagination-btn ${currentPage === number + 1 ? 'active' : ''}`}
                >
                  {number + 1}
                </button>
              ))}
              
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Suivant
              </button>
            </div>
          </>
        )}
      </div>

      {/* Détails du client */}
      {showClientDetails && selectedClient && (
        <div className="client-details-modal">
          <div className="modal-overlay" onClick={() => setShowClientDetails(false)}></div>
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowClientDetails(false)}>
              <X size={20} />
            </button>
            
            <div className="client-profile">
              <div className="profile-avatar">
                {selectedClient.firstName?.charAt(0)}{selectedClient.lastName?.charAt(0)}
              </div>
              <div className="profile-info">
                <h2>{selectedClient.firstName} {selectedClient.lastName}</h2>
                <p className="client-behavior">{getClientBehavior(selectedClient)}</p>
                <div className="profile-meta">
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
                      <strong>{formatCurrency(selectedClient.totalSpent || 0)}</strong>
                      <small>MAD dépensés</small>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Calendar size={16} />
                    <div>
                      <strong>{
                        selectedClient.lastOrderDate 
                          ? new Date(selectedClient.lastOrderDate).toLocaleDateString() 
                          : 'Aucune'
                      }</strong>
                      <small>Dernière commande</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="behavior-analysis">
              <h3>Analyse Comportementale</h3>
              <p>
                Ce client a un profil <strong>{getClientBehavior(selectedClient)}</strong>. 
                {selectedClient.totalProposals > selectedClient.totalOrders && (
                  ` Il a créé ${selectedClient.totalProposals - selectedClient.totalOrders} devis supplémentaires sans commande.`
                )}
                {selectedClient.status === 'INACTIF' && selectedClient.totalOrders > 0 && (
                  ` Inactif depuis ${Math.floor((new Date() - new Date(selectedClient.lastOrderDate)) / (1000 * 60 * 60 * 24 * 30))} mois.`
                )}
                {selectedClient.totalOrders > 5 && (
                  ` Fidèle avec ${selectedClient.totalOrders} commandes.`
                )}
              </p>
              
              <div className="recommendations">
                <h4>Recommandations:</h4>
                {getClientBehavior(selectedClient) === 'Client dormant - Relance nécessaire' && (
                  <p>📧 Envoyer une offre spéciale pour le relancer</p>
                )}
                {getClientBehavior(selectedClient) === 'Prospect actif' && (
                  <p>📞 Contacter pour comprendre ses besoins spécifiques</p>
                )}
                {getClientBehavior(selectedClient) === 'Nouveau client - Potentiel' && (
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