<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mes signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button class="icon-chip" @click="refreshReports" :disabled="loading">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="reports-content">
      <div class="page-shell">
        <section class="glass-strong card header-panel">
          <div>
            <h1>Vos signalements</h1>
            <p class="text-secondary">Suivez le statut, le budget et l'évolution des interventions.</p>
          </div>
          <div class="btn-primary" v-if="!loading">
            <ion-button expand="block" @click="goToMap">
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Nouveau signalement
            </ion-button>
          </div>
        </section>

        <div v-if="loading" class="loading-state glass card">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Chargement de vos signalements...</p>
        </div>

        <div v-else-if="myReports.length === 0" class="empty-state glass card">
          <div class="empty-visual">
            <ion-icon :icon="documentTextOutline"></ion-icon>
          </div>
          <h2>Aucun signalement pour le moment</h2>
          <p class="text-secondary">Ajoutez votre premier signalement pour améliorer la circulation.</p>
          <div class="btn-primary">
            <ion-button expand="block" @click="goToMap" size="large">
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              Créer un signalement
            </ion-button>
          </div>
        </div>

        <div v-else class="reports-grid">
          <div class="stats-grid">
            <div class="stat-card glass">
              <span>Total</span>
              <strong>{{ myReports.length }}</strong>
            </div>
            <div class="stat-card glass">
              <span>Nouveau</span>
              <strong>{{ statusCount.nouveau }}</strong>
            </div>
            <div class="stat-card glass">
              <span>En cours</span>
              <strong>{{ statusCount.enCours }}</strong>
            </div>
            <div class="stat-card glass">
              <span>Terminé</span>
              <strong>{{ statusCount.termine }}</strong>
            </div>
          </div>

          <div class="reports-list">
            <ion-item-sliding v-for="report in sortedReports" :key="report.id" class="report-slide">
              <ion-item button lines="none" class="report-card" @click="viewReportDetails(report)">
                <div class="report-main">
                  <div class="report-top">
                    <div class="type-pill">
                      <ion-icon :icon="getTypeIcon(report.problemType)"></ion-icon>
                      <span>{{ getProblemTypeText(report.problemType) }}</span>
                    </div>
                    <span :class="['status-pill', getStatusClass(report.status)]">{{ getStatusText(report.status) }}</span>
                  </div>
                  <p class="report-date">{{ formatDate(report.createdAt) }}</p>
                  <p class="report-desc">{{ report.description }}</p>
                  <div class="report-meta">
                    <span v-if="report.surface"><ion-icon :icon="resizeOutline"></ion-icon>{{ report.surface }} m²</span>
                    <span v-if="report.budget"><ion-icon :icon="cashOutline"></ion-icon>{{ formatCurrency(report.budget) }}</span>
                    <span v-if="report.company"><ion-icon :icon="businessOutline"></ion-icon>{{ report.company }}</span>
                  </div>
                </div>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option color="danger" @click="deleteReport(report)">
                  <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </div>
        </div>
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
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonMenuButton,
  alertController,
  toastController,
} from '@ionic/vue';
import {
  refreshOutline,
  documentTextOutline,
  resizeOutline,
  cashOutline,
  businessOutline,
  trashOutline,
  addOutline,
  addCircleOutline,
  timeOutline,
  syncOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  constructOutline,
  warningOutline,
  ellipseOutline,
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import reportService from '@/services/reportService';
import authService from '@/services/authService';

export default {
  name: 'MyReportsPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonMenuButton,
  },
  setup() {
    const router = useRouter();
    const myReports = ref([]);
    const loading = ref(false);

    const sortedReports = computed(() => {
      return [...myReports.value].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    });

    const statusCount = computed(() => {
      const counts = { nouveau: 0, enCours: 0, termine: 0 };

      myReports.value.forEach((report) => {
        const status = report.status?.toLowerCase() || 'nouveau';

        if (status.includes('nouveau') || status === 'new') {
          counts.nouveau++;
        } else if (status.includes('cours') || status.includes('progress')) {
          counts.enCours++;
        } else if (status.includes('termine') || status.includes('complete')) {
          counts.termine++;
        } else {
          counts.nouveau++;
        }
      });

      return counts;
    });

    const getStatusClass = (status) => {
      const statusStr = status?.toLowerCase() || 'nouveau';
      if (statusStr.includes('nouveau') || statusStr === 'new') return 'nouveau';
      if (statusStr.includes('cours') || statusStr.includes('progress')) return 'en-cours';
      if (statusStr.includes('termine') || statusStr.includes('complete')) return 'termine';
      return 'nouveau';
    };

    const getStatusText = (status) => {
      const statusStr = status?.toLowerCase() || 'nouveau';
      if (statusStr.includes('nouveau') || statusStr === 'new') return 'Nouveau';
      if (statusStr.includes('cours') || statusStr.includes('progress')) return 'En cours';
      if (statusStr.includes('termine') || statusStr.includes('complete')) return 'Terminé';
      return 'Nouveau';
    };

    const getProblemTypeText = (type) => {
      const typeMap = {
        nid_poule: 'Nid de poule',
        fissure: 'Fissure',
        affaissement: 'Affaissement',
        degradation: 'Dégradation',
        autre: 'Autre',
        hole: 'Nid de poule',
        crack: 'Fissure',
        flooding: 'Inondation',
        obstacle: 'Obstacle sur la route',
        other: 'Autre',
      };
      return typeMap[type] || type || 'Type non spécifié';
    };

    const getTypeIcon = (type) => {
      const iconMap = {
        nid_poule: alertCircleOutline,
        fissure: warningOutline,
        affaissement: warningOutline,
        degradation: constructOutline,
        autre: ellipseOutline,
        hole: alertCircleOutline,
        crack: warningOutline,
        flooding: warningOutline,
        obstacle: constructOutline,
        other: ellipseOutline,
      };
      return iconMap[type] || alertCircleOutline;
    };

    const loadMyReports = async () => {
      loading.value = true;

      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }

        const userId = currentUser.uid || currentUser.id;
        const result = await reportService.getUserReports(userId);

        if (result.success) {
          myReports.value = result.data;
        } else {
          showAlert('Erreur', 'Impossible de charger vos signalements');
        }
      } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur', "Une erreur s'est produite lors du chargement");
      } finally {
        loading.value = false;
      }
    };

    const refreshReports = async () => {
      await loadMyReports();
      showToast('Signalements actualisés', 'success');
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        return 'Date invalide';
      }
    };

    const formatCurrency = (amount) => {
      try {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'MGA',
          minimumFractionDigits: 0,
        }).format(amount);
      } catch (error) {
        return `${amount} MGA`;
      }
    };

    const viewReportDetails = async (report) => {
      const alert = await alertController.create({
        header: getProblemTypeText(report.problemType),
        message: `Statut: ${getStatusText(report.status)}\n\n${report.description}`,
        buttons: ['OK'],
      });
      await alert.present();
    };

    const deleteReport = async (report) => {
      const alert = await alertController.create({
        header: 'Supprimer',
        message: 'Voulez-vous vraiment supprimer ce signalement ?',
        buttons: [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Supprimer',
            handler: async () => {
              try {
                const result = await reportService.deleteReport(report.id);
                if (result.success) {
                  myReports.value = myReports.value.filter((item) => item.id !== report.id);
                  showToast('Signalement supprimé', 'success');
                } else {
                  showToast('Erreur lors de la suppression', 'danger');
                }
              } catch (error) {
                console.error('Erreur:', error);
                showToast('Erreur lors de la suppression', 'danger');
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const goToMap = () => {
      router.push('/map');
    };

    const showAlert = async (header, message) => {
      const alert = await alertController.create({
        header,
        message,
        buttons: ['OK'],
      });
      await alert.present();
    };

    const showToast = async (message, color = 'primary') => {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: 'top',
      });
      await toast.present();
    };

    onMounted(() => {
      loadMyReports();
    });

    return {
      myReports,
      loading,
      sortedReports,
      statusCount,
      refreshReports,
      formatDate,
      formatCurrency,
      viewReportDetails,
      deleteReport,
      goToMap,
      getStatusClass,
      getStatusText,
      getProblemTypeText,
      getTypeIcon,
      refreshOutline,
      documentTextOutline,
      resizeOutline,
      cashOutline,
      businessOutline,
      trashOutline,
      addOutline,
      addCircleOutline,
      timeOutline,
      syncOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      constructOutline,
      warningOutline,
      ellipseOutline,
    };
  },
};
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.reports-content {
  --background: transparent;
}

.icon-chip {
  --background: rgba(255, 255, 255, 0.3);
  --color: var(--app-text-primary);
  --border-radius: var(--app-radius-full);
  --padding-start: 8px;
  --padding-end: 8px;
}

.header-panel {
  display: grid;
  gap: var(--app-space-md);
}

.header-panel h1 {
  margin: 0 0 6px;
  font-size: clamp(1.5rem, 4vw, 2rem);
}

.loading-state {
  display: grid;
  gap: 10px;
  place-items: center;
  min-height: 160px;
}

.empty-state {
  display: grid;
  gap: var(--app-space-sm);
  text-align: center;
  padding: var(--app-space-xl);
}

.empty-visual {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(79, 70, 229, 0.15);
  margin: 0 auto;
  animation: pulse 2s ease-in-out infinite;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--app-space-md);
}

.stat-card {
  padding: 14px 16px;
  border-radius: var(--app-radius-lg);
  display: grid;
  gap: 6px;
}

.stat-card span {
  color: var(--app-text-tertiary);
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.stat-card strong {
  font-size: 1.4rem;
}

.reports-list {
  margin-top: var(--app-space-lg);
  display: grid;
  gap: var(--app-space-md);
}

.report-card {
  --background: transparent;
  --inner-padding-end: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.report-main {
  width: 100%;
  background: var(--app-glass-bg);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-xl);
  padding: var(--app-space-lg);
  display: grid;
  gap: 10px;
}

.report-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(79, 70, 229, 0.12);
  padding: 6px 12px;
  border-radius: var(--app-radius-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.status-pill {
  padding: 6px 12px;
  border-radius: var(--app-radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.status-pill.nouveau {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.status-pill.en-cours {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-pill.termine {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.report-date {
  color: var(--app-text-tertiary);
  font-size: 0.75rem;
  margin: 0;
}

.report-desc {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.9rem;
}

.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.75rem;
  color: var(--app-text-secondary);
}

.report-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>