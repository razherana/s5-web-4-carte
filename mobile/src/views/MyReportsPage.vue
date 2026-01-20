<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mes signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="clear" @click="refreshReports" :disabled="loading">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="reports-content">
      <!-- Hero Section -->
      <div class="page-header">
        <div class="header-content animate-fade-in">
          <h1 class="page-title">
            Mes <span class="gradient-text">Signalements</span>
          </h1>
          <p class="page-subtitle">Suivez l'évolution de vos rapports routiers</p>
        </div>
        <ion-button 
          fill="solid" 
          class="add-btn" 
          @click="goToMap"
          v-if="!loading && myReports.length > 0"
        >
          <ion-icon :icon="addOutline" slot="start"></ion-icon>
          Nouveau
        </ion-button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loader-wrapper">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <p>Chargement de vos signalements...</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="myReports.length === 0" class="empty-state animate-scale-in">
        <div class="empty-illustration">
          <div class="empty-circle">
            <ion-icon :icon="documentTextOutline"></ion-icon>
          </div>
        </div>
        <h2>Aucun signalement</h2>
        <p>Commencez à contribuer en créant votre premier signalement routier</p>
        <ion-button expand="block" @click="goToMap" size="large">
          <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
          Créer un signalement
        </ion-button>
      </div>

      <!-- Reports Content -->
      <div v-else class="reports-wrapper">
        <!-- Stats Grid -->
        <div class="stats-overview animate-slide-up">
          <div class="stat-card total">
            <div class="stat-icon-wrapper">
              <ion-icon :icon="documentTextOutline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total</span>
              <strong class="stat-value">{{ myReports.length }}</strong>
            </div>
          </div>

          <div class="stat-card nouveau">
            <div class="stat-icon-wrapper">
              <ion-icon :icon="timeOutline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Nouveau</span>
              <strong class="stat-value">{{ statusCount.nouveau }}</strong>
            </div>
          </div>

          <div class="stat-card progress">
            <div class="stat-icon-wrapper">
              <ion-icon :icon="syncOutline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">En cours</span>
              <strong class="stat-value">{{ statusCount.enCours }}</strong>
            </div>
          </div>

          <div class="stat-card done">
            <div class="stat-icon-wrapper">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Terminé</span>
              <strong class="stat-value">{{ statusCount.termine }}</strong>
            </div>
          </div>
        </div>

        <!-- Reports List -->
        <div class="reports-list">
          <ion-item-sliding 
            v-for="(report, index) in sortedReports" 
            :key="report.id"
            class="animate-slide-up"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <ion-item 
              button 
              @click="viewReportDetails(report)"
              lines="none"
              class="report-item"
            >
              <div class="report-content">
                <!-- Report Header -->
                <div class="report-header">
                  <div class="report-type">
                    <div class="type-icon">
                      <ion-icon :icon="getTypeIcon(report.problemType)"></ion-icon>
                    </div>
                    <div class="type-info">
                      <h3>{{ getProblemTypeText(report.problemType) }}</h3>
                      <p class="report-date">{{ formatDate(report.createdAt) }}</p>
                    </div>
                  </div>
                  <div :class="['status-badge', getStatusClass(report.status)]">
                    <span>{{ getStatusText(report.status) }}</span>
                  </div>
                </div>

                <!-- Report Description -->
                <div class="report-description">
                  <p>{{ report.description }}</p>
                </div>

                <!-- Report Meta -->
                <div class="report-meta" v-if="report.surface || report.budget || report.company">
                  <div class="meta-item" v-if="report.surface">
                    <ion-icon :icon="resizeOutline"></ion-icon>
                    <span>{{ report.surface }} m²</span>
                  </div>
                  <div class="meta-item" v-if="report.budget">
                    <ion-icon :icon="cashOutline"></ion-icon>
                    <span>{{ formatCurrency(report.budget) }}</span>
                  </div>
                  <div class="meta-item" v-if="report.company">
                    <ion-icon :icon="businessOutline"></ion-icon>
                    <span>{{ report.company }}</span>
                  </div>
                </div>
              </div>
            </ion-item>

            <!-- Slide Options -->
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="deleteReport(report)">
                <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonChip,
  IonLabel,
  IonMenuButton,
  alertController,
  toastController,
} from "@ionic/vue";
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
  ellipseOutline
} from "ionicons/icons";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import reportService from "@/services/reportService";
import authService from "@/services/authService";

