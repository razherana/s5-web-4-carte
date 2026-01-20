<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Carte des signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button class="toolbar-pill" @click="toggleStats">
            <ion-icon :icon="statsChartOutline"></ion-icon>
          </ion-button>
          <ion-button class="toolbar-pill" @click="goToMyReports" v-if="isLoggedIn">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
          <ion-button class="toolbar-pill" @click="handleLogout" v-if="isLoggedIn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button class="toolbar-pill" @click="goToLogin" v-else>
            <ion-icon :icon="logInOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="map-page-content">
      <section class="hero">
        <div>
          <h1>Signalez les anomalies routières</h1>
          <p>Repérez les incidents, ajoutez un signalement et suivez les travaux en temps réel.</p>
        </div>
        <div class="hero-actions">
          <ion-button v-if="!isLoggedIn" expand="block" @click="goToLogin">Se connecter</ion-button>
          <ion-button v-if="isLoggedIn" expand="block" color="secondary" @click="goToMyReports">Voir mes signalements</ion-button>
        </div>
      </section>

      <section class="stats-panel" v-if="showStats">
        <StatsCard :stats="statistics" :reports="reports" />
      </section>

      <section class="map-section">
        <div class="map-header">
          <div>
            <h2>Carte interactive</h2>
            <p>Cliquez sur la carte pour ajouter un signalement.</p>
          </div>
          <div class="map-badges">
            <span class="badge">{{ filteredReports.length }} signalements</span>
            <span class="badge ghost">Antananarivo</span>
          </div>
        </div>
        <div class="map-wrapper">
          <MapComponent
            :reports="filteredReports"
            :can-report="isLoggedIn"
            @add-report="handleAddReport"
            @marker-clicked="handleMarkerClick"
            ref="mapComponent"
          />
        </div>
      </section>

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
import { 
    IonMenuButton 
    } from '@ionic/vue';

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
} from "@ionic/vue";
import {
  statsChartOutline,
  listOutline,
  logOutOutline,
  logInOutline,
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import MapComponent from "@/components/MapComponent.vue";
import ReportModal from "@/components/ReportModal.vue";
import StatsCard from "@/components/StatsCard.vue";
import reportService from "@/services/reportService";
import authService from "@/services/authService";

export default {
  name: "MapPage",
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

    const isLoggedIn = computed(() => {
      return currentUser.value !== null;
    });

    const filteredReports = computed(() => {
      return reports.value;
    });

    const statistics = computed(() => {
      return reportService.calculateStats(reports.value);
    });

    const loadReports = async () => {
      loading.value = true;

      const result = await reportService.getAllReports();

      if (result.success) {
        reports.value = result.data;
      } else {
        const alert = await alertController.create({
          header: "Erreur",
          message: "Impossible de charger les signalements",
          buttons: ["OK"],
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
            header: "Connexion requise",
            message: "Vous devez vous connecter pour créer un signalement",
            buttons: [
              {
                text: "Annuler",
                role: "cancel",
              },
              {
                text: "Se connecter",
                handler: () => {
                  router.push("/login");
                },
              },
            ],
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

      // Attendre que le modal soit fermé avant de nettoyer
      setTimeout(() => {
        // Nettoyer le marqueur temporaire
        if (mapComponent.value) {
          mapComponent.value.clearTempMarker();
        }
      }, 100);
    };

    const handleReportCreated = async () => {
      // Recharger les signalements
      await loadReports();
    };

    const handleMarkerClick = (report) => {
      console.log("Marker clicked:", report);
      // Vous pouvez afficher plus de détails ici si nécessaire
    };

    const goToMyReports = () => {
      router.push("/my-reports");
    };

    const goToLogin = () => {
      router.push("/login");
    };

    const handleLogout = async () => {
      const alert = await alertController.create({
        header: "Déconnexion",
        message: "Voulez-vous vraiment vous déconnecter ?",
        buttons: [
          {
            text: "Annuler",
            role: "cancel",
          },
          {
            text: "Déconnexion",
            handler: async () => {
              await authService.logout();
              currentUser.value = null;
              router.push("/login");
            },
          },
        ],
      });
      await alert.present();
    };

    onMounted(() => {
      loadReports();

      // Vérifier l'état de connexion
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
  --background: var(--app-background);
}

.hero {
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  background: var(--app-gradient);
  color: #ffffff;
  box-shadow: var(--app-shadow-lg);
  display: grid;
  gap: 16px;
}

.hero h1 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
}

.hero p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.hero-actions ion-button {
  --background: #ffffff;
  --color: #1e293b;
}

.stats-panel {
  margin: 0 16px 16px;
}

.map-section {
  margin: 0 16px 20px;
  display: grid;
  gap: 12px;
}

.map-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-header h2 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.map-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 13px;
}

.map-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.ghost {
  background: #f1f5f9;
  color: #475569;
}

.toolbar-pill {
  --background: rgba(255, 255, 255, 0.2);
  --color: #ffffff;
  --border-radius: 999px;
}

.map-wrapper {
  height: clamp(320px, 60vh, 520px);
  width: 100%;
  position: relative;
  padding: 12px;
  box-sizing: border-box;
}

.map-wrapper :deep(.leaflet-container) {
  border-radius: 18px;
  box-shadow: var(--app-shadow-lg);
  overflow: hidden;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

ion-spinner {
  --color: var(--ion-color-primary);
  width: 50px;
  height: 50px;
}
</style>
