<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Statistiques</ion-title>
        <ion-buttons slot="end">
          <ion-button class="icon-chip" @click="loadStats">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="stats-content">
      <div class="page-shell">
        <section class="hero glass-strong card">
          <h1>Tableau de bord</h1>
          <p class="text-secondary">Suivi global des signalements et indicateurs clés.</p>
          <div class="hero-chips">
            <span class="chip">Temps réel</span>
            <span class="chip">Données publiques</span>
          </div>
        </section>

        <div v-if="loading" class="loading-container glass card">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Chargement des statistiques...</p>
        </div>

        <StatsCard v-else :stats="statistics" :reports="reports" />
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
  --background: transparent;
}

.icon-chip {
  --background: rgba(255, 255, 255, 0.3);
  --color: var(--app-text-primary);
  --border-radius: var(--app-radius-full);
  --padding-start: 8px;
  --padding-end: 8px;
}

.hero {
  display: grid;
  gap: var(--app-space-sm);
  background: var(--app-glass-bg-strong);
  border: 1px solid var(--app-glass-border);
  color: var(--app-text-primary);
  position: relative;
  overflow: hidden;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.25), transparent 55%),
    radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.2), transparent 50%);
  z-index: 0;
}

.hero > * {
  position: relative;
  z-index: 1;
}

.hero h1 {
  margin: 0;
  font-size: clamp(1.4rem, 4vw, 2rem);
}

.hero-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.loading-container {
  display: grid;
  place-items: center;
  min-height: 200px;
  gap: 10px;
}
</style>
    