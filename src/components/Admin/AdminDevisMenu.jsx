import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Button, DatePicker, Space, Tag, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import moment from 'moment';
import './AdminDevisMenu.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminDevisMenu = () => {
  const [devis, setDevis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    commercial: 'all',
    dateRange: [],
  });

  // Simuler la récupération des données (à remplacer par votre API)
  useEffect(() => {
    fetchDevis();
  }, []);

  const fetchDevis = async () => {
    try {
      const response = await fetch('/api/admin/devis');
      const data = await response.json();
      setDevis(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      setLoading(false);
    }
  };

  // Fonction de filtrage des devis
  const getFilteredDevis = () => {
    return devis.filter(devis => {
      const matchesSearch = (
        devis.reference.toLowerCase().includes(searchText.toLowerCase()) ||
        devis.client.nom.toLowerCase().includes(searchText.toLowerCase()) ||
        devis.commercial.nom.toLowerCase().includes(searchText.toLowerCase())
      );

      const matchesStatus = filters.status === 'all' || devis.status === filters.status;
      const matchesCommercial = filters.commercial === 'all' || devis.commercial.id === filters.commercial;
      
      const matchesDate = !filters.dateRange.length || (
        moment(devis.date).isBetween(filters.dateRange[0], filters.dateRange[1], 'day', '[]')
      );

      return matchesSearch && matchesStatus && matchesCommercial && matchesDate;
    });
  };

  const columns = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      sorter: (a, b) => a.reference.localeCompare(b.reference),
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
      render: (client) => (
        <Tooltip title={`${client.email} - ${client.telephone}`}>
          <Space>
            <UserOutlined />
            {client.nom}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Commercial',
      dataIndex: 'commercial',
      key: 'commercial',
      render: (commercial) => (
        <Tooltip title={commercial.email}>
          <Space>
            <TeamOutlined />
            {commercial.nom}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => `${montant.toFixed(2)} €`,
      sorter: (a, b) => a.montant - b.montant,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          en_attente: { color: 'orange', text: 'En attente' },
          valide: { color: 'green', text: 'Validé' },
          refuse: { color: 'red', text: 'Refusé' },
        };
        return <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDevis(record.id)}
          >
            Voir
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDevis = (devisId) => {
    // Navigation vers la page de détails du devis
    // À implémenter selon votre système de routing
    console.log('Voir devis:', devisId);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleStatusChange = (value) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleCommercialChange = (value) => {
    setFilters(prev => ({ ...prev, commercial: value }));
  };

  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };

  return (
    <div className="admin-devis-menu">
      <div className="admin-devis-header">
        <h1>Gestion des Devis</h1>
        <div className="admin-devis-filters">
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearchChange}
            className="search-input"
          />
          <Select
            defaultValue="all"
            onChange={handleStatusChange}
            className="status-filter"
          >
            <Option value="all">Tous les statuts</Option>
            <Option value="en_attente">En attente</Option>
            <Option value="valide">Validé</Option>
            <Option value="refuse">Refusé</Option>
          </Select>
          <Select
            defaultValue="all"
            onChange={handleCommercialChange}
            className="commercial-filter"
          >
            <Option value="all">Tous les commerciaux</Option>
            {/* À remplir dynamiquement avec vos commerciaux */}
          </Select>
          <RangePicker
            onChange={handleDateRangeChange}
            className="date-filter"
          />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={getFilteredDevis()}
        loading={loading}
        rowKey="id"
        className="devis-table"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} devis`,
        }}
      />
    </div>
  );
};

export default AdminDevisMenu; 