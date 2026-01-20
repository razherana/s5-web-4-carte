// src/router/index.js
import { createRouter, createWebHistory } from '@ionic/vue-router';
import LoginPage from '@/views/LoginPage.vue';
import RegisterPage from '@/views/RegisterPage.vue';
import MapPage from '@/views/MapPage.vue';
import MyReportsPage from '@/views/MyReportsPage.vue';
import ReportingPage from '@/views/ReportingPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/map'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/map',
    name: 'Map',
    component: MapPage
  },
  {
    path: '/my-reports',
    name: 'MyReports',
    component: MyReportsPage
    // meta: { requiresAuth: true }
  }, 
  {
    path: '/reporting',
    name: 'reporting',
    component: ReportingPage
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Guard de navigation pour les routes protégées
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = localStorage.getItem('user') !== null;

  if (requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;