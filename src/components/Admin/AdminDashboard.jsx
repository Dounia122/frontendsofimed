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
import './AdminDashboard.css';
import noImage from '../../assets/no-image.png';

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
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedDepartement, setSelectedDepartement] = useState('all');
  const [selectedPeriode, setSelectedPeriode] = useState('mois');
  
  // Nouveaux états pour les filtres avancés
  const [activeTab, setActiveTab] = useState('overview');
  const [productFilter, setProductFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
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

  // Données de démonstration pour les produits les plus vendus
  const produitsDemo = [
    {
      id: 10,
      reference: "SDG082",
      nom: "Compteur d'air comprimé SDG082",
      description: "Mesure précise du débit et de la consommation. Précision, répétabilité et dynamique de mesure élevées.",
      imageUrl: "P3.jpg",
      prixUnitaire: 1200,
      quantiteVendue: 42,
      departement: "Automatisation",
      chiffreAffaires: 50400
    },
    {
      id: 47,
      reference: "1002010102",
      nom: "Filtre LFM-1/4-D-MIDI",
      description: "Filtre LFM-1/4-D-MIDI haute performance pour air comprimé d'usage général.",
      imageUrl: "P34.jpg",
      prixUnitaire: 350,
      quantiteVendue: 38,
      departement: "Filtration",
      chiffreAffaires: 13300
    },
    {
      id: 24,
      reference: "PI2897",
      nom: "Capteur de pression combiné PI2897",
      description: "Capteur de pression combiné pour l'industrie alimentaire et des boissons.",
      imageUrl: "P13.jpg",
      prixUnitaire: 890,
      quantiteVendue: 35,
      departement: "Capteurs",
      chiffreAffaires: 31150
    },
    {
      id: 22,
      reference: "EVL-100200",
      nom: "LANTERNE 200W/LED-20502 lm Antidéflagrant ATEX",
      description: "La nouvelle série de luminaires LED EVL a été développée dans le but de redéfinir les concepts de compacité.",
      imageUrl: "P11.jpg",
      prixUnitaire: 1850,
      quantiteVendue: 28,
      departement: "Électrique-ATEX",
      chiffreAffaires: 51800
    },
    {
      id: 7,
      reference: "T1510 AAAAD/NES/NF/ANE/0504",
      nom: "Pompe à double membranes 3\" corps Alum/Membranes neoprene",
      description: "Les pompes pneumatiques à double membrane (AODD)...",
      imageUrl: "p2.jpg",
      prixUnitaire: 1499.99,
      quantiteVendue: 25,
      departement: "Pompage",
      chiffreAffaires: 37499.75
    }
  ];

  // Données de démonstration pour les commerciaux les plus performants
  const commerciauxDemo = [
    {
      id: 1,
      employeeCode: "COM-001",
      firstName: "Mohammed",
      lastName: "El Ammari",
      email: "m.elammari@sofimed.com",
      phone: "+212 661-234567",
      totalVentes: 587000,
      nombreDevis: 78,
      nombreCommandes: 53,
      tauxConversion: 68,
      territoireId: 1,
      pseudo: "MEA"
    },
    {
      id: 2,
      employeeCode: "COM-002",
      firstName: "Youssef",
      lastName: "Benkirane",
      email: "y.benkirane@sofimed.com",
      phone: "+212 662-345678",
      totalVentes: 498000,
      nombreDevis: 65,
      nombreCommandes: 47,
      tauxConversion: 72,
      territoireId: 2,
      pseudo: "YBK"
    },
    {
      id: 3,
      employeeCode: "COM-003",
      firstName: "Karim",
      lastName: "Tazi",
      email: "k.tazi@sofimed.com",
      phone: "+212 663-456789",
      totalVentes: 435000,
      nombreDevis: 59,
      nombreCommandes: 38,
      tauxConversion: 65,
      territoireId: 3,
      pseudo: "KTZ"
    },
    {
      id: 4,
      employeeCode: "COM-004",
      firstName: "Samir",
      lastName: "Alaoui",
      email: "s.alaoui@sofimed.com",
      phone: "+212 664-567890",
      totalVentes: 389000,
      nombreDevis: 52,
      nombreCommandes: 32,
      tauxConversion: 62,
      territoireId: 4,
      pseudo: "SAL"
    },
    {
      id: 5,
      employeeCode: "COM-005",
      firstName: "Nadia",
      lastName: "Benjelloun",
      email: "n.benjelloun@sofimed.com",
      phone: "+212 665-678901",
      totalVentes: 356000,
      nombreDevis: 48,
      nombreCommandes: 28,
      tauxConversion: 58,
      territoireId: 5,
      pseudo: "NBJ"
    }
  ];

  // Données de démonstration pour les statistiques de ventes
  const statsVentesDemo = {
    totalVentes: 2265000,
    totalDevis: 302,
    totalCommandes: 198,
    tauxConversionGlobal: 66,
    moyenneParCommande: 7500,
    croissanceMensuelle: 12.5
  };

  // Données de démonstration pour les statistiques par département
  const statsParDepartementDemo = [
    { departement: "Automatisation", ventes: 625000, pourcentage: 27.6 },
    { departement: "Filtration", ventes: 485000, pourcentage: 21.4 },
    { departement: "Électrique-ATEX", ventes: 420000, pourcentage: 18.5 },
    { departement: "PTE", ventes: 380000, pourcentage: 16.8 },
    { departement: "Pompage", ventes: 355000, pourcentage: 15.7 }
  ];

  // Données de démonstration pour les ventes par période
  const ventesPeriodeHebdoDemo = [
    { periode: "Semaine 1 - 2023", ventes: 45000, devis: 8, commandes: 5, tauxConversion: 62.5 },
    { periode: "Semaine 2 - 2023", ventes: 52000, devis: 10, commandes: 7, tauxConversion: 70 },
    { periode: "Semaine 3 - 2023", ventes: 48000, devis: 9, commandes: 6, tauxConversion: 66.7 },
    { periode: "Semaine 4 - 2023", ventes: 55000, devis: 11, commandes: 8, tauxConversion: 72.7 }
  ];

  const ventesPeriodeMensuelleDemo = [
    { periode: "Janvier 2023", ventes: 175000, devis: 25, commandes: 16, tauxConversion: 64 },
    { periode: "Février 2023", ventes: 190000, devis: 28, commandes: 18, tauxConversion: 64.3 },
    { periode: "Mars 2023", ventes: 210000, devis: 30, commandes: 20, tauxConversion: 66.7 },
    { periode: "Avril 2023", ventes: 195000, devis: 27, commandes: 17, tauxConversion: 63 },
    { periode: "Mai 2023", ventes: 225000, devis: 32, commandes: 22, tauxConversion: 68.8 },
    { periode: "Juin 2023", ventes: 240000, devis: 35, commandes: 24, tauxConversion: 68.6 }
  ];

  const ventesPeriodeTrimestrielleDemo = [
    { periode: "T1 2023", ventes: 575000, devis: 83, commandes: 54, tauxConversion: 65.1 },
    { periode: "T2 2023", ventes: 660000, devis: 94, commandes: 63, tauxConversion: 67 },
    { periode: "T3 2023", ventes: 710000, devis: 98, commandes: 68, tauxConversion: 69.4 },
    { periode: "T4 2023", ventes: 680000, devis: 95, commandes: 65, tauxConversion: 68.4 }
  ];

  const ventesPeriodeAnnuelleDemo = [
    { periode: "2020", ventes: 1850000, devis: 265, commandes: 172, tauxConversion: 64.9 },
    { periode: "2021", ventes: 2050000, devis: 285, commandes: 188, tauxConversion: 66 },
    { periode: "2022", ventes: 2265000, devis: 302, commandes: 198, tauxConversion: 65.6 },
    { periode: "2023", ventes: 2625000, devis: 370, commandes: 250, tauxConversion: 67.6 }
  ];

  // Fonction pour obtenir l'icône de tendance
  const getTrendIcon = useCallback((evolution) => {
    if (evolution > 0) return { icon: faChartLine, color: 'var(--success-color)', direction: '↗' };
    if (evolution < 0) return { icon: faChartLine, color: 'var(--danger-color)', direction: '↘' };
    return { icon: faChartLine, color: 'var(--gray-500)', direction: '→' };
  }, []);

  // Fonction pour ajouter/supprimer des filtres de produits
  const toggleProductFilter = useCallback((departement) => {
    setSelectedProducts(prev => 
      prev.includes(departement)
        ? prev.filter(d => d !== departement)
        : [...prev, departement]
    );
  }, []);

  // Fonction d'exportation
  const handleExport = useCallback((format) => {
    console.log(`Exportation en format ${format}`);
    // Ici vous pouvez implémenter la logique d'exportation
  }, []);

  // Fonction de filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = topProduits;
    
    if (productFilter) {
      filtered = filtered.filter(product => 
        product.nom.toLowerCase().includes(productFilter.toLowerCase()) ||
        product.reference.toLowerCase().includes(productFilter.toLowerCase()) ||
        product.departement.toLowerCase().includes(productFilter.toLowerCase())
      );
    }
    
    if (selectedProducts.length > 0) {
      filtered = filtered.filter(product => 
        selectedProducts.includes(product.departement)
      );
    }
    
    return filtered;
  }, [topProduits, productFilter, selectedProducts]);

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

  // Fonction pour obtenir les données de période en fonction de la sélection
  const getVentesParPeriode = useCallback(() => {
    switch(selectedPeriode) {
      case 'semaine':
        return ventesPeriodeHebdoDemo;
      case 'mois':
        return ventesPeriodeMensuelleDemo;
      case 'trimestre':
        return ventesPeriodeTrimestrielleDemo;
      case 'annee':
        return ventesPeriodeAnnuelleDemo;
      default:
        return ventesPeriodeMensuelleDemo;
    }
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
              <span>{trend.direction} {Math.abs(evolution)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // Simuler le chargement des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Dans un environnement réel, vous feriez des appels API ici
        // const token = localStorage.getItem('token');
        // const response = await axios.get(`${API_BASE_URL}/statistiques`, {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        
        // Simuler un délai de chargement
        setTimeout(() => {
          setTopProduits(produitsDemo);
          setTopCommerciaux(commerciauxDemo);
          setStatsVentes(statsVentesDemo);
          setStatsParDepartement(statsParDepartementDemo);
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
  }, [dateRange, selectedDepartement, selectedPeriode, getVentesParPeriode]);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Chargement du tableau de bord professionnel...</p>
    </div>
  );

  return (
    <div className="admin-dashboard-container">
      <h2 className="page-title">
        <FontAwesomeIcon icon={faChartLine} className="title-icon" />
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

      {/* Filtres Avancés */}
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
            <option value="annee">Analyse Annuelle</option>
          </select>
        </div>

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} className="filter-icon" />
            Plage de dates
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          />
          <span>à</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            Département
          </label>
          <select
            value={selectedDepartement}
            onChange={(e) => setSelectedDepartement(e.target.value)}
          >
            <option value="all">Tous les départements</option>
            <option value="Automatisation">Automatisation</option>
            <option value="Filtration">Filtration</option>
            <option value="Électrique-ATEX">Électrique-ATEX</option>
            <option value="PTE">PTE</option>
            <option value="Pompage">Pompage</option>
          </select>
        </div>

        {/* Nouveau filtre de produits */}
        <div className="product-filter-group">
          <label>
            <FontAwesomeIcon icon={faSearch} className="filter-icon" />
            Recherche de produits
          </label>
          <div className="product-search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher par nom, référence ou département..."
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="product-search-input"
            />
          </div>
          
          {/* Tags de filtres actifs */}
          {selectedProducts.length > 0 && (
            <div className="product-filter-tags">
              {selectedProducts.map(dept => (
                <span key={dept} className="filter-tag">
                  {dept}
                  <span 
                    className="remove-tag" 
                    onClick={() => toggleProductFilter(dept)}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}
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
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <FontAwesomeIcon icon={faMoneyBill} />
          Ventes
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

          {/* Section des ventes par période */}
          <div className="dashboard-main-sections">
            <div className="dashboard-section period-section">
              <div className="section-header">
                <h3>
                  <FontAwesomeIcon icon={getPeriodicIcon(selectedPeriode)} />
                  Évolution des ventes par {getPeriodeLabel(selectedPeriode)}
                </h3>
              </div>
              
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Période</th>
                      <th>Ventes (MAD)</th>
                      <th>Devis</th>
                      <th>Commandes</th>
                      <th>Taux de Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventesParPeriode.map((periode, index) => (
                      <tr key={index}>
                        <td className="period-cell">
                          <span className={`period-badge period-badge-${selectedPeriode}`}>
                            {periode.periode}
                          </span>
                        </td>
                        <td className="amount-cell">{formatMAD(periode.ventes)}</td>
                        <td className="devis-cell">{periode.devis}</td>
                        <td className="commandes-cell">{periode.commandes}</td>
                        <td className="conversion-cell">
                          <div className="conversion-wrapper">
                            <div 
                              className="conversion-bar" 
                              style={{ width: `${periode.tauxConversion}%` }}
                            ></div>
                            <span className="conversion-text">
                              {periode.tauxConversion}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <th>
                      Département
                      <button onClick={() => {
                        const depts = [...new Set(topProduits.map(p => p.departement))];
                        depts.forEach(dept => {
                          if (!selectedProducts.includes(dept)) {
                            toggleProductFilter(dept);
                          }
                        });
                      }}>
                        <FontAwesomeIcon icon={faFilter} />
                      </button>
                    </th>
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
                        <span 
                          className="filter-tag"
                          onClick={() => toggleProductFilter(produit.departement)}
                          style={{ cursor: 'pointer' }}
                        >
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
                <div key={index} className="department-card">
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