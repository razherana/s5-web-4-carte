<template>
  <ion-modal
    class="report-modal-modern"
    :is-open="isOpen"
    @ionModalDidDismiss="close"
  >
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

        <!-- Photo Section - Multi-photos -->
        <div class="form-section photo-section">
          <div class="section-header">
            <ion-icon :icon="cameraOutline"></ion-icon>
            <h3>Photos</h3>
            <span class="optional-badge"
              >{{ form.photos.length }}/{{ maxPhotos }}</span
            >
          </div>

          <!-- Upload zone -->
          <div
            v-if="form.photos.length < maxPhotos"
            class="photo-upload-zone"
            @click="addPhotos"
          >
            <div class="upload-icon">
              <ion-icon :icon="imagesOutline"></ion-icon>
            </div>
            <p class="upload-text">Ajouter des photos</p>
            <p class="upload-hint">
              Jusqu'à {{ maxPhotos }} photos • Cliquez pour sélectionner
            </p>
          </div>

          <!-- Photos preview grid -->
          <div v-if="form.photos.length > 0" class="photos-grid">
            <div
              v-for="(photo, index) in form.photos"
              :key="index"
              class="photo-item"
            >
              <img :src="photo.preview" :alt="`Photo ${index + 1}`" />
              <button
                type="button"
                class="remove-photo-btn-small"
                @click="removePhoto(index)"
              >
                <ion-icon :icon="closeCircleOutline"></ion-icon>
              </button>
              <div class="photo-number">{{ index + 1 }}</div>
            </div>
          </div>

          <!-- Action buttons -->
          <div
            v-if="form.photos.length > 0 && form.photos.length < maxPhotos"
            class="photo-actions"
          >
            <button type="button" class="add-more-btn" @click="addPhotos">
              <ion-icon :icon="addOutline"></ion-icon>
              Ajouter plus
            </button>
          </div>
        </div>

        <!-- Submit Section -->
        <div class="form-actions">
          <button
            type="button"
            class="cancel-btn-modern"
            @click="close"
            :disabled="submitting"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="submit-btn-modern"
            :disabled="submitting || !isFormValid"
          >
            <ion-spinner v-if="submitting" name="crescent"></ion-spinner>
            <ion-icon v-else :icon="checkmarkCircleOutline"></ion-icon>
            <span>{{
              submitting ? uploadProgress : "Créer le signalement"
            }}</span>
          </button>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script>
import imageService from "@/services/imageService";

