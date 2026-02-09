<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Mon Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="profile-container">
        <!-- User Info Card -->
        <ion-card class="user-card">
          <ion-card-content>
            <div class="user-avatar">
              <ion-icon :icon="personCircleOutline"></ion-icon>
            </div>
            <h2 class="user-name">{{ user?.displayName || 'Utilisateur' }}</h2>
            <p class="user-email">{{ user?.email }}</p>
            <p class="user-id">ID: {{ user?.uid || user?.id }}</p>
          </ion-card-content>
        </ion-card>

        <!-- Settings Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="settingsOutline"></ion-icon>
              Paramètres
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <!-- Notifications Toggle -->
            <ion-item lines="full">
              <ion-icon :icon="notificationsOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Notifications</h3>
                <p>Recevoir des alertes pour mes signalements</p>
              </ion-label>
              <ion-toggle 
                :checked="notificationsEnabled" 
                @ionChange="toggleNotifications"
              ></ion-toggle>
            </ion-item>

            <!-- Test Notification Button -->
            <ion-item 
              v-if="notificationsEnabled" 
              button 
              @click="sendTestNotification"
              lines="full"
            >
              <ion-icon :icon="notificationsCircleOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Test de notification</h3>
                <p>Envoyer une notification de test</p>
              </ion-label>
            </ion-item>

            <!-- Clear Notifications -->
            <ion-item 
              v-if="notificationsEnabled" 
              button 
              @click="clearNotifications"
              lines="none"
            >
              <ion-icon :icon="trashOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Effacer les notifications</h3>
                <p>Supprimer toutes les notifications</p>
              </ion-label>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Stats Card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="statsChartOutline"></ion-icon>
              Statistiques
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <ion-icon :icon="documentTextOutline"></ion-icon>
                <div class="stat-value">{{ userStats.total }}</div>
                <div class="stat-label">Signalements</div>
              </div>
              <div class="stat-item">
                <ion-icon :icon="timeOutline"></ion-icon>
                <div class="stat-value">{{ userStats.pending }}</div>
                <div class="stat-label">En attente</div>
              </div>
              <div class="stat-item">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <div class="stat-value">{{ userStats.completed }}</div>
                <div class="stat-label">Terminés</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Logout Button -->
        <ion-button 
          expand="block" 
          color="danger" 
          @click="handleLogout"
          class="logout-btn"
        >
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Se déconnecter
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  toastController,
  alertController,
} from '@ionic/vue';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  personCircleOutline,
  settingsOutline,
  notificationsOutline,
  notificationsCircleOutline,
  trashOutline,
  statsChartOutline,
  documentTextOutline,
  timeOutline,
  checkmarkCircleOutline,
  logOutOutline,
} from 'ionicons/icons';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';
import reportService from '@/services/reportService';

export default {
  name: 'ProfilePage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton,
    IonIcon,
  },
  setup() {
    const router = useRouter();
    const user = ref(null);
    const notificationsEnabled = ref(false);
    const userReports = ref([]);

    const userStats = computed(() => {
      const total = userReports.value.length;
      const pending = userReports.value.filter(r => 
        r.status === 'nouveau' || r.status === 'new' || r.status === 'en_cours' || r.status === 'in_progress'
      ).length;
      const completed = userReports.value.filter(r => 
        r.status === 'termine' || r.status === 'completed'
      ).length;

      return { total, pending, completed };
    });

    onMounted(async () => {
      // Récupérer l'utilisateur actuel
      user.value = authService.getCurrentUser();
      
      if (!user.value) {
        router.push('/login');
        return;
      }

      // Vérifier l'état des notifications
      notificationsEnabled.value = notificationService.areNotificationsEnabled();

      // Charger les signalements de l'utilisateur
      await loadUserReports();
    });

    const loadUserReports = async () => {
      try {
        const result = await reportService.getUserReports(user.value.uid || user.value.id);
        if (result.success) {
          userReports.value = result.data;
        }
      } catch (error) {
        console.error('Erreur chargement signalements:', error);
      }
    };

    const toggleNotifications = async (event) => {
      const enabled = event.detail.checked;
      
      if (enabled) {
        // Activer les notifications
        const success = await notificationService.initialize();
        
        if (success) {
          notificationsEnabled.value = true;
          
          // Commencer à écouter les changements
          notificationService.watchUserReports(user.value.uid || user.value.id);
          
          showToast('✅ Notifications activées', 'success');
        } else {
          notificationsEnabled.value = false;
          showToast('❌ Impossible d\'activer les notifications', 'danger');
        }
      } else {
        // Désactiver les notifications
        notificationService.stopWatchingUserReports(user.value.uid || user.value.id);
        notificationsEnabled.value = false;
        showToast('Notifications désactivées', 'warning');
      }
    };

    const sendTestNotification = async () => {
      await notificationService.sendTestNotification();
      showToast('📬 Notification de test envoyée', 'primary');
    };

    const clearNotifications = async () => {
      await notificationService.clearAllNotifications();
      showToast('🗑️ Notifications effacées', 'medium');
    };

    const handleLogout = async () => {
      const alert = await alertController.create({
        header: 'Déconnexion',
        message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel',
          },
          {
            text: 'Déconnexion',
            role: 'destructive',
            handler: async () => {
              // Arrêter les notifications
              notificationService.stopAllListeners();
              
              // Déconnecter
              const result = await authService.logout();
              
              if (result.success) {
                showToast('✅ Déconnexion réussie', 'success');
                router.push('/login');
              } else {
                showToast('❌ Erreur lors de la déconnexion', 'danger');
              }
            },
          },
        ],
      });

      await alert.present();
    };

    const showToast = async (message, color = 'primary') => {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: 'bottom',
      });
      await toast.present();
    };

    return {
      user,
      notificationsEnabled,
      userStats,
      toggleNotifications,
      sendTestNotification,
      clearNotifications,
      handleLogout,
      // Icons
      personCircleOutline,
      settingsOutline,
      notificationsOutline,
      notificationsCircleOutline,
      trashOutline,
      statsChartOutline,
      documentTextOutline,
      timeOutline,
      checkmarkCircleOutline,
      logOutOutline,
    };
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.user-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 20px;
}

.user-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar ion-icon {
  font-size: 60px;
  color: white;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.user-email {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0 0 4px 0;
}

.user-id {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0;
  font-family: monospace;
}

ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

ion-card-title ion-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  border-radius: 12px;
}

.stat-item ion-icon {
  font-size: 32px;
  color: var(--ion-color-primary);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--ion-text-color);
  opacity: 0.7;
}

.logout-btn {
  margin-top: 24px;
}

ion-item {
  --padding-start: 16px;
  --inner-padding-end: 16px;
  margin-bottom: 8px;
}

ion-item ion-icon[slot="start"] {
  margin-right: 16px;
  font-size: 24px;
}
</style>
