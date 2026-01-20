<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Statistiques</ion-title>
        <ion-buttons slot="end">
          <ion-button class="toolbar-pill" @click="loadStats">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="stats-content">
      <section class="stats-hero">
        <h1>Tableau de bord</h1>
        <p>Suivi global des signalements et de l'avancement.</p>
      </section>

      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement des statistiques...</p>
      </div>

      <StatsCard v-else :stats="statistics" :reports="reports" />
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
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import StatsCard from '@/components/StatsCard.vue';
import reportService from '@/services/reportService';

export default {
    name: 'StatisticsPage',
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
      StatsCard
    },
    setup() {
      const reports = ref([]);
      const loading = ref(false);

      const statistics = computed(() => reportService.calculateStats(reports.value));

      const loadStats = async () => {
        loading.value = true;
        const result = await reportService.getAllReports();
        if (result.success) {
          reports.value = result.data;
        }
        loading.value = false;
      };

      onMounted(() => {
        loadStats();
      });

      return {
        reports,
        loading,
        statistics,
        loadStats,
        refreshOutline
      };
    }
  };
</script>
  
<style scoped>
.stats-content {
  --background: var(--app-background);
}

.toolbar-pill {
  --background: rgba(255, 255, 255, 0.2);
  --color: #ffffff;
  --border-radius: 999px;
}

.stats-hero {
  margin: 16px;
  padding: 20px;
  border-radius: 20px;
  background: var(--app-gradient-primary);
  color: #ffffff;
  box-shadow: var(--app-shadow-lg);
}

.stats-hero h1 {
  margin: 0 0 6px;
  font-size: 20px;
}

.stats-hero p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 12px;
  color: var(--ion-color-medium);
}
</style>
    