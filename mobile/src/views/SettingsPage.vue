<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Paramètres</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="settings-content">
      <div class="page-shell">
        <section class="glass-strong card">
          <h1>Préférences</h1>
          <p class="text-secondary">Personnalisez vos notifications et votre expérience.</p>
        </section>

        <section class="glass card settings-list">
          <div class="setting-item">
            <div>
              <strong>Notifications</strong>
              <p class="text-secondary">Recevoir les mises à jour de statut</p>
            </div>
            <ion-toggle v-model="settings.notifications"></ion-toggle>
          </div>
          <div class="setting-item">
            <div>
              <strong>Actualisations automatiques</strong>
              <p class="text-secondary">Synchroniser les données toutes les 10 minutes</p>
            </div>
            <ion-toggle v-model="settings.autoRefresh"></ion-toggle>
          </div>
          <div class="setting-item">
            <div>
              <strong>Mode discret</strong>
              <p class="text-secondary">Réduire les animations pour plus de confort</p>
            </div>
            <ion-toggle v-model="settings.reducedMotion"></ion-toggle>
          </div>
        </section>

        <section class="glass card">
          <h2>Apparence</h2>
          <div class="setting-item">
            <div>
              <strong>Interface automatique</strong>
              <p class="text-secondary">S'adapte au thème système</p>
            </div>
            <ion-toggle v-model="settings.autoTheme"></ion-toggle>
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
  IonToggle
} from '@ionic/vue';
import { reactive, watch } from 'vue';

const STORAGE_KEY = 'roadwatch_settings';

export default {
  name: 'SettingsPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonToggle
  },
  setup() {
    const defaultSettings = {
      notifications: true,
      autoRefresh: true,
      reducedMotion: false,
      autoTheme: true
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    const settings = reactive(stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings);

    watch(
      () => ({ ...settings }),
      (newValue) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      },
      { deep: true }
    );

    return { settings };
  }
};
</script>

<style scoped>
.settings-content {
  --background: transparent;
}

.settings-list {
  display: grid;
  gap: var(--app-space-md);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-md);
  padding: 12px 0;
  border-bottom: 1px solid var(--app-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item strong {
  display: block;
}

.setting-item p {
  margin: 4px 0 0;
  font-size: 0.85rem;
}
</style>
