<template>
  <ion-app>
    <SidebarMenu />
    <ion-router-outlet id="main-content"></ion-router-outlet>
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';
import SidebarMenu from '@/components/SidebarMenu.vue';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
    SidebarMenu
  },
  setup() {
    const router = useRouter();

    const initializeNotifications = async () => {
      try {
        console.log('🔔 Initialisation des notifications...');
        
        // Vérifier si nous sommes dans un environnement supporté
        if (!('Notification' in window)) {
          console.warn('❌ Ce navigateur ne supporte pas les notifications');
          return;
        }

        // Attendre que l'application soit complètement chargée
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Enregistrer le service worker si nécessaire
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('✅ Service Worker enregistré avec succès:', registration.scope);
            
            // Attendre que le service worker soit activé
            if (registration.active) {
              console.log('✅ Service Worker actif');
            } else if (registration.installing) {
              await new Promise(resolve => {
                registration.installing.addEventListener('statechange', (event) => {
                  if (event.target.state === 'activated') {
                    resolve();
                  }
                });
              });
            }
          } catch (swError) {
            console.warn('⚠️ Erreur enregistrement Service Worker:', swError.message);
            // Continuer même si le SW échoue
          }
        }

        // Initialiser Firebase Messaging
        setTimeout(async () => {
          const result = await notificationService.initialize();
          
          if (result.success) {
            console.log('✅ Notifications initialisées avec succès');
            
            // Récupérer l'utilisateur actuel
            const currentUser = authService.getCurrentUser();
            
            if (currentUser && currentUser.id) {
              console.log(`👤 Surveillance des signalements pour: ${currentUser.email}`);
              
              // Démarrer la surveillance avec un léger délai
              setTimeout(() => {
                notificationService.watchUserReports(currentUser.id);
              }, 2000);
            }
          } else {
            console.warn('⚠️ Notifications non initialisées:', result.error);
          }
        }, 500);
      } catch (error) {
        console.error('❌ Erreur initialisation notifications:', error);
      }
    };

    const setupAuthListener = () => {
      // Écouter les changements d'authentification
      const originalGetCurrentUser = authService.getCurrentUser;
      let lastUser = originalGetCurrentUser();
      
      // Vérifier périodiquement les changements d'utilisateur
      const checkAuthInterval = setInterval(() => {
        const currentUser = originalGetCurrentUser();
        
        if (currentUser?.id !== lastUser?.id) {
          console.log(`🔄 Changement d'utilisateur détecté:`, {
            ancien: lastUser?.email,
            nouveau: currentUser?.email
          });
          
          // Arrêter l'ancienne surveillance
          if (lastUser?.id) {
            notificationService.stopWatchingUserReports(lastUser.id);
          }
          
          // Démarrer la nouvelle surveillance
          if (currentUser?.id) {
            setTimeout(() => {
              notificationService.watchUserReports(currentUser.id);
            }, 1000);
          }
          
          lastUser = currentUser;
        }
      }, 5000);
      
      return () => clearInterval(checkAuthInterval);
    };

    onMounted(async () => {
      console.log('🚀 Application Vue démarrée');
      
      // Initialiser les notifications
      await initializeNotifications();
      
      // Configurer l'écouteur d'authentification
      const cleanupAuthListener = setupAuthListener();
      
      // Vérifier l'état actuel
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        console.log(`👤 Utilisateur connecté au démarrage: ${currentUser.email}`);
        
        // Démarrer la surveillance immédiate
        setTimeout(() => {
          notificationService.watchUserReports(currentUser.id);
        }, 3000);
      }
      
      // Nettoyage
      onUnmounted(() => {
        if (cleanupAuthListener) cleanupAuthListener();
        
        // Arrêter toutes les surveillances
        const currentUser = authService.getCurrentUser();
        if (currentUser?.id) {
          notificationService.stopWatchingUserReports(currentUser.id);
        }
        
        console.log('🧹 Application démontée - nettoyage effectué');
      });
    });

    // Exposer les services globalement pour débogage
    onMounted(() => {
      window.$notificationService = notificationService;
      window.$authService = authService;
      console.log('🔧 Services exposés globalement pour débogage');
    });

    return {};
  }
});
</script>

<style>
@import 'leaflet/dist/leaflet.css';

ion-app {
  background: transparent;
}

ion-header::after {
  display: none;
}

ion-toolbar {
  --background: transparent;
  --color: var(--app-text-primary);
  --border-style: none;
  --min-height: 64px;
}

ion-title {
  font-family: var(--app-font-display);
  font-weight: 700;
  letter-spacing: -0.3px;
}

ion-button {
  --border-radius: var(--app-radius-lg);
  text-transform: none;
  font-weight: 600;
}

ion-modal::part(backdrop) {
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
}

ion-spinner {
  --color: var(--ion-color-primary);
}

ion-input,
ion-textarea,
ion-select {
  --color: var(--app-text-primary);
  --placeholder-color: var(--app-text-tertiary);
}

.modern-alert .alert-wrapper {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: var(--app-radius-xl);
  box-shadow: var(--app-shadow-xl);
  backdrop-filter: blur(18px) saturate(120%);
}

.modern-alert .alert-head h2 {
  color: var(--app-text-primary);
  font-family: var(--app-font-display);
}

.modern-alert .alert-message {
  color: var(--app-text-secondary);
}

.modern-alert .alert-button {
  color: var(--app-text-primary);
  font-weight: 600;
}

.modern-alert .alert-button-role-cancel {
  color: var(--app-text-secondary);
}

/* Styles pour les notifications */
@media (display-mode: standalone) {
  /* Styles PWA */
  ion-app {
    -webkit-tap-highlight-color: transparent;
  }
}

/* Pour le débogage */
.debug-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #333;
  color: white;
  padding: 10px;
  border-radius: 8px;
  z-index: 9999;
  font-size: 12px;
}
</style>