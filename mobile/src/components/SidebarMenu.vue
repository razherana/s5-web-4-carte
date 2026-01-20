<!-- src/components/SidebarMenu.vue -->
<template>
    <ion-menu side="start" content-id="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <ion-list>
          <!-- Utilisateur connecté -->
          <div v-if="isLoggedIn" class="user-info">
            <ion-item lines="none">
              <ion-avatar slot="start">
                <ion-icon :icon="personCircle" size="large"></ion-icon>
              </ion-avatar>
              <ion-label>
                <h2>{{ currentUser?.name || 'Utilisateur' }}</h2>
                <p>{{ currentUser?.email }}</p>
              </ion-label>
            </ion-item>
          </div>
  
          <!-- Menu principal -->
          <ion-menu-toggle auto-hide="false">
            <ion-item button @click="goToPage('/map')" :class="{ active: $route.path === '/map' }">
              <ion-icon slot="start" :icon="mapOutline"></ion-icon>
              <ion-label>Carte des travaux</ion-label>
            </ion-item>
          </ion-menu-toggle>
  
          <ion-menu-toggle auto-hide="false">
            <ion-item button @click="goToPage('/my-reports')" :class="{ active: $route.path === '/my-reports' }">
              <ion-icon slot="start" :icon="documentTextOutline"></ion-icon>
              <ion-label>Mes signalements</ion-label>
              <ion-badge color="primary" v-if="reportCount > 0">{{ reportCount }}</ion-badge>
            </ion-item>
          </ion-menu-toggle>
  
          <!-- Statistiques -->
          <!-- <ion-menu-toggle acceptuto-hide="false">
            <ion-item button @click="toggleStats">
              <ion-icon slot="start" :icon="statsChartOutline"></ion-icon>
              <ion-label>Statistiques</ion-label>
              <ion-icon slot="end" :icon="showStats ? chevronUp : chevronDown"></ion-icon>
            </ion-item>
          </ion-menu-toggle> -->
  
          <!-- Section administrateur (optionnel) -->
          <div v-if="isAdmin" class="admin-section">
            <ion-item-divider>
              <ion-label>Administration</ion-label>
            </ion-item-divider>
            
            <ion-menu-toggle auto-hide="false">
              <ion-item button>
                <ion-icon slot="start" :icon="settingsOutline"></ion-icon>
                <ion-label>Gestion des travaux</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </div>
  
          <!-- Aide -->
          <!-- <ion-menu-toggle auto-hide="false">
            <ion-item button>
              <ion-icon slot="start" :icon="helpCircleOutline"></ion-icon>
              <ion-label>Aide & Support</ion-label>
            </ion-item>
          </ion-menu-toggle>  -->
  
          <!-- À propos -->
          <!-- <ion-menu-toggle auto-hide="false">
            <ion-item button>
              <ion-icon slot="start" :icon="informationCircleOutline"></ion-icon>
              <ion-label>À propos</ion-label>
            </ion-item>
          </ion-menu-toggle> -->
  
          <!-- Boutons connexion/déconnexion -->
          <div class="auth-buttons">
            <ion-menu-toggle auto-hide="false">
              <ion-item button v-if="!isLoggedIn" @click="goToPage('/login')">
                <ion-icon slot="start" :icon="logInOutline"></ion-icon>
                <ion-label>Se connecter</ion-label>
              </ion-item>
            </ion-menu-toggle>
  
            <ion-menu-toggle auto-hide="false">
              <ion-item button v-if="!isLoggedIn" @click="goToPage('/register')">
                <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
                <ion-label>S'inscrire</ion-label>
              </ion-item>
            </ion-menu-toggle>
  
            <ion-menu-toggle auto-hide="false">
              <ion-item button v-if="isLoggedIn" @click="handleLogout">
                <ion-icon slot="start" :icon="logOutOutline" color="danger"></ion-icon>
                <ion-label color="danger">Déconnexion</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </div>
        </ion-list>
      </ion-content>
      
      <!-- Footer -->
      <ion-footer>
        <ion-toolbar>
          <ion-title size="small">Travaux Routiers Antananarivo</ion-title>
          <ion-text slot="end">
            <p class="version">v1.0.0</p>
          </ion-text>
        </ion-toolbar>
      </ion-footer>
    </ion-menu>
  </template>
  
  <script>
  import {
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonBadge,
    IonAvatar,
    IonItemDivider,
    IonFooter,
    IonText,
    IonMenuToggle,
    alertController
  } from '@ionic/vue';
  import {
    mapOutline,
    documentTextOutline,
    statsChartOutline,
    settingsOutline,
    helpCircleOutline,
    informationCircleOutline,
    logInOutline,
    logOutOutline,
    personAddOutline,
    personCircle,
    chevronDown,
    chevronUp
  } from 'ionicons/icons';
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import authService from '@/services/authService';
  import reportService from '@/services/reportService';
  
  export default {
    name: 'SidebarMenu',
    components: {
      IonMenu,
      IonHeader,
      IonToolbar,
      IonTitle,
      IonContent,
      IonList,
      IonItem,
      IonLabel,
      IonIcon,
      IonBadge,
      IonAvatar,
      IonItemDivider,
      IonFooter,
      IonText,
      IonMenuToggle
    },
    setup() {
      const router = useRouter();
      const route = useRoute();
      
      const showStats = ref(true);
      const reportCount = ref(0);
      const currentUser = ref(null);
  
      const isLoggedIn = computed(() => {
        return currentUser.value !== null;
      });
  
      const isAdmin = computed(() => {
        return currentUser.value?.role === 'admin';
      });
  
      const loadUserReports = async () => {
        if (isLoggedIn.value) {
          const userId = currentUser.value.uid || currentUser.value.id;
          const result = await reportService.getUserReports(userId);
          if (result.success) {
            reportCount.value = result.data.length;
          }
        }
      };
  
      const goToPage = (path) => {
        router.push(path);
        // Fermer le menu après navigation
        const menu = document.querySelector('ion-menu');
        if (menu) {
          menu.close();
        }
      };
  
      const toggleStats = () => {
        showStats.value = !showStats.value;
        // Émettre un événement pour MapPage
        window.dispatchEvent(new CustomEvent('toggle-stats', { 
          detail: { show: showStats.value } 
        }));
      };
  
      const handleLogout = async () => {
        const alert = await alertController.create({
          header: 'Déconnexion',
          message: 'Voulez-vous vraiment vous déconnecter ?',
          buttons: [
            {
              text: 'Annuler',
              role: 'cancel'
            },
            {
              text: 'Déconnexion',
              handler: async () => {
                await authService.logout();
                currentUser.value = null;
                router.push('/login');
              }
            }
          ]
        });
        await alert.present();
        
        // Fermer le menu
        const menu = document.querySelector('ion-menu');
        if (menu) {
          menu.close();
        }
      };
  
      onMounted(() => {
        currentUser.value = authService.getCurrentUser();
        loadUserReports();
      });
  
      return {
        showStats,
        reportCount,
        currentUser,
        isLoggedIn,
        isAdmin,
        goToPage,
        toggleStats,
        handleLogout,
        mapOutline,
        documentTextOutline,
        statsChartOutline,
        settingsOutline,
        helpCircleOutline,
        informationCircleOutline,
        logInOutline,
        logOutOutline,
        personAddOutline,
        personCircle,
        chevronDown,
        chevronUp
      };
    }
  };
  </script>
  
  <style scoped>
  .user-info {
    padding: 15px;
    background: var(--ion-color-light);
  }
  
  .user-info ion-avatar {
    width: 50px;
    height: 50px;
  }
  
  .user-info h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .user-info p {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin: 0;
  }
  
  ion-item.active {
    --background: var(--ion-color-light);
    --color: var(--ion-color-primary);
  }
  
  ion-item.active ion-icon {
    color: var(--ion-color-primary);
  }
  
  .admin-section {
    margin-top: 20px;
  }
  
  .auth-buttons {
    margin-top: 20px;
    border-top: 1px solid var(--ion-color-light);
    padding-top: 10px;
  }
  
  .version {
    font-size: 11px;
    color: var(--ion-color-medium);
    margin: 0;
    padding-right: 10px;
  }
  
  ion-badge {
    margin-left: 8px;
  }
  </style>