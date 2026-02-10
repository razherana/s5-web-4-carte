<template>
  <ion-menu side="start" content-id="main-content" class="menu-shell" @ionDidOpen="onMenuOpen" @ionDidClose="onMenuClose">
    <ion-content>
      <div class="menu-hero glass-strong">
        <div class="brand-row">
          <div class="brand-icon">
            <ion-icon :icon="navigateCircleOutline"></ion-icon>
          </div>
          <div>
            <h1>Road<span>Watch</span></h1>
            <p>Antananarivo • Signalement intelligent</p>
          </div>
        </div>

        <!-- <div class="profile-panel" :class="{ guest: !isLoggedIn }">
          <div class="avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ currentUser?.displayName || 'Bienvenue' }}</h2>
            <p class="profile-email">{{ currentUser?.email || 'Connectez-vous pour personnaliser votre expérience.' }}</p>
          </div>
        </div> -->
      </div>

      <div class="menu-section">
        <p class="section-label">Navigation</p>
        <ion-menu-toggle auto-hide="false">
          <button class="menu-item" :class="{ active: $route.path === '/map' }" @click="goToPage('/map')">
            <ion-icon :icon="mapOutline"></ion-icon>
            <div>
              <strong>Carte</strong>
              <span>Explorer les signalements</span>
            </div>
          </button>
        </ion-menu-toggle>

        <ion-menu-toggle auto-hide="false" v-if="isLoggedIn">
          <button class="menu-item" :class="{ active: $route.path === '/my-reports' }" @click="goToPage('/my-reports')">
            <ion-icon :icon="documentTextOutline"></ion-icon>
            <div>
              <strong>Mes signalements</strong>
              <span>{{ reportCount }} rapport(s) actif(s)</span>
            </div>
            <span v-if="reportCount > 0" class="chip">{{ reportCount }}</span>
          </button>
        </ion-menu-toggle>

        <ion-menu-toggle auto-hide="false">
          <button class="menu-item" :class="{ active: $route.path === '/statistics' }" @click="goToPage('/statistics')">
            <ion-icon :icon="statsChartOutline"></ion-icon>
            <div>
              <strong>Statistiques</strong>
              <span>Vue globale & tendances</span>
            </div>
          </button>
        </ion-menu-toggle>
      </div>

      <div class="menu-section">
        <p class="section-label">Compte</p>
        <template v-if="!isLoggedIn">
          <ion-menu-toggle auto-hide="false">
            <button class="menu-item accent" @click="goToPage('/login')">
              <ion-icon :icon="logInOutline"></ion-icon>
              <div>
                <strong>Se connecter</strong>
                <span>Accéder à votre compte</span>
              </div>
            </button>
          </ion-menu-toggle>
          <!-- <ion-menu-toggle auto-hide="false">
            <button class="menu-item" @click="goToPage('/register')">
              <ion-icon :icon="personAddOutline"></ion-icon>
              <div>
                <strong>Créer un compte</strong>
                <span>Inscription gratuite</span>
              </div>
            </button>
          </ion-menu-toggle> -->
        </template>

        <template v-else>
          <ion-menu-toggle auto-hide="false">
            <button class="menu-item" :class="{ active: $route.path === '/profile' }" @click="goToPage('/profile')">
              <ion-icon :icon="personOutline"></ion-icon>
              <div>
                <strong>Profil</strong>
                <span>Vos informations</span>
              </div>
            </button>
          </ion-menu-toggle>
          <ion-menu-toggle auto-hide="false">
            <button class="menu-item" :class="{ active: $route.path === '/settings' }" @click="goToPage('/settings')">
              <ion-icon :icon="settingsOutline"></ion-icon>
              <div>
                <strong>Paramètres</strong>
                <span>Préférences & notifications</span>
              </div>
            </button>
          </ion-menu-toggle>
          <ion-menu-toggle auto-hide="false">
            <button class="menu-item danger" @click="handleLogout">
              <ion-icon :icon="logOutOutline"></ion-icon>
              <div>
                <strong>Déconnexion</strong>
                <span>Quitter la session</span>
              </div>
            </button>
          </ion-menu-toggle>
        </template>
      </div>

      <div class="menu-footer">
        <ion-icon :icon="informationCircleOutline"></ion-icon>
        <span>RoadWatch • Version 1.0.0</span>
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
  settingsOutline,
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
        message: 'Êtes-vous sûr de vouloir vous déconnecter de votre compte ?',
        buttons: [
          { 
            text: 'Annuler', 
            role: 'cancel',
            cssClass: 'alert-button-cancel'
          },
          {
            text: 'Se déconnecter',
            cssClass: 'alert-button-confirm',
            handler: async () => {
              await authService.logout();
              currentUser.value = null;
              router.push('/login');
              closeMenu();
            }
          }
        ],
        cssClass: 'modern-alert-glass'
      });
      await alert.present();
    };

    const onMenuOpen = () => {
      const backdrop = document.querySelector('ion-backdrop');
      if (backdrop) {
        backdrop.style.backdropFilter = 'blur(8px)';
        backdrop.style.webkitBackdropFilter = 'blur(8px)';
      }
      
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.style.filter = 'blur(4px)';
        mainContent.style.transition = 'filter 0.3s ease';
      }
    };

    const onMenuClose = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.style.filter = 'none';
      }
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
      onMenuOpen,
      onMenuClose,
      navigateCircleOutline,
      mapOutline,
      documentTextOutline,
      statsChartOutline,
      logInOutline,
      logOutOutline,
      personAddOutline,
      personOutline,
      settingsOutline,
      informationCircleOutline
    };
  }
};
</script>

