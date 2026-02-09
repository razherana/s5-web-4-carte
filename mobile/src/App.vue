<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { defineComponent, onMounted, onUnmounted } from 'vue';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet
  },
  setup() {
    onMounted(async () => {
      console.log('🚀 Application démarrée');
      
      // Initialiser les notifications
      await notificationService.initialize();
      
      // Vérifier si un utilisateur est connecté
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        console.log(`👤 Utilisateur connecté: ${currentUser.email}`);
        
        // Démarrer la surveillance des notifications pour cet utilisateur
        notificationService.watchUserReports(currentUser.uid);
      }
    });

    return {};
  }
});
</script>