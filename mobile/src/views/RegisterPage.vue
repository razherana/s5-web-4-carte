<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button default-href="/login"></ion-back-button>
          </ion-buttons>
          <ion-title>Inscription</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="register-container">
          <h2>Créer un compte</h2>
          
          <ion-card>
            <ion-card-content>
              <ion-item>
                <ion-label position="floating">Nom</ion-label>
                <ion-input 
                  v-model="formData.name" 
                  type="text"
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Prénom</ion-label>
                <ion-input 
                  v-model="formData.firstName" 
                  type="text"
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input 
                  v-model="formData.email" 
                  type="email"
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Mot de passe</ion-label>
                <ion-input 
                  v-model="formData.password" 
                  type="password"
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Confirmer le mot de passe</ion-label>
                <ion-input 
                  v-model="formData.confirmPassword" 
                  type="password"
                ></ion-input>
              </ion-item>
              
              <ion-button 
                expand="block" 
                @click="handleRegister"
                :disabled="loading"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>S'inscrire</span>
              </ion-button>
            </ion-card-content>
          </ion-card>
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
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonBackButton,
    IonSpinner,
    alertController
  } from '@ionic/vue';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import authService from '@/services/authService';
  
  export default {
    name: 'RegisterPage',
    components: {
      IonPage,
      IonHeader,
      IonToolbar,
      IonTitle,
      IonContent,
      IonCard,
      IonCardContent,
      IonItem,
      IonLabel,
      IonInput,
      IonButton,
      IonButtons,
      IonBackButton,
      IonSpinner
    },
    setup() {
      const router = useRouter();
      const loading = ref(false);
      const formData = ref({
        name: '',
        firstName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
  
      const validateForm = () => {
        if (!formData.value.name || !formData.value.firstName || 
            !formData.value.email || !formData.value.password) {
          return { valid: false, message: 'Veuillez remplir tous les champs' };
        }
  
        if (formData.value.password !== formData.value.confirmPassword) {
          return { valid: false, message: 'Les mots de passe ne correspondent pas' };
        }
  
        if (formData.value.password.length < 6) {
          return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
        }
  
        return { valid: true };
      };
  
      const handleRegister = async () => {
        const validation = validateForm();
        
        if (!validation.valid) {
          const alert = await alertController.create({
            header: 'Erreur',
            message: validation.message,
            buttons: ['OK']
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
            header: 'Succès',
            message: 'Votre compte a été créé avec succès',
            buttons: [{
              text: 'OK',
              handler: () => {
                router.push('/map');
              }
            }]
          });
          await alert.present();
        } else {
          const alert = await alertController.create({
            header: 'Erreur',
            message: result.error,
            buttons: ['OK']
          });
          await alert.present();
        }
      };
  
      return {
        formData,
        loading,
        handleRegister
      };
    }
  };
  </script>
  
  <style scoped>
  .register-container {
    max-width: 500px;
    margin: 0 auto;
    padding-top: 20px;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: var(--ion-color-primary);
  }
  </style>