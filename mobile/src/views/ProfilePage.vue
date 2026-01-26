<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="profile-content">
      <div class="page-shell">
        <section class="glass-strong card profile-hero">
          <div class="avatar">
            <span>{{ initials }}</span>
          </div>
          <div>
            <h1>{{ currentUser?.displayName || 'Utilisateur invité' }}</h1>
            <p class="text-secondary">{{ currentUser?.email || 'Connectez-vous pour accéder à votre profil.' }}</p>
          </div>
          <div v-if="!currentUser" class="btn-primary">
            <ion-button expand="block" @click="goToLogin">Se connecter</ion-button>
          </div>
        </section>

        <section class="glass card info-grid" v-if="currentUser">
          <div>
            <span>Adresse email</span>
            <strong>{{ currentUser.email }}</strong>
          </div>
          <div>
            <span>Identifiant</span>
            <strong>{{ currentUser.uid || currentUser.id }}</strong>
          </div>
          <div>
            <span>Authentification</span>
            <strong>{{ authProvider }}</strong>
          </div>
        </section>

        <section class="glass card" v-if="currentUser">
          <h2>Actions rapides</h2>
          <p class="text-secondary">Gérez vos signalements et vos préférences.</p>
          <div class="action-grid">
            <div class="btn-secondary">
              <ion-button expand="block" @click="goToReports">Mes signalements</ion-button>
            </div>
            <div class="btn-secondary">
              <ion-button expand="block" @click="goToSettings">Paramètres</ion-button>
            </div>
          </div>
        </section>
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
  IonMenuButton,
  IonButton
} from '@ionic/vue';
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';

export default {
  name: 'ProfilePage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton
  },
  setup() {
    const router = useRouter();
    const currentUser = ref(null);

    const initials = computed(() => {
      if (!currentUser.value) return 'RW';
      const name = currentUser.value.displayName || currentUser.value.email || 'U';
      return name.slice(0, 2).toUpperCase();
    });

    const authProvider = computed(() => authService.getAuthProvider());

    const goToLogin = () => router.push('/login');
    const goToReports = () => router.push('/my-reports');
    const goToSettings = () => router.push('/settings');

    onMounted(() => {
      currentUser.value = authService.getCurrentUser();
    });

    return {
      currentUser,
      initials,
      authProvider,
      goToLogin,
      goToReports,
      goToSettings
    };
  }
};
</script>

<style scoped>
.profile-content {
  --background: transparent;
}

.profile-hero {
  display: grid;
  gap: var(--app-space-md);
  text-align: center;
}

.profile-hero h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.text-secondary {
  color: #64748b !important;
  font-weight: 500;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.08));
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.6rem;
  color: #2563eb;
  margin: 0 auto;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.2);
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.info-grid {
  display: grid;
  gap: var(--app-space-md);
}

.info-grid > div {
  padding: 16px;
  border-radius: var(--app-radius-lg);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(10px);
}

.info-grid span {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
  display: block;
  margin-bottom: 6px;
}

.info-grid strong {
  display: block;
  font-size: 0.95rem;
  color: #0f172a;
  font-weight: 700;
}

.glass.card h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.action-grid {
  display: grid;
  gap: var(--app-space-sm);
  margin-top: var(--app-space-md);
}

@media (min-width: 768px) {
  .info-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
