<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-content">
      <div class="register-container">
        <!-- Animated Background -->
        <div class="animated-bg">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
        </div>

        <!-- Main Content -->
        <div class="content-wrapper">
          <!-- Header -->
          <div class="page-header animate-fade-in">
            <ion-button fill="clear" class="back-btn" @click="goBack">
              <ion-icon slot="icon-only" :icon="arrowBackOutline"></ion-icon>
            </ion-button>
            <div class="header-content">
              <h1 class="page-title">
                Créer un <span class="gradient-text">compte</span>
              </h1>
              <p class="page-subtitle">Rejoignez la communauté RoadWatch</p>
            </div>
          </div>

          <!-- Registration Form -->
          <div class="form-section animate-slide-up">
            <div class="form-card glass-card">
              <form @submit.prevent="handleRegister" class="register-form">
                <!-- Name Fields -->
                <div class="input-row">
                  <div class="input-group">
                    <label class="input-label">Nom</label>
                    <div class="input-wrapper">
                      <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
                      <input
                        v-model="formData.name"
                        type="text"
                        placeholder="Rakoto"
                        class="modern-input"
                        required
                      />
                    </div>
                  </div>

                  <div class="input-group">
                    <label class="input-label">Prénom</label>
                    <div class="input-wrapper">
                      <ion-icon :icon="personOutline" class="input-icon"></ion-icon>
                      <input
                        v-model="formData.firstName"
                        type="text"
                        placeholder="Jean"
                        class="modern-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                <!-- Email Field -->
                <div class="input-group">
                  <label class="input-label">Adresse email</label>
                  <div class="input-wrapper">
                    <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
                    <input
                      v-model="formData.email"
                      type="email"
                      placeholder="jean.rakoto@email.com"
                      class="modern-input"
                      required
                    />
                  </div>
                </div>

                <!-- Password Field -->
                <div class="input-group">
                  <label class="input-label">Mot de passe</label>
                  <div class="input-wrapper">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    <input
                      v-model="formData.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="••••••••"
                      class="modern-input"
                      required
                    />
                    <ion-icon 
                      :icon="showPassword ? eyeOffOutline : eyeOutline" 
                      class="input-action"
                      @click="showPassword = !showPassword"
                    ></ion-icon>
                  </div>
                  <div class="password-strength">
                    <div class="strength-bar">
                      <div 
                        class="strength-fill"
                        :class="passwordStrength.class"
                        :style="{ width: passwordStrength.width }"
                      ></div>
                    </div>
                    <span class="strength-text">{{ passwordStrength.text }}</span>
                  </div>
                </div>

                <!-- Confirm Password Field -->
                <div class="input-group">
                  <label class="input-label">Confirmer le mot de passe</label>
                  <div class="input-wrapper">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    <input
                      v-model="formData.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="••••••••"
                      class="modern-input"
                      required
                    />
                    <ion-icon 
                      :icon="showConfirmPassword ? eyeOffOutline : eyeOutline" 
                      class="input-action"
                      @click="showConfirmPassword = !showConfirmPassword"
                    ></ion-icon>
                  </div>
                  <div v-if="formData.confirmPassword" class="password-match">
                    <ion-icon 
                      :icon="passwordsMatch ? checkmarkCircleOutline : closeCircleOutline"
                      :class="{ 'match': passwordsMatch, 'no-match': !passwordsMatch }"
                    ></ion-icon>
                    <span :class="{ 'match': passwordsMatch, 'no-match': !passwordsMatch }">
                      {{ passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas' }}
                    </span>
                  </div>
                </div>

                <!-- Terms & Conditions -->
                <div class="terms-container">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="acceptTerms" required />
                    <span>
                      J'accepte les 
                      <button type="button" class="link-btn primary">conditions d'utilisation</button>
                      et la
                      <button type="button" class="link-btn primary">politique de confidentialité</button>
                    </span>
                  </label>
                </div>

                <!-- Submit Button -->
                <ion-button
                  expand="block"
                  type="submit"
                  :disabled="loading || !isFormValid"
                  class="submit-btn"
                  size="large"
                >
                  <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                  <span v-else>Créer mon compte</span>
                </ion-button>
              </form>
            </div>

            <!-- Login Link -->
            <div class="login-link">
              <p>
                Vous avez déjà un compte?
                <button @click="goToLogin" class="link-btn primary">Se connecter</button>
              </p>
            </div>
          </div>
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
.register-content {
  --background: var(--app-background);
}

.register-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Animated Background - Same as Login */
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;
}

.blob-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  bottom: -150px;
  right: -100px;
  animation-delay: 7s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Content Wrapper */
.content-wrapper {
  position: relative;
  z-index: 1;
  padding: var(--app-space-xl) var(--app-space-lg);
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: center;
  gap: var(--app-space-2xl);
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
}

.back-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  --color: var(--app-text-primary);
  width: 44px;
  height: 44px;
  border-radius: var(--app-radius-lg);
  background: var(--app-glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--app-glass-border);
}