import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonButtons,
  IonIcon,
  IonSpinner,
  alertController,
  toastController,
  actionSheetController,
} from "@ionic/vue";
import { ref, computed } from "vue";
import {
  cameraOutline,
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
  imagesOutline,
  closeCircleOutline,
  addOutline,
  checkmarkCircleOutline,
  warningOutline,
  hammerOutline,
  trendingDownOutline,
  constructOutline,
  ellipsisHorizontalOutline,
  folderOutline,
} from "ionicons/icons";
import reportService from "@/services/reportService";
import authService from "@/services/authService";
import capacitorService from "@/services/capacitorService";

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
    const maxPhotos = 5;
    const form = ref({
      description: "",
      problemType: "nid_poule",
      surface: null,
      budget: null,
      company: "",
      photos: [], // Array of { file, preview, name }
    });

    const problemTypes = [
      { value: "nid_poule", label: "Nid de poule", icon: warningOutline },
      { value: "fissure", label: "Fissure", icon: hammerOutline },
      {
        value: "affaissement",
        label: "Affaissement",
        icon: trendingDownOutline,
      },
      { value: "degradation", label: "Dégradation", icon: constructOutline },
      { value: "autre", label: "Autre", icon: ellipsisHorizontalOutline },
    ];

    const submitting = ref(false);
    const uploadProgress = ref("Envoi...");

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
        photos: [],
      };
      submitting.value = false;
      uploadProgress.value = "Envoi...";
    };

    // Fonction utilitaire pour convertir dataURL en Blob
    const dataURLtoBlob = (dataURL) => {
      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }

      return new Blob([u8arr], { type: mime });
    };

    // Fonction pour compresser les images
    const compressImage = async (blob, maxWidth = 1024) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
          URL.revokeObjectURL(url);

          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (compressedBlob) => resolve(compressedBlob),
            "image/jpeg",
            0.7
          );
        };

        img.onerror = reject;
        img.src = url;
      });
    };

    // Fonction pour ajouter une photo au formulaire
    const addPhotoToForm = async (fileOrBlob) => {
      try {
        const blob =
          fileOrBlob instanceof Blob
            ? fileOrBlob
            : await fetch(fileOrBlob).then((r) => r.blob());

        // Compresser l'image
        const compressedBlob = await compressImage(blob);

        // Créer une preview
        const reader = new FileReader();
        reader.onload = (e) => {
          form.value.photos.push({
            file: compressedBlob,
            preview: e.target.result,
            name: `photo_${Date.now()}_${form.value.photos.length}`,
          });

          if (form.value.photos.length >= maxPhotos) {
            showToast(`Maximum de ${maxPhotos} photos atteint`, "warning");
          } else {
            showToast(
              `Photo ajoutée (${form.value.photos.length}/${maxPhotos})`
            );
          }
        };
        reader.readAsDataURL(compressedBlob);
      } catch (error) {
        console.error("Erreur ajout photo:", error);
        showToast("Erreur lors de l'ajout de la photo", "danger");
      }
    };

    const addPhotos = async () => {
      try {
        const actionSheet = await actionSheetController.create({
          header: "Ajouter des photos",
          buttons: [
            {
              text: "Prendre une photo",
              icon: cameraOutline,
              handler: () => {
                takePhoto();
              },
            },
            {
              text: "Choisir depuis la galerie",
              icon: imagesOutline,
              handler: () => {
                pickPhotos();
              },
            },
            {
              text: "Choisir des fichiers",
              icon: folderOutline,
              handler: () => {
                pickFiles();
              },
            },
            {
              text: "Annuler",
              icon: closeOutline,
              role: "cancel",
            },
          ],
        });

        await actionSheet.present();
      } catch (error) {
        console.error("Erreur action sheet:", error);
        // Fallback simple
        pickPhotos();
      }
    };

    const takePhoto = async () => {
      try {
        const result = await capacitorService.takePhoto();

        if (result.success && result.dataUrl) {
          const blob = dataURLtoBlob(result.dataUrl);
          await addPhotoToForm(blob);
        }
      } catch (error) {
        console.error("Erreur prise de photo:", error);
        showToast("Erreur lors de la prise de photo", "danger");
      }
    };

    const pickFiles = async () => {
      try {
        const remainingSlots = maxPhotos - form.value.photos.length;

        // Créer un input file
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;

        input.onchange = async (e) => {
          const files = Array.from(e.target.files || []).slice(
            0,
            remainingSlots
          );

          for (const file of files) {
            await addPhotoToForm(file);
          }

          if (files.length > 0) {
            showToast(
              `${files.length} photo(s) ajoutée(s) à partir de fichiers`
            );
          }
        };

        input.click();
      } catch (error) {
        console.error("Erreur sélection fichiers:", error);
        showToast("Erreur lors de la sélection des fichiers", "danger");
      }
    };

    const pickPhotos = async () => {
      try {
        const remainingSlots = maxPhotos - form.value.photos.length;
        const result = await capacitorService.pickMultiplePhotos(
          remainingSlots
        );

        if (result.success && result.photos.length > 0) {
          for (const photo of result.photos) {
            const blob = photo.file || dataURLtoBlob(photo.dataUrl);
            await addPhotoToForm(blob);
          }

          showToast(`${result.photos.length} photo(s) ajoutée(s)`);
        }
      } catch (error) {
        console.error("Erreur sélection photos:", error);
        showToast("Erreur lors de la sélection des photos", "danger");
      }
    };

    const removePhoto = (index) => {
      form.value.photos.splice(index, 1);
      showToast("Photo supprimée");
    };

    const submitReport = async () => {
      if (!isFormValid.value) {
        showToast("Veuillez remplir les champs obligatoires", "warning");
        return;
      }

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        showToast(
          "Vous devez être connecté pour créer un signalement",
          "danger"
        );
        return;
      }

      submitting.value = true;
      uploadProgress.value = "Préparation...";

      try {
        // 1. Créer le signalement dans Firestore
        uploadProgress.value = "Création du signalement...";

        const reportData = {
          description: form.value.description,
          problem_type: form.value.problemType,
          lat: props.location.lat,
          lng: props.location.lng,
          surface: form.value.surface,
          budget: form.value.budget,
          enterprise_id: form.value.company,
          user_id: currentUser.uid || currentUser.id,
          user_email: currentUser.email,
          status: "nouveau",
          reporting_date: new Date(),
        };

        const result = await reportService.createReport(reportData);

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de la création");
        }

        const reportId = result.id;

        // 2. Sauvegarder les images si présentes
        if (form.value.photos.length > 0) {
          uploadProgress.value = `Upload des images (0/${form.value.photos.length})...`;

          const imageFiles = form.value.photos.map((photo) => photo.file);
          const imageResult = await imageService.saveMultipleImages(
            imageFiles,
            reportId,
            currentUser.uid || currentUser.id
          );

          if (!imageResult.success) {
            console.warn(
              "Erreur lors de la sauvegarde des images:",
              imageResult.error
            );
            showToast(
              "Signalement créé mais erreur avec certaines images",
              "warning"
            );
          } else {
            console.log(`${imageResult.successful} image(s) sauvegardée(s)`);
          }
        }

        uploadProgress.value = "Finalisation...";

        showToast("Signalement créé avec succès", "success");
        emit("report-created");
        close();
      } catch (error) {
        console.error("Erreur création signalement:", error);
        showToast(error.message || "Erreur lors de la création", "danger");
      } finally {
        submitting.value = false;
        uploadProgress.value = "Envoi...";
      }
    };

    const showToast = async (message, color = "primary") => {
      const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: "bottom",
      });
      await toast.present();
    };

    return {
      form,
      problemTypes,
      submitting,
      uploadProgress,
      coordsText,
      isFormValid,
      maxPhotos,
      close,
      addPhotos,
      removePhoto,
      submitReport,
      // Icons
      cameraOutline,
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
      imagesOutline,
      closeCircleOutline,
      addOutline,
      checkmarkCircleOutline,
      warningOutline,
      hammerOutline,
      trendingDownOutline,
      constructOutline,
      ellipsisHorizontalOutline,
      folderOutline,
    };
  },
};
</script>