export default {
  name: "MyReportsPage",
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonChip,
    IonLabel,
    IonMenuButton,
  },
  setup() {
    const router = useRouter();
    const myReports = ref([]);
    const loading = ref(false);

    const sortedReports = computed(() => {
      return [...myReports.value].sort((a, b) => {
        const dateA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt);
        return dateB - dateA;
      });
    });

    const statusCount = computed(() => {
      const counts = {
        nouveau: 0,
        enCours: 0,
        termine: 0,
      };

      myReports.value.forEach((report) => {
        const status = report.status?.toLowerCase() || "nouveau";

        if (status.includes("nouveau") || status === "new") {
          counts.nouveau++;
        } else if (status.includes("cours") || status.includes("progress")) {
          counts.enCours++;
        } else if (status.includes("termine") || status.includes("complete")) {
          counts.termine++;
        } else {
          counts.nouveau++;
        }
      });

      return counts;
    });

    const getStatusClass = (status) => {
      const statusStr = status?.toLowerCase() || "nouveau";
      if (statusStr.includes("nouveau") || statusStr === "new") return "nouveau";
      if (statusStr.includes("cours") || statusStr.includes("progress"))
        return "en-cours";
      if (statusStr.includes("termine") || statusStr.includes("complete"))
        return "termine";
      return "nouveau";
    };

    const getStatusText = (status) => {
      const statusStr = status?.toLowerCase() || "nouveau";
      if (statusStr.includes("nouveau") || statusStr === "new") return "Nouveau";
      if (statusStr.includes("cours") || statusStr.includes("progress"))
        return "En cours";
      if (statusStr.includes("termine") || statusStr.includes("complete"))
        return "Terminé";
      return "Nouveau";
    };

    const getProblemTypeText = (type) => {
      const typeMap = {
        nid_poule: "Nid de poule",
        fissure: "Fissure",
        affaissement: "Affaissement",
        degradation: "Dégradation",
        autre: "Autre",
        hole: "Nid de poule",
        crack: "Fissure",
        flooding: "Inondation",
        obstacle: "Obstacle sur la route",
        other: "Autre",
      };
      return typeMap[type] || type || "Type non spécifié";
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
          router.push("/login");
          return;
        }

        const userId = currentUser.uid || currentUser.id;
        const result = await reportService.getUserReports(userId);

        if (result.success) {
          myReports.value = result.data;
        } else {
          showAlert("Erreur", "Impossible de charger vos signalements");
        }
      } catch (error) {
        console.error("Erreur:", error);
        showAlert("Erreur", "Une erreur s'est produite lors du chargement");
      } finally {
        loading.value = false;
      }
    };

    const refreshReports = async () => {
      await loadMyReports();
      showToast("Signalements actualisés", "success");
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return "N/A";
      try {
        const date = timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);
        return date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        return "Date invalide";
      }
    };

    const formatCurrency = (amount) => {
      try {
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "MGA",
          minimumFractionDigits: 0,
        }).format(amount);
      } catch (error) {
        return `${amount} MGA`;
      }
    };

    const viewReportDetails = async (report) => {
      const alert = await alertController.create({
        header: "Détails du signalement",
        message: `
          <strong>Type:</strong> ${getProblemTypeText(report.problemType)}<br>
          <strong>Description:</strong> ${report.description || "N/A"}<br>
          <strong>Statut:</strong> ${getStatusText(report.status)}<br>
          <strong>Date:</strong> ${formatDate(report.createdAt)}<br>
          <strong>Coordonnées:</strong> Lat: ${
            report.location?.lat?.toFixed(6) || "N/A"
          }, Lng: ${report.location?.lng?.toFixed(6) || "N/A"}<br>
          ${
            report.surface
              ? `<strong>Surface:</strong> ${report.surface} m²<br>`
              : ""
          }
          ${
            report.budget
              ? `<strong>Budget:</strong> ${formatCurrency(report.budget)}<br>`
              : ""
          }
          ${
            report.company
              ? `<strong>Entreprise:</strong> ${report.company}<br>`
              : ""
          }
        `,
        buttons: ["Fermer"],
      });
      await alert.present();
    };

    const deleteReport = async (report) => {
      const alert = await alertController.create({
        header: "Confirmation",
        message: "Voulez-vous vraiment supprimer ce signalement ?",
        buttons: [
          {
            text: "Annuler",
            role: "cancel",
          },
          {
            text: "Supprimer",
            role: "destructive",
            handler: async () => {
              try {
                const result = await reportService.deleteReport(report.id);
                
                if (result.success) {
                  myReports.value = myReports.value.filter((r) => r.id !== report.id);
                  showToast("Signalement supprimé avec succès", "success");
                } else {
                  showToast("Erreur lors de la suppression", "danger");
                }
              } catch (error) {
                console.error("Erreur:", error);
                showToast("Erreur lors de la suppression", "danger");
              }
            },
          },
        ],
      });
      await alert.present();
    };

    const goToMap = () => {
      router.push("/map");
    };

    const showAlert = async (header, message) => {
      const alert = await alertController.create({
        header,
        message,
        buttons: ["OK"],
      });
      await alert.present();
    };

    const showToast = async (message, color = "primary") => {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: "top",
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
      ellipseOutline
    };
  },
};
</script>

<style scoped>
.reports-content {
  --background: var(--app-background);
}

ion-header {
  background: var(--app-gradient-primary);
}

ion-header ion-toolbar {
  --background: transparent;
  --color: white;
}

ion-title {
  color: white;
}

ion-buttons ion-button {
  --color: white;
}

