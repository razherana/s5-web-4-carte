<template>
  <ion-menu side="start" content-id="main-content" class="modern-menu">
    <ion-content>
      <!-- Modern Header with Gradient -->
      <div class="menu-header">
        <div class="brand-section">
          <div class="brand-logo">
            <ion-icon :icon="navigateCircleOutline" class="brand-icon"></ion-icon>
          </div>
          <div class="brand-info">
            <h1 class="brand-title">Road<span class="brand-accent">Watch</span></h1>
            <p class="brand-subtitle">Antananarivo, Madagascar</p>
          </div>
        </div>

        <!-- User Profile Card -->
        <div v-if="isLoggedIn" class="profile-card">
          <div class="profile-avatar">
            <div class="avatar-circle">
              <span>{{ userInitials }}</span>
            </div>
            <div class="status-dot"></div>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ currentUser?.displayName || 'Utilisateur' }}</h2>
            <p class="profile-email">{{ currentUser?.email }}</p>
          </div>
        </div>

        <!-- Guest State -->
        <div v-else class="guest-card">
          <div class="guest-icon">
            <ion-icon :icon="personOutline"></ion-icon>
          </div>
          <div class="guest-content">
            <h2>Bienvenue!</h2>
            <p>Connectez-vous pour accéder à toutes les fonctionnalités</p>
          </div>
        </div>
      </div>

      <!-- Navigation Menu -->
      <div class="menu-content">
        <!-- Primary Navigation -->
        <div class="menu-section">
          <h3 class="section-title">Navigation</h3>
          <div class="menu-items">
            <ion-menu-toggle auto-hide="false">
              <div 
                class="menu-item" 
                :class="{ active: $route.path === '/map' }"
                @click="goToPage('/map')"
              >
                <div class="item-icon-wrapper">
                  <ion-icon :icon="mapOutline" class="item-icon"></ion-icon>
                </div>
                <div class="item-content">
                  <span class="item-label">Carte interactive</span>
                  <span class="item-description">Explorer les signalements</span>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
              </div>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false" v-if="isLoggedIn">
              <div 
                class="menu-item" 
                :class="{ active: $route.path === '/my-reports' }"
                @click="goToPage('/my-reports')"
              >
                <div class="item-icon-wrapper">
                  <ion-icon :icon="documentTextOutline" class="item-icon"></ion-icon>
                </div>
                <div class="item-content">
                  <span class="item-label">Mes signalements</span>
                  <span class="item-description">Suivre mes rapports</span>
                </div>
                <ion-badge v-if="reportCount > 0" class="item-badge">{{ reportCount }}</ion-badge>
                <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
              </div>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false">
              <div 
                class="menu-item" 
                :class="{ active: $route.path === '/statistics' }"
                @click="goToPage('/statistics')"
              >
                <div class="item-icon-wrapper">
                  <ion-icon :icon="statsChartOutline" class="item-icon"></ion-icon>
                </div>
                <div class="item-content">
                  <span class="item-label">Statistiques</span>
                  <span class="item-description">Tableau de bord</span>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
              </div>
            </ion-menu-toggle>
          </div>
        </div>

        <!-- Account Section -->
        <div class="menu-section">
          <h3 class="section-title">Compte</h3>
          <div class="menu-items">
            <template v-if="!isLoggedIn">
              <ion-menu-toggle auto-hide="false">
                <div class="menu-item" @click="goToPage('/login')">
                  <div class="item-icon-wrapper primary">
                    <ion-icon :icon="logInOutline" class="item-icon"></ion-icon>
                  </div>
                  <div class="item-content">
                    <span class="item-label">Se connecter</span>
                    <span class="item-description">Accéder à mon compte</span>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
                </div>
              </ion-menu-toggle>

              <ion-menu-toggle auto-hide="false">
                <div class="menu-item" @click="goToPage('/register')">
                  <div class="item-icon-wrapper secondary">
                    <ion-icon :icon="personAddOutline" class="item-icon"></ion-icon>
                  </div>
                  <div class="item-content">
                    <span class="item-label">Créer un compte</span>
                    <span class="item-description">Inscription gratuite</span>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
                </div>
              </ion-menu-toggle>
            </template>

            <template v-else>
              <ion-menu-toggle auto-hide="false">
                <div class="menu-item danger" @click="handleLogout">
                  <div class="item-icon-wrapper danger">
                    <ion-icon :icon="logOutOutline" class="item-icon"></ion-icon>
                  </div>
                  <div class="item-content">
                    <span class="item-label">Déconnexion</span>
                    <span class="item-description">Quitter mon compte</span>
                  </div>
                  <ion-icon :icon="chevronForwardOutline" class="item-arrow"></ion-icon>
                </div>
              </ion-menu-toggle>
            </template>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="menu-footer">
        <div class="footer-info">
          <ion-icon :icon="informationCircleOutline"></ion-icon>
          <span>Version 1.0.0 • Made with ❤️</span>
        </div>
      </div>
    </ion-content>
  </ion-menu>
</template>