<style scoped>
/* Styles de base du modal */
.report-modal-modern {
  --width: 100%;
  --max-width: 600px;
  --height: 90%;
  --border-radius: 24px 24px 0 0;
  --box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.15);
}

.modal-header-modern {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.modal-header-modern ion-toolbar {
  --background: transparent;
  --border-width: 0;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.back-btn-modern {
  --color: white;
  --background: rgba(255, 255, 255, 0.15);
  --border-radius: 12px;
  width: 44px;
  height: 44px;
  margin-left: 8px;
}

.back-btn-modern:hover {
  --background: rgba(255, 255, 255, 0.25);
}

.modal-title-modern {
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  text-align: center;
}

.title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-icon {
  font-size: 24px;
  color: white;
}

/* Contenu du modal */
.modal-content-modern {
  --background: #f8fafc;
  --padding-top: 0;
  --padding-bottom: 32px;
}

.report-form-modern {
  padding: 0 20px 32px;
}

/* Hero Section */
.modal-hero-modern {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin: -16px 0 24px;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.modal-hero-modern::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa);
}

.hero-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.hero-icon-wrapper ion-icon {
  font-size: 32px;
  color: #2563eb;
}

.hero-content h2 {
  margin: 0 0 8px;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 700;
}

.hero-content p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.location-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 16px;
  font-size: 0.875rem;
  color: #475569;
}

.location-badge ion-icon {
  font-size: 16px;
  color: #2563eb;
}

/* Form Sections */
.form-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f5f9;
}

.section-header ion-icon {
  font-size: 24px;
  color: #2563eb;
}

.section-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.optional-badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Inputs */
.input-wrapper {
  margin-bottom: 16px;
}

.input-wrapper:last-child {
  margin-bottom: 0;
}

.modern-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
}

.modern-label ion-icon {
  font-size: 20px;
  color: #2563eb;
}

.modern-input,
.modern-textarea {
  --background: #f8fafc;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 14px;
  --padding-bottom: 14px;
  --color: #1e293b;
  --placeholder-color: #94a3b8;
  --border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.modern-input:focus,
.modern-textarea:focus {
  --border-color: #2563eb;
  --background: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modern-textarea {
  --height: auto;
  min-height: 120px;
}

.input-hint {
  display: block;
  margin-top: 8px;
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

/* Problem Type Grid */
.problem-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.problem-type-btn {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.problem-type-btn:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
}

.problem-type-btn.active {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: #2563eb;
  color: #2563eb;
}

.problem-type-btn ion-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.problem-type-btn span {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 480px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Photo Section */
.photo-section {
  padding-bottom: 24px;
}

.photo-upload-zone {
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.photo-upload-zone:hover {
  background: #f1f5f9;
  border-color: #2563eb;
  transform: translateY(-2px);
}

.upload-icon {
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  border: 2px solid #e2e8f0;
}

.upload-icon ion-icon {
  font-size: 32px;
  color: #2563eb;
}

.upload-text {
  margin: 0 0 8px;
  color: #1e293b;
  font-size: 1.1rem;
  font-weight: 600;
}

.upload-hint {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

/* Photos Grid */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.photo-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn-small {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.95);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
}

.remove-photo-btn-small:hover {
  background: rgba(185, 28, 28, 0.95);
  transform: scale(1.1);
}

.remove-photo-btn-small ion-icon {
  font-size: 20px;
  color: white;
}

.photo-number {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
}

.photo-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.add-more-btn {
  background: rgba(37, 99, 235, 0.1);
  border: 2px dashed rgba(37, 99, 235, 0.3);
  border-radius: 16px;
  padding: 14px 24px;
  color: #2563eb;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-more-btn:hover {
  background: rgba(37, 99, 235, 0.15);
  border-color: #2563eb;
  transform: translateY(-2px);
}

.add-more-btn ion-icon {
  font-size: 20px;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  padding: 0 8px;
}

.cancel-btn-modern {
  flex: 1;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px 24px;
  color: #64748b;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn-modern:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-2px);
}

.cancel-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn-modern {
  flex: 2;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  border-radius: 16px;
  padding: 18px 24px;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
}

.submit-btn-modern:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.4);
}

.submit-btn-modern:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.submit-btn-modern ion-spinner,
.submit-btn-modern ion-icon {
  font-size: 24px;
}

/* Responsive */
@media (max-width: 640px) {
  .report-form-modern {
    padding: 0 16px 24px;
  }

  .modal-hero-modern {
    padding: 20px;
  }

  .form-section {
    padding: 16px;
  }

  .problem-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .photos-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .problem-type-grid {
    grid-template-columns: 1fr;
  }

  .photos-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hero-content h2 {
    font-size: 1.3rem;
  }
}
</style>
