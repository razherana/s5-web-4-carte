<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Mes signalements</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshReports">
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Chargement de vos signalements...</p>
      </div>

      <div v-else-if="myReports.length === 0" class="empty-state">
        <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
        <h2>Aucun signalement</h2>
        <p>Vous n'avez pas encore créé de signalement</p>
        <ion-button @click="goToMap">Créer un signalement</ion-button>
      </div>

      <div v-else class="reports-container">
        <!-- Statistiques personnelles -->
        <ion-card class="my-stats">
          <ion-card-header>
            <ion-card-title>Mes statistiques</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="stats-row">
              <div class="stat">
                <span class="stat-value">{{ myReports.length }}</span>
                <span class="stat-label">Total</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ statusCount.nouveau }}</span>
                <span class="stat-label">Nouveau</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ statusCount.enCours }}</span>
                <span class="stat-label">En cours</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ statusCount.termine }}</span>
                <span class="stat-label">Terminé</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Liste des signalements -->
        <ion-list>
          <ion-item-sliding v-for="report in sortedReports" :key="report.id">
            <ion-item @click="viewReportDetails(report)">
              <div class="report-item">
                <div class="report-header">
                  <span
                    :class="['status-badge', getStatusClass(report.status)]"
                  >
                    {{ getStatusText(report.status) }}
                  </span>
                  <span class="report-date">
                    {{ formatDate(report.createdAt) }}
                  </span>
                </div>

                <div class="report-content">
                  <h3>{{ getProblemTypeText(report.problemType) }}</h3>
                  <p class="description">{{ report.description }}</p>
                </div>

                <div class="report-details">
                  <ion-chip v-if="report.surface" outline>
                    <ion-icon :icon="resizeOutline"></ion-icon>
                    <ion-label>{{ report.surface }} m²</ion-label>
                  </ion-chip>
                  <ion-chip v-if="report.budget" outline>
                    <ion-icon :icon="cashOutline"></ion-icon>
                    <ion-label>{{ formatCurrency(report.budget) }}</ion-label>
                  </ion-chip>
                  <ion-chip v-if="report.company" outline>
                    <ion-icon :icon="businessOutline"></ion-icon>
                    <ion-label>{{ report.company }}</ion-label>
                  </ion-chip>
                </div>
              </div>
            </ion-item>

            <ion-item-options side="end">
              <ion-item-option color="danger" @click="deleteReport(report)">
                <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>
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
      refreshOutline,
      documentTextOutline,
      resizeOutline,
      cashOutline,
      businessOutline,
      trashOutline,
    };
  },
};
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 80px;
  color: var(--ion-color-medium);
  margin-bottom: 20px;
}

.empty-state h2 {
  margin: 0 0 10px 0;
  color: var(--ion-color-dark);
}

.empty-state p {
  color: var(--ion-color-medium);
  margin-bottom: 30px;
}

.reports-container {
  padding: 10px;
}

.my-stats {
  margin-bottom: 20px;
}

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.report-item {
  width: 100%;
  padding: 10px 0;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.nouveau {
  background-color: #fee;
  color: #e74c3c;
}

.status-badge.en-cours {
  background-color: #fef5e7;
  color: #f39c12;
}

.status-badge.termine {
  background-color: #eafaf1;
  color: #2ecc71;
}

.report-date {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.report-content h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: var(--ion-color-dark);
}

.description {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
  white-space: pre-wrap;
}

.report-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

ion-chip {
  margin: 0;
  font-size: 12px;
}
</style>