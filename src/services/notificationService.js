import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class NotificationService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId, onNotificationReceived) {
    try {
      console.log('🔌 Tentative de connexion WebSocket pour userId:', userId);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ Token d\'authentification manquant');
        return;
      }
      
      // Utiliser la nouvelle API Client au lieu de Stomp.over
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': userId.toString()
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
          console.log('✅ WebSocket connecté:', frame);
          this.connected = true;
          this.reconnectAttempts = 0;
          
          // S'abonner aux notifications pour cet utilisateur
          const notificationSub = this.stompClient.subscribe(
            `/topic/notifications/${userId}`, 
            (notification) => {
              console.log('📬 Notification reçue:', notification.body);
              const notificationData = JSON.parse(notification.body);
              onNotificationReceived(notificationData);
            },
            { 'Authorization': `Bearer ${token}` }
          );
          
          // S'abonner aux mises à jour de devis
          const devisSub = this.stompClient.subscribe(
            `/topic/devis/updates/${userId}`, 
            (update) => {
              console.log('📝 Mise à jour devis reçue:', update.body);
              const updateData = JSON.parse(update.body);
              onNotificationReceived({
                type: 'devis_update',
                title: 'Mise à jour de devis',
                message: `Le devis ${updateData.reference} a été mis à jour`,
                data: updateData
              });
            },
            { 'Authorization': `Bearer ${token}` }
          );
          
          // S'abonner aux nouveaux messages
          const messageSub = this.stompClient.subscribe(
            `/topic/messages/${userId}`, 
            (message) => {
              console.log('💬 Nouveau message reçu:', message.body);
              const messageData = JSON.parse(message.body);
              onNotificationReceived({
                type: 'new_message',
                title: 'Nouveau message',
                message: `Nouveau message de ${messageData.senderName}`,
                data: messageData
              });
            },
            { 'Authorization': `Bearer ${token}` }
          );
          
          // Stocker les abonnements
          this.subscriptions.set('notifications', notificationSub);
          this.subscriptions.set('devis', devisSub);
          this.subscriptions.set('messages', messageSub);
        },
        onStompError: (frame) => {
          console.error('❌ Erreur STOMP:', frame);
          this.connected = false;
          this.handleReconnect(userId, onNotificationReceived);
        },
        onWebSocketError: (error) => {
          console.error('❌ Erreur WebSocket:', error);
          this.connected = false;
        },
        onDisconnect: () => {
          console.log('🔌 WebSocket déconnecté');
          this.connected = false;
        }
      });
      
      // Activer la connexion
      this.stompClient.activate();
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation WebSocket:', error);
    }
  }

  handleAuthError() {
    console.log('🔄 Gestion de l\'erreur d\'authentification');
    // Nettoyer le localStorage et rediriger vers la connexion
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  handleReconnect(userId, onNotificationReceived) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId, onNotificationReceived);
      }, 3000 * this.reconnectAttempts);
    } else {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  disconnect() {
    if (this.stompClient && this.connected) {
      console.log('🔌 Déconnexion WebSocket');
      
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      this.stompClient.deactivate();
      this.connected = false;
    }
  }

  sendNotification(destination, notification) {
    if (this.stompClient && this.connected && this.stompClient.connected) {
      console.log('📤 Envoi notification vers:', destination, notification);
      const token = localStorage.getItem('token');
      try {
        this.stompClient.publish({
          destination: destination,
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(notification)
        });
      } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de la notification:', error);
        this.connected = false;
        this.attemptReconnectAndSend(destination, notification);
      }
    } else {
      console.warn('⚠️ WebSocket non connecté, impossible d\'envoyer la notification');
      this.attemptReconnectAndSend(destination, notification);
    }
  }

  attemptReconnectAndSend(destination, notification) {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId && this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log('🔄 Tentative de reconnexion pour envoi de notification...');
      this.connect(userId, () => {});
      
      // Attendre que la connexion soit établie avant de réessayer
      const checkConnection = setInterval(() => {
        if (this.connected && this.stompClient && this.stompClient.connected) {
          clearInterval(checkConnection);
          console.log('✅ Reconnexion réussie, renvoi de la notification');
          this.sendNotification(destination, notification);
        }
      }, 500);
      
      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!this.connected) {
          console.error('❌ Échec de la reconnexion pour l\'envoi de notification');
        }
      }, 10000);
    } else {
      console.error('❌ Impossible de reconnecter pour envoyer la notification');
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new NotificationService();