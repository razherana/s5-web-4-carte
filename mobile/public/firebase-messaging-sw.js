// public/firebase-messaging-sw.js
// Service Worker pour Firebase Cloud Messaging

// Importer Firebase (version compatible)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

console.log('[SW] 🔥 Firebase scripts loaded');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0Tms7mzZP0hMxQghg3xnSQOgATluQXrc",
  authDomain: "route-project-c44ce.firebaseapp.com",
  projectId: "route-project-c44ce",
  storageBucket: "route-project-c44ce.firebasestorage.app",
  messagingSenderId: "875716847528",
  appId: "1:875716847528:web:be0569614612a76b419f9d",
  measurementId: "G-WDWP5R1DW8"
};

// Initialiser Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('[SW] ✅ Firebase initialisé');
  }
} catch (error) {
  console.error('[SW] ❌ Erreur initialisation Firebase:', error);
}

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

// Gestionnaire pour les messages en background
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] 📨 Message reçu en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'Nouveau signalement';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data || {},
    tag: `notification_${Date.now()}`,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  // Afficher la notification
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[SW] ✅ Notification affichée avec succès');
    })
    .catch(error => {
      console.error('[SW] ❌ Erreur affichage notification:', error);
    });
});

// Gestionnaire pour le clic sur la notification
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 🖱️ Notification cliquée:', event.notification);
  
  // Fermer la notification
  event.notification.close();
  
  // Gérer les actions
  if (event.action === 'close') {
    console.log('[SW] Notification fermée par l\'utilisateur');
    return;
  }
  
  // Déterminer l'URL à ouvrir
  let urlToOpen = '/map';
  const notificationData = event.notification.data || {};
  
  if (notificationData.reportId) {
    urlToOpen = `/my-reports#${notificationData.reportId}`;
  } else if (notificationData.type === 'status_change') {
    urlToOpen = '/my-reports';
  } else if (notificationData.url) {
    urlToOpen = notificationData.url;
  }
  
  console.log('[SW] 🔗 Redirection vers:', urlToOpen);
  
  // Ouvrir ou focaliser la fenêtre
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    })
    .then((windowClients) => {
      // Chercher une fenêtre existante
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus().then(() => {
            // Naviguer vers l'URL
            if (client.url !== urlToOpen) {
              return client.navigate(urlToOpen);
            }
            return client;
          });
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'existe
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
    .catch(error => {
      console.error('[SW] ❌ Erreur redirection:', error);
    })
  );
});

// Gestionnaire pour l'installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] 📦 Installation du Service Worker...');
  
  // Prendre le contrôle immédiatement
  self.skipWaiting();
});

// Gestionnaire pour l'activation
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Activation du Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('firebase-messaging') || 
                cacheName.startsWith('workbox-') ||
                cacheName.startsWith('old-')) {
              console.log('[SW] 🗑️ Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prendre le contrôle de tous les clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('[SW] ✅ Service Worker activé et prêt');
    })
  );
});

// Gestionnaire pour les messages de l'application
self.addEventListener('message', (event) => {
  console.log('[SW] 📬 Message reçu de l\'application:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Répondre au ping
  if (event.data && event.data.type === 'PING') {
    event.ports[0].postMessage({ type: 'PONG' });
  }
});

// Gestionnaire pour les erreurs
self.addEventListener('error', (event) => {
  console.error('[SW] ❌ Erreur:', event.error);
});

// Gestionnaire pour les rejets de promesses non gérés
self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] ❌ Rejet de promesse non géré:', event.reason);
});

// Log de démarrage
console.log('[SW] 🚀 Service Worker chargé et prêt');
