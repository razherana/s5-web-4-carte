<template>
  <ion-page>
    <ion-content :fullscreen="true" class="auth-page">
      <div class="auth-bg">
        <div class="orb orb-primary"></div>
        <div class="orb orb-secondary"></div>
        <div class="orb orb-tertiary"></div>
      </div>

      <div class="auth-shell">
        <div class="auth-header glass-strong card fade-in">
          <ion-button fill="clear" class="back-btn" @click="goBack">
            <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
          </ion-button>
          <div>
            <h1>Créer un <span class="gradient-text">compte</span></h1>
            <p>Rejoignez la communauté RoadWatch et suivez vos signalements.</p>
          </div>
        </div>

        <div class="glass card slide-up">
          <form @submit.prevent="handleRegister" class="register-form">
            <div class="input-grid">
              <div class="input-field">
                <label>Nom</label>
                <div class="input-shell">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <input v-model="formData.name" type="text" placeholder="Rakoto" required />
                </div>
              </div>
              <div class="input-field">
                <label>Prénom</label>
                <div class="input-shell">
                  <ion-icon :icon="personOutline"></ion-icon>
                  <input v-model="formData.firstName" type="text" placeholder="Jean" required />
                </div>
              </div>
            </div>

            <div class="input-field">
              <label>Adresse email</label>
              <div class="input-shell">
                <ion-icon :icon="mailOutline"></ion-icon>
                <input v-model="formData.email" type="email" placeholder="jean@email.com" required />
              </div>
            </div>

            <div class="input-field">
              <label>Mot de passe</label>
              <div class="input-shell">
                <ion-icon :icon="lockClosedOutline"></ion-icon>
                <input v-model="formData.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" required />
                <button type="button" class="icon-btn" @click="showPassword = !showPassword">
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
              <div class="password-strength">
                <div class="strength-bar">
                  <span class="strength-fill" :class="passwordStrength.class" :style="{ width: passwordStrength.width }"></span>
                </div>
                <span class="strength-text">{{ passwordStrength.text }}</span>
              </div>
            </div>

            <div class="input-field">
              <label>Confirmer le mot de passe</label>
              <div class="input-shell">
                <ion-icon :icon="lockClosedOutline"></ion-icon>
                <input v-model="formData.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="••••••••" required />
                <button type="button" class="icon-btn" @click="showConfirmPassword = !showConfirmPassword">
                  <ion-icon :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
              <div v-if="formData.confirmPassword" class="password-match">
                <ion-icon :icon="passwordsMatch ? checkmarkCircleOutline : closeCircleOutline" :class="{ match: passwordsMatch, 'no-match': !passwordsMatch }"></ion-icon>
                <span :class="{ match: passwordsMatch, 'no-match': !passwordsMatch }">
                  {{ passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas' }}
                </span>
              </div>
            </div>

            <label class="terms">
              <input type="checkbox" v-model="acceptTerms" required />
              <span>
                J'accepte les <button type="button" class="link-btn primary">conditions</button> et la
                <button type="button" class="link-btn primary">politique de confidentialité</button>.
              </span>
            </label>

            <div class="btn-primary">
              <ion-button expand="block" type="submit" :disabled="loading || !isFormValid" size="large">
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>Créer mon compte</span>
              </ion-button>
            </div>
          </form>
        </div>

        <div class="auth-footer">
          <span>Déjà un compte ?</span>
          <button @click="goToLogin" class="link-btn primary">Se connecter</button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { 
  IonPage, 
  IonContent,
  IonButton,
  IonSpinner,
  IonIcon,
  alertController
} from '@ionic/vue';
import { 
  arrowBackOutline,
  personOutline,
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';

export default {
  name: 'RegisterPage',
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonSpinner,
    IonIcon
  },
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const acceptTerms = ref(false);
    
    const formData = ref({
      name: '',
      firstName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });

    const passwordStrength = computed(() => {
      const pwd = formData.value.password;
      if (!pwd) return { width: '0%', class: '', text: '' };
      
      let strength = 0;
      if (pwd.length >= 6) strength++;
      if (pwd.length >= 8) strength++;
      if (/[A-Z]/.test(pwd)) strength++;
      if (/[0-9]/.test(pwd)) strength++;
      if (/[^A-Za-z0-9]/.test(pwd)) strength++;
      
      if (strength <= 2) return { width: '33%', class: 'weak', text: 'Faible' };
      if (strength <= 3) return { width: '66%', class: 'medium', text: 'Moyen' };
      return { width: '100%', class: 'strong', text: 'Fort' };
    });

    const passwordsMatch = computed(() => {
      return formData.value.password && 
             formData.value.confirmPassword && 
             formData.value.password === formData.value.confirmPassword;
    });

    const isFormValid = computed(() => {
      return formData.value.name &&
             formData.value.firstName &&
             formData.value.email &&
             formData.value.password &&
             passwordsMatch.value &&
             acceptTerms.value;
    });

    const validateForm = () => {
      if (!formData.value.name || !formData.value.firstName || 
          !formData.value.email || !formData.value.password) {
        return { valid: false, message: 'Veuillez remplir tous les champs' };
      }

      if (!passwordsMatch.value) {
        return { valid: false, message: 'Les mots de passe ne correspondent pas' };
      }

      if (formData.value.password.length < 6) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
      }

      if (!acceptTerms.value) {
        return { valid: false, message: 'Veuillez accepter les conditions d\'utilisation' };
      }

      return { valid: true };
    };

    const handleRegister = async () => {
      const validation = validateForm();
      
      if (!validation.valid) {
        const alert = await alertController.create({
          header: 'Formulaire incomplet',
          message: validation.message,
          buttons: ['OK'],
          cssClass: 'modern-alert'
        });
        await alert.present();
        return;
      }

      loading.value = true;

      const result = await authService.register(
        formData.value.email,
        formData.value.password,
        {
          name: formData.value.name,
          firstName: formData.value.firstName
        }
      );

      loading.value = false;

      if (result.success) {
        const alert = await alertController.create({
          header: '🎉 Bienvenue!',
          message: 'Votre compte a été créé avec succès',
          buttons: [{
            text: 'Commencer',
            handler: () => {
              router.push('/map');
            }
          }],
          cssClass: 'modern-alert'
        });
        await alert.present();
      } else {
        const alert = await alertController.create({
          header: 'Erreur d\'inscription',
          message: result.error || 'Une erreur est survenue',
          buttons: ['OK'],
          cssClass: 'modern-alert'
        });
        await alert.present();
      }
    };

    const goBack = () => {
      router.back();
    };

    const goToLogin = () => {
      router.push('/login');
    };

    return {
      formData,
      loading,
      showPassword,
      showConfirmPassword,
      acceptTerms,
      passwordStrength,
      passwordsMatch,
      isFormValid,
      handleRegister,
      goBack,
      goToLogin,
      arrowBackOutline,
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    };
  }
};
</script>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-16px);
  }
}

