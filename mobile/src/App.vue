<!-- src/App.vue -->
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
/* Styles globaux */
@import 'leaflet/dist/leaflet.css';

:root {
  --ion-color-primary: #3880ff;
  --ion-color-primary-rgb: 56, 128, 255;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #3171e0;
  --ion-color-primary-tint: #4c8dff;
}

ion-content {
  --background: #f5f5f5;
}
</style>