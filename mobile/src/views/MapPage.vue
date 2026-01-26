<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Carte intelligente</ion-title>
        <ion-buttons slot="end">
          <ion-button class="icon-chip" @click="toggleStats">
            <ion-icon :icon="statsChartOutline"></ion-icon>
          </ion-button>
          <ion-button class="icon-chip" @click="goToMyReports" v-if="isLoggedIn">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
          <ion-button class="icon-chip" @click="handleLogout" v-if="isLoggedIn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button class="icon-chip" @click="goToLogin" v-else>
            <ion-icon :icon="logInOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="map-page-content">
      <div class="page-shell">
        <section class="hero glass-strong card">
          <div>
            <h1>Signalez, suivez, améliorez.</h1>
            <p class="text-secondary">
              Repérez les incidents routiers et suivez l'avancement des interventions en temps réel.
            </p>
          </div>
          <div class="hero-actions">
            <div class="btn-primary" v-if="!isLoggedIn">
              <ion-button expand="block" @click="goToLogin">Se connecter</ion-button>
            </div>
            <div class="btn-secondary" v-else>
              <ion-button expand="block" @click="goToMyReports">Voir mes signalements</ion-button>
            </div>
          </div>
        </section>

        <section v-if="showStats" class="stats-panel">
          <StatsCard :stats="statistics" :reports="reports" />
        </section>

        <section class="map-section">
          <div class="map-header">
            <div>
              <h2>Carte interactive</h2>
              <p class="text-secondary">Touchez la carte pour ajouter un signalement.</p>
            </div>
            <div class="map-badges">
              <span class="badge">{{ filteredReports.length }} signalements</span>
              <span class="badge">Antananarivo</span>
            </div>
          </div>
          <div class="map-wrapper glass">
            <MapComponent
              :reports="filteredReports"
              :can-report="isLoggedIn"
              @add-report="handleAddReport"
              @marker-clicked="handleMarkerClick"
              ref="mapComponent"
            />
            <div class="map-overlay">
              <span class="chip">Cliquez pour signaler</span>
              <span class="chip" v-if="!isLoggedIn">Connexion requise</span>
            </div>
          </div>
        </section>
      </div>

      <ReportModal
        :is-open="reportModalOpen"
        :location="selectedLocation"
        @close="closeReportModal"
        @report-created="handleReportCreated"
      />

      <div v-if="loading" class="loader-overlay">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonMenuButton } from '@ionic/vue';

