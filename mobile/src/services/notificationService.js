// src/services/notificationService.js
import { messaging } from "./firebaseConfig";
import { getToken, onMessage, deleteToken } from "firebase/messaging";
import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

class NotificationService {
  constructor() {
    this.vapidKey =
      "BITUvXzzSStF3YF7iK3NUykOrUb5GJ6uuGfByKd3q7nCCzOmZmbXRDseJhim55gAmCI8D-J_6jemgc8og-UV7cE";
    this.reportListeners = new Map();
    this.isInitialized = false;
  }

  // Vérifier et demander les permissions
  async checkAndRequestPermission() {
    try {
      if (!("Notification" in window)) {
        return {
          granted: false,
          error: "Ce navigateur ne supporte pas les notifications",
        };
      }

      if (!messaging) {
        return {
          granted: false,
          error: "Firebase Messaging non configuré",
        };
      }

      let permission = Notification.permission;

      if (permission === "default") {
        console.log("📝 Demande de permission pour les notifications...");
        permission = await Notification.requestPermission();
      }

      if (permission !== "granted") {
        console.warn("⚠️ Permission refusée pour les notifications:", permission);
        return {
          granted: false,
          error: `Permission refusée: ${permission}`,
        };
      }

      console.log("✅ Permission notifications accordée");
      return { granted: true };
    } catch (error) {
      console.error("❌ Erreur lors de la demande de permission:", error);
      return {
        granted: false,
        error: error.message,
      };
    }
  }

  async initializeForMobile() {
    try {
      console.log('📱 Initialisation notifications mobiles natives...');
      
      // Pour mobile, utiliser Capacitor Push Notifications
      const { PushNotifications } = await import(
        "@capacitor/push-notifications"
      );

      // Vérifier les permissions
      let permission = await PushNotifications.checkPermissions();
      console.log('📱 Permissions actuelles:', permission);

      if (permission.receive !== "granted") {
        console.log('📱 Demande de permissions push...');
        permission = await PushNotifications.requestPermissions();
        if (permission.receive !== "granted") {
          console.warn("⚠️ Permission push refusée sur mobile");
          return { success: false, error: "Permission refusée" };
        }
      }

      // S'inscrire aux notifications
      await PushNotifications.register();
      console.log('📱 Enregistrement push effectué');

      // Écouter l'inscription
      await PushNotifications.addListener("registration", (token) => {
        console.log("✅ Token push mobile:", token.value);
        localStorage.setItem("pushToken", token.value);
        this.sendTokenToServer(token.value);
      });

      // Écouter les erreurs
      await PushNotifications.addListener("registrationError", (error) => {
        console.error("❌ Erreur enregistrement push:", error);
      });

      // Écouter les notifications reçues
      await PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          console.log("📱 Notification reçue sur mobile:", notification);
          this.showLocalNotification({
            title: notification.title,
            body: notification.body,
            data: notification.data
          });
        }
      );

