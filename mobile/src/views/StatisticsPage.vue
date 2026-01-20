<template>
    <ion-card class="stats-card">
      <ion-card-header>
        <ion-card-title>Tableau récapitulatif</ion-card-title>
      </ion-card-header>
      
      <ion-card-content>
        <div class="stats-grid">
          <div class="stat-item">
            <ion-icon :icon="flagOutline" class="stat-icon"></ion-icon>
            <div class="stat-info">
              <div class="stat-label">Nombre de signalements</div>
              <div class="stat-value">{{ stats.totalReports }}</div>
            </div>
          </div>
          
          <div class="stat-item">
            <ion-icon :icon="resizeOutline" class="stat-icon"></ion-icon>
            <div class="stat-info">
              <div class="stat-label">Surface totale</div>
              <div class="stat-value">{{ formatNumber(stats.totalSurface) }} m²</div>
            </div>
          </div>
          
          <div class="stat-item">
            <ion-icon :icon="cashOutline" class="stat-icon"></ion-icon>
            <div class="stat-info">
              <div class="stat-label">Budget total</div>
              <div class="stat-value">{{ formatCurrency(stats.totalBudget) }}</div>
            </div>
          </div>
          
          <div class="stat-item">
            <ion-icon :icon="statsChartOutline" class="stat-icon"></ion-icon>
            <div class="stat-info">
              <div class="stat-label">Avancement</div>
              <div class="stat-value">
                {{ stats.advancement.toFixed(1) }}%
                <ion-progress-bar 
                  :value="stats.advancement / 100"
                  class="advancement-bar"
                ></ion-progress-bar>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Statistiques par statut -->
        <div class="status-stats">
          <h3>Par statut</h3>
          <div class="status-list">
            <div class="status-item nouveau">
              <span class="status-dot"></span>
              <span>Nouveau: {{ statusCounts.nouveau }}</span>
            </div>
            <div class="status-item en-cours">
              <span class="status-dot"></span>
              <span>En cours: {{ statusCounts.enCours }}</span>
            </div>
            <div class="status-item termine">
              <span class="status-dot"></span>
              <span>Terminé: {{ statusCounts.termine }}</span>
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
    IonCardContent,
    IonIcon,
    IonProgressBar
  } from '@ionic/vue';
  import { 
    flagOutline, 
    resizeOutline, 
    cashOutline, 
    statsChartOutline 
  } from 'ionicons/icons';
  import { computed } from 'vue';
  
  export default {
    name: 'StatsCard',
    components: {
      IonCard,
      IonCardHeader,
      IonCardTitle,
      IonCardContent,
      IonIcon,
      IonProgressBar
    },
    props: {
      stats: {
        type: Object,
        required: true
      },
      reports: {
        type: Array,
        default: () => []
      }
    },
    setup(props) {
      const statusCounts = computed(() => {
        const counts = {
          nouveau: 0,
          enCours: 0,
          termine: 0
        };
  
        props.reports.forEach(report => {
          switch(report.status) {
            case 'nouveau':
              counts.nouveau++;
              break;
            case 'en cours':
              counts.enCours++;
              break;
            case 'terminé':
              counts.termine++;
              break;
          }
        });
  
        return counts;
      });
  
      const formatNumber = (num) => {
        return new Intl.NumberFormat('fr-FR').format(num || 0);
      };
  
      const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'MGA',
          minimumFractionDigits: 0
        }).format(amount || 0);
      };
  
      return {
        flagOutline,
        resizeOutline,
        cashOutline,
        statsChartOutline,
        statusCounts,
        formatNumber,
        formatCurrency
      };
    }
  };
  </script>
  
  <style scoped>
  .stats-card {
    margin: 10px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: var(--ion-color-light);
    border-radius: 8px;
  }
  
  .stat-icon {
    font-size: 32px;
    margin-right: 15px;
    color: var(--ion-color-primary);
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-bottom: 5px;
  }
  
  .stat-value {
    font-size: 18px;
    font-weight: bold;
    color: var(--ion-color-dark);
  }
  
  .advancement-bar {
    margin-top: 5px;
    height: 8px;
    border-radius: 4px;
  }
  
  .status-stats {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--ion-color-light);
  }
  
  .status-stats h3 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: var(--ion-color-dark);
  }
  
  .status-list {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    border-radius: 20px;
    background: var(--ion-color-light);
    font-size: 14px;
  }
  
  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .status-item.nouveau .status-dot {
    background-color: #e74c3c;
  }
  
  .status-item.en-cours .status-dot {
    background-color: #f39c12;
  }
  
  .status-item.termine .status-dot {
    background-color: #2ecc71;
  }
  </style>