import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  alertController,
} from '@ionic/vue';
import {
  statsChartOutline,
  listOutline,
  logOutOutline,
  logInOutline,
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MapComponent from '@/components/MapComponent.vue';
import ReportModal from '@/components/ReportModal.vue';
import StatsCard from '@/components/StatsCard.vue';
import reportService from '@/services/reportService';
import authService from '@/services/authService';

export default {
  name: 'MapPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonSpinner,
    MapComponent,
    ReportModal,
    StatsCard,
  },
  setup() {
    const router = useRouter();
    const mapComponent = ref(null);

    const reports = ref([]);
    const loading = ref(false);
    const showStats = ref(true);
    const reportModalOpen = ref(false);
    const selectedLocation = ref({ lat: -18.8792, lng: 47.5079 });

    const currentUser = ref(authService.getCurrentUser());

    const isLoggedIn = computed(() => currentUser.value !== null);
    const filteredReports = computed(() => reports.value);
    const statistics = computed(() => reportService.calculateStats(reports.value));

    const loadReports = async () => {
      loading.value = true;

      const result = await reportService.getAllReports();

      if (result.success) {
        reports.value = result.data;
      } else {
        const alert = await alertController.create({
          header: 'Erreur',
          message: 'Impossible de charger les signalements',
          buttons: ['OK'],
        });
        await alert.present();
      }

      loading.value = false;
    };

    const toggleStats = () => {
      showStats.value = !showStats.value;
    };

    const handleAddReport = (location) => {
      if (!isLoggedIn.value) {
        alertController
          .create({
            header: 'Connexion requise',
            message: 'Vous devez vous connecter pour créer un signalement',
            buttons: [
              { text: 'Annuler', role: 'cancel' },
              {
                text: 'Se connecter',
                handler: () => router.push('/login'),
              },
            ],
            cssClass: 'modern-alert',
          })
          .then((alert) => alert.present());
        return;
      }

      if (mapComponent.value?.stopMapAnimations) {
        mapComponent.value.stopMapAnimations();
      }

      selectedLocation.value = location;
      reportModalOpen.value = true;
    };

    const closeReportModal = () => {
      reportModalOpen.value = false;

      setTimeout(() => {
        if (mapComponent.value) {
          mapComponent.value.clearTempMarker();
        }
      }, 100);
    };

    const handleReportCreated = async () => {
      await loadReports();
    };

    const handleMarkerClick = (report) => {
      console.log('Marker clicked:', report);
    };

    const goToMyReports = () => router.push('/my-reports');
    const goToLogin = () => router.push('/login');

    const handleLogout = async () => {
      const alert = await alertController.create({
        header: 'Déconnexion',
        message: 'Voulez-vous vraiment vous déconnecter ?',
        buttons: [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Déconnexion',
            handler: async () => {
              await authService.logout();
              currentUser.value = null;
              router.push('/login');
            },
          },
        ],
        cssClass: 'modern-alert',
      });
      await alert.present();
    };

    onMounted(() => {
      loadReports();
      currentUser.value = authService.getCurrentUser();
    });

    return {
      reports,
      loading,
      showStats,
      reportModalOpen,
      selectedLocation,
      isLoggedIn,
      filteredReports,
      statistics,
      mapComponent,
      toggleStats,
      handleAddReport,
      closeReportModal,
      handleReportCreated,
      handleMarkerClick,
      goToMyReports,
      goToLogin,
      handleLogout,
      statsChartOutline,
      listOutline,
      logOutOutline,
      logInOutline,
    };
  },
};
</script>

<style scoped>
.map-page-content {
  --background: transparent;
}

.icon-chip {
  --background: rgba(255, 255, 255, 0.85);
  --color: #0f172a;
  --border-radius: var(--app-radius-full);
  --padding-start: 10px;
  --padding-end: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.icon-chip ion-icon {
  font-size: 20px;
  color: #2563eb;
}

.hero {
  display: grid;
  gap: var(--app-space-md);
  background: var(--app-glass-bg-strong);
  border: 1px solid var(--app-glass-border);
  color: #0f172a;
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 55%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.08), transparent 50%);
  z-index: 0;
}

.hero > * {
  position: relative;
  z-index: 1;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 800;
  color: #0f172a;
}

.hero p {
  margin: 0;
  font-size: 0.95rem;
}

.hero-actions {
  display: grid;
  gap: var(--app-space-sm);
}

.stats-panel {
  margin-top: var(--app-space-md);
}

.map-section {
  display: grid;
  gap: var(--app-space-md);
}

.map-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.map-header p {
  color: #64748b;
  font-weight: 500;
}

.map-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: var(--app-radius-full);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.08));
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(37, 99, 235, 0.2);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.1);
}

.map-wrapper {
  position: relative;
  padding: 12px;
  height: clamp(320px, 60vh, 520px);
  border-radius: var(--app-radius-xl);
}

.map-wrapper :deep(.leaflet-container) {
  border-radius: var(--app-radius-xl);
  overflow: hidden;
}

.map-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  z-index: 5;
}

.chip {
  padding: 8px 16px;
  border-radius: var(--app-radius-full);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  color: #0f172a;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(16px) saturate(120%);
  z-index: 1000;
}

.loader-overlay ion-spinner {
  --color: #2563eb;
  transform: scale(1.5);
}
</style>