/* Page Header */
.page-header {
  background: var(--app-gradient-primary);
  padding: var(--app-space-xl) var(--app-space-lg) var(--app-space-2xl);
  color: white;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.header-content {
  position: relative;
  z-index: 1;
  margin-bottom: var(--app-space-md);
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 var(--app-space-xs);
  font-family: var(--app-font-display);
  letter-spacing: -0.5px;
  color: white;
}

.page-title .gradient-text {
  color: rgba(255, 255, 255, 0.9);
}

.page-subtitle {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

.add-btn {
  --background: rgba(255, 255, 255, 0.2);
  --background-hover: rgba(255, 255, 255, 0.3);
  --color: white;
  --border-radius: var(--app-radius-full);
  --padding-start: 20px;
  --padding-end: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-weight: 600;
  position: relative;
  z-index: 1;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loader-wrapper {
  text-align: center;
}

.loader-wrapper p {
  margin-top: var(--app-space-lg);
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-3xl) var(--app-space-xl);
  text-align: center;
  min-height: 60vh;
}

.empty-illustration {
  margin-bottom: var(--app-space-xl);
}

.empty-circle {
  width: 120px;
  height: 120px;
  border-radius: var(--app-radius-full);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 2px solid rgba(99, 102, 241, 0.2);
}

.empty-circle ion-icon {
  font-size: 60px;
  color: var(--ion-color-primary);
}

.empty-state h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 var(--app-space-sm);
  color: var(--app-text-primary);
}

.empty-state p {
  font-size: 1rem;
  color: var(--app-text-secondary);
  margin: 0 0 var(--app-space-xl);
  max-width: 300px;
  line-height: 1.6;
}

.empty-state ion-button {
  --background: var(--app-gradient-primary);
  --box-shadow: var(--app-shadow-primary);
}

/* Reports Wrapper */
.reports-wrapper {
  padding: var(--app-space-lg);
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--app-space-md);
  margin-bottom: var(--app-space-xl);
}

.stat-card {
  background: var(--app-surface);
  border-radius: var(--app-radius-xl);
  padding: var(--app-space-lg);
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-sm);
  transition: all var(--app-transition-base);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
  transition: all var(--app-transition-base);
}

.stat-card.total::before {
  background: var(--ion-color-primary);
}

.stat-card.nouveau::before {
  background: var(--ion-color-warning);
}

.stat-card.progress::before {
  background: var(--ion-color-secondary);
}

.stat-card.done::before {
  background: var(--ion-color-success);
}

.stat-card:active {
  transform: scale(0.98);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--app-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.stat-card.total .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05));
}

.stat-card.nouveau .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
}

.stat-card.progress .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05));
}

.stat-card.done .stat-icon-wrapper {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05));
}

.stat-icon-wrapper ion-icon {
  font-size: 24px;
}

.stat-card.total .stat-icon-wrapper ion-icon {
  color: var(--ion-color-primary);
}

.stat-card.nouveau .stat-icon-wrapper ion-icon {
  color: var(--ion-color-warning);
}

.stat-card.progress .stat-icon-wrapper ion-icon {
  color: var(--ion-color-secondary);
}

.stat-card.done .stat-icon-wrapper ion-icon {
  color: var(--ion-color-success);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--app-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--app-text-primary);
  line-height: 1;
}

/* Reports List */
.reports-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-md);
}

.report-item {
  --background: var(--app-surface);
  --border-radius: var(--app-radius-xl);
  --padding-start: 0;
  --padding-end: 0;
  --inner-padding-end: 0;
  border-radius: var(--app-radius-xl);
  box-shadow: var(--app-shadow-sm);
  border: 1px solid var(--app-border);
  transition: all var(--app-transition-base);
}

.report-item:active {
  transform: scale(0.98);
  box-shadow: var(--app-shadow-md);
}

.report-content {
  width: 100%;
  padding: var(--app-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-md);
}

/* Report Header */
.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--app-space-md);
}

.report-type {
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  flex: 1;
  min-width: 0;
}

.type-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--app-radius-md);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.type-icon ion-icon {
  font-size: 22px;
  color: var(--ion-color-primary);
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-info h3 {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 4px;
  color: var(--app-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-date {
  font-size: 0.75rem;
  color: var(--app-text-tertiary);
  margin: 0;
}

/* Status Badge */
.status-badge {
  padding: 6px 14px;
  border-radius: var(--app-radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.status-badge.nouveau {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.1));
  color: var(--ion-color-warning-shade);
}

.status-badge.en-cours {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.1));
  color: var(--ion-color-secondary-shade);
}

.status-badge.termine {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.1));
  color: var(--ion-color-success-shade);
}

/* Report Description */
.report-description {
  padding-left: 60px;
}

.report-description p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--app-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Report Meta */
.report-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-sm);
  padding-left: 60px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--app-background);
  border-radius: var(--app-radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--app-text-secondary);
}

.meta-item ion-icon {
  font-size: 16px;
  color: var(--app-text-tertiary);
}

/* Slide Options */
ion-item-sliding {
  margin: 0;
}

ion-item-option {
  border-radius: var(--app-radius-xl);
}

/* Responsive */
@media (min-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(4, 1fr);
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-content {
    margin-bottom: 0;
  }

  .reports-wrapper {
    padding: var(--app-space-xl);
  }
}
</style>