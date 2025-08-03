import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, Mail, Phone, MapPin, Building, FileText, 
  Edit, Trash2, MessageSquare, Calendar, DollarSign, User,
  Filter, Package, BarChart2, TrendingUp, Clipboard, ShoppingCart, 
  Percent, Activity, RefreshCw, AlertCircle, Star, Clock, Award, 
  ShoppingBag, ChevronDown, ChevronUp, Plus, X, Moon, Sun,
  Users, Download, Eye, Target, TrendingDown
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import './CommercialDashboardUnifie.css';

const CommercialDashboardUnifie = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mois');
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);

  // États pour les filtres de devis
  const [devisFilters, setDevisFilters] = useState({
    period: 'mois', // Même valeur initiale que selectedPeriod
    status: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Ajout de la déclaration manquante de clients avec des données de démonstration
  const [clients, setClients] = useState([
    {
      id: 1,
      firstName: 'Ahmed',
      lastName: 'Benali',
      email: 'ahmed.benali@email.com',
      phone: '+212 6 12 34 56 78',
      address: 'Casablanca, Maroc',
      reference: 'CLI-2024-001',
      registrationDate: '2024-01-15',
      status: 'ACTIF',
      totalOrders: 5,
      totalSpent: 12500,
      lastOrderDate: '2024-03-10',
      clientType: 'Premium',
      loyaltyScore: 85,
      avgOrderValue: 2500,
      territory: 'Casablanca'
    },
    {
      id: 2,
      firstName: 'Fatima',
      lastName: 'El Mansouri',
      email: 'fatima.elmansouri@email.com',
      phone: '+212 6 23 45 67 89',
      address: 'Rabat, Maroc',
      reference: 'CLI-2024-002',
      registrationDate: '2024-02-20',
      status: 'ACTIF',
      totalOrders: 3,
      totalSpent: 6000,
      lastOrderDate: '2024-03-08',
      clientType: 'Standard',
      loyaltyScore: 72,
      avgOrderValue: 2000,
      territory: 'Rabat'
    },
    {
      id: 3,
      firstName: 'Omar',
      lastName: 'Tazi',
      email: 'omar.tazi@email.com',
      phone: '+212 6 34 56 78 90',
      address: 'Marrakech, Maroc',
      reference: 'CLI-2024-003',
      registrationDate: '2024-01-10',
      status: 'PROSPECT',
      totalOrders: 1,
      totalSpent: 1800,
      lastOrderDate: '2024-02-15',
      clientType: 'Nouveau',
      loyaltyScore: 45,
      avgOrderValue: 1800,
      territory: 'Marrakech'
    },
    {
      id: 4,
      firstName: 'Aicha',
      lastName: 'Benjelloun',
      email: 'aicha.benjelloun@email.com',
      phone: '+212 6 45 67 89 01',
      address: 'Fès, Maroc',
      reference: 'CLI-2024-004',
      registrationDate: '2024-03-01',
      status: 'ACTIF',
      totalOrders: 4,
      totalSpent: 9200,
      lastOrderDate: '2024-03-12',
      clientType: 'Premium',
      loyaltyScore: 78,
      avgOrderValue: 2300,
      territory: 'Fès'
    },
    {
      id: 5,
      firstName: 'Youssef',
      lastName: 'Alami',
      email: 'youssef.alami@email.com',
      phone: '+212 6 56 78 90 12',
      address: 'Tanger, Maroc',
      reference: 'CLI-2024-005',
      registrationDate: '2024-02-05',
      status: 'ACTIF',
      totalOrders: 6,
      totalSpent: 15000,
      lastOrderDate: '2024-03-11',
      clientType: 'Premium',
      loyaltyScore: 92,
      avgOrderValue: 2500,
      territory: 'Tanger'
    },
    {
      id: 6,
      firstName: 'Khadija',
      lastName: 'Ouali',
      email: 'khadija.ouali@email.com',
      phone: '+212 6 67 89 01 23',
      address: 'Agadir, Maroc',
      reference: 'CLI-2024-006',
      registrationDate: '2024-01-25',
      status: 'INACTIF',
      totalOrders: 2,
      totalSpent: 3600,
      lastOrderDate: '2024-01-30',
      clientType: 'Standard',
      loyaltyScore: 35,
      avgOrderValue: 1800,
      territory: 'Agadir'
    },
    {
      id: 7,
      firstName: 'Hassan',
      lastName: 'Idrissi',
      email: 'hassan.idrissi@email.com',
      phone: '+212 6 78 90 12 34',
      address: 'Meknès, Maroc',
      reference: 'CLI-2024-007',
      registrationDate: '2024-02-28',
      status: 'ACTIF',
      totalOrders: 3,
      totalSpent: 6300,
      lastOrderDate: '2024-03-09',
      clientType: 'Standard',
      loyaltyScore: 68,
      avgOrderValue: 2100,
      territory: 'Meknès'
    },
    {
      id: 8,
      firstName: 'Zineb',
      lastName: 'Fassi',
      email: 'zineb.fassi@email.com',
      phone: '+212 6 89 01 23 45',
      address: 'Salé, Maroc',
      reference: 'CLI-2024-008',
      registrationDate: '2024-03-05',
      status: 'PROSPECT',
      totalOrders: 1,
      totalSpent: 1900,
      lastOrderDate: '2024-03-05',
      clientType: 'Nouveau',
      loyaltyScore: 25,
      avgOrderValue: 1900,
      territory: 'Rabat'
    }
  ]);

  
  
  const getChartDataByPeriod = () => {
    const baseData = {
      semaine: {
        evolutionVentes: [
          { periode: 'Lun', commandes: 1, ca: 1200, clients: 1 },
          { periode: 'Mar', commandes: 1, ca: 1300, clients: 1 },
          { periode: 'Mer', commandes: 0, ca: 0, clients: 1 },
          { periode: 'Jeu', commandes: 1, ca: 1000, clients: 1 },
          { periode: 'Ven', commandes: 0, ca: 0, clients: 1 },
          { periode: 'Sam', commandes: 0, ca: 0, clients: 1 },
          { periode: 'Dim', commandes: 0, ca: 0, clients: 0 }
        ]
      },
      mois: {
        evolutionVentes: [
          { periode: 'S1', commandes: 3, ca: 3500, clients: 2 },
          { periode: 'S2', commandes: 3, ca: 3600, clients: 2 },
          { periode: 'S3', commandes: 3, ca: 3400, clients: 1 },
          { periode: 'S4', commandes: 3, ca: 3500, clients: 1 }
        ]
      },
      trimestre: {
        evolutionVentes: [
          { periode: 'Mois 1', commandes: 8, ca: 14000, clients: 2 },
          { periode: 'Mois 2', commandes: 8, ca: 14200, clients: 3 },
          { periode: 'Mois 3', commandes: 8, ca: 13800, clients: 2 }
        ]
      },
      annee: {
        evolutionVentes: [
          { periode: 'T1', commandes: 6, ca: 11000, clients: 2 },
          { periode: 'T2', commandes: 6, ca: 11200, clients: 2 },
          { periode: 'T3', commandes: 7, ca: 11800, clients: 2 },
          { periode: 'T4', commandes: 6, ca: 11000, clients: 1 }
        ]
      }
    };
    
    return baseData[selectedPeriod] || baseData.mois;
  };
  
  // Fonction pour obtenir les données complètes des graphiques
  const getChartData = () => {
    const territoryData = clients.reduce((acc, client) => {
      if (!acc[client.territory]) {
        acc[client.territory] = 0;
      }
      acc[client.territory]++;
      return acc;
    }, {});

    const typeData = clients.reduce((acc, client) => {
      if (!acc[client.clientType]) {
        acc[client.clientType] = 0;
      }
      acc[client.clientType]++;
      return acc;
    }, {});

    return {
      evolutionVentes: getChartDataByPeriod().evolutionVentes,
      clientsParTerritory: Object.entries(territoryData).map(([name, value], index) => ({
        name,
        value,
        color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]
      })),
      clientsParType: Object.entries(typeData).map(([name, value], index) => ({
        name,
        value,
        color: ['#9C27B0', '#2196F3', '#FF9800'][index % 3]
      }))
    };
  };

  // Utilisation des données corrigées
  const [chartDataComplete, setChartDataComplete] = useState(() => getChartData());
  
  // Ajouter après la déclaration de chartDataComplete :
  useEffect(() => {
    setChartDataComplete(getChartData());
  }, [selectedPeriod, clients]);
  
  // États pour les filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    clientType: '',
    territory: '',
    loyaltyRange: '',
    quarter: ''
  });
  
  // États pour les modales
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showTopClients, setShowTopClients] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  

  // Calcul des statistiques en temps réel
  const [stats, setStats] = useState({});

  useEffect(() => {
    calculateStats();
  }, [clients, selectedPeriod]);

  // Calcul des statistiques en temps réel selon la période - VERSION RÉALISTE AMÉLIORÉE
  const calculateStats = () => {
    // Données fixes par période pour éviter les problèmes de filtrage par date
    const statsData = {
      semaine: {
        totalRevenue: 3500,
        totalClients: 6,
        activeClients: 5,
        newClients: 1,
        totalOrders: 3,
        totalDevis: 6,
        avgOrderValue: 1167,
        conversionRate: 50,
        devisEnAttente: 2,
        devisAcceptes: 3,
        devisRefuses: 1
      },
      mois: {
        totalRevenue: 14000,
        totalClients: 6,
        activeClients: 5,
        newClients: 2,
        totalOrders: 12,
        totalDevis: 24,
        avgOrderValue: 1167,
        conversionRate: 50,
        devisEnAttente: 8,
        devisAcceptes: 12,
        devisRefuses: 4
      },
      trimestre: {
        totalRevenue: 42000,
        totalClients: 7,
        activeClients: 6,
        newClients: 3,
        totalOrders: 24,
        totalDevis: 48,
        avgOrderValue: 1750,
        conversionRate: 50,
        devisEnAttente: 16,
        devisAcceptes: 24,
        devisRefuses: 8
      },
      annee: {
        totalRevenue: 45000,
        totalClients: 7,
        activeClients: 6,
        newClients: 3,
        totalOrders: 25,
        totalDevis: 50,
        avgOrderValue: 1800,
        conversionRate: 50,
        devisEnAttente: 17,
        devisAcceptes: 25,
        devisRefuses: 8
      }
    };

    const currentStats = statsData[selectedPeriod] || statsData.mois;

    setStats({
      ...currentStats,
      topClient: clients.length > 0 ? clients.reduce((prev, current) => 
        (prev.totalSpent > current.totalSpent) ? prev : current
      ) : null,
      period: selectedPeriod,
      filteredClients: clients,
      growth: {
        revenue: selectedPeriod === 'semaine' ? 8.2 : selectedPeriod === 'mois' ? 12.4 : selectedPeriod === 'trimestre' ? 22.8 : 35.2,
        clients: selectedPeriod === 'semaine' ? 9.1 : selectedPeriod === 'mois' ? 15.2 : selectedPeriod === 'trimestre' ? 19.9 : 28.7
      },
      averageOrderFrequency: currentStats.totalClients > 0 ? Math.round((currentStats.totalOrders / currentStats.totalClients) * 10) / 10 : 0,
      customerLifetimeValue: currentStats.avgOrderValue * 12,
      churnRate: Math.round((clients.filter(c => c.status === 'PROSPECT').length / currentStats.totalClients) * 100),
      territoryPerformance: calculateTerritoryPerformance(clients)
    });
  };

  // Fonction pour obtenir le libellé de la période avec plus de détails
  const getPeriodLabel = () => {
    switch(selectedPeriod) {
      case 'semaine': return 'cette semaine';
      case 'mois': return 'ce mois';
      case 'trimestre': return 'ce trimestre';
      case 'annee': return 'cette année';
      default: return 'la période';
    }
  };

  // Fonction pour obtenir des données réalistes selon la période
  const getPeriodSpecificData = () => {
    const baseData = {
      semaine: {
        expectedDevis: 15,
        expectedCommandes: 8,
        expectedCA: 25000,
        expectedClients: 6
      },
      mois: {
        expectedDevis: 60,
        expectedCommandes: 35,
        expectedCA: 95000,
        expectedClients: 25
      },
      trimestre: {
        expectedDevis: 180,
        expectedCommandes: 105,
        expectedCA: 285000,
        expectedClients: 75
      },
      annee: {
        expectedDevis: 720,
        expectedCommandes: 420,
        expectedCA: 1140000,
        expectedClients: 300
      }
    };
    
    return baseData[selectedPeriod] || baseData.mois;
  };

  // Fonction pour obtenir la comparaison de période
  const getPeriodComparison = () => {
    switch(selectedPeriod) {
      case 'semaine': return 'vs semaine dernière';
      case 'mois': return 'vs mois dernier';
      case 'trimestre': return 'vs trimestre dernier';
      case 'annee': return 'vs année dernière';
      default: return 'vs période précédente';
    }
  };

  

  const filteredClients = clients.filter(client => 
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', { 
      style: 'currency', 
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getClientStatusColor = (status) => {
    switch(status) {
      case 'ACTIF': return '#4CAF50';
      case 'PROSPECT': return '#FF9800';
      case 'INACTIF': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getClientTypeColor = (type) => {
    switch(type) {
      case 'Premium': return '#9C27B0';
      case 'Standard': return '#2196F3';
      case 'Nouveau': return '#FF9800';
      default: return '#607D8B';
    }
  };

  // Fonction pour calculer la performance par territoire
  // Fonction pour obtenir les données de devis selon la période avec valeurs réalistes
  const getDevisDataByPeriod = (period) => {
    const devisData = {
      semaine: {
        total: 3,
        enAttente: 1,
        acceptes: 1,
        refuses: 1,
        valeurMoyenne: 1167,
        evolution: [
          { jour: 'Lun', devis: 1, acceptes: 0, refuses: 0 },
          { jour: 'Mar', devis: 1, acceptes: 1, refuses: 0 },
          { jour: 'Mer', devis: 0, acceptes: 0, refuses: 0 },
          { jour: 'Jeu', devis: 1, acceptes: 0, refuses: 1 },
          { jour: 'Ven', devis: 0, acceptes: 0, refuses: 0 },
          { jour: 'Sam', devis: 0, acceptes: 0, refuses: 0 },
          { jour: 'Dim', devis: 0, acceptes: 0, refuses: 0 }
        ]
      },
      mois: {
        total: 12,
        enAttente: 4,
        acceptes: 6,
        refuses: 2,
        valeurMoyenne: 1167,
        evolution: [
          { semaine: 'S1', devis: 3, acceptes: 1, refuses: 1 },
          { semaine: 'S2', devis: 3, acceptes: 2, refuses: 0 },
          { semaine: 'S3', devis: 3, acceptes: 2, refuses: 1 },
          { semaine: 'S4', devis: 3, acceptes: 1, refuses: 0 }
        ]
      },
      trimestre: {
        total: 24,
        enAttente: 8,
        acceptes: 12,
        refuses: 4,
        valeurMoyenne: 1750,
        evolution: [
          { mois: 'Mois 1', devis: 8, acceptes: 4, refuses: 1 },
          { mois: 'Mois 2', devis: 8, acceptes: 4, refuses: 1 },
          { mois: 'Mois 3', devis: 8, acceptes: 4, refuses: 2 }
        ]
      },
      annee: {
        total: 25,
        enAttente: 8,
        acceptes: 13,
        refuses: 4,
        valeurMoyenne: 1800,
        evolution: [
          { trimestre: 'T1', devis: 6, acceptes: 3, refuses: 1 },
          { trimestre: 'T2', devis: 6, acceptes: 3, refuses: 1 },
          { trimestre: 'T3', devis: 7, acceptes: 4, refuses: 1 },
          { trimestre: 'T4', devis: 6, acceptes: 3, refuses: 1 }
        ]
      }
    };
    
    // Retourner les données pour la période demandée ou les données du mois par défaut
    const result = devisData[period] || devisData.mois;
    
    // S'assurer que toutes les propriétés existent
    return {
      total: result.total || 0,
      enAttente: result.enAttente || 0,
      acceptes: result.acceptes || 0,
      refuses: result.refuses || 0,
      valeurMoyenne: result.valeurMoyenne || 0,
      evolution: result.evolution || []
    };
  };

  // Fonction pour filtrer les devis selon les critères
  const getFilteredDevisData = () => {
    const baseData = getDevisDataByPeriod(devisFilters.period);
    
    // S'assurer que baseData existe et a des valeurs par défaut
    if (!baseData) {
      return {
        total: 0,
        enAttente: 0,
        acceptes: 0,
        refuses: 0,
        valeurMoyenne: 0,
        evolution: []
      };
    }
    
    // Appliquer les filtres de statut si nécessaire
    if (devisFilters.status) {
      switch(devisFilters.status) {
        case 'en_attente':
          return {
            ...baseData,
            acceptes: 0,
            refuses: 0,
            total: baseData.enAttente || 0,
            evolution: baseData.evolution || []
          };
        case 'accepte':
          return {
            ...baseData,
            enAttente: 0,
            refuses: 0,
            total: baseData.acceptes || 0,
            evolution: baseData.evolution || []
          };
        case 'refuse':
          return {
            ...baseData,
            enAttente: 0,
            acceptes: 0,
            total: baseData.refuses || 0,
            evolution: baseData.evolution || []
          };
        default:
          return baseData;
      }
    }
    
    return baseData;
  };

  useEffect(() => {
    // Force le re-rendu des données de devis quand les filtres changent
    const data = getFilteredDevisData();
    console.log('Données devis filtrées:', data); // Pour débugger
  }, [devisFilters]);

  // État pour mémoriser les données et éviter les recalculs multiples
  const [devisData, setDevisData] = useState(() => getFilteredDevisData());

  // useEffect unique pour gérer les changements de filtres
  useEffect(() => {
    const newData = getFilteredDevisData();
    setDevisData(newData);
    console.log('🔄 Données devis mises à jour pour la période:', devisFilters.period, newData);
  }, [devisFilters.period, devisFilters.status]);

  // Fonction utilitaire pour éviter les divisions par zéro
  const calculatePercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
  };

  // Fonction pour obtenir le libellé de la période
  const getDevisPeriodLabel = () => {
    switch(devisFilters.period) {
      case 'semaine': return 'cette semaine';
      case 'mois': return 'ce mois';
      case 'trimestre': return 'ce trimestre';
      case 'annee': return 'cette année';
      default: return 'la période';
    }
  };

  const calculateTerritoryPerformance = (clientsList) => {
    const territoryStats = {};
    
    clientsList.forEach(client => {
      if (!territoryStats[client.territory]) {
        territoryStats[client.territory] = {
          clients: 0,
          revenue: 0,
          orders: 0,
          avgLoyalty: 0
        };
      }
      
      territoryStats[client.territory].clients++;
      territoryStats[client.territory].revenue += client.totalSpent;
      territoryStats[client.territory].orders += client.totalOrders;
      territoryStats[client.territory].avgLoyalty += client.loyaltyScore;
    });
    
    // Calcul des moyennes
    Object.keys(territoryStats).forEach(territory => {
      const stats = territoryStats[territory];
      stats.avgLoyalty = Math.round(stats.avgLoyalty / stats.clients);
      stats.avgOrderValue = Math.round(stats.revenue / stats.orders);
    });
    
    return territoryStats;
  };

  // Fonctions de gestion des actions clients
  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const handleEditClient = (client) => {
    navigate(`/commercial/clients/edit/${client.id}`, { state: { client } });
  };

  const handleContactClient = (client) => {
    const emailSubject = encodeURIComponent(`Suivi commercial - ${client.firstName} ${client.lastName}`);
    const emailBody = encodeURIComponent(
      `Bonjour ${client.firstName},\n\n` +
      `Nous vous contactons dans le cadre du suivi de votre dossier client (Réf: ${client.reference}).\n\n` +
      `Cordialement,\nÉquipe Commerciale SofIMed`
    );
    window.open(`mailto:${client.email}?subject=${emailSubject}&body=${emailBody}`);
  };

  const handleNewClient = () => {
    navigate('/commercial/clients/new');
  };

  const handleFilterClients = () => {
    setShowFilters(!showFilters);
  };

  // Nouvelles fonctions pour corriger les erreurs ESLint
  const handleViewAllTopClients = () => {
    setShowTopClients(true);
  };

  const handleCloseTopClients = () => {
    setShowTopClients(false);
  };

  const handleOpportunityAction = (type, description) => {
    setSelectedOpportunity({ type, description });
    setShowOpportunityModal(true);
  };

  const handleCloseOpportunityModal = () => {
    setShowOpportunityModal(false);
    setSelectedOpportunity(null);
  };

  const handleAnalyzeOpportunity = () => {
    alert(`Analyse en cours pour : ${selectedOpportunity?.description}`);
    handleCloseOpportunityModal();
  };

  const handleContactOpportunity = () => {
    alert(`Relance programmée pour : ${selectedOpportunity?.description}`);
    handleCloseOpportunityModal();
  };

  const handleDevelopTerritory = () => {
    alert(`Plan de développement créé pour : ${selectedOpportunity?.description}`);
    handleCloseOpportunityModal();
  };

  const handleExportData = () => {
    const exportData = {
      date: new Date().toISOString(),
      periode: selectedPeriod,
      statistiques: stats,
      clients: filteredClients.map(client => ({
        ...client,
        registrationDate: new Date(client.registrationDate).toLocaleDateString('fr-FR'),
        lastOrderDate: new Date(client.lastOrderDate).toLocaleDateString('fr-FR')
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-commercial-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Notification de succès
    alert('Rapport exporté avec succès !');
  };

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Données actualisées avec succès !');
    }, 1500);
  };

  const resetAllFilters = () => {
    setFilters({
      status: '',
      clientType: '',
      territory: '',
      loyaltyRange: '',
      quarter: ''
    });
    setSearchTerm('');
    setShowFilters(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  return (
    <div className={`commercial-dashboard-unifie ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Tableau de Bord Commercial</h1>
          <div className="period-selector">
            <select 
              value={selectedPeriod} 
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setDevisFilters(prev => ({ ...prev, period: e.target.value }));
              }}
              className="period-select"
            >
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
              <option value="trimestre">Ce trimestre</option>
              <option value="annee">Cette année</option>
            </select>
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="mode-toggle"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {/* Bouton Nouveau client supprimé */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart2 size={16} /> Vue d'ensemble
        </button>
        <button 
          className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <Users size={16} /> Clients ({stats.totalClients})
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} /> Analyses
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="stats-overview">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <h3>CA {getPeriodLabel()}</h3>
            <p className="stat-value">{formatCurrency(stats.totalRevenue || 0)}</p>
            <small className="stat-detail positive">+8% {getPeriodComparison()}</small>
          </div>
        </div>
        
        <div className="stat-card clients">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>Clients {getPeriodLabel()}</h3>
            <p className="stat-value">{stats.totalClients || 0}</p>
            <small className="stat-detail">
              <span className="positive">+{stats.newClients} nouveaux</span>
              <span className="neutral"> • {stats.activeClients} actifs</span>
            </small>
          </div>
        </div>
        
        <div className="stat-card orders">
          <div className="stat-icon">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>Commandes {getPeriodLabel()}</h3>
            <p className="stat-value">{stats.totalOrders || 0}</p>
            <small className="stat-detail">Panier moyen: {formatCurrency(stats.avgOrderValue || 0)}</small>
          </div>
        </div>
        
        <div className="stat-card conversion">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <h3>Devis {getPeriodLabel()}</h3>
            <p className="stat-value">{stats.totalDevis || 0}</p>
            <small className="stat-detail">
              <span className="positive">{stats.devisEnAttente} en attente</span>
              <span className="neutral"> • {stats.conversionRate}% convertis</span>
            </small>
          </div>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'overview' && (
        <div className="overview-content">
          {/* Graphiques */}
          <div className="charts-section">
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Évolution des Ventes</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartDataComplete.evolutionVentes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periode" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => new Intl.NumberFormat('fr').format(value)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="commandes" name="Commandes" stroke="#4CAF50" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="ca" name="CA (MAD)" stroke="#2196F3" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Clients par Territoire</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartDataComplete.clientsParTerritory}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartDataComplete.clientsParTerritory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>Types de Clients</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartDataComplete.clientsParType}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartDataComplete.clientsParType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nouvelle section détails des devis améliorée */}
          <div className="devis-details-section">
            <div className="section-header-with-filters">
              <div className="section-title">
                <h3>Détails des Devis {getDevisPeriodLabel()}</h3>
                <p className="section-subtitle">Analyse complète de vos devis et conversions</p>
              </div>
              
              {/* Filtres pour les devis */}
              <div className="devis-filters">
                <div className="filter-group">
                  <label>Période :</label>
                  <select 
                    value={devisFilters.period} 
                    onChange={(e) => {
                      setDevisFilters(prev => ({ ...prev, period: e.target.value }));
                      setSelectedPeriod(e.target.value);
                    }}
                    className="period-filter"
                  >
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                    <option value="trimestre">Ce trimestre</option>
                    <option value="annee">Cette année</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label>Statut :</label>
                  <select 
                    value={devisFilters.status} 
                    onChange={(e) => setDevisFilters({...devisFilters, status: e.target.value})}
                    className="status-filter"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="accepte">Acceptés</option>
                    <option value="refuse">Refusés</option>
                  </select>
                </div>
                
                <button 
                  className="filter-reset-btn"
                  onClick={() => setDevisFilters({ period: 'mois', status: '', dateRange: { start: '', end: '' } })}
                >
                  <RefreshCw size={16} />
                  Réinitialiser
                </button>
              </div>
            </div>
            
            {/* Statistiques des devis avec design amélioré */}
            <div className="devis-stats-grid-enhanced">
              <div className="devis-stat-card-enhanced total">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <FileText size={24} />
                  </div>
                  <div className="devis-stat-trend positive">
                    <TrendingUp size={16} />
                    +12%
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>Total Devis</h4>
                  <p className="devis-stat-value">{devisData.total || 0}</p>
                  <small>Générés {getDevisPeriodLabel()}</small>
                </div>
                <div className="devis-stat-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '75%'}}></div>
                  </div>
                  <span className="progress-text">75% de l'objectif</span>
                </div>
              </div>
              
              <div className="devis-stat-card-enhanced pending">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <Clock size={24} />
                  </div>
                  <div className="devis-stat-trend neutral">
                    <Activity size={16} />
                    {calculatePercentage(devisData.enAttente || 0, devisData.total || 0)}%
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>En Attente</h4>
                  <p className="devis-stat-value">{devisData.enAttente || 0}</p>
                  <small>En cours de traitement</small>
                </div>
                <div className="devis-stat-actions">
                  <button className="quick-action-btn" disabled>
                    <Eye size={14} />
                    Voir détails
                  </button>
                </div>
              </div>
              
              <div className="devis-stat-card-enhanced accepted">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="devis-stat-trend positive">
                    <TrendingUp size={16} />
                    +8%
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>Acceptés</h4>
                  <p className="devis-stat-value">{devisData.acceptes || 0}</p>
                  <small>Convertis en commandes</small>
                </div>
                <div className="devis-conversion-rate">
                  <span className="conversion-label">Taux de conversion</span>
                  <span className="conversion-value">
                    {calculatePercentage(devisData.acceptes || 0, devisData.total || 0)}%
                  </span>
                </div>
              </div>
              
              <div className="devis-stat-card-enhanced rejected">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <X size={24} />
                  </div>
                  <div className="devis-stat-trend negative">
                    <TrendingDown size={16} />
                    -3%
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>Refusés</h4>
                  <p className="devis-stat-value">{devisData.refuses || 0}</p>
                  <small>À analyser pour amélioration</small>
                </div>
              </div>
              
              <div className="devis-stat-card-enhanced performance">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <Target size={24} />
                  </div>
                  <div className="devis-stat-trend positive">
                    <TrendingUp size={16} />
                    +5%
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>Valeur Moyenne</h4>
                  <p className="devis-stat-value">{formatCurrency(devisData.valeurMoyenne || 0)}</p>
                  <small>Par devis {getDevisPeriodLabel()}</small>
                </div>
                <div className="devis-performance-indicator">
                  <span className="performance-label">Performance</span>
                  <div className="performance-bar">
                    <div className="performance-fill" style={{width: `${Math.min(100, (devisData.valeurMoyenne || 0) / 50)}%`}}></div>
                  </div>
                </div>
              </div>
              
              <div className="devis-stat-card-enhanced evolution">
                <div className="devis-stat-header">
                  <div className="devis-stat-icon">
                    <BarChart2 size={24} />
                  </div>
                  <div className="devis-stat-trend positive">
                    <TrendingUp size={16} />
                    Évolution
                  </div>
                </div>
                <div className="devis-stat-content">
                  <h4>Graphique d'Évolution</h4>
                  <div className="mini-chart">
                    <ResponsiveContainer width="100%" height={60}>
                      <BarChart data={devisData.evolution || []}>
                        <Bar dataKey={devisFilters.period === 'semaine' ? 'devis' : devisFilters.period === 'mois' ? 'devis' : devisFilters.period === 'trimestre' ? 'devis' : 'devis'} fill="#4CAF50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Graphique d'évolution des devis */}
            <div className="devis-evolution-chart">
              <div className="chart-header">
                <h4>Évolution des Devis {getDevisPeriodLabel()}</h4>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color devis"></div>
                    <span>Devis générés</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color acceptes"></div>
                    <span>Acceptés</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color refuses"></div>
                    <span>Refusés</span>
                  </div>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getFilteredDevisData().evolution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey={devisFilters.period === 'semaine' ? 'jour' : 
                              devisFilters.period === 'mois' ? 'semaine' :
                              devisFilters.period === 'trimestre' ? 'mois' : 'trimestre'} 
                      stroke="#718096" 
                    />
                    <YAxis stroke="#718096" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="devis" fill="#3182ce" name="Devis générés" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="acceptes" fill="#38a169" name="Acceptés" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="refuses" fill="#e53e3e" name="Refusés" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Clients */}
          <div className="top-clients-section">
            <div className="section-header">
              <h3>Top Clients</h3>
              <button className="view-all-btn" onClick={() => setActiveTab('clients')}>
                Voir tous
              </button>
            </div>
            <div className="clients-grid">
              {clients
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 3)
                .map(client => (
                <div key={client.id} className="client-card">
                  <div className="client-header">
                    <div className="client-avatar">
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </div>
                    <div className="client-info">
                      <h4>{client.firstName} {client.lastName}</h4>
                      <p className="client-email">{client.email}</p>
                    </div>
                    <div 
                      className="client-status"
                      style={{ backgroundColor: getClientStatusColor(client.status) }}
                    >
                      {client.status}
                    </div>
                  </div>
                  <div className="client-stats">
                    <div className="client-stat">
                      <span className="stat-label">CA Total</span>
                      <span className="stat-value">{formatCurrency(client.totalSpent)}</span>
                    </div>
                    <div className="client-stat">
                      <span className="stat-label">Commandes</span>
                      <span className="stat-value">{client.totalOrders}</span>
                    </div>
                    <div className="client-stat">
                      <span className="stat-label">Fidélité</span>
                      <span className="stat-value">{client.loyaltyScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="clients-content">
          {/* Barre de recherche et filtres */}
          <div className="clients-controls">
            <div className="search-bar">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="clients-actions">
              <button className="btn secondary" disabled>
                <Filter size={16} /> Filtres
              </button>
              <button className="btn primary" disabled>
                <UserPlus size={16} /> Nouveau client
              </button>
            </div>
          </div>

          {/* Liste des clients */}
          <div className="clients-table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Référence</th>
                  <th>Territoire</th>
                  <th>Type</th>
                  <th>Commandes</th>
                  <th>CA Total</th>
                  <th>Fidélité</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-cell">
                        <div className="client-avatar small">
                          {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="client-name">{client.firstName} {client.lastName}</div>
                          <div className="client-address">{client.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{client.email}</span>
                        </div>
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{client.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="reference">{client.reference}</span>
                    </td>
                    <td>
                      <span className="territory">{client.territory}</span>
                    </td>
                    <td>
                      <span 
                        className="client-type"
                        style={{ 
                          backgroundColor: getClientTypeColor(client.clientType),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        {client.clientType}
                      </span>
                    </td>
                    <td>
                      <div className="orders-info">
                        <span className="orders-count">{client.totalOrders}</span>
                        <small>Moy: {formatCurrency(client.avgOrderValue)}</small>
                      </div>
                    </td>
                    <td>
                      <span className="revenue">{formatCurrency(client.totalSpent)}</span>
                    </td>
                    <td>
                      <div className="loyalty-score">
                        <div className="loyalty-bar">
                          <div 
                            className="loyalty-fill"
                            style={{ width: `${client.loyaltyScore}%` }}
                          ></div>
                        </div>
                        <span>{client.loyaltyScore}%</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getClientStatusColor(client.status) }}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="action-btn" 
                          title="Voir détails"
                          disabled
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Modifier"
                          disabled
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="action-btn" 
                          title="Contacter"
                          onClick={() => handleContactClient(client)}
                        >
                          <MessageSquare size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-content">
          <div className="analytics-grid">
            {/* Analyse des performances */}
            <div className="analytics-card">
              <h3>Performance par Territoire</h3>
              <div className="territory-stats">
                {Object.entries(
                  clients.reduce((acc, client) => {
                    if (!acc[client.territory]) {
                      acc[client.territory] = { clients: 0, revenue: 0, orders: 0 };
                    }
                    acc[client.territory].clients++;
                    acc[client.territory].revenue += client.totalSpent;
                    acc[client.territory].orders += client.totalOrders;
                    return acc;
                  }, {})
                ).map(([territory, stats]) => (
                  <div key={territory} className="territory-stat">
                    <div className="territory-name">{territory}</div>
                    <div className="territory-metrics">
                      <span>{stats.clients} clients</span>
                      <span>{formatCurrency(stats.revenue)}</span>
                      <span>{stats.orders} commandes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analyse des types de clients */}
            <div className="analytics-card">
              <h3>Analyse par Type de Client</h3>
              <div className="client-type-analysis">
                {Object.entries(
                  clients.reduce((acc, client) => {
                    if (!acc[client.clientType]) {
                      acc[client.clientType] = { count: 0, avgSpent: 0, totalSpent: 0 };
                    }
                    acc[client.clientType].count++;
                    acc[client.clientType].totalSpent += client.totalSpent;
                    return acc;
                  }, {})
                ).map(([type, data]) => {
                  data.avgSpent = data.totalSpent / data.count;
                  return (
                    <div key={type} className="type-analysis">
                      <div className="type-header">
                        <span className="type-name">{type}</span>
                        <span className="type-count">{data.count} clients</span>
                      </div>
                      <div className="type-metrics">
                        <div className="metric">
                          <span className="metric-label">CA Moyen</span>
                          <span className="metric-value">{formatCurrency(data.avgSpent)}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">CA Total</span>
                          <span className="metric-value">{formatCurrency(data.totalSpent)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opportunités */}
            <div className="analytics-card opportunities">
              <h3>Opportunités Identifiées</h3>
              <div className="opportunities-list">
                <div className="opportunity">
                  <div className="opportunity-icon">
                    <TrendingUp size={20} />
                  </div>
                  <div className="opportunity-content">
                    <h4>Clients à fort potentiel</h4>
                    <p>2 clients avec score de fidélité élevé mais faible CA</p>
                    <button 
                      className="opportunity-action"
                      disabled
                    >
                      Analyser
                    </button>
                  </div>
                </div>
                <div className="opportunity">
                  <div className="opportunity-icon">
                    <AlertCircle size={20} />
                  </div>
                  <div className="opportunity-content">
                    <h4>Clients à risque</h4>
                    <p>1 prospect sans commande récente</p>
                    <button 
                      className="opportunity-action"
                      disabled
                    >
                      Relancer
                    </button>
                  </div>
                </div>
                <div className="opportunity">
                  <div className="opportunity-icon">
                    <Star size={20} />
                  </div>
                  <div className="opportunity-content">
                    <h4>Territoire prometteur</h4>
                    <p>Casablanca concentre 40% du CA</p>
                    <button 
                      className="opportunity-action"
                      disabled
                    >
                      Développer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale Top Clients */}
      {showTopClients && (
        <div className="modal-overlay" onClick={handleCloseTopClients}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tous les Top Clients</h3>
              <button className="close-btn" onClick={handleCloseTopClients}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="top-clients-list">
                {clients
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .map((client, index) => (
                    <div key={client.id} className="top-client-item">
                      <div className="client-rank">#{index + 1}</div>
                      <div className="client-avatar">
                        {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                      </div>
                      <div className="client-info">
                        <div className="client-name">{client.firstName} {client.lastName}</div>
                        <div className="client-territory">{client.territory}</div>
                      </div>
                      <div className="client-revenue">
                        {formatCurrency(client.totalSpent)}
                      </div>
                      <div className="client-actions">
                        <button 
                          className="action-btn"
                          onClick={() => {
                            handleViewClient(client);
                            handleCloseTopClients();
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modale Opportunités */}
      {showOpportunityModal && selectedOpportunity && (
        <div className="modal-overlay" onClick={handleCloseOpportunityModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Action sur Opportunité</h3>
              <button className="close-btn" onClick={handleCloseOpportunityModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="opportunity-details">
                <h4>{selectedOpportunity.description}</h4>
                <p>Choisissez l'action à effectuer :</p>
                <div className="opportunity-actions">
                  {selectedOpportunity.type === 'analyze' && (
                    <button 
                      className="action-button primary"
                      disabled
                    >
                      <BarChart2 size={16} />
                      Lancer l'analyse
                    </button>
                  )}
                  {selectedOpportunity.type === 'contact' && (
                    <button 
                      className="action-button primary"
                      disabled
                    >
                      <MessageSquare size={16} />
                      Programmer relance
                    </button>
                  )}
                  {selectedOpportunity.type === 'develop' && (
                    <button 
                      className="action-button primary"
                      disabled
                    >
                      <Target size={16} />
                      Créer plan de développement
                    </button>
                  )}
                  <button 
                    className="action-button secondary"
                    onClick={handleCloseOpportunityModal}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... existing modals ... */}
    </div>
  );
};

export default CommercialDashboardUnifie;
