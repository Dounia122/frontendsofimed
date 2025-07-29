import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import notificationService from '../services/notificationService';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Récupérer les notifications existantes
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('📥 Chargement des notifications pour userId:', userId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/notifications/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
      console.log('✅ Notifications chargées:', response.data.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications:', error);
      setConnectionError('Erreur de chargement des notifications');
    }
  }, [userId]);

  // Gérer les nouvelles notifications en temps réel
  const handleNewNotification = useCallback((notification) => {
    console.log('🔔 Nouvelle notification reçue:', notification);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Afficher une notification toast
    showToastNotification(notification);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/notifications/${notificationId}/read`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  }, []);

  // Afficher une notification toast
  const showToastNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('🚀 Initialisation des notifications pour userId:', userId);
      
      fetchNotifications();
      
      // Demander la permission pour les notifications
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Connecter WebSocket avec gestion d'erreur
      try {
        notificationService.connect(userId, handleNewNotification);
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        console.error('❌ Erreur de connexion WebSocket:', error);
        setConnectionError('Erreur de connexion WebSocket');
        setIsConnected(false);
      }
      
      return () => {
        console.log('🔌 Nettoyage des notifications');
        notificationService.disconnect();
        setIsConnected(false);
      };
    }
  }, [userId, fetchNotifications, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionError,
    markAsRead,
    fetchNotifications
  };
};