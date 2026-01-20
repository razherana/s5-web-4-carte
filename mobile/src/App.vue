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
/* Modern Global Styles */
@import 'leaflet/dist/leaflet.css';

* {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--app-font-sans);
  background: var(--app-background);
  color: var(--app-text-primary);
  line-height: 1.6;
}

ion-content {
  --background: var(--app-background);
}

ion-toolbar {
  --background: transparent;
  --color: var(--app-text-primary);
  --border-style: none;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --min-height: 64px;
}

ion-title {
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.5px;
  font-family: var(--app-font-display);
}

ion-header {
  box-shadow: none;
}

ion-header::after {
  display: none;
}

/* Modern Button Styles */
ion-button {
  --border-radius: var(--app-radius-lg);
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: all var(--app-transition-base);
  text-transform: none;
}

ion-button:not([fill="clear"]):not([fill="outline"]) {
  --box-shadow: var(--app-shadow-sm);
}

ion-button:hover {
  transform: translateY(-2px);
  --box-shadow: var(--app-shadow-md);
}

ion-button[size="large"] {
  --padding-top: 16px;
  --padding-bottom: 16px;
  font-size: 1.05rem;
}

ion-button[fill="outline"] {
  --border-width: 2px;
}

/* Modern Card Styles */
ion-card {
  --background: var(--app-surface);
  border-radius: var(--app-radius-xl);
  box-shadow: var(--app-shadow-sm);
  margin: var(--app-space-md);
  border: 1px solid var(--app-border);
  transition: all var(--app-transition-base);
}

ion-card:hover {
  box-shadow: var(--app-shadow-lg);
  transform: translateY(-4px);
}

ion-card-header {
  padding: var(--app-space-lg);
}

ion-card-content {
  padding: var(--app-space-lg);
}

ion-card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--app-text-primary);
  margin-bottom: var(--app-space-sm);
}

ion-card-subtitle {
  color: var(--app-text-secondary);
  font-size: 0.95rem;
}

/* Modern Input Styles */
ion-item {
  --background: transparent;
  --border-color: var(--app-border);
  --padding-start: 0;
  --inner-padding-end: 0;
  --min-height: 56px;
  margin-bottom: var(--app-space-md);
  border-radius: var(--app-radius-md);
}

ion-input,
ion-textarea,
ion-select {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  --background: var(--app-surface);
  border: 2px solid var(--app-border);
  border-radius: var(--app-radius-md);
  transition: all var(--app-transition-fast);
  font-size: 0.95rem;
}

ion-input:focus-within,
ion-textarea:focus-within,
ion-select:focus-within {
  --border-color: var(--ion-color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

ion-label {
  font-weight: 600;
  color: var(--app-text-secondary);
  margin-bottom: var(--app-space-xs);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

ion-label[position="stacked"] {
  margin-bottom: var(--app-space-sm);
}

/* Modern Modal Styles */
ion-modal {
  --border-radius: var(--app-radius-2xl) var(--app-radius-2xl) 0 0;
  --box-shadow: var(--app-shadow-2xl);
}

ion-modal::part(backdrop) {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
}

/* Loading Spinner */
ion-spinner {
  --color: var(--ion-color-primary);
  width: 32px;
  height: 32px;
}

/* Chip Styles */
ion-chip {
  --background: var(--app-surface-elevated);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-full);
  padding: 6px 16px;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Menu */
ion-menu {
  --background: var(--app-surface);
  --width: 280px;
}

ion-menu-button {
  --color: var(--app-text-primary);
  --border-radius: var(--app-radius-md);
  --padding-start: 8px;
  --padding-end: 8px;
}

/* List Items */
ion-list {
  background: transparent;
  padding: 0;
}

ion-item-sliding {
  margin-bottom: var(--app-space-sm);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn var(--app-transition-base) ease-out;
}

.animate-slide-up {
  animation: slideUp var(--app-transition-slow) ease-out;
}

.animate-scale-in {
  animation: scaleIn var(--app-transition-base) ease-out;
}

/* Utility Classes */
.glass-card {
  background: var(--app-glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--app-glass-border);
  box-shadow: var(--app-glass-shadow);
}

.gradient-text {
  background: var(--app-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-primary {
  color: var(--app-text-primary);
}

.text-secondary {
  color: var(--app-text-secondary);
}

.text-tertiary {
  color: var(--app-text-tertiary);
}

/* Safe Area Handling */
ion-content {
  --padding-top: env(safe-area-inset-top);
  --padding-bottom: env(safe-area-inset-bottom);
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--app-background);
}

::-webkit-scrollbar-thumb {
  background: var(--app-border);
  border-radius: var(--app-radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--app-divider);
}

/* Additional Ionic Component Overrides */
ion-card {
  border-radius: 18px;
  box-shadow: var(--app-shadow-sm);
  background: var(--app-surface);
}

ion-button {
  --border-radius: 14px;
  font-weight: 600;
}

ion-item {
  --border-radius: 12px;
}
</style>