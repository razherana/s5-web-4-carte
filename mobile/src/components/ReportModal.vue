<template>
  <ion-modal class="report-modal-modern" :is-open="isOpen" @ionModalDidDismiss="close">
    <ion-header class="modal-header-modern">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" class="back-btn-modern" @click="close">
            <ion-icon :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="modal-title-modern">
          <div class="title-wrapper">
            <ion-icon :icon="addCircleOutline" class="title-icon"></ion-icon>
            <span>Nouveau signalement</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="modal-content-modern">
      <form @submit.prevent="submitReport" class="report-form-modern">
        <!-- Hero Section -->
        <div class="modal-hero-modern">
          <div class="hero-icon-wrapper">
            <ion-icon :icon="locationOutline"></ion-icon>
          </div>
          <div class="hero-content">
            <h2>Signaler une anomalie</h2>
            <p>Aidez à améliorer la qualité des routes d'Antananarivo</p>
          </div>
          <div class="location-badge">
            <ion-icon :icon="navigateOutline"></ion-icon>
            <span>{{ coordsText }}</span>
          </div>
        </div>

        <!-- Description Section -->
        <div class="form-section">
          <div class="section-header">
            <ion-icon :icon="documentTextOutline"></ion-icon>
            <h3>Description</h3>
          </div>
          <div class="input-wrapper">
            <ion-textarea
              v-model="form.description"
              :rows="5"
              placeholder="Décrivez précisément l'anomalie observée..."
              class="modern-textarea"
              required
            ></ion-textarea>
            <span class="input-hint">Soyez aussi précis que possible</span>
          </div>
        </div>

        <!-- Problem Type Section -->
        <div class="form-section">
          <div class="section-header">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <h3>Type de problème</h3>
          </div>
          <div class="problem-type-grid">
            <button
              type="button"
              v-for="type in problemTypes"
              :key="type.value"
              class="problem-type-btn"
              :class="{ active: form.problemType === type.value }"
              @click="form.problemType = type.value"
            >
              <ion-icon :icon="type.icon"></ion-icon>
              <span>{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- Details Section -->
        <div class="form-section">
          <div class="section-header">
            <ion-icon :icon="analyticsOutline"></ion-icon>
            <h3>Estimations</h3>
          </div>
          <div class="details-grid">
            <div class="input-wrapper">
              <label class="modern-label">
                <ion-icon :icon="resizeOutline"></ion-icon>
                Surface (m²)
              </label>
              <ion-input
                v-model.number="form.surface"
                type="number"
                min="0"
                step="0.1"
                placeholder="Ex: 5.5"
                class="modern-input"
              ></ion-input>
            </div>
            <div class="input-wrapper">
              <label class="modern-label">
                <ion-icon :icon="cashOutline"></ion-icon>
                Budget (MGA)
              </label>
              <ion-input
                v-model.number="form.budget"
                type="number"
                min="0"
                step="1000"
                placeholder="Ex: 500000"
                class="modern-input"
              ></ion-input>
            </div>
          </div>
        </div>

        <!-- Company Section -->
        <div class="form-section">
          <div class="section-header">
            <ion-icon :icon="businessOutline"></ion-icon>
            <h3>Entreprise</h3>
            <span class="optional-badge">Optionnel</span>
          </div>
          <div class="input-wrapper">
            <ion-input
              v-model="form.company"
              placeholder="Nom de l'entreprise responsable"
              class="modern-input"
            ></ion-input>
          </div>
        </div>

        <!-- Photo Section -->
        <div class="form-section photo-section">
          <div class="section-header">
            <ion-icon :icon="cameraOutline"></ion-icon>
            <h3>Photo</h3>
            <span class="optional-badge">Optionnel</span>
          </div>
          
          <div v-if="!form.photoUrl" class="photo-upload-zone" @click="takePhoto">
            <div class="upload-icon">
              <ion-icon :icon="cloudUploadOutline"></ion-icon>
            </div>
            <p class="upload-text">Ajouter une photo</p>
            <p class="upload-hint">Cliquez pour prendre ou sélectionner une photo</p>
          </div>
          
          <div v-else class="photo-preview-modern">
            <img :src="form.photoUrl" alt="Photo du signalement" />
            <button type="button" class="remove-photo-btn" @click="removePhoto">
              <ion-icon :icon="trashOutline"></ion-icon>
              Supprimer
            </button>
          </div>
        </div>

        <!-- Submit Section -->
        <div class="form-actions">
          <button type="button" class="cancel-btn-modern" @click="close" :disabled="submitting">
            Annuler
          </button>
          <button type="submit" class="submit-btn-modern" :disabled="submitting || !isFormValid">
            <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
            <ion-icon v-else :icon="checkmarkCircleOutline"></ion-icon>
            <span>{{ submitting ? "Envoi..." : "Créer le signalement" }}</span>
          </button>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script>
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  alertController,
  toastController,
} from "@ionic/vue";
import { ref, computed, watch } from "vue";
import {
  camera,
  cameraOutline,
  closeOutline,
  mapOutline,
  addCircleOutline,
  locationOutline,
  navigateOutline,
  documentTextOutline,
  alertCircleOutline,
  analyticsOutline,
  resizeOutline,
  cashOutline,
  businessOutline,
  cloudUploadOutline,
  trashOutline,
  checkmarkCircleOutline,
  warningOutline,
  hammerOutline,
  trendingDownOutline,
  constructOutline,
  ellipsisHorizontalOutline,
} from "ionicons/icons";
import reportService from "@/services/reportService";
import authService from "@/services/authService";

