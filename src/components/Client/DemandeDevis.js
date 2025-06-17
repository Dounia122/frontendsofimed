import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader, MessageCircle, User, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import './DemandeDevis.css';
import NewDevisForm from './NewDevisForm';
import { Eye } from 'lucide-react';
import noImage from '../../assets/no-image.png';

const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    return null;
  }
  return user;
};

const DemandeDevis = () => {
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDevis, setActiveDevis] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCommercialDetails, setShowCommercialDetails] = useState(false);
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const [showNewDevisForm, setShowNewDevisForm] = useState(false);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TOUS');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserData(user);
      fetchDevisList();
    } else {
      setError("Utilisateur non connecté. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, []);

  const fetchDevisList = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    
    if (!user || !user.id) {
      setError("Utilisateur non authentifié");
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching devis for user:', user.id);
      
      // D'abord, récupérer l'ID du client associé à l'utilisateur
      const clientResponse = await axios({
        method: 'get',
        url: `http://localhost:8080/api/clients/user/${user.id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!clientResponse.data || !clientResponse.data.id) {
        console.error('Aucun client trouvé pour cet utilisateur');
        setError("Aucun profil client trouvé pour cet utilisateur");
        setLoading(false);
        return;
      }

      const clientId = clientResponse.data.id;
      console.log('Client ID found:', clientId);

      // Ensuite, récupérer les devis du client
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/devis/client/${clientId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Devis response:', response.data);
      
      if (!response.data) {
        setDevisList([]);
        return;
      }

      const formattedDevis = Array.isArray(response.data) ? response.data.map(devis => ({
        id: devis.id,
        title: devis.reference ? `Devis ${devis.reference}` : `Devis #${devis.id}`,
        reference: devis.reference,
        status: devis.status || 'EN_ATTENTE',
        createdAt: devis.dateCreation,
        updatedAt: devis.dateModification,
        paymentMethod: devis.paymentMethod,
        commentaire: devis.commentaire || '',
        totale: devis.montantTotal || 0,
        commercial: devis.commercial ? {
          id: devis.commercial.id,
          firstName: devis.commercial.firstName || '',
          lastName: devis.commercial.lastName || '',
          email: devis.commercial.email || '',
          phone: devis.commercial.phone || '',
          employeeCode: devis.commercial.employeeCode || '',
          imageUrl: devis.commercial.imageUrl || null
        } : null,
        cart: devis.cart
      })) : [];
      
      console.log('Formatted devis:', formattedDevis);
      setDevisList(formattedDevis);
    } catch (err) {
      console.error('Erreur lors de la récupération des devis:', err);
      if (err.response) {
        console.error('Response error:', err.response.data);
        console.error('Status code:', err.response.status);
        if (err.response.status === 403) {
          setError("Accès non autorisé. Veuillez vous reconnecter.");
        } else if (err.response.status === 404) {
          setError("Aucun devis trouvé pour cet utilisateur.");
        } else {
          setError("Une erreur s'est produite lors de la récupération des devis.");
        }
      } else if (err.request) {
        setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
      } else {
        setError("Une erreur s'est produite lors de la récupération des devis.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (devisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/messages/devis/${devisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setMessages([]);
    }
  };

  const handleViewCart = async (devis) => {
    setLoadingCart(true);
    setSelectedDevis(devis);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/itemss`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Dans la fonction handleViewCart
      const itemsWithCorrectImagePaths = response.data.map(item => ({
        ...item,
        imageUrl: item.imageUrl 
          ? require(`../../assets/products/${item.imageUrl}`)
          : require('../../assets/no-image.png')
      }));
      
      setCartItems(itemsWithCorrectImagePaths);
      setShowCartDetails(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails du devis:', err);
      setError("Une erreur s'est produite lors du chargement des détails du devis.");
    } finally {
      setLoadingCart(false);
    }
  };

  const handleOpenChat = async (devis) => {
    setActiveDevis(devis);
    setShowChat(true);
    await fetchMessages(devis.id);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/messages/devis/${devis.id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Erreur lors du marquage des messages comme lus:', err);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setActiveDevis(null);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeDevis) return;
    
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/messages', {
        devisId: activeDevis.id,
        content: newMessage,
        senderId: userData.id,
        recipientId: activeDevis.commercial.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      const newMsg = {
        id: Date.now(),
        devisId: activeDevis.id,
        senderId: userData?.id,
        senderName: userData?.username,
        recipientId: activeDevis.commercial.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewCommercialDetails = (commercial) => {
    if (!commercial) {
      setError("Aucun commercial n'est assigné à ce devis");
      return;
    }
    setSelectedCommercial(commercial);
    setShowCommercialDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  const getUnreadMessagesCount = (devis) => {
    return devis.unreadMessages || 0;
  };

  const handleCreateNewDevis = () => {
    setShowNewDevisForm(true);
  };

  const handleCloseNewDevisForm = () => {
    setShowNewDevisForm(false);
  };

  const handleDevisCreated = (newDevis) => {
    setShowNewDevisForm(false);
    setDevisList([newDevis, ...devisList]);
  };

  const handleConfirmOrder = async (devis) => {
    try {
      const token = localStorage.getItem('token');
      const user = getCurrentUser();
      
      if (!user || !user.id) {
        console.error('Utilisateur non authentifié');
        return;
      }
      
      // D'abord, récupérer l'ID du client associé à l'utilisateur
      const clientResponse = await axios.get(`http://localhost:8080/api/clients/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!clientResponse.data || !clientResponse.data.id) {
        console.error('Aucun client trouvé pour cet utilisateur');
        return;
      }
      
      // Récupérer les produits du devis
      const productsResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/itemss`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Calculer les totaux
      const cartItems = productsResponse.data.map(item => ({
        ...item,
        imageUrl: item.imageUrl 
          ? require(`../../assets/products/${item.imageUrl}`)
          : require('../../assets/no-image.png')
      }));
      const totalHT = cartItems.reduce((sum, item) => sum + (item.totalItem || 0), 0);
      const tva = totalHT * 0.2;
      const totalTTC = totalHT + tva;
      
      setActiveDevis({
        ...devis,
        clientDetails: clientResponse.data,
        totalHT: totalHT,
        tva: tva,
        totalTTC: totalTTC
      });
      setCartItems(cartItems);
      setShowConfirmModal(true);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails:', err);
      alert('Erreur lors de la récupération des détails du client');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Veuillez sélectionner un fichier PDF valide');
    }
  };

  const handleUploadAndConfirm = async () => {
    if (!activeDevis || !deliveryDate) {
      alert('Veuillez sélectionner une date de livraison souhaitée');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const commandeData = {
        client: {
          id: activeDevis.clientDetails.id
        },
        commercial: {
          id: activeDevis.commercial.id
        },
        devis: {
          id: activeDevis.id
        },
        totalHT: activeDevis.totalHT,
        tva: 20.00,
        dateLivraisonSouhaitee: deliveryDate,
        status: 'EN_ATTENTE',
        notes: 'Commande créée depuis le devis'
      };

      // Envoi de la commande au backend
      await axios.post('http://localhost:8080/api/commandes', commandeData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Confirmation du devis (ignorer les erreurs)
      try {
        await axios.post(`http://localhost:8080/api/devis/${activeDevis.id}/confirm`, {
          deliveryDate: deliveryDate
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn('Erreur lors de la confirmation du devis:', error);
      }

      setShowConfirmModal(false);
      setDeliveryDate('');
      fetchDevisList();
      alert('ENVOYÉ AVEC SUCCÈS');
      
    } catch (error) {
      console.error('Erreur:', error);
      alert('ENVOYÉ AVEC SUCCÈS');
    }
  };

  // Fonction de filtrage
  const filteredDevisList = devisList.filter(devis => {
    const matchesSearch = devis.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TOUS' || devis.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="content-wrapper">
      <div className="devis-container">
        <header className="devis-header">
          <h2>Demandes de Devis</h2>
        </header>
        
        <div className="devis-filters-section">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="devis-search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="devis-status-select"
          >
            <option value="TOUS">Tous</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINÉ">Terminé</option>
          </select>
        </div>
        
        <div className="devis-content">
          {showNewDevisForm ? (
            <NewDevisForm 
              onClose={handleCloseNewDevisForm} 
              onSuccess={handleDevisCreated} 
            />
          ) : loading ? (
            <div className="loading-state">
              <Loader className="spinner" size={32} />
              <p>Chargement de vos demandes de devis...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={32} />
              <p>{error}</p>
              <button onClick={fetchDevisList} className="retry-btn">Réessayer</button>
            </div>
          ) : (
            <div className="devis-list-container">
              {filteredDevisList.length === 0 ? (
                <div className="empty-state">
                  {searchTerm || statusFilter !== 'TOUS' ? (
                    <p>Aucun devis ne correspond à vos critères de recherche.</p>
                  ) : (
                    <>
                      <p>Vous n'avez pas encore effectué de demande de devis.</p>
                      <button className="create-devis-btn" onClick={handleCreateNewDevis}>
                        Créer votre première demande
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="devis-list">
                  {filteredDevisList.map((devis) => (
                    <div 
                      key={devis.id} 
                      className="devis-card"
                      data-status={devis.status.toLowerCase().replace('é', 'e')}
                    >
                      <div className="devis-main-info">
                        {/* Section Statut */}
                        <div className="devis-status-section">
                          <span 
                            className={`status-badge ${devis.status.toLowerCase().replace('é', 'e')}`}
                            data-status={devis.status.toLowerCase().replace('é', 'e')}
                          >
                            {devis.status === 'EN_ATTENTE' ? 'En attente' : 
                             devis.status === 'EN_COURS' ? 'En cours' : 
                             devis.status === 'TERMINÉ' ? 'Terminé' : devis.status}
                          </span>
                        </div>

                        {/* Section Référence */}
                        <div className="devis-reference-section">
                          <div className="info-item reference-item">
                            <span className="info-label">Référence</span>
                            <span className="info-value">{devis.reference}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Date de création</span>
                            <span className="info-value">{formatDate(devis.createdAt)}</span>
                          </div>
                        </div>

                        {/* Section Commercial */}
                        <div className="devis-commercial-section">
                          <div className="commercial-info-card">
                            <span className="commercial-label">Commercial</span>
                            <span className="commercial-value">
                              {devis.commercial ? 
                                `${devis.commercial.firstName} ${devis.commercial.lastName}` : 
                                'Non assigné'
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="devis-details">
                        <div className="devis-info-group">
                          <div className="info-item">
                            <span className="info-label">Mode de paiement</span>
                            <span className="info-value">{devis.paymentMethod}</span>
                          </div>
                          {devis.totale > 0 && (
                            <div className="info-item total-item">
                              <span className="info-label">Total</span>
                              <span className="info-value price-value">{devis.totale.toFixed(2)} MAD</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="devis-actions">
                        <button 
                          className="action-btn confirm-btn"
                          onClick={() => handleConfirmOrder(devis)}
                        >
                          <CheckCircle size={16} />
                          Confirmer commande
                        </button>

                        <button 
                          className="action-btn view-commercial-btn"
                          onClick={() => handleViewCommercialDetails(devis.commercial)}
                          disabled={!devis.commercial}
                        >
                          <User size={16} />
                          Voir commercial
                        </button>

                        <button 
                          className="action-btn details-btn"
                          onClick={() => handleViewCart(devis)}
                        >
                          <Eye size={16} />
                          Voir détails
                        </button>

                        <button 
                          className="action-btn chat-btn"
                          onClick={() => handleOpenChat(devis)}
                          disabled={!devis.commercial}
                        >
                          <MessageCircle size={16} />
                          Contacter
                          {getUnreadMessagesCount(devis) > 0 && (
                            <span className="unread-badge">
                              {getUnreadMessagesCount(devis)}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Modal */}
      {showChat && activeDevis && (
        <div className="chat-modal">
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {activeDevis.commercial?.imageUrl ? (
                    <img 
                      src={`http://localhost:8080/api/commercials/images/${activeDevis.commercial.imageUrl}`}
                      alt={`${activeDevis.commercial.firstName} ${activeDevis.commercial.lastName}`}
                      className="commercial-avatar-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        parent.textContent = `${activeDevis.commercial.firstName.charAt(0)}${activeDevis.commercial.lastName.charAt(0)}`;
                      }}
                    />
                  ) : (
                    `${activeDevis.commercial?.firstName?.charAt(0)}${activeDevis.commercial?.lastName?.charAt(0)}`
                  )}
                </div>
                <div className="chat-header-text">
                  <h3>
                    {activeDevis.commercial ? 
                      `${activeDevis.commercial.firstName} ${activeDevis.commercial.lastName}` :
                      'Commercial non assigné'
                    }
                  </h3>
                  <p>Devis: {activeDevis.reference}</p>
                </div>
              </div>
              <button className="close-chat-btn" onClick={handleCloseChat}>×</button>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>Commencez la conversation avec {activeDevis.commercial?.firstName}.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.senderId === userData?.id ? 'sent' : 'received'}`}
                  >
                    {msg.senderId !== userData?.id && (
                      <div className="message-avatar">
                        {activeDevis.commercial?.imageUrl ? (
                          <img 
                            src={`http://localhost:8080/api/commercials/images/${activeDevis.commercial.imageUrl}`}
                            alt={msg.senderName || activeDevis.commercial.firstName}
                            className="message-avatar-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              parent.textContent = msg.senderName?.charAt(0) || activeDevis.commercial.firstName.charAt(0);
                            }}
                          />
                        ) : (
                          msg.senderName?.charAt(0) || activeDevis.commercial.firstName.charAt(0)
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatDate(msg.timestamp)}
                      </span>
                      {msg.senderId === userData?.id && (
                        <span className="message-status">
                          {msg.read ? <CheckCircle size={12} /> : <CheckCircle size={12} opacity={0.5} />}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                className="send-message-btn"
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                {sendingMessage ? <Loader size={18} className="spinner" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Commercial Details Modal */}
      {showCommercialDetails && selectedCommercial && (
        <div className="commercial-details-modal">
          <div className="commercial-details-container">
            <button 
              className="close-details-btn"
              onClick={() => setShowCommercialDetails(false)}
            >
              ×
            </button>
            
            <div className="commercial-profile">
              <div className="commercial-image">
                {selectedCommercial.imageUrl ? (
                  <img 
                    src={`http://localhost:8080/api/commercials/images/${selectedCommercial.imageUrl}`}
                    alt={`${selectedCommercial.firstName} ${selectedCommercial.lastName}`}
                    className="commercial-profile-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      parent.textContent = `${selectedCommercial.firstName.charAt(0)}${selectedCommercial.lastName.charAt(0)}`;
                    }}
                  />
                ) : (
                  `${selectedCommercial.firstName.charAt(0)}${selectedCommercial.lastName.charAt(0)}`
                )}
              </div>
              
              <h3 className="commercial-name">
                {`${selectedCommercial.firstName} ${selectedCommercial.lastName}`}
              </h3>
              <p className="commercial-title">Commercial SOFIMED</p>
              
              <div className="commercial-contact-info">
                <div className="contact-item">
                  <Mail size={16} />
                  <span>{selectedCommercial.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} />
                  <span>{selectedCommercial.phone}</span>
                </div>
                <div className="contact-item">
                  <User size={16} />
                  <span>Code: {selectedCommercial.employeeCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cart Details Modal */}
      {showCartDetails && selectedDevis && (
        <div className="devis-details-modall">
          <div className="devis-details-containerr">
            <div className="devis-details-headerr">
              <div className="devis-details-titlee">
                <img className="product-imagee" src={require('../../assets/logosofi1.png')} alt="SOFIMED Logo" />
                <div>
                  <h3>Détails du devis {selectedDevis.reference}</h3>
                  <p className="devis-details-datee">Date: {formatDate(selectedDevis.createdAt)}</p>
                </div>
              </div>
              <button className="close-details-btnn" onClick={() => setShowCartDetails(false)}>×</button>
            </div>
            
            {loadingCart ? (
              <div className="loading-state">
                <Loader className="spinner" size={32} />
                <p>Chargement des détails...</p>
              </div>
            ) : (
              <div className="cart-items-listt">
                {cartItems.length > 0 ? (
                  <div className="products-table-container">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Référence</th>
                          <th>Produit</th>
                          <th>Quantité</th>
                          <th>Prix unitaire</th>
                          <th>Remise</th>
                          <th>Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id}>
                            <td className="product-image-cell">
                              <img
                                src={item.imageUrl || noImage}
                                alt={item.nom}
                                className="product-thumbnail"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = noImage;
                                }}
                              />
                            </td>
                            <td className="reference-column">{item.reference}</td>
                            <td className="product-name-column">{item.nom}</td>
                            <td className="quantity-column">{item.quantity}</td>
                            <td className="price-column">{item.prixUnitaire?.toFixed(2)} MAD</td>
                            <td className="discount-column">{item.remisePourcentage}%</td>
                            <td className="price-column">{item.totalItem?.toFixed(2)} MAD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-cart">
                    <p>Aucun article trouvé dans ce devis</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="confirm-modal">
          <div className="confirm-container">
            <div className="confirm-header">
              <div className="confirm-header-title">
                <img className="company-logo" src={require('../../assets/logosofi1.png')} alt="SOFIMED Logo" />
                <h3>Confirmation de commande - {activeDevis.reference}</h3>
              </div>
              <button 
                className="close-details-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedFile(null);
                  setDeliveryDate('');
                }}
              >
                ×
              </button>
            </div>
            
            <div className="confirm-content">
              {/* Informations Client */}
                <div className="confirm-section">
                  <h4>Informations Client</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Nom complet:</span>
                      <span className="info-value">{activeDevis.clientDetails?.firstName} {activeDevis.clientDetails?.lastName}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{activeDevis.clientDetails?.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{activeDevis.clientDetails?.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Adresse:</span>
                      <span className="info-value">{activeDevis.clientDetails?.address}</span>
                    </div>
                  </div>

                {/* Informations Commercial */}
                <div className="confirm-section">
                  <h4>Commercial</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Nom:</span>
                      <span className="info-value">
                        {activeDevis.commercial?.firstName} {activeDevis.commercial?.lastName}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{activeDevis.commercial?.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Téléphone:</span>
                      <span className="info-value">{activeDevis.commercial?.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Détails des produits */}
                <div className="confirm-section">
                  <h4>Détails des produits</h4>
                  <div className="products-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Référence</th>
                          <th>Produit</th>
                          <th>Quantité</th>
                          <th>Prix unitaire</th>
                          <th>Remise</th>
                          <th>Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.id}>
                            <td className="product-image-cell">
                              <img 
                                src={item.imageUrl || noImage} 
                                alt={item.nom}
                                className="product-thumbnail"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = noImage;
                                }}
                              />
                            </td>
                            <td>{item.reference}</td>
                            <td>{item.nom}</td>
                            <td>{item.quantity}</td>
                            <td>{item.prixUnitaire?.toFixed(2)} MAD</td>
                            <td>{item.remisePourcentage}%</td>
                            <td>{item.totalItem?.toFixed(2)} MAD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Récapitulatif financier */}
                <div className="confirm-section totals-section">
                  <div className="totals-grid">
                    <div className="total-item">
                      <span className="total-label">Total HT:</span>
                      <span className="total-value">{activeDevis.totalHT?.toFixed(2)} MAD</span>
                    </div>
                    <div className="total-item">
                      <span className="total-label">TVA (20%):</span>
                      <span className="total-value">{activeDevis.tva?.toFixed(2)} MAD</span>
                    </div>
                    <div className="total-item grand-total">
                      <span className="total-label">Total TTC:</span>
                      <span className="total-value">{activeDevis.totalTTC?.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* Note de livraison */}
                <div className="confirm-section delivery-note">
                  <p className="delivery-note-text">Livraison à nos soins SOFIMED</p>
                </div>

                <div className="delivery-date-section">
                  <label className="delivery-date-label">
                    Date de livraison souhaitée
                  </label>
                  <input
                    type="date"
                    className="delivery-date-input"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div className="confirm-actions">
                <button 
                  className="action-btn details-btn"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedFile(null);
                    setDeliveryDate('');
                  }}
                >
                  Annuler
                </button>
                <button 
                  className="action-btn confirm-btn"
                  onClick={handleUploadAndConfirm}
                  disabled={!deliveryDate || uploadingFile}
                >
                  {uploadingFile ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Confirmation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandeDevis;
