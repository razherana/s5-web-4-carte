<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>

        <ion-title>Travaux Routiers - Antananarivo</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleStats">
            <ion-icon :icon="statsChartOutline"></ion-icon>
          </ion-button>
          <ion-button @click="goToMyReports" v-if="isLoggedIn">
            <ion-icon :icon="listOutline"></ion-icon>
          </ion-button>
          <ion-button @click="handleLogout" v-if="isLoggedIn">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
          <ion-button @click="goToLogin" v-else>
            <ion-icon :icon="logInOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Statistiques (repliables) -->
      <!-- <div v-if="showStats">
        <StatsCard :stats="statistics" :reports="reports" />
      </div> -->

      <!-- Carte -->
      <div class="map-wrapper">
        <MapComponent
          :reports="filteredReports"
          :can-report="isLoggedIn"
          @add-report="handleAddReport"
          @marker-clicked="handleMarkerClick"
          ref="mapComponent"
        />
      </div>

      <!-- Modal de signalement -->
      <ReportModal
        :is-open="reportModalOpen"
        :location="selectedLocation"
        @close="closeReportModal"
        @report-created="handleReportCreated"
      />

      <!-- Loader -->
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
.map-wrapper {
  height: calc(
    100vh - 56px
  ); /* Hauteur totale moins la hauteur de la toolbar */
  width: 100%;
  position: relative;
}

.loader-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

ion-spinner {
  --color: var(--ion-color-primary);
  width: 50px;
  height: 50px;
}
</style>
