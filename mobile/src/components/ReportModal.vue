<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouveau Signalement</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">Fermer</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="submitReport">
        <ion-item>
          <ion-label position="stacked">Description *</ion-label>
          <ion-textarea
            v-model="form.description"
            rows="4"
            placeholder="Décrivez le problème routier..."
            required
          ></ion-textarea>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Type de problème *</ion-label>
          <ion-select v-model="form.problemType" placeholder="Sélectionner">
            <ion-select-option value="nid_poule"
              >Nid de poule</ion-select-option
            >
            <ion-select-option value="fissure">Fissure</ion-select-option>
            <ion-select-option value="affaissement"
              >Affaissement</ion-select-option
            >
            <ion-select-option value="degradation"
              >Dégradation</ion-select-option
            >
            <ion-select-option value="autre">Autre</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Surface estimée (m²)</ion-label>
          <ion-input
            v-model.number="form.surface"
            type="number"
            min="0"
            step="0.1"
            placeholder="Ex: 5.5"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Budget estimé (MGA)</ion-label>
          <ion-input
            v-model.number="form.budget"
            type="number"
            min="0"
            step="1000"
            placeholder="Ex: 500000"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Entreprise (optionnel)</ion-label>
          <ion-input
            v-model="form.company"
            placeholder="Nom de l'entreprise"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Coordonnées</ion-label>
          <ion-input readonly :value="coordsText"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Photo (optionnel)</ion-label>
          <ion-button expand="block" @click="takePhoto">
            <ion-icon :icon="camera" slot="start"></ion-icon>
            Prendre une photo
          </ion-button>
        </ion-item>

        <div v-if="form.photoUrl" class="photo-preview">
          <img :src="form.photoUrl" alt="Photo du signalement" />
          <ion-button color="danger" size="small" @click="removePhoto">
            Supprimer
          </ion-button>
        </div>

        <div class="modal-actions">
          <ion-button
            expand="block"
            type="submit"
            :disabled="submitting || !isFormValid"
          >
            <ion-spinner v-if="submitting" slot="start"></ion-spinner>
            {{ submitting ? "Envoi en cours..." : "Envoyer le signalement" }}
          </ion-button>
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
  IonItem,
  IonLabel,
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
import { camera } from "ionicons/icons";
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
    IonItem,
    IonLabel,
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
      camera,
      close,
      takePhoto,
      removePhoto,
      submitReport,
    };
  },
};
</script>

<style scoped>
.photo-preview {
  margin: 20px 0;
  text-align: center;
}

.photo-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.modal-actions {
  margin-top: 20px;
}

ion-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 15px;
}

ion-label {
  margin-bottom: 8px !important;
}
</style>
