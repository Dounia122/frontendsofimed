import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, faExclamationCircle, faTimes, faShoppingBag, 
  faUsers, faUserTie, faBoxOpen, faTag, 
  faSearch, faFilter, faCalendarAlt, faListOl, 
  faSyncAlt, faEye, faCheck, faFileInvoice, 
  faUser, faIdCard, faEnvelope, faPhone, 
  faMapMarkerAlt, faBriefcase, faIdBadge, 
  faShoppingCart, faCalculator, faTruck, faCalendarDay,
  faMoneyBill, faChartBar, faChartPie, faPercent,
  faCalendarWeek, faCalendar, faChartArea, faCog,
  faDownload, faFileExcel, faFilePdf, faPrint
} from '@fortawesome/free-solid-svg-icons';
import { Chart as ChartJS, LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './AdminDashboard.css';
import noImage from '../../assets/no-image.png';

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
  LineElement, BarElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend
);

const API_BASE_URL = 'http://localhost:8080/api';

const AdminDashboard = () => {
  // Fonction de formatage MAD
  const formatMAD = (value) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartement, setSelectedDepartement] = useState('all');
  const [selectedPeriode, setSelectedPeriode] = useState('mois');
  
  // États pour les filtres avancés simplifiés
  const [activeTab, setActiveTab] = useState('overview');
  const [showTooltip, setShowTooltip] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // États pour les données
  const [topProduits, setTopProduits] = useState([]);
  const [topCommerciaux, setTopCommerciaux] = useState([]);
  const [statsVentes, setStatsVentes] = useState({});
  const [statsParDepartement, setStatsParDepartement] = useState([]);
  const [ventesParPeriode, setVentesParPeriode] = useState([]);
  
  // Données de comparaison pour les tendances
  const [statsComparison, setStatsComparison] = useState({
    ventesEvolution: 12.5,
    devisEvolution: 8.3,
    commandesEvolution: 15.2,
    conversionEvolution: 3.1
  });

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  // Mise à jour des données de produits par période
  const getProduitsDataByPeriod = useCallback(() => {
    // Dans getProduitsDataByPeriod
    const baseData = {
      semaine: {
        produits: [
          {
            id: 10,
            reference: "SDG082",
            nom: "Compteur d'air comprimé SDG082",
            description: "Mesure précise du débit et de la consommation. Précision élevée.",
            imageUrl: "P3.jpg",
            prixUnitaire: 600,
            quantiteVendue: 1,
            departement: "Automatisation",
            chiffreAffaires: 600
          },
          {
            id: 47,
            reference: "1002010102", 
            nom: "Filtre LFM-1/4-D-MIDI",
            description: "Filtre haute performance pour air comprimé.",
            imageUrl: "P34.jpg",
            prixUnitaire: 175,
            quantiteVendue: 1,
            departement: "Filtration",
            chiffreAffaires: 175
          },
          {
            id: 35,
            reference: "EAX445",
            nom: "Boîtier ATEX EAX445",
            description: "Boîtier antidéflagrant pour environnements explosifs.",
            imageUrl: "P20.jpg",
            prixUnitaire: 750,
            quantiteVendue: 2,
            departement: "Électrique-ATEX",
            chiffreAffaires: 1500
          }
        ],
        stats: {
          totalVentes: 2275,
          totalDevis: 3,
          totalCommandes: 2,
          tauxConversionGlobal: 67,
          moyenneParCommande: 1138,
          croissanceMensuelle: 4.2
        }
      },
      mois: {
        produits: [
          {
            id: 10,
            reference: "SDG082",
            nom: "Compteur d'air comprimé SDG082",
            description: "Mesure précise du débit et de la consommation. Précision élevée.",
            imageUrl: "P3.jpg",
            prixUnitaire: 600,
            quantiteVendue: 4,
            departement: "Automatisation",
            chiffreAffaires: 2400
          },
          {
            id: 47,
            reference: "1002010102",
            nom: "Filtre LFM-1/4-D-MIDI",
            description: "Filtre haute performance pour air comprimé.",
            imageUrl: "P34.jpg",
            prixUnitaire: 175,
            quantiteVendue: 3,
            departement: "Filtration",
            chiffreAffaires: 525
          },
          {
            id: 35,
            reference: "EAX445",
            nom: "Boîtier ATEX EAX445",
            description: "Boîtier antidéflagrant pour environnements explosifs.",
            imageUrl: "P20.jpg",
            prixUnitaire: 750,
            quantiteVendue: 5,
            departement: "Électrique-ATEX",
            chiffreAffaires: 3750
          }
        ],
        stats: {
          totalVentes: 6675,
          totalDevis: 10,
          totalCommandes: 6,
          tauxConversionGlobal: 60,
          moyenneParCommande: 1113,
          croissanceMensuelle: 6.4
        }
      },
      trimestre: {
        produits: [
          {
            id: 10,
            reference: "SDG082",
            nom: "Compteur d'air comprimé SDG082",
            description: "Mesure précise du débit et de la consommation. Précision élevée.",
            imageUrl: "P3.jpg",
            prixUnitaire: 600,
            quantiteVendue: 10,
            departement: "Automatisation",
            chiffreAffaires: 6000
          },
          {
            id: 47,
            reference: "1002010102",
            nom: "Filtre LFM-1/4-D-MIDI",
            description: "Filtre haute performance pour air comprimé.",
            imageUrl: "P34.jpg",
            prixUnitaire: 175,
            quantiteVendue: 8,
            departement: "Filtration",
            chiffreAffaires: 1400
          },
          {
            id: 35,
            reference: "EAX445",
            nom: "Boîtier ATEX EAX445",
            description: "Boîtier antidéflagrant pour environnements explosifs.",
            imageUrl: "P20.jpg",
            prixUnitaire: 750,
            quantiteVendue: 12,
            departement: "Électrique-ATEX",
            chiffreAffaires: 9000
          }
        ],
        stats: {
          totalVentes: 16400,
          totalDevis: 20,
          totalCommandes: 12,
          tauxConversionGlobal: 60,
          moyenneParCommande: 1367,
          croissanceMensuelle: 8.8
        }
      }
    };
    
    return baseData[selectedPeriode] || baseData.mois;
  }, [selectedPeriode]);

  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = useCallback((evolution) => {
    if (evolution > 0) return { icon: faChartLine, color: 'var(--success-color)', direction: '↗' };
    if (evolution < 0) return { icon: faChartLine, color: 'var(--danger-color)', direction: '↘' };
    return { icon: faChartLine, color: 'var(--gray-500)', direction: '→' };
  }, []);

  // Fonction d'exportation
  const handleExport = useCallback((format) => {
    console.log(`Exportation en format ${format}`);
    // Ici vous pouvez implémenter la logique d'exportation
  }, []);

  // Produits filtrés simplifiés (sans recherche textuelle)
  const filteredProducts = useMemo(() => {
    const currentData = getProduitsDataByPeriod();
    let filtered = currentData.produits;
    
    // Filtrage uniquement par département
    if (selectedDepartement !== 'all') {
      filtered = filtered.filter(product => 
        product.departement === selectedDepartement
      );
    }
    
    return filtered;
  }, [selectedPeriode, selectedDepartement, getProduitsDataByPeriod]);

  // Fonction de tri
  const sortedData = useCallback((data, config) => {
    if (!config.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[config.key] < b[config.key]) {
        return config.direction === 'asc' ? -1 : 1;
      }
      if (a[config.key] > b[config.key]) {
        return config.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, []);

  // Fonction pour obtenir les données de période en fonction de la sélection - MISE À JOUR
  const getVentesParPeriode = useCallback(() => {
    const ventesData = {
      semaine: [
        { periode: "Semaine 1", ventes: 2275, devis: 3, commandes: 2, tauxConversion: 67 },
        { periode: "Semaine 2", ventes: 2500, devis: 4, commandes: 3, tauxConversion: 75 },
        { periode: "Semaine 3", ventes: 2100, devis: 3, commandes: 2, tauxConversion: 67 },
        { periode: "Semaine 4", ventes: 2400, devis: 4, commandes: 3, tauxConversion: 75 }
      ],
      mois: [
        { periode: "Janvier", ventes: 6675, devis: 10, commandes: 6, tauxConversion: 60 },
        { periode: "Février", ventes: 7200, devis: 12, commandes: 7, tauxConversion: 58 },
        { periode: "Mars", ventes: 6900, devis: 11, commandes: 7, tauxConversion: 64 }
      ],
      trimestre: [
        { periode: "T1", ventes: 8400, devis: 20, commandes: 12, tauxConversion: 60 },
        { periode: "T2", ventes: 7800, devis: 18, commandes: 11, tauxConversion: 61 }
      ]
    };
    
    return ventesData[selectedPeriode] || ventesData.mois;
  }, [selectedPeriode]);

  // Fonctions utilitaires
  const getPeriodicIcon = useCallback((periode) => {
    switch(periode) {
      case 'semaine': return faCalendarWeek;
      case 'mois': return faCalendar;
      case 'trimestre': return faCalendarAlt;
      case 'annee': return faChartArea;
      default: return faCalendar;
    }
  }, []);

  const getPeriodeLabel = useCallback((periode) => {
    switch(periode) {
      case 'semaine': return 'semaine';
      case 'mois': return 'mois';
      case 'trimestre': return 'trimestre';
      case 'annee': return 'année';
      default: return 'mois';
    }
  }, []);

  // Options et données pour les graphiques
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatMAD(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatMAD(value).replace('MAD', '');
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatMAD(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatMAD(value).replace('MAD', '');
          }
        }
      }
    }
  };

  const commercialBarChartOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatMAD(context.raw);
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatMAD(value).replace('MAD', '');
          }
        }
      }
    }
  };

  // Données pour les graphiques
  const lineChartData = {
    labels: ventesParPeriode.map(item => item.periode),
    datasets: [
      {
        label: 'Ventes (MAD)',
        data: ventesParPeriode.map(item => item.ventes),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const barChartData = {
    labels: statsParDepartement.map(item => item.departement),
    datasets: [
      {
        label: 'Ventes par département (MAD)',
        data: statsParDepartement.map(item => item.ventes),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const commercialBarChartData = {
    labels: topCommerciaux.map(item => `${item.firstName} ${item.lastName}`),
    datasets: [
      {
        label: 'Ventes par commercial (MAD)',
        data: topCommerciaux.map(item => item.totalVentes),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Composant StatCard amélioré avec tendances
  const StatCard = useCallback(({ title, value, icon, className, trend, evolution }) => {
    return (
      <div className={`stat-card ${className}`}>
        <div className="stat-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="stat-content">
          <h3>{title}</h3>
          <p>{value}</p>
          {trend && (
            <div className="stat-trend" style={{ color: trend.color }}>
              <FontAwesomeIcon icon={trend.icon} className="trend-icon" />
              <span>{trend.direction} {Math.abs(evolution)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // Simuler le chargement des données - MISE À JOUR
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simuler un délai de chargement
        setTimeout(() => {
          const currentData = getProduitsDataByPeriod();
          setTopProduits(currentData.produits.slice(0, 3)); // Réduire à 3 produits max
          setStatsVentes(currentData.stats);
          
          // Tous les commerciaux avec données réduites
          // Dans useEffect pour les commerciaux
          setTopCommerciaux([
            {
              id: 1,
              employeeCode: "COM-001",
              firstName: "Mohammed",
              lastName: "El Ammari",
              email: "m.elammari@sofimed.com",
              phone: "+212 661-234567",
              totalVentes: 8700,
              nombreDevis: 38,
              nombreCommandes: 26,
              tauxConversion: 68,
              territoireId: 1,
              pseudo: "MEA",
              imageUrl: "commercial1.jpg"
            },
            {
              id: 2,
              employeeCode: "COM-002",
              firstName: "Youssef",
              lastName: "Benkirane",
              email: "y.benkirane@sofimed.com",
              phone: "+212 662-345678",
              totalVentes: 7490,
              nombreDevis: 32,
              nombreCommandes: 23,
              tauxConversion: 72,
              territoireId: 2,
              pseudo: "YBK",
              imageUrl: "commercial2.jpg"
            },
            {
              id: 3,
              employeeCode: "COM-003",
              firstName: "Karim",
              lastName: "Tazi",
              email: "k.tazi@sofimed.com",
              phone: "+212 663-456789",
              totalVentes: 6950,
              nombreDevis: 28,
              nombreCommandes: 19,
              tauxConversion: 68,
              territoireId: 3,
              pseudo: "KTZ",
              imageUrl: "commercial3.jpg"
            },
            {
              id: 4,
              employeeCode: "COM-004",
              firstName: "Samir",
              lastName: "Alaoui",
              email: "s.alaoui@sofimed.com",
              phone: "+212 664-567890",
              totalVentes: 5780,
              nombreDevis: 25,
              nombreCommandes: 17,
              tauxConversion: 68,
              territoireId: 4,
              pseudo: "SAL",
              imageUrl: "commercial4.jpg"
            },
            {
              id: 5,
              employeeCode: "COM-005",
              firstName: "Nadia",
              lastName: "Benjelloun",
              email: "n.benjelloun@sofimed.com",
              phone: "+212 665-678901",
              totalVentes: 4650,
              nombreDevis: 22,
              nombreCommandes: 15,
              tauxConversion: 68,
              territoireId: 5,
              pseudo: "NBJ",
              imageUrl: "commercial5.jpg"
            }
          ]);
          
          // Données départements réduites
          // Dans setStatsParDepartement
setStatsParDepartement([
  { departement: "Automatisation", ventes: 8125, pourcentage: 27.6 },
  { departement: "Filtration", ventes: 6425, pourcentage: 21.4 },
  { departement: "Électrique-ATEX", ventes: 5100, pourcentage: 18.5 },
  { departement: "Capteurs", ventes: 4900, pourcentage: 16.8 },
  { departement: "Pompage", ventes: 4775, pourcentage: 15.7 }
]);
          
          // Mettre à jour les ventes par période
          setVentesParPeriode(getVentesParPeriode());
          
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
                          err.response?.data || 
                          err.message || 
                          'Erreur lors du chargement des données';
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartement, selectedPeriode, getProduitsDataByPeriod, getVentesParPeriode]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement du tableau de bord professionnel...</p>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <h2 className="page-title">
        <FontAwesomeIcon icon={faChartBar} className="title-icon" />
        Tableau de Bord Administratif Professionnel
       
      </h2>

      {error && (
        <div className="alert alert-error">
          <FontAwesomeIcon icon={faExclamationCircle} className="alert-icon" />
          <span>{error}</span>
          <button className="btn-close-alert" onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Filtres Simplifiés */}
      <div className="filters-section">
        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
            Période d'analyse
          </label>
          <select 
            value={selectedPeriode} 
            onChange={(e) => setSelectedPeriode(e.target.value)}
            className="period-select"
          >
            <option value="semaine">Analyse Hebdomadaire</option>
            <option value="mois">Analyse Mensuelle</option>
            <option value="trimestre">Analyse Trimestrielle</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={() => window.location.reload()}>
          <FontAwesomeIcon icon={faSyncAlt} />
          Actualiser
        </button>
      </div>

      {/* Onglets de navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FontAwesomeIcon icon={faChartBar} />
          Vue d'ensemble
        </button>
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <FontAwesomeIcon icon={faBoxOpen} />
          Produits
        </button>
        <button 
          className={`tab-button ${activeTab === 'commercials' ? 'active' : ''}`}
          onClick={() => setActiveTab('commercials')}
        >
          <FontAwesomeIcon icon={faUserTie} />
          Commerciaux
        </button>
        <button 
          className={`tab-button ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          <FontAwesomeIcon icon={faBriefcase} />
          Départements
        </button>
      </div>

      {/* Statistiques globales avec tendances */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-stats">
            <StatCard 
              title="Ventes Totales" 
              value={formatMAD(statsVentes.totalVentes)} 
              icon={faMoneyBill}
              className="stat-card-primary"
              trend={getTrendIcon(statsComparison.ventesEvolution)}
              evolution={statsComparison.ventesEvolution}
            />
            <StatCard 
              title="Nombre de Devis" 
              value={statsVentes.totalDevis} 
              icon={faFileInvoice}
              className="stat-card-info"
              trend={getTrendIcon(statsComparison.devisEvolution)}
              evolution={statsComparison.devisEvolution}
            />
            <StatCard 
              title="Nombre de Commandes" 
              value={statsVentes.totalCommandes} 
              icon={faShoppingCart}
              className="stat-card-warning"
              trend={getTrendIcon(statsComparison.commandesEvolution)}
              evolution={statsComparison.commandesEvolution}
            />
            <StatCard 
              title="Taux de Conversion" 
              value={`${statsVentes.tauxConversionGlobal}%`} 
              icon={faPercent}
              className="stat-card-success"
              trend={getTrendIcon(statsComparison.conversionEvolution)}
              evolution={statsComparison.conversionEvolution}
            />
          </div>

          {/* Section des graphiques */}
          <div className="dashboard-main-sections">
            {/* Graphique d'évolution des ventes */}
            <div className="dashboard-section chart-section">
              <div className="section-header">
                <h3>
                  <FontAwesomeIcon icon={faChartLine} />
                  Évolution des ventes sur {getPeriodeLabel(selectedPeriode)}
                </h3>
              </div>
              <div className="chart-container">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Graphique de répartition par département */}
            <div className="dashboard-section chart-section">
              <div className="section-header">
                <h3>
                  <FontAwesomeIcon icon={faChartPie} />
                  Répartition des ventes par département
                </h3>
              </div>
              <div className="chart-container">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

            {/* Graphique de performance des commerciaux */}
            <div className="dashboard-section chart-section">
              <div className="section-header">
                <h3>
                  <FontAwesomeIcon icon={faUserTie} />
                  Performance des commerciaux (Top 5)
                </h3>
              </div>
              <div className="chart-container">
                <Bar data={commercialBarChartData} options={commercialBarChartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Section Produits avec filtres avancés */}
      {activeTab === 'products' && (
        <div className="dashboard-main-sections">
          <div className="dashboard-section products-section">
            <div className="section-header">
              <h3>
                <FontAwesomeIcon icon={faBoxOpen} />
                Produits les plus performants ({filteredProducts.length})
              </h3>
              <div className="section-actions">
                <button onClick={() => handleExport('excel')} className="btn-export">
                  <FontAwesomeIcon icon={faFileExcel} /> Excel
                </button>
                <button onClick={() => handleExport('pdf')} className="btn-export">
                  <FontAwesomeIcon icon={faFilePdf} /> PDF
                </button>
              </div>
            </div>
            
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Référence</th>
                    <th>Département</th>
                    <th>Quantité</th>
                    <th>CA (MAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((produit) => (
                    <tr key={produit.id}>
                      <td className="product-cell">
                        <div className="product-info">
                          <img 
                            src={produit.imageUrl ? require(`../../assets/products/${produit.imageUrl}`) : noImage} 
                            alt={produit.nom}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = noImage;
                            }}
                          />
                          <div>
                            <div className="product-name">{produit.nom}</div>
                            <div className="product-description">
                              {produit.description.substring(0, 80)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="reference-cell">
                        <span className="reference-badge">{produit.reference}</span>
                      </td>
                      <td>
                        <span className="filter-tag">
                          {produit.departement}
                        </span>
                      </td>
                      <td className="quantity-cell">{produit.quantiteVendue}</td>
                      <td className="amount-cell">{formatMAD(produit.chiffreAffaires)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section Commerciaux */}
      {activeTab === 'commercials' && (
        <div className="dashboard-main-sections">
          <div className="dashboard-section commercials-section">
            <div className="section-header">
              <h3>
                <FontAwesomeIcon icon={faUserTie} />
                Performance des commerciaux
              </h3>
            </div>
            
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Commercial</th>
                    <th>Code</th>
                    <th>Devis</th>
                    <th>Commandes</th>
                    <th>Taux de Conversion</th>
                    <th>Montant Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topCommerciaux.map((commercial) => (
                    <tr key={commercial.id}>
                      <td className="commercial-cell">
                        <div className="commercial-info">
                          <div className="commercial-avatar">
                            {commercial.firstName.charAt(0)}{commercial.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="commercial-name">
                              {commercial.firstName} {commercial.lastName}
                            </div>
                            <div className="commercial-email">{commercial.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="code-cell">
                        <span className="code-badge">{commercial.employeeCode}</span>
                      </td>
                      <td className="devis-cell">{commercial.nombreDevis}</td>
                      <td className="commandes-cell">{commercial.nombreCommandes}</td>
                      <td className="conversion-cell">
                        <div className="conversion-wrapper">
                          <div 
                            className="conversion-bar" 
                            style={{ width: `${commercial.tauxConversion}%` }}
                          ></div>
                          <span className="conversion-text">
                            {commercial.tauxConversion}%
                          </span>
                        </div>
                      </td>
                      <td className="amount-cell">{formatMAD(commercial.totalVentes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section Départements */}
      {activeTab === 'departments' && (
        <div className="dashboard-main-sections">
          <div className="dashboard-section departments-section">
            <div className="section-header">
              <h3>
                <FontAwesomeIcon icon={faBriefcase} />
                Performance par département
              </h3>
            </div>
            
            <div className="departments-grid">
              {statsParDepartement.map((dept, index) => (
                <div key={dept.departement} className="department-card">
                  <div className="department-header">
                    <h4>{dept.departement}</h4>
                    <span className="department-percentage">{dept.pourcentage}%</span>
                  </div>
                  <div className="department-progress">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${dept.pourcentage}%` }}
                    ></div>
                  </div>
                  <div className="department-amount">{formatMAD(dept.ventes)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
