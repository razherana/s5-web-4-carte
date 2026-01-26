<template>
  <ion-app>
    <SidebarMenu />
    <ion-router-outlet id="main-content"></ion-router-outlet>
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import SidebarMenu from '@/components/SidebarMenu.vue';

export default {
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet,
    SidebarMenu
  }
};
</script>

<style>
@import 'leaflet/dist/leaflet.css';

ion-app {
  background: transparent;
}

ion-header::after {
  display: none;
}

ion-toolbar {
  --background: transparent;
  --color: var(--app-text-primary);
  --border-style: none;
  --min-height: 64px;
}

ion-title {
  font-family: var(--app-font-display);
  font-weight: 700;
  letter-spacing: -0.3px;
}

ion-button {
  --border-radius: var(--app-radius-lg);
  text-transform: none;
  font-weight: 600;
}

ion-modal::part(backdrop) {
  background: rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(8px);
}

ion-spinner {
  --color: var(--ion-color-primary);
}

ion-input,
ion-textarea,
ion-select {
  --color: var(--app-text-primary);
  --placeholder-color: var(--app-text-tertiary);
}

.modern-alert .alert-wrapper {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: var(--app-radius-xl);
  box-shadow: var(--app-shadow-xl);
  backdrop-filter: blur(18px) saturate(120%);
}

.modern-alert .alert-head h2 {
  color: var(--app-text-primary);
  font-family: var(--app-font-display);
}

.modern-alert .alert-message {
  color: var(--app-text-secondary);
}

.modern-alert .alert-button {
  color: var(--app-text-primary);
  font-weight: 600;
}

.modern-alert .alert-button-role-cancel {
  color: var(--app-text-secondary);
}
</style>