export default {
  name: "ReportModal",
  components: {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons,
    IonIcon,
    IonSpinner,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    location: {
      type: Object,
      default: () => ({ lat: -18.8792, lng: 47.5079 }),
    },
  },
  emits: ["close", "report-created"],
  setup(props, { emit }) {
    const form = ref({
      description: "",
      problemType: "nid_poule",
      surface: null,
      budget: null,
      company: "",
      photoUrl: "",
    });

    const problemTypes = [
      { value: "nid_poule", label: "Nid de poule", icon: warningOutline },
      { value: "fissure", label: "Fissure", icon: hammerOutline },
      { value: "affaissement", label: "Affaissement", icon: trendingDownOutline },
      { value: "degradation", label: "Dégradation", icon: constructOutline },
      { value: "autre", label: "Autre", icon: ellipsisHorizontalOutline },
    ];

    const submitting = ref(false);

    const coordsText = computed(() => {
      return `${props.location.lat.toFixed(6)}, ${props.location.lng.toFixed(
        6
      )}`;
    });

    const isFormValid = computed(() => {
      return (
        form.value.description.trim() !== "" && form.value.problemType !== ""
      );
    });

    const close = () => {
      resetForm();
      emit("close");
    };

    const resetForm = () => {
      form.value = {
        description: "",
        problemType: "nid_poule",
        surface: null,
        budget: null,
        company: "",
        photoUrl: "",
      };
      submitting.value = false;
    };

    const takePhoto = async () => {
      // Pour l'instant, simuler la prise de photo
      // En production, utiliser @capacitor/camera
      const alert = await alertController.create({
        header: "Photo",
        message:
          "Simulation de prise de photo. En production, utilisez @capacitor/camera.",
        buttons: ["OK"],
      });
      await alert.present();

      // Simuler une URL de photo
      form.value.photoUrl =
        "https://via.placeholder.com/300x200/007bff/ffffff?text=Photo+du+signalement";
    };

    const removePhoto = () => {
      form.value.photoUrl = "";
    };

    const submitReport = async () => {
      // Vérifier que l'utilisateur est connecté
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        const alert = await alertController.create({
          header: "Erreur",
          message: "Vous devez être connecté pour créer un signalement",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      // Vérifier la validation du formulaire
      if (!isFormValid.value) {
        const alert = await alertController.create({
          header: "Erreur",
          message: "Veuillez remplir tous les champs obligatoires",
          buttons: ["OK"],
        });
        await alert.present();
        return;
      }

      submitting.value = true;

      try {
        const reportData = {
          description: form.value.description.trim(),
          problem_type: form.value.problemType, // Correspond au schéma
          lat: props.location.lat,
          lng: props.location.lng,
          surface: form.value.surface || null,
          budget: form.value.budget || null,
          entreprise_id: form.value.company.trim() || null,
          user_id: currentUser.uid || currentUser.id,
          user_email: currentUser.email || "Non spécifié",
          // Supprimer l'id car Firestore le génère automatiquement
          status: "nouveau",
        };

        console.log("Envoi du signalement au format reporting:", reportData);

        const result = await reportService.createReport(reportData);

        if (result.success) {
          const toast = await toastController.create({
            message: "Signalement créé avec succès!",
            duration: 2000,
            color: "success",
            position: "top",
          });
          await toast.present();

          resetForm();
          emit("report-created", result.id);
          emit("close");
        } else {
          throw new Error(result.error || "Erreur inconnue");
        }
      } catch (error) {
        console.error("Erreur lors de la création du signalement:", error);
        const alert = await alertController.create({
          header: "Erreur",
          message:
            error.message ||
            "Impossible de créer le signalement. Veuillez réessayer.",
          buttons: ["OK"],
        });
        await alert.present();
      } finally {
        submitting.value = false;
      }
    };

    // Réinitialiser le formulaire quand le modal se ferme
    watch(
      () => props.isOpen,
      (newVal) => {
        if (!newVal) {
          resetForm();
        }
      }
    );

    return {
      form,
      submitting,
      coordsText,
      isFormValid,
      problemTypes,
      camera,
      cameraOutline,
      mapOutline,
      closeOutline,
      addCircleOutline,
      locationOutline,
      navigateOutline,
      documentTextOutline,
      alertCircleOutline,
      analyticsOutline,
      resizeOutline,
      cashOutline,
      businessOutline,
      cloudUploadOutline,
      trashOutline,
      checkmarkCircleOutline,
      warningOutline,
      hammerOutline,
      trendingDownOutline,
      constructOutline,
      ellipsisHorizontalOutline,
      close,
      takePhoto,
      removePhoto,
      submitReport,
    };
  },
};
</script>

<style scoped>
/* Modal Container */
:deep(.report-modal-modern .modal-wrapper) {
  border-radius: 100px 100px 0 0;
  overflow: hidden;
  height: 90vh;
  max-height: 90vh;
}

:deep(.report-modal-modern .ion-page) {
  border-radius: 100px 100px 0 0;
  overflow: hidden;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.2);
}

/* Header */
.modal-header-modern {
  position: relative;
  z-index: 10;
}

:deep(.modal-header-modern ion-toolbar) {
  --background: rgba(255, 255, 255, 0.98);
  --color: #0f172a;
  --border-width: 0;
  --padding-top: 8px;
  --padding-bottom: 8px;
  backdrop-filter: blur(24px) saturate(140%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.back-btn-modern {
  --color: #64748b;
  --padding-start: 12px;
  --padding-end: 12px;
}

.back-btn-modern ion-icon {
  font-size: 26px;
}

.modal-title-modern {
  font-weight: 800;
  font-size: 1.1rem;
  padding: 0;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
}

.title-icon {
  font-size: 24px;
  color: #2563eb;
}

/* Content */
.modal-content-modern {
  --background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%);
  --padding-top: 0;
  --padding-bottom: 0;
}

/* Form */
.report-form-modern {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 640px;
  margin: 0 auto;
}

/* Hero Section */
.modal-hero-modern {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(29, 78, 216, 0.95));
  border-radius: 20px;
  padding: 24px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.25);
}