<script>
import {
  IonMenu,
  IonContent,
  IonIcon,
  IonBadge,
  IonMenuToggle,
  alertController
} from '@ionic/vue';
import {
  navigateCircleOutline,
  mapOutline,
  documentTextOutline,
  statsChartOutline,
  logInOutline,
  logOutOutline,
  personAddOutline,
  personOutline,
  chevronForwardOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import authService from '@/services/authService';
import reportService from '@/services/reportService';

export default {
  name: 'SidebarMenu',
  components: {
    IonMenu,
    IonContent,
    IonIcon,
    IonBadge,
    IonMenuToggle
  },
  setup() {
    const router = useRouter();
    const reportCount = ref(0);
    const currentUser = ref(null);

    const isLoggedIn = computed(() => currentUser.value !== null);

    const userInitials = computed(() => {
      if (!currentUser.value) return 'U';
      const name = currentUser.value.displayName || currentUser.value.email || 'User';
      return name.charAt(0).toUpperCase();
    });

    const loadUserReports = async () => {
      if (!isLoggedIn.value) return;
      const userId = currentUser.value.uid || currentUser.value.id;
      const result = await reportService.getUserReports(userId);
      if (result.success) {
        reportCount.value = result.data.length;
      }
    };

    const closeMenu = () => {
      const menu = document.querySelector('ion-menu');
      if (menu) {
        menu.close();
      }
    };

    const goToPage = (path) => {
      router.push(path);
      closeMenu();
    };

    const handleLogout = async () => {
      const alert = await alertController.create({
        header: 'Déconnexion',
        message: 'Voulez-vous vraiment vous déconnecter?',
        buttons: [
          { text: 'Annuler', role: 'cancel' },
          {
            text: 'Déconnexion',
            handler: async () => {
              await authService.logout();
              currentUser.value = null;
              router.push('/login');
              closeMenu();
            }
          }
        ],
        cssClass: 'modern-alert'
      });
      await alert.present();
    };

    onMounted(() => {
      currentUser.value = authService.getCurrentUser();
      loadUserReports();
    });

    return {
      reportCount,
      currentUser,
      isLoggedIn,
      userInitials,
      goToPage,
      handleLogout,
      navigateCircleOutline,
      mapOutline,
      documentTextOutline,
      statsChartOutline,
      logInOutline,
      logOutOutline,
      personAddOutline,
      personOutline,
      chevronForwardOutline,
      informationCircleOutline
    };
  }
};
</script>

<style scoped>
.modern-menu {
  --width: 300px;
  --ion-background-color: var(--app-background);
}

ion-content {
  --background: var(--app-background);
}

/* Header */
.menu-header {
  padding: var(--app-space-xl) var(--app-space-lg);
  background: var(--app-gradient-primary);
  position: relative;
  overflow: hidden;
}

.menu-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

/* Brand Section */
.brand-section {
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  margin-bottom: var(--app-space-xl);
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 52px;
  height: 52px;
  border-radius: var(--app-radius-lg);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.brand-icon {
  font-size: 28px;
  color: white;
}

.brand-info {
  flex: 1;
}

.brand-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  font-family: var(--app-font-display);
  letter-spacing: -0.5px;
}

.brand-accent {
  color: rgba(255, 255, 255, 0.8);
}

.brand-subtitle {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

/* Profile Card */
.profile-card {
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  padding: var(--app-space-md);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: var(--app-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.profile-avatar {
  position: relative;
}

.avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: var(--app-radius-full);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--ion-color-primary);
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--ion-color-success);
  border: 2px solid white;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-email {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Guest Card */
.guest-card {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-md);
  padding: var(--app-space-md);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: var(--app-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.guest-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--app-radius-md);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guest-icon ion-icon {
  font-size: 24px;
  color: white;
}

.guest-content h2 {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
  color: white;
}

.guest-content p {
  margin: 0;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
}

/* Menu Content */
.menu-content {
  padding: var(--app-space-md) 0;
}

.menu-section {
  padding: var(--app-space-md) var(--app-space-lg);
}

.section-title {
  margin: 0 0 var(--app-space-sm);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  color: var(--app-text-tertiary);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

/* Menu Item */
.menu-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  padding: var(--app-space-md);
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  cursor: pointer;
  transition: all var(--app-transition-base);
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: var(--app-gradient-primary);
  transition: width var(--app-transition-base);
}

.menu-item:hover {
  transform: translateX(4px);
  box-shadow: var(--app-shadow-sm);
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  border-color: var(--ion-color-primary);
}

.menu-item.active::before {
  width: 4px;
}

.menu-item.danger:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(239, 68, 68, 0.1));
  border-color: var(--ion-color-danger);
}

.item-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: var(--app-radius-md);
  background: var(--app-background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--app-transition-base);
}

.item-icon-wrapper.primary {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
}

.item-icon-wrapper.secondary {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.1));
}

.item-icon-wrapper.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
}

.item-icon {
  font-size: 20px;
  color: var(--app-text-secondary);
  transition: color var(--app-transition-fast);
}

.menu-item.active .item-icon {
  color: var(--ion-color-primary);
}

.menu-item.danger .item-icon {
  color: var(--ion-color-danger);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--app-text-primary);
}

.item-description {
  font-size: 0.75rem;
  color: var(--app-text-tertiary);
}

.item-badge {
  --background: var(--ion-color-primary);
  --color: white;
  --padding-start: 8px;
  --padding-end: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  height: 22px;
  border-radius: var(--app-radius-full);
}

.item-arrow {
  font-size: 18px;
  color: var(--app-text-tertiary);
  transition: transform var(--app-transition-fast);
  flex-shrink: 0;
}

.menu-item:hover .item-arrow {
  transform: translateX(4px);
}

/* Footer */
.menu-footer {
  padding: var(--app-space-lg);
  border-top: 1px solid var(--app-border);
  margin-top: auto;
}

.footer-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-xs);
  font-size: 0.75rem;
  color: var(--app-text-tertiary);
}

.footer-info ion-icon {
  font-size: 16px;
}
</style>