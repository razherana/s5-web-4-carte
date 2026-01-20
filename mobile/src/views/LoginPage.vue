<template>
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>Log in</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="ion-padding">
        <div class="login-container">
          <h1>Travaux Routiers Antananarivo</h1>
          
          <ion-card>
            <ion-card-content>
              <ion-item>
                <ion-label position="floating">Email</ion-label>
                <ion-input 
                  v-model="email" 
                  type="email"
                  placeholder="votre@email.com"
                ></ion-input>
              </ion-item>
              
              <ion-item>
                <ion-label position="floating">Password</ion-label>
                <ion-input 
                  v-model="password" 
                  type="password"
                  placeholder="********"
                ></ion-input>
              </ion-item>
              
              <ion-button 
                expand="block" 
                @click="handleLogin"
                :disabled="loading"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                <span v-else>Log in</span>
              </ion-button>
              
              <div class="register-link">
                <p>Pas encore de compte ?</p>
                <ion-button fill="clear" @click="goToRegister">
                  Register
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
          
          <ion-button 
            expand="block" 
            fill="outline"
            @click="continueAsVisitor"
            class="ion-margin-top"
          >
            Connect as a visitor
          </ion-button>
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
    IonSpinner,
    alertController
  } from '@ionic/vue';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import authService from '@/services/authService';
  
  export default {
    name: 'LoginPage',
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
      IonSpinner
    },
    setup() {
      const router = useRouter();
      const email = ref('');
      const password = ref('');
      const loading = ref(false);
  
      const handleLogin = async () => {
        if (!email.value || !password.value) {
          const alert = await alertController.create({
            header: 'Erreur',
            message: 'Veuillez remplir tous les champs',
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
  
        loading.value = true;
  
        // Essayer d'abord avec Firebase
        const result = await authService.loginWithFirebase(email.value, password.value);
  
        if (result.success) {
          router.push('/my-reports');
        } else {
          // Si Firebase échoue, essayer avec l'API locale
          const apiResult = await authService.loginWithAPI(email.value, password.value);
          
          if (apiResult.success) {
            router.push('/map');
          } else {
            const alert = await alertController.create({
              header: 'Erreur de connexion',
              message: result.error || 'Email ou mot de passe incorrect',
              buttons: ['OK']
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
        handleLogin,
        goToRegister,
        continueAsVisitor
      };
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    max-width: 500px;
    margin: 0 auto;
    padding-top: 50px;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: var(--ion-color-primary);
  }
  
  .register-link {
    text-align: center;
    margin-top: 20px;
  }
  
  .register-link p {
    margin: 0;
    font-size: 14px;
  }
  </style>