.auth-page {
  position: relative;
  --background: transparent;
}

.auth-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 16s ease-in-out infinite;
}

.orb-primary {
  width: 320px;
  height: 320px;
  background: rgba(14, 165, 233, 0.45);
  top: -120px;
  left: -80px;
}

.orb-secondary {
  width: 280px;
  height: 280px;
  background: rgba(79, 70, 229, 0.45);
  bottom: -120px;
  right: -80px;
  animation-delay: 2s;
}

.orb-tertiary {
  width: 240px;
  height: 240px;
  background: rgba(168, 85, 247, 0.4);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

.auth-shell {
  position: relative;
  z-index: 1;
  padding: clamp(16px, 4vw, 32px);
  display: grid;
  gap: var(--app-space-lg);
  max-width: 640px;
  margin: 0 auto;
}

.auth-header {
  display: grid;
  gap: var(--app-space-sm);
  grid-template-columns: auto 1fr;
  align-items: start;
}

.auth-header h1 {
  margin: 0 0 6px;
  font-family: var(--app-font-display);
  font-size: 1.6rem;
}

.auth-header p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.9rem;
}

.back-btn {
  --color: var(--app-text-primary);
  margin-top: 2px;
}

.register-form {
  display: grid;
  gap: var(--app-space-md);
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--app-space-md);
}

.password-strength {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}

.strength-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.strength-fill.weak {
  background: #f87171;
}

.strength-fill.medium {
  background: #f59e0b;
}

.strength-fill.strong {
  background: #22c55e;
}

.strength-text {
  font-size: 0.75rem;
  color: var(--app-text-tertiary);
}

.password-match {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
}

.password-match .match {
  color: #22c55e;
}

.password-match .no-match {
  color: #f87171;
}

.terms {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.8rem;
  color: var(--app-text-secondary);
}

.terms input {
  margin-top: 4px;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--ion-color-primary);
  font-weight: 600;
  cursor: pointer;
}

.icon-btn {
  border: none;
  background: transparent;
  color: var(--app-text-secondary);
}

.auth-footer {
  display: flex;
  justify-content: center;
  gap: 6px;
  color: var(--app-text-secondary);
}
</style>