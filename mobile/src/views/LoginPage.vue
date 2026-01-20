<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <div class="login-container">
        <!-- Animated Background -->
        <div class="animated-bg">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
        </div>

        <!-- Main Content -->
        <div class="content-wrapper">
          <!-- Hero Section -->
          <div class="hero-section animate-fade-in">
            <div class="logo-container">
              <div class="logo-circle">
                <ion-icon :icon="navigateCircleOutline" class="logo-icon"></ion-icon>
              </div>
            </div>
            <h1 class="main-title">
              Road<span class="gradient-text">Watch</span>
            </h1>
            <p class="subtitle">Signalement intelligent des anomalies routières</p>
            
            <!-- Stats Bar -->
            <div class="stats-bar glass-card">
              <div class="stat-item">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <div>
                  <strong>2.5K+</strong>
                  <span>Utilisateurs</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <div>
                  <strong>98%</strong>
                  <span>Résolution</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Login Form -->
          <div class="form-section animate-slide-up">
            <div class="form-card glass-card">
              <div class="form-header">
                <h2>Bienvenue</h2>
                <p>Connectez-vous pour continuer</p>
              </div>

              <form @submit.prevent="handleLogin" class="login-form">
                <div class="input-group">
                  <div class="input-wrapper">
                    <ion-icon :icon="mailOutline" class="input-icon"></ion-icon>
                    <input
                      v-model="email"
                      type="email"
                      placeholder="Adresse email"
                      class="modern-input"
                      required
                    />
                  </div>
                </div>

                <div class="input-group">
                  <div class="input-wrapper">
                    <ion-icon :icon="lockClosedOutline" class="input-icon"></ion-icon>
                    <input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Mot de passe"
                      class="modern-input"
                      required
                    />
                    <ion-icon 
                      :icon="showPassword ? eyeOffOutline : eyeOutline" 
                      class="input-action"
                      @click="showPassword = !showPassword"
                    ></ion-icon>
                  </div>
                </div>

                <div class="form-footer">
                  <label class="remember-me">
                    <input type="checkbox" v-model="rememberMe" />
                    <span>Se souvenir de moi</span>
                  </label>
                  <button type="button" class="link-btn">Mot de passe oublié?</button>
                </div>

                <ion-button
                  expand="block"
                  type="submit"
                  :disabled="loading"
                  class="submit-btn"
                  size="large"
                >
                  <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                  <span v-else>Se connecter</span>
                </ion-button>

                <div class="divider">
                  <span>ou continuer avec</span>
                </div>

                <div class="action-buttons">
                  <ion-button 
                    fill="outline" 
                    expand="block"
                    @click="continueAsVisitor"
                    class="secondary-btn"
                  >
                    <ion-icon :icon="compassOutline" slot="start"></ion-icon>
                    Continuer en visiteur
                  </ion-button>
                </div>
              </form>
            </div>

            <!-- Register Link -->
            <div class="register-link">
              <p>
                Pas encore de compte?
                <button @click="goToRegister" class="link-btn primary">Créer un compte</button>
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
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline,
  navigateCircleOutline,
  peopleOutline,
  checkmarkCircleOutline,
  compassOutline
} from 'ionicons/icons';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';

export default {
  name: 'LoginPage',
  components: {
    IonPage,
    IonContent,
    IonButton,
    IonSpinner,
    IonIcon
  },
  setup() {
    const router = useRouter();
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const showPassword = ref(false);
    const rememberMe = ref(false);

    const handleLogin = async () => {
      if (!email.value || !password.value) {
        const alert = await alertController.create({
          header: 'Champs requis',
          message: 'Veuillez remplir tous les champs',
          buttons: ['OK'],
          cssClass: 'modern-alert'
        });
        await alert.present();
        return;
      }

      loading.value = true;

      // Try Firebase first
      const result = await authService.loginWithFirebase(email.value, password.value);

      if (result.success) {
        router.push('/my-reports');
      } else {
        // Fallback to API
        const apiResult = await authService.loginWithAPI(email.value, password.value);
        
        if (apiResult.success) {
          router.push('/map');
        } else {
          const alert = await alertController.create({
            header: 'Échec de connexion',
            message: result.error || 'Email ou mot de passe incorrect',
            buttons: ['OK'],
            cssClass: 'modern-alert'
          });
          await alert.present();
        }
      }

      loading.value = false;
    };

    const goToRegister = () => {
      router.push('/register');
    };

    const continueAsVisitor = () => {
      router.push('/map');
    };

    return {
      email,
      password,
      loading,
      showPassword,
      rememberMe,
      handleLogin,
      goToRegister,
      continueAsVisitor,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      navigateCircleOutline,
      peopleOutline,
      checkmarkCircleOutline,
      compassOutline
    };
  }
};
</script>

