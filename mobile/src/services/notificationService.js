// src/services/notificationService.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { onSnapshot, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';

class NotificationService {
  constructor() {
    this.messaging = null;
    this.reportListeners = new Map();
    this.vapidKey = "BITUvXzzSStF3YF7iK3NUykOrUb5GJ6uuGfByKd3q7nCCzOmZmbXRDseJhim55gAmCI8D-J_6jemgc8og-UV7cE";
  }

  // Initialiser les notifications
  async initialize() {
    try {
      if (!('Notification' in window)) {
        console.warn('Notifications non supportées par ce navigateur');
        return false;
      }

      // Demander la permission
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Permission notifications accordée');
          this.initializeFirebaseMessaging();
          return true;
        } else {
          console.warn('Permission notifications refusée');
          return false;
        }
      } else if (Notification.permission === 'granted') {
        this.initializeFirebaseMessaging();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
      return false;
    }
  }

  // Initialiser Firebase Messaging
  async initializeFirebaseMessaging() {
    try {
      this.messaging = getMessaging();
      await this.getFCMToken();
      this.setupForegroundListener();
      console.log('Firebase Messaging initialisé');
    } catch (error) {
      console.error('Erreur Firebase Messaging:', error);
    }
  }

  // Obtenir le token FCM
  async getFCMToken() {
    try {
      if (!this.messaging) return null;
      
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });
      
      if (token) {
        console.log('🔑 Token FCM obtenu:', token);
        localStorage.setItem('fcmToken', token);
        return token;
      } else {
        console.log('⚠️ Pas de token FCM disponible');
        return null;
      }
    } catch (error) {
      console.error('Erreur récupération token FCM:', error);
      return null;
    }
  }

  // Écouter les messages en foreground
  setupForegroundListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📬 Notification reçue en foreground:', payload);
      
      if (payload.notification) {
        this.showLocalNotification(payload.notification, payload.data);
      }
    });
  }

  // Surveiller les changements de statut pour un utilisateur
  watchUserReports(userId) {
    if (!userId) {
      console.error('UserId requis pour surveiller les signalements');
      return;
    }

    // Arrêter l'écoute précédente si elle existe
    this.stopWatchingUserReports(userId);

    console.log(`👁️ Surveillance des signalements pour l'utilisateur: ${userId}`);

    // Créer la requête pour les signalements de cet utilisateur
    const q = query(
      collection(db, 'reporting'),
      where('user_id', '==', userId),
      orderBy('reporting_date', 'desc')
    );

    // Écouter les changements
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const oldData = change.doc.data();
          const newData = change.doc.data();

          // Vérifier si le statut a changé
          if (oldData.status !== newData.status) {
            console.log(`🔄 Changement de statut détecté pour le signalement: ${change.doc.id}`);
            console.log('Ancien statut:', oldData.status);
            console.log('Nouveau statut:', newData.status);
            
            this.sendStatusChangeNotification(change.doc.id, newData);
          }
        }
      });
    }, (error) => {
      console.error('Erreur écoute signalements:', error);
    });

    // Stocker le listener pour pouvoir l'arrêter plus tard
    this.reportListeners.set(userId, unsubscribe);
    
    console.log(`Surveillance démarrée pour ${userId}`);
  }

  // Arrêter la surveillance pour un utilisateur
  stopWatchingUserReports(userId) {
    const unsubscribe = this.reportListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.reportListeners.delete(userId);
      console.log(`🛑 Surveillance arrêtée pour ${userId}`);
    }
  }

  // Arrêter tous les listeners
  stopAllListeners() {
    this.reportListeners.forEach((unsubscribe, userId) => {
      unsubscribe();
      console.log(`🛑 Surveillance arrêtée pour ${userId}`);
    });
    this.reportListeners.clear();
  }

  // Envoyer une notification de changement de statut
  sendStatusChangeNotification(reportId, reportData) {
    const statusText = this.getStatusText(reportData.status);
    const problemType = this.getProblemTypeText(reportData.problem_type);
    
    const notification = {
      title: '📢 Mise à jour de votre signalement',
      body: `Le signalement "${problemType}" est maintenant: ${statusText}`,
      icon: '/assets/icon/favicon.png',
      badge: '/assets/icon/notification-badge.png',
      data: {
        reportId: reportId,
        type: 'status_change',
        status: reportData.status
      }
    };

    this.showLocalNotification(notification);
  }

  // Afficher une notification locale
  showLocalNotification(notification, data = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('Notifications non autorisées');
      return;
    }

    const options = {
      body: notification.body,
      icon: notification.icon || '/assets/icon/favicon.png',
      badge: notification.badge || '/assets/icon/notification-badge.png',
      data: { ...notification.data, ...data },
      tag: `report_${notification.data?.reportId || Date.now()}`,
      requireInteraction: false
    };

    try {
      const notif = new Notification(notification.title, options);

      // Gérer le clic sur la notification
      notif.onclick = (event) => {
        event.preventDefault();
        notif.close();
        
        // Rediriger vers la page des signalements
        if (notification.data?.reportId) {
          window.location.href = `/my-reports#${notification.data.reportId}`;
        } else {
          window.location.href = '/my-reports';
        }
      };

      // Fermer automatiquement après 5 secondes
      setTimeout(() => notif.close(), 5000);
      
      console.log('Notification affichée:', notification.title);
    } catch (error) {
      console.error('Erreur affichage notification:', error);
    }
  }

  // Envoyer une notification de test
  async sendTestNotification() {
    const testNotification = {
      title: '🔔 Test de notification',
      body: 'Les notifications fonctionnent correctement !',
      icon: '/assets/icon/favicon.png'
    };

    this.showLocalNotification(testNotification);
  }

  // Vérifier si les notifications sont activées
  areNotificationsEnabled() {
    return Notification.permission === 'granted';
  }

  // Effacer toutes les notifications
  async clearAllNotifications() {
    if (navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications();
        
        notifications.forEach(notification => {
          notification.close();
        });
        
        console.log(`🗑️ ${notifications.length} notification(s) effacée(s)`);
      } catch (error) {
        console.error('Erreur effacement notifications:', error);
      }
    }
  }

  // Méthodes utilitaires
  getStatusText(status) {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'nouveau':
        return 'Nouveau';
      case 'in_progress':
      case 'en_cours':
        return 'En cours';
      case 'completed':
      case 'termine':
        return 'Terminé';
      default:
        return status || 'Inconnu';
    }
  }

  getProblemTypeText(problemType) {
    const types = {
      'nid_poule': 'Nid de poule',
      'mid_poule': 'Nid de poule',
      'fissure': 'Fissure',
      'affaissement': 'Affaissement',
      'degradation': 'Dégradation',
      'autre': 'Autre'
    };
    
    return types[problemType] || problemType || 'Signalement';
  }

  // Demander la permission des notifications
  async requestPermission() {
    if (!('Notification' in window)) {
      return { granted: false, error: 'Non supporté' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.initialize();
        return { granted: true };
      } else {
        return { granted: false, error: 'Permission refusée' };
      }
    } catch (error) {
      return { granted: false, error: error.message };
    }
  }
}

export default new NotificationService();