      // Écouter les clics
      await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notificationAction) => {
          console.log("📱 Notification cliquée:", notificationAction);
          this.handleNotificationClick(notificationAction.notification);
        }
      );

      console.log('✅ Notifications mobiles initialisées avec succès');
      this.isInitialized = true;
      
      return { success: true, platform: 'mobile' };
    } catch (error) {
      console.error("❌ Erreur init notifications mobile:", error);
      return { success: false, error: error.message };
    }
  }

  // Initialiser complètement les notifications
  async initialize() {
    try {
      console.log('🔔 Démarrage initialisation notifications...');
      
      // Détecter la plateforme
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
      const isNativePlatform = !!(window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform());
      
      console.log('🔍 Détection plateforme:', {
        isMobile,
        isNativePlatform,
        userAgent: navigator.userAgent
      });

      // Sur mobile natif, utiliser Capacitor Push
      if (isMobile && isNativePlatform) {
        console.log('📱 Plateforme mobile native détectée');
        return await this.initializeForMobile();
      }

      // Sur web, utiliser Firebase Cloud Messaging
      console.log('🌐 Plateforme web détectée - utilisation FCM');

      // Vérifier les permissions (uniquement pour web)
      const permissionResult = await this.checkAndRequestPermission();
      if (!permissionResult.granted) {
        console.warn('⚠️ Permissions non accordées:', permissionResult.error);
        return permissionResult;
      }
      
      // Vérifier si le service worker est disponible
      if (!("serviceWorker" in navigator)) {
        return {
          success: false,
          error: "Service Worker non supporté",
        };
      }

      // Attendre que le service worker soit prêt
      let registration;
      try {
        console.log('⏳ Attente du Service Worker...');
        registration = await navigator.serviceWorker.ready;
        console.log("✅ Service Worker prêt:", registration.scope);
      } catch (swError) {
        console.warn("⚠️ Service Worker non disponible:", swError);
        // Essayer d'enregistrer le service worker
        try {
          console.log('📝 Tentative enregistrement Service Worker...');
          registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
          console.log("✅ Service Worker enregistré:", registration.scope);
          
          // Attendre qu'il soit actif
          await new Promise((resolve) => {
            if (registration.active) {
              resolve();
            } else if (registration.installing) {
              registration.installing.addEventListener('statechange', (e) => {
                if (e.target.state === 'activated') {
                  resolve();
                }
              });
            } else {
              setTimeout(resolve, 1000);
            }
          });
        } catch (registerError) {
          console.error('❌ Impossible d\'enregistrer le Service Worker:', registerError);
          return {
            success: false,
            error: `Service Worker non disponible: ${registerError.message}`,
          };
        }
      }

      // Obtenir le token FCM
      console.log('🔑 Obtention du token FCM...');
      const token = await this.getFCMToken();
      if (!token) {
        return {
          success: false,
          error: "Impossible d'obtenir le token FCM",
        };
      }

      // Configurer l'écouteur des messages en foreground
      this.setupForegroundListener();

      this.isInitialized = true;
      console.log("✅ Notifications Firebase (web) initialisées avec succès");

      return {
        success: true,
        token: token,
        platform: 'web'
      };
    } catch (error) {
      console.error("❌ Erreur d'initialisation des notifications:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Obtenir le token FCM
  async getFCMToken() {
    try {
      console.log("🔑 Tentative d'obtention du token FCM...");

      // Vérifier que messaging est disponible
      if (!messaging) {
        console.error("❌ Firebase Messaging non disponible");
        return null;
      }

      // Obtenir le service worker registration
      let serviceWorkerRegistration;
      if ("serviceWorker" in navigator) {
        serviceWorkerRegistration = await navigator.serviceWorker.ready;
        console.log("✅ Service Worker registration obtenu");
      }

      // Configuration pour le token
      const tokenOptions = {
        vapidKey: this.vapidKey,
      };

      // Ajouter le service worker registration si disponible
      if (serviceWorkerRegistration) {
        tokenOptions.serviceWorkerRegistration = serviceWorkerRegistration;
      }

      // Demander le token
      const token = await getToken(messaging, tokenOptions);

      if (token) {
        console.log("✅ Token FCM obtenu:", token.substring(0, 20) + "...");
        localStorage.setItem("fcmToken", token);

        // Envoyer le token au serveur (optionnel)
        await this.sendTokenToServer(token);

        return token;
      } else {
        console.log("⚠️ Aucun token FCM disponible");
        return null;
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'obtention du token FCM:", error);

      // Analyser les erreurs courantes
      if (error.code === "messaging/permission-blocked") {
        console.error("🚫 L'utilisateur a bloqué les notifications");
      } else if (error.code === "messaging/invalid-vapid-key") {
        console.error("🔑 Clé VAPID invalide. Vérifiez dans Firebase Console");
      } else if (error.code === "messaging/unsupported-browser") {
        console.error("🌐 Navigateur non supporté pour Firebase Messaging");
      }

      return null;
    }
  }

  // Envoyer le token au serveur (optionnel)
  async sendTokenToServer(token) {
    console.log("📤 Token à envoyer au serveur:", token.substring(0, 20) + "...");
    
    // Sauvegarder localement pour l'instant
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        localStorage.setItem(`fcm_token_${currentUser.id}`, token);
        console.log("✅ Token sauvegardé localement pour l'utilisateur");
      }
    } catch (e) {
      console.error("❌ Erreur sauvegarde token:", e);
    }

    // TODO: Implémenter l'envoi au backend
    /*
    try {
      await fetch('http://localhost:3000/api/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: currentUser.id })
      });
    } catch (error) {
      console.error('Erreur envoi token:', error);
    }
    */
  }

  // Configurer l'écouteur des messages en foreground
  setupForegroundListener() {
    try {
      if (!messaging) {
        console.error("❌ Firebase Messaging non disponible pour l'écoute");
        return;
      }

      onMessage(messaging, (payload) => {
        console.log("📨 Message reçu en foreground:", payload);

        // Afficher une notification locale
        this.showLocalNotification({
          title: payload.notification?.title || "Nouvelle notification",
          body: payload.notification?.body || "Message reçu",
          data: payload.data || {},
        });
      });

      console.log("✅ Écouteur foreground configuré");
    } catch (error) {
      console.error("❌ Erreur configuration écouteur:", error);
    }
  }

  // Afficher une notification locale
  showLocalNotification(notificationData) {
    try {
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        console.warn("⚠️ Notifications non autorisées");
        return;
      }

      const options = {
        body: notificationData.body,
        icon: "/icon.png",
        badge: "/badge.png",
        data: notificationData.data || {},
        tag: `notification_${Date.now()}`,
        requireInteraction: false,
      };

      const notification = new Notification(notificationData.title, options);

      // Gérer le clic sur la notification
      notification.onclick = (event) => {
        event.preventDefault();
        notification.close();

        // Rediriger selon les données de la notification
        this.handleNotificationClick(notificationData);
      };

      // Fermer automatiquement après 8 secondes
      setTimeout(() => notification.close(), 8000);

      console.log("✅ Notification affichée:", notificationData.title);
    } catch (error) {
      console.error("❌ Erreur affichage notification:", error);
    }
  }

  // Gérer le clic sur notification
  handleNotificationClick(notificationData) {
    const data = notificationData.data || {};
    
    if (data.reportId) {
      window.location.href = `/my-reports#${data.reportId}`;
    } else if (data.type === "status_change") {
      window.location.href = "/my-reports";
    } else {
      window.location.href = "/map";
    }
  }

  // Surveiller les changements de statut des signalements
  watchUserReports(userId) {
    try {
      if (!userId) {
        console.error("❌ UserId requis pour la surveillance");
        return;
      }

      // Arrêter l'écoute précédente
      this.stopWatchingUserReports(userId);

      console.log(
        `👁️ Surveillance des signalements pour l'utilisateur: ${userId}`
      );

      // Créer la requête
      const q = query(
        collection(db, "reporting"),
        where("user_id", "==", userId),
        orderBy("reporting_date", "desc")
      );

      // Écouter les changements
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
              const oldData = change.doc.data();
              const newData = change.doc.data();

              // Vérifier les changements de statut
              if (oldData.status !== newData.status) {
                console.log(`🔄 Changement de statut détecté: ${change.doc.id}`);
                console.log(
                  `   Ancien: ${oldData.status} → Nouveau: ${newData.status}`
                );

                this.sendStatusChangeNotification(change.doc.id, newData);
              }
            }
          });
        },
        (error) => {
          console.error("❌ Erreur écoute signalements:", error);
          // Tentative de reconnexion
          setTimeout(() => this.watchUserReports(userId), 5000);
        }
      );

      // Stocker le listener
      this.reportListeners.set(userId, unsubscribe);

      console.log(`✅ Surveillance démarrée pour ${userId}`);
    } catch (error) {
      console.error("❌ Erreur démarrage surveillance:", error);
    }
  }

  // Envoyer une notification de changement de statut
  sendStatusChangeNotification(reportId, reportData) {
    const statusText = this.getStatusText(reportData.status);
    const problemType = this.getProblemTypeText(reportData.problem_type);

    const notification = {
      title: "Mise à jour de votre signalement",
      body: `Le signalement "${problemType}" est maintenant: ${statusText}`,
      data: {
        reportId: reportId,
        type: "status_change",
        status: reportData.status,
      },
    };

    this.showLocalNotification(notification);
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

  // Arrêter toutes les surveillances
  stopAllListeners() {
    this.reportListeners.forEach((unsubscribe, userId) => {
      unsubscribe();
      console.log(`🛑 Surveillance arrêtée pour ${userId}`);
    });
    this.reportListeners.clear();
  }

  // Test des notifications
  async testNotification() {
    try {
      const testData = {
        title: "🔔 Test de notifications",
        body: "Les notifications fonctionnent correctement !",
        data: { test: true, timestamp: Date.now() },
      };

      this.showLocalNotification(testData);
      return { success: true, message: "Notification de test envoyée" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Supprimer le token (désinscription)
  async unsubscribe() {
    try {
      const token = localStorage.getItem("fcmToken");
      if (token && messaging) {
        await deleteToken(messaging);
        localStorage.removeItem("fcmToken");
        console.log("🗑️ Token FCM supprimé");
      }

      this.stopAllListeners();
      this.isInitialized = false;

      return { success: true, message: "Désinscription réussie" };
    } catch (error) {
      console.error("❌ Erreur désinscription:", error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier l'état des notifications
  getNotificationStatus() {
    const status = {
      browserSupported: "Notification" in window,
      permission: Notification.permission,
      fcmToken: localStorage.getItem("fcmToken") ? "Existe" : "Non existant",
      pushToken: localStorage.getItem("pushToken") ? "Existe" : "Non existant",
      isInitialized: this.isInitialized,
      listenersCount: this.reportListeners.size,
      platform: window.Capacitor?.isNativePlatform() ? 'mobile' : 'web'
    };

    console.log("📊 État notifications:", status);
    return status;
  }

  // Méthodes utilitaires pour le texte
  getStatusText(status) {
    const statusMap = {
      new: "Nouveau",
      nouveau: "Nouveau",
      in_progress: "En cours",
      en_cours: "En cours",
      completed: "Terminé",
      termine: "Terminé",
      resolved: "Résolu",
    };

    return statusMap[status?.toLowerCase()] || status || "Inconnu";
  }

  getProblemTypeText(problemType) {
    const typeMap = {
      nid_poule: "Nid de poule",
      fissure: "Fissure",
      affaissement: "Affaissement",
      degradation: "Dégradation",
      flooding: "Inondation",
      obstacle: "Obstacle",
      hole: "Nid de poule",
      crack: "Fissure",
      other: "Autre",
      autre: "Autre",
    };

    return typeMap[problemType] || problemType || "Signalement";
  }
}

export default new NotificationService();