<style scoped>
.login-content {
  --background: var(--app-background);
}

.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Animated Background */
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
  background: linear-gradient(135deg, #6366f1, #a855f7);
  top: -200px;
  right: -100px;
  animation-delay: 0s;
}

.blob-2 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  bottom: -150px;
  left: -100px;
  animation-delay: 7s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #22c55e, #10b981);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* Content Wrapper */
.content-wrapper {
  position: relative;
  z-index: 1;
  padding: var(--app-space-xl) var(--app-space-lg);
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: center;
  gap: var(--app-space-2xl);
}

/* Hero Section */
.hero-section {
  text-align: center;
}

.logo-container {
  margin-bottom: var(--app-space-lg);
}

.logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  border-radius: var(--app-radius-full);
  background: var(--app-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--app-shadow-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: var(--app-shadow-primary);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 40px -5px rgba(99, 102, 241, 0.5);
  }
}

.logo-icon {
  font-size: 42px;
  color: white;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 var(--app-space-sm);
  color: var(--app-text-primary);
  font-family: var(--app-font-display);
  letter-spacing: -1px;
}

.subtitle {
  font-size: 1rem;
  color: var(--app-text-secondary);
  margin: 0 0 var(--app-space-xl);
  font-weight: 500;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-lg);
  padding: var(--app-space-lg);
  border-radius: var(--app-radius-xl);
  margin: 0 auto;
  max-width: 320px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-sm);
}

.stat-item ion-icon {
  font-size: 28px;
  color: var(--ion-color-primary);
}

.stat-item strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-text-primary);
  line-height: 1.2;
}

.stat-item span {
  display: block;
  font-size: 0.75rem;
  color: var(--app-text-secondary);
  line-height: 1.2;
}

.stat-divider {
  width: 2px;
  height: 40px;
  background: var(--app-border);
  border-radius: var(--app-radius-full);
}

/* Form Section */
.form-section {
  animation-delay: 150ms;
}

.form-card {
  padding: var(--app-space-xl);
  border-radius: var(--app-radius-2xl);
}

.form-header {
  text-align: center;
  margin-bottom: var(--app-space-xl);
}

.form-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 var(--app-space-xs);
  color: var(--app-text-primary);
}

.form-header p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

/* Form Inputs */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-lg);
}

.input-group {
  position: relative;
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
  padding: 16px 16px 16px 48px;
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

/* Form Footer */
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--app-space-sm);
  cursor: pointer;
  color: var(--app-text-secondary);
  font-weight: 500;
}

.remember-me input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--ion-color-primary);
}

.link-btn {
  background: none;
  border: none;
  color: var(--app-text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color var(--app-transition-fast);
  padding: 4px;
  font-family: var(--app-font-sans);
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

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: var(--app-space-sm) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--app-border);
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 var(--app-space-md);
  background: var(--app-surface);
  color: var(--app-text-tertiary);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-sm);
}

.secondary-btn {
  --border-width: 2px;
  --border-color: var(--app-border);
  font-weight: 600;
}

/* Register Link */
.register-link {
  text-align: center;
  margin-top: var(--app-space-lg);
}

.register-link p {
  margin: 0;
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

/* Responsive Design */
@media (min-width: 768px) {
  .content-wrapper {
    max-width: 520px;
    padding: var(--app-space-3xl) var(--app-space-xl);
  }

  .main-title {
    font-size: 3rem;
  }

  .form-card {
    padding: var(--app-space-3xl);
  }
}

/* Modern Alert Styling */
:global(.modern-alert) {
  --border-radius: var(--app-radius-xl);
}
</style>