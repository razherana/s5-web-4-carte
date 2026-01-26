<template>
  <ion-page>
    <ion-content :fullscreen="true" class="auth-page">
      <div class="auth-bg">
        <div class="orb orb-primary"></div>
        <div class="orb orb-secondary"></div>
        <div class="orb orb-tertiary"></div>
      </div>

      <div class="auth-shell">
        <div class="auth-hero glass-strong card fade-in">
          <div class="brand">
            <div class="brand-icon">
              <ion-icon :icon="navigateCircleOutline"></ion-icon>
            </div>
            <div>
              <h1>Road<span class="gradient-text">Watch</span></h1>
              <p>Signalement intelligent des anomalies routières</p>
            </div>
          </div>
          <div class="hero-stats">
            <div>
              <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              <strong>Fiable</strong>
              <span>Signalements vérifiés</span>
            </div>
            <div>
              <ion-icon :icon="sparklesOutline"></ion-icon>
              <strong>Rapide</strong>
              <span>Mises à jour en temps réel</span>
            </div>
          </div>
        </div>

        <div class="auth-card glass card slide-up">
          <div class="auth-header">
            <h2>Connexion</h2>
            <p class="text-secondary">Reprenez vos signalements en quelques secondes.</p>
          </div>

          <form @submit.prevent="handleLogin" class="auth-form">
            <div class="input-field">
              <label>Adresse email</label>
              <div class="input-shell">
                <ion-icon :icon="mailOutline"></ion-icon>
                <input v-model="email" type="email" placeholder="vous@email.com" required />
              </div>
            </div>

            <div class="input-field">
              <label>Mot de passe</label>
              <div class="input-shell">
                <ion-icon :icon="lockClosedOutline"></ion-icon>
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" required />
                <button type="button" class="icon-btn" @click="showPassword = !showPassword">
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </button>
              </div>
            </div>

            <div class="auth-actions">
              <button type="button" class="link-btn">Mot de passe oublié ?</button>
              <button type="button" class="link-btn ghost" @click="continueAsVisitor">Continuer en visiteur</button>
            </div>

            <div class="btn-primary">
              <ion-button expand="block" type="submit" :disabled="loading" size="large">
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>Se connecter</span>
              </ion-button>
            </div>
          </form>
        </div>

        <div class="auth-footer">
          <span>Pas encore de compte ?</span>
          <button class="link-btn primary" @click="goToRegister">Créer un compte</button>
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
  shieldCheckmarkOutline,
  sparklesOutline
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
      handleLogin,
      goToRegister,
      continueAsVisitor,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      navigateCircleOutline,
      shieldCheckmarkOutline,
      sparklesOutline
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
  background: rgba(79, 70, 229, 0.5);
  top: -120px;
  right: -80px;
}

.orb-secondary {
  width: 280px;
  height: 280px;
  background: rgba(14, 165, 233, 0.4);
  bottom: -120px;
  left: -80px;
  animation-delay: 2s;
}

.orb-tertiary {
  width: 240px;
  height: 240px;
  background: rgba(168, 85, 247, 0.4);
  top: 45%;
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
  max-width: 520px;
  margin: 0 auto;
}

.auth-hero {
  display: grid;
  gap: var(--app-space-md);
}

.brand {
  display: flex;
  gap: var(--app-space-sm);
  align-items: center;
}

.brand-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--app-radius-lg);
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.5);
}

.brand h1 {
  margin: 0;
  font-size: 1.7rem;
  font-family: var(--app-font-display);
}

.brand p {
  margin: 4px 0 0;
  color: var(--app-text-secondary);
  font-size: 0.85rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--app-space-md);
}

.hero-stats div {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--app-radius-lg);
  padding: 12px;
  display: grid;
  gap: 4px;
  color: var(--app-text-primary);
}

.hero-stats ion-icon {
  font-size: 20px;
  color: var(--ion-color-primary);
}

.auth-card {
  display: grid;
  gap: var(--app-space-md);
}

.auth-header h2 {
  margin: 0;
  font-size: 1.4rem;
}

.auth-form {
  display: grid;
  gap: var(--app-space-md);
}

.auth-actions {
  display: flex;
  justify-content: space-between;
  gap: var(--app-space-sm);
  flex-wrap: wrap;
}

.link-btn {
  background: none;
  border: none;
  padding: 0;
  color: var(--ion-color-primary);
  font-weight: 600;
  cursor: pointer;
}

.link-btn.ghost {
  color: var(--app-text-secondary);
}

.link-btn.primary {
  color: var(--ion-color-primary);
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