<style scoped>
ion-content {
  --background: transparent;
}

.menu-shell {
  --width: 320px;
  --ion-background-color: transparent;
}

.menu-hero {
  margin: var(--app-space-lg);
  padding: var(--app-space-lg);
  border-radius: var(--app-radius-xl);
  display: grid;
  gap: var(--app-space-md);
}

.brand-row {
  display: flex;
  gap: var(--app-space-md);
  align-items: center;
}

.brand-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--app-radius-lg);
  display: grid;
  place-items: center;
  background: rgba(37, 99, 235, 0.15);
  border: 1px solid rgba(37, 99, 235, 0.25);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.brand-icon ion-icon {
  font-size: 28px;
  color: #2563eb;
}

.brand-row h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  font-family: var(--app-font-display);
  color: #0f172a;
}

.brand-row h1 span {
  color: var(--ion-color-primary);
}

.brand-row p {
  margin: 0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 500;
}

.profile-panel {
  display: flex;
  gap: var(--app-space-sm);
  align-items: center;
  padding: var(--app-space-md);
  border-radius: var(--app-radius-lg);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.25);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.profile-panel.guest {
  background: rgba(255, 255, 255, 0.5);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.08));
  font-weight: 700;
  font-size: 1.2rem;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
}

.profile-info {
  flex: 1;
  min-width: 0; /* Crucial pour que text-overflow fonctionne */
  overflow: hidden;
}

.profile-info h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.profile-info p {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.menu-section {
  margin: 0 var(--app-space-lg) var(--app-space-lg);
  display: grid;
  gap: var(--app-space-sm);
}

.section-label {
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #64748b;
  margin: 0 0 var(--app-space-xs);
  font-weight: 700;
}

.menu-item {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border-radius: var(--app-radius-lg);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: var(--app-space-md);
  text-align: left;
  color: #0f172a;
  transition: all var(--app-transition-base);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.menu-item:hover {
  transform: translateX(4px);
  border-color: rgba(37, 99, 235, 0.3);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.menu-item ion-icon {
  font-size: 22px;
  color: #2563eb;
  transition: transform 0.2s ease;
}

.menu-item:hover ion-icon {
  transform: scale(1.1);
}

.menu-item div {
  display: grid;
  gap: 3px;
  flex: 1;
}

.menu-item strong {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.menu-item span {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.menu-item.active {
  border-color: rgba(37, 99, 235, 0.5);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(37, 99, 235, 0.04));
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.menu-item.accent {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.menu-item.accent:hover {
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.4);
  transform: translateX(4px) translateY(-2px);
}

.menu-item.accent ion-icon,
.menu-item.accent strong,
.menu-item.accent span {
  color: #ffffff;
}

.menu-item.danger {
  border-color: rgba(220, 38, 38, 0.3);
  background: rgba(254, 242, 242, 0.6);
}

.menu-item.danger:hover {
  border-color: rgba(220, 38, 38, 0.5);
  background: rgba(254, 242, 242, 0.9);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.menu-item.danger ion-icon {
  color: #dc2626;
}

.chip {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
}

.menu-footer {
  margin: 0 var(--app-space-lg) var(--app-space-lg);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 12px;
  border-radius: var(--app-radius-lg);
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.menu-footer ion-icon {
  color: #64748b;
}

.profile-info {
  flex: 1;
  min-width: 0; /* Crucial pour que text-overflow fonctionne */
  overflow: hidden;
}

.profile-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.profile-email {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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

/* Styles globaux pour le backdrop du menu */
ion-menu::part(backdrop) {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>