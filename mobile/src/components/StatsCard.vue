<template>
  <ion-card class="stats-shell glass">
    <ion-card-header>
      <ion-card-title>
        <ion-icon :icon="statsChart" slot="start"></ion-icon>
        Tableau des indicateurs
      </ion-card-title>
      <ion-card-subtitle>Vision globale des signalements</ion-card-subtitle>
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
        <div class="section-header">
          <h4>Répartition par statut</h4>
          <span class="chip">{{ reports.length }} rapports</span>
        </div>
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
            nouveau: 0,
            en_cours: 0,
            termine: 0
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
          { status: 'nouveau', label: 'Nouveau', color: '#f97316' },
          { status: 'en_cours', label: 'En cours', color: '#38bdf8' },
          { status: 'termine', label: 'Terminé', color: '#22c55e' }
        ];
        
        // Utiliser l'opérateur de chaînage optionnel et des valeurs par défaut
        const statusCounts = props.stats?.statusCounts || {
          nouveau: 0,
          en_cours: 0,
          termine: 0
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
    border-radius: var(--app-radius-2xl);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(148, 163, 184, 0.2);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(16px);
  }

  :deep(.stats-shell ion-card-header) {
    padding: 20px;
    background: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  }

  :deep(.stats-shell ion-card-title) {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  :deep(.stats-shell ion-card-title ion-icon) {
    font-size: 24px;
    color: #2563eb;
  }

  :deep(.stats-shell ion-card-subtitle) {
    font-size: 0.875rem;
    color: #64748b;
    font-weight: 500;
    margin-top: 4px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--app-space-md);
  }

  .metric {
    padding: 18px;
    border-radius: var(--app-radius-lg);
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(148, 163, 184, 0.25);
    display: grid;
    gap: 8px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  }

  .metric:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
    border-color: rgba(37, 99, 235, 0.3);
  }

  .metric h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    color: #0f172a;
  }

  .metric span {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .status-section {
    margin-top: var(--app-space-lg);
    padding-top: var(--app-space-lg);
    border-top: 1px solid rgba(148, 163, 184, 0.15);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--app-space-md);
  }

  .section-header h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .chip {
    padding: 6px 12px;
    border-radius: var(--app-radius-full);
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.08));
    color: #2563eb;
    font-size: 0.75rem;
    font-weight: 700;
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .status-list {
    display: grid;
    gap: 14px;
  }

  .status-item {
    display: grid;
    gap: 8px;
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .status-header span {
    color: #475569;
    font-weight: 600;
  }

  .status-header strong {
    color: #0f172a;
    font-weight: 700;
  }

  .status-track {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.2);
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .status-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  </style>