.modal-hero-modern::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  border-radius: 50%;
}

.hero-icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.hero-icon-wrapper ion-icon {
  font-size: 32px;
  color: white;
}

.hero-content h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
}

.hero-content p {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.location-badge ion-icon {
  font-size: 18px;
  color: white;
}

.location-badge span {
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
}

/* Form Sections */
.form-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(130%);
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(148, 163, 184, 0.1);
}

.section-header ion-icon {
  font-size: 22px;
  color: #2563eb;
}

.section-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  flex: 1;
}

.optional-badge {
  background: rgba(100, 116, 139, 0.12);
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Input Wrapper */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modern-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.modern-label ion-icon {
  font-size: 16px;
  color: #64748b;
}

/* Modern Inputs */
:deep(.modern-textarea),
:deep(.modern-input) {
  --background: rgba(255, 255, 255, 0.9);
  --color: #0f172a;
  --placeholder-color: #94a3b8;
  --placeholder-opacity: 1;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  border-radius: 14px;
  border: 2px solid rgba(148, 163, 184, 0.2);
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

:deep(.modern-textarea:focus-within),
:deep(.modern-input:focus-within) {
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.15), 0 0 0 4px rgba(37, 99, 235, 0.08);
}

.input-hint {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  padding-left: 4px;
}

/* Problem Type Grid */
.problem-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.problem-type-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.problem-type-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(37, 99, 235, 0.02));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.problem-type-btn:hover::before {
  opacity: 1;
}

.problem-type-btn ion-icon {
  font-size: 28px;
  color: #64748b;
  transition: all 0.3s ease;
}

.problem-type-btn span {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.3s ease;
}

.problem-type-btn.active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.08));
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
  transform: translateY(-2px);
}

.problem-type-btn.active ion-icon {
  color: #2563eb;
  transform: scale(1.1);
}

.problem-type-btn.active span {
  color: #2563eb;
  font-weight: 700;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

/* Photo Section */
.photo-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
}

.photo-upload-zone {
  border: 2px dashed rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.6);
}

.photo-upload-zone:hover {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.03);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.1);
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(37, 99, 235, 0.08));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon ion-icon {
  font-size: 32px;
  color: #2563eb;
}

.upload-text {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

.photo-preview-modern {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.photo-preview-modern img {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.remove-photo-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(220, 38, 38, 0.95);
  backdrop-filter: blur(10px);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  transition: all 0.2s ease;
}

.remove-photo-btn:hover {
  background: rgba(185, 28, 28, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
}

.remove-photo-btn ion-icon {
  font-size: 18px;
}

/* Form Actions */
.form-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  position: sticky;
  bottom: 20px;
  z-index: 5;
}

.cancel-btn-modern {
  background: rgba(148, 163, 184, 0.15);
  color: #475569;
  border: 2px solid rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  padding: 16px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn-modern:hover:not(:disabled) {
  background: rgba(148, 163, 184, 0.25);
  border-color: rgba(148, 163, 184, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.cancel-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn-modern {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);
  position: relative;
  overflow: hidden;
}

.submit-btn-modern::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.submit-btn-modern:hover:not(:disabled)::before {
  opacity: 1;
}

.submit-btn-modern:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.45);
}

.submit-btn-modern:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn-modern:disabled {
  background: rgba(148, 163, 184, 0.3);
  color: rgba(15, 23, 42, 0.4);
  box-shadow: none;
  cursor: not-allowed;
}

.submit-btn-modern ion-icon,
.submit-btn-modern ion-spinner {
  font-size: 22px;
}

/* Responsive */
@media (max-width: 640px) {
  .problem-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    grid-template-columns: 1fr;
  }
  
  .cancel-btn-modern {
    order: 2;
  }
}
</style>
