<template>
  <ion-page>
    <ion-content class="notfound-content">
      <div class="page-shell">
        <div class="glass-strong card notfound-card">
          <h1>Page introuvable</h1>
          <p class="text-secondary">La page demandée n'existe pas ou a été déplacée.</p>
          <div class="btn-primary">
            <ion-button expand="block" @click="goHome">Retour à la carte</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonPage, IonContent, IonButton } from '@ionic/vue';
import { useRouter } from 'vue-router';

export default {
  name: 'NotFoundPage',
  components: {
    IonPage,
    IonContent,
    IonButton
  },
  setup() {
    const router = useRouter();
    const goHome = () => router.push('/map');

    return { goHome };
  }
};
</script>

<style scoped>
.notfound-content {
  --background: transparent;
}

.notfound-card {
  text-align: center;
  display: grid;
  gap: var(--app-space-sm);
}

.notfound-card h1 {
  margin: 0;
  font-size: 1.6rem;
}
</style>