.back-btn ion-icon {
  font-size: 24px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 var(--app-space-xs);
  color: var(--app-text-primary);
  font-family: var(--app-font-display);
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--app-text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Form Section */
.form-section {
  animation-delay: 150ms;
}

.form-card {
  padding: var(--app-space-2xl);
  border-radius: var(--app-radius-2xl);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-lg);
}

/* Input Row for Name Fields */
.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--app-space-md);
}

/* Input Styles */
.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-sm);
}

.input-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--app-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--app-surface);
  border: 2px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  transition: all var(--app-transition-base);
}

.input-wrapper:focus-within {
  border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 20px;
  color: var(--app-text-tertiary);
  pointer-events: none;
  z-index: 1;
}

.modern-input {
  flex: 1;
  padding: 14px 16px 14px 48px;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--app-text-primary);
  font-family: var(--app-font-sans);
  outline: none;
}

.modern-input::placeholder {
  color: var(--app-text-tertiary);
}

.input-action {
  position: absolute;
  right: 16px;
  font-size: 20px;
  color: var(--app-text-tertiary);
  cursor: pointer;
  transition: color var(--app-transition-fast);
  z-index: 1;
}

.input-action:hover {
  color: var(--ion-color-primary);
}

/* Password Strength Indicator */
.password-strength {
  display: flex;
  align-items: center;
  gap: var(--app-space-sm);
  margin-top: 4px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: var(--app-border);
  border-radius: var(--app-radius-full);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all var(--app-transition-base);
  border-radius: var(--app-radius-full);
}

.strength-fill.weak {
  background: var(--ion-color-danger);
}

.strength-fill.medium {
  background: var(--ion-color-warning);
}

.strength-fill.strong {
  background: var(--ion-color-success);
}

.strength-text {
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 45px;
}

/* Password Match Indicator */
.password-match {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 4px;
}

.password-match ion-icon {
  font-size: 18px;
}

.password-match .match {
  color: var(--ion-color-success);
}

.password-match .no-match {
  color: var(--ion-color-danger);
}

/* Terms & Conditions */
.terms-container {
  padding: var(--app-space-md) 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-sm);
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--app-text-secondary);
  line-height: 1.6;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--ion-color-primary);
  flex-shrink: 0;
}

.link-btn {
  background: none;
  border: none;
  color: var(--app-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--app-transition-fast);
  padding: 0;
  font-family: var(--app-font-sans);
  display: inline;
}

.link-btn:hover {
  color: var(--ion-color-primary);
}

.link-btn.primary {
  color: var(--ion-color-primary);
}

.link-btn.primary:hover {
  color: var(--ion-color-primary-shade);
}

/* Submit Button */
.submit-btn {
  --background: var(--app-gradient-primary);
  --box-shadow: var(--app-shadow-primary);
  margin-top: var(--app-space-sm);
  font-size: 1.05rem;
  font-weight: 700;
}

.submit-btn:hover:not([disabled]) {
  --box-shadow: 0 15px 40px -5px rgba(99, 102, 241, 0.4);
}

/* Login Link */
.login-link {
  text-align: center;
  margin-top: var(--app-space-lg);
}

.login-link p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

/* Responsive Design */
@media (max-width: 480px) {
  .input-row {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .content-wrapper {
    max-width: 580px;
    padding: var(--app-space-3xl) var(--app-space-xl);
  }

  .page-title {
    font-size: 2.5rem;
  }

  .form-card {
    padding: var(--app-space-3xl);
  }
}
</style>