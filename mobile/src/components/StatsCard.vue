<template>
  <ion-card class="stats-shell">
    <ion-card-header>
      <ion-card-title>
        <ion-icon :icon="statsChart" slot="start"></ion-icon>
        Aperçu des statistiques
      </ion-card-title>
      <ion-card-subtitle>Indicateurs clés des signalements</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="stats-grid">
        <div class="metric">
          <h3>{{ stats?.totalReports || 0 }}</h3>
          <span>Signalements</span>
        </div>
        <div class="metric">
          <h3>{{ stats?.totalSurface || 0 }} m²</h3>
          <span>Surface totale</span>
        </div>
        <div class="metric">
          <h3>{{ (stats?.totalBudget || 0).toLocaleString() }} Ar</h3>
          <span>Budget estimé</span>
        </div>
        <div class="metric">
          <h3>{{ stats?.progress || 0 }}%</h3>
          <span>Avancement</span>
        </div>
      </div>

      <div class="status-section">
        <h4>Répartition par statut</h4>
        <div class="status-list">
          <div class="status-item" v-for="item in statusStats" :key="item.status">
            <div class="status-header">
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </div>
            <div class="status-track">
              <span class="status-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></span>
            </div>
          </div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>
  
  <script>
  import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon
  } from '@ionic/vue';
  import { statsChart } from 'ionicons/icons';
  import { computed } from 'vue';
  
  export default {
    name: 'StatsCard',
    props: {
      stats: {
        type: Object,
        default: () => ({
          totalReports: 0,
          totalSurface: 0,
          totalBudget: 0,
          progress: 0,
          statusCounts: {
            new: 0,
            in_progress: 0,
            completed: 0
          }
        })
      },
      reports: {
        type: Array,
        default: () => []
      }
    },
    setup(props) {
      const statusStats = computed(() => {
        const total = props.reports?.length || 0;
        const statusInfo = [
          { status: 'new', label: 'Nouveau', color: '#ff4444' },
          { status: 'in_progress', label: 'En cours', color: '#ffbb33' },
          { status: 'completed', label: 'Terminé', color: '#00C851' }
        ];
        
        // Utiliser l'opérateur de chaînage optionnel et des valeurs par défaut
        const statusCounts = props.stats?.statusCounts || {
          new: 0,
          in_progress: 0,
          completed: 0
        };
        
        return statusInfo.map(info => {
          const count = statusCounts[info.status] || 0;
          return {
            ...info,
            count,
            percentage: total > 0 ? (count / total * 100) : 0
          };
        });
      });
  
      return {
        statsChart,
        statusStats
      };
    }
  };
  </script>
  
  <style scoped>
  .stats-shell {
    border-radius: 22px;
    box-shadow: var(--app-shadow-lg);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .metric {
    padding: 14px;
    border-radius: 16px;
    background: #f8fafc;
    display: grid;
    gap: 6px;
  }

  .metric h3 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
  }

  .metric span {
    font-size: 12px;
    color: var(--ion-color-medium);
  }

  .status-section {
    margin-top: 20px;
  }

  .status-section h4 {
    margin: 0 0 12px;
    font-size: 14px;
    color: #0f172a;
  }

  .status-list {
    display: grid;
    gap: 12px;
  }

  .status-item {
    display: grid;
    gap: 6px;
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--ion-color-medium);
  }

  .status-track {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: #e2e8f0;
    overflow: hidden;
  }

  .status-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
  }
  </style>