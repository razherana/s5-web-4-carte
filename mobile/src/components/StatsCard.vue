<template>
    <ion-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon :icon="statsChart" slot="start"></ion-icon>
          Statistiques
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-card color="light">
                <ion-card-content class="stat-item">
                  <div class="stat-value">{{ stats?.totalReports || 0 }}</div>
                  <div class="stat-label">Signalements</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card color="light">
                <ion-card-content class="stat-item">
                  <div class="stat-value">{{ stats?.totalSurface || 0 }} m²</div>
                  <div class="stat-label">Surface totale</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="6">
              <ion-card color="light">
                <ion-card-content class="stat-item">
                  <div class="stat-value">{{ (stats?.totalBudget || 0).toLocaleString() }} Ar</div>
                  <div class="stat-label">Budget total</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card color="light">
                <ion-card-content class="stat-item">
                  <div class="stat-value">{{ stats?.progress || 0 }}%</div>
                  <div class="stat-label">Avancement</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
          <ion-row>
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-subtitle>Répartition par statut</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <div class="status-chart">
                    <div class="status-item" v-for="item in statusStats" :key="item.status">
                      <div class="status-bar" :style="{ width: item.percentage + '%', 'background-color': item.color }"></div>
                      <div class="status-info">
                        <span class="status-label">{{ item.label }}</span>
                        <span class="status-count">{{ item.count }}</span>
                      </div>
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
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
  .stat-item {
    text-align: center;
    padding: 10px;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--ion-color-primary);
  }
  
  .stat-label {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin-top: 5px;
  }
  
  .status-chart {
    margin-top: 10px;
  }
  
  .status-item {
    margin-bottom: 12px;
  }
  
  .status-bar {
    height: 8px;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: width 0.3s ease;
  }
  
  .status-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
  }
  
  .status-label {
    color: var(--ion-color-dark);
  }
  
  .status-count {
    color: var(--ion-color-medium);
    font-weight: bold;
  }
  
  ion-card[color="light"] {
    margin: 0;
  }
  </style>