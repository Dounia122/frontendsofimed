import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, Download, Eye } from 'lucide-react';
import './CommercialHistorique.css';

const CommercialHistorique = () => {
  const [historique, setHistorique] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('TOUS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      const mockData = [
        {
          id: 1,
          reference: "DEV-2024-001",
          type: "DEVIS",
          date: "2024-01-15",
          statut: "TERMINÉ",
          client: "Entreprise ABC",
          montant: 1500.00
        },
        // Ajouter plus de données mock ici
      ];
      setHistorique(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredHistorique = historique.filter(item => {
    const matchesSearch = 
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || item.date === filterDate;
    const matchesType = filterType === 'TOUS' || item.type === filterType;

    return matchesSearch && matchesDate && matchesType;
  });

  return (
    <div className="historique-container">
      <div className="historique-header">
        <h1>Historique des Activités</h1>
        <div className="historique-filters">
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="Rechercher par référence ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-filter">
            <Calendar size={20} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="type-filter"
          >
            <option value="TOUS">Tous les types</option>
            <option value="DEVIS">Devis</option>
            <option value="FACTURE">Facture</option>
            <option value="CONSULTATION">Consultation</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement de l'historique...</p>
        </div>
      ) : filteredHistorique.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>Aucune activité trouvée</p>
        </div>
      ) : (
        <div className="historique-table-container">
          <table className="historique-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Date</th>
                <th>Client</th>
                <th>Statut</th>
                <th>Montant</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistorique.map(item => (
                <tr key={item.id}>
                  <td>{item.reference}</td>
                  <td>
                    <span className={`type-badge ${item.type.toLowerCase()}`}>
                      {item.type}
                    </span>
                  </td>
                  <td>{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                  <td>{item.client}</td>
                  <td>
                    <span className={`status-badge ${item.statut.toLowerCase()}`}>
                      {item.statut}
                    </span>
                  </td>
                  <td className="montant">{item.montant.toFixed(2)} €</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view" title="Voir les détails">
                        <Eye size={18} />
                      </button>
                      <button className="action-btn download" title="Télécharger">
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CommercialHistorique;