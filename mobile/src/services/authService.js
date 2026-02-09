// src/services/authService.js
import axios from 'axios';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebaseConfig';

const API_URL = 'http://localhost:3000/api'; // URL de votre API REST

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initAuthListener();
  }

  // Initialiser l'écouteur d'authentification Firebase
  initAuthListener() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          photoURL: user.photoURL || null
        };
        // Sauvegarder dans localStorage
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        localStorage.setItem('authProvider', 'firebase');
      } else {
        // Vérifier si l'utilisateur est connecté via l'API
        const apiUser = localStorage.getItem('user');
        const authProvider = localStorage.getItem('authProvider');
        
        if (!apiUser || authProvider === 'firebase') {
          this.currentUser = null;
          localStorage.removeItem('user');
          localStorage.removeItem('authProvider');
          localStorage.removeItem('token');
        }
      }
    });
  }

  // Connexion avec Firebase (en ligne)
  async loginWithFirebase(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      this.currentUser = {
        uid: user.uid,
        id: user.uid,
        email: user.email,
        displayName: user.displayName || user.email,
        photoURL: user.photoURL || null
      };
      
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      localStorage.setItem('authProvider', 'firebase');
      
      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Erreur Firebase login:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Connexion avec l'API REST (mode hors ligne ou fallback)
  async loginWithAPI(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        timeout: 5000 // 5 secondes timeout
      });
      
      if (response.data.token) {
        this.currentUser = {
          uid: response.data.user?.id || response.data.userId,
          id: response.data.user?.id || response.data.userId,
          email: response.data.user?.email || email,
          displayName: response.data.user?.name || email,
          photoURL: response.data.user?.photoURL || null
        };
        
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('authProvider', 'api');
      }
      
      return {
        success: true,
        user: this.currentUser,
        token: response.data.token
      };
    } catch (error) {
      const isNet = this.isNetworkError(error);
      if (isNet) {
        console.warn("API indisponible (login):", error.message);
      } else {
        console.error("Erreur API login:", error);
      }
      return {
        success: false,
        error: isNet
          ? "API indisponible. Lancez le serveur API ou vérifiez l'URL."
          : error.response?.data?.message || "Erreur de connexion à l'API"
      };
    }
  }

  // Connexion intelligente (essaie Firebase d'abord, puis API en fallback)
  async login(email, password) {
    // Vérifier la validation
    if (!email || !password) {
      return {
        success: false,
        error: 'Email et mot de passe requis'
      };
    }

    // Essayer d'abord Firebase
    const firebaseResult = await this.loginWithFirebase(email, password);
    
    if (firebaseResult.success) {
      console.log('✅ Connexion réussie avec Firebase');
      return firebaseResult;
    }
    
    console.log('⚠️ Firebase login échoué, tentative avec API...');

    if (!this.isApiEnabled()) {
      return firebaseResult;
    }

    const apiResult = await this.loginWithAPI(email, password);
    
    if (apiResult.success) {
      console.log('✅ Connexion réussie avec API');
      return apiResult;
    }
    
    console.log('❌ Échec de connexion avec Firebase et API');
    
    // Retourner l'erreur Firebase (plus détaillée)
    return firebaseResult;
  }

  // Inscription avec Firebase
  async registerWithFirebase(email, password, userData = {}) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      this.currentUser = {
        uid: user.uid,
        id: user.uid,
        email: user.email,
        displayName: userData.name || user.email,
        photoURL: user.photoURL || null
      };
      
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      localStorage.setItem('authProvider', 'firebase');
      
      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Erreur Firebase register:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Inscription avec l'API
  async registerWithAPI(email, password, userData = {}) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name: userData.name || email,
        ...userData
      }, {
        timeout: 5000
      });
      
      if (response.data.token) {
        this.currentUser = {
          uid: response.data.user?.id || response.data.userId,
          id: response.data.user?.id || response.data.userId,
          email: response.data.user?.email || email,
          displayName: response.data.user?.name || email,
          photoURL: response.data.user?.photoURL || null
        };
        
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('authProvider', 'api');
        
        return {
          success: true,
          user: this.currentUser,
          token: response.data.token
        };
      }
      
      return {
        success: false,
        error: 'Réponse invalide du serveur'
      };
    } catch (error) {
      const isNet = this.isNetworkError(error);
      if (isNet) {
        console.warn("API indisponible (register):", error.message);
      } else {
        console.error("Erreur API register:", error);
      }
      return {
        success: false,
        error: isNet
          ? "API indisponible. Lancez le serveur API ou vérifiez l'URL."
          : error.response?.data?.message || "Erreur lors de l'inscription"
      };
    }
  }

  // Inscription intelligente (Firebase + sync avec API)
  async register(email, password, userData = {}) {
    // Vérifier la validation
    if (!email || !password) {
      return {
        success: false,
        error: 'Email et mot de passe requis'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      };
    }

    // Essayer d'abord Firebase
    const firebaseResult = await this.registerWithFirebase(email, password, userData);
    
    if (firebaseResult.success) {
      console.log('✅ Inscription réussie avec Firebase');
      
      if (this.isApiEnabled()) {
        try {
          await this.registerWithAPI(email, password, userData);
          console.log('✅ Utilisateur synchronisé avec l\'API');
        } catch (error) {
          console.warn('⚠️ Sync API échouée (non bloquant):', error);
        }
      }

      return firebaseResult;
    }
    
    console.log('⚠️ Firebase register échoué, tentative avec API...');

    if (!this.isApiEnabled()) {
      return firebaseResult;
    }

    const apiResult = await this.registerWithAPI(email, password, userData);

    if (apiResult.success) {
      console.log('✅ Inscription réussie avec API');
      return apiResult;
    }
    
    console.log('❌ Échec d\'inscription avec Firebase et API');
    return firebaseResult;
  }

  // Déconnexion
  async logout() {
    try {
      const authProvider = localStorage.getItem('authProvider');
      
      // Déconnecter de Firebase si c'était le provider
      if (authProvider === 'firebase') {
        await signOut(auth);
      }
      
      // Nettoyer localStorage
      this.currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authProvider');
      
      console.log('✅ Déconnexion réussie');
      
      return { 
        success: true 
      };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Forcer le nettoyage même en cas d'erreur
      this.currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('authProvider');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    // Essayer d'abord depuis la mémoire
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Vérifier Firebase Auth
    if (auth.currentUser) {
      this.currentUser = {
        uid: auth.currentUser.uid,
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || auth.currentUser.email,
        photoURL: auth.currentUser.photoURL || null
      };
      return this.currentUser;
    }
    
    // Vérifier localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        return this.currentUser;
      } catch (error) {
        console.error('Erreur lors de la lecture de l\'utilisateur:', error);
        localStorage.removeItem('user');
        return null;
      }
    }
    
    return null;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Obtenir le token (pour les requêtes API)
  getToken() {
    return localStorage.getItem('token');
  }

  // Obtenir le provider d'authentification actuel
  getAuthProvider() {
    return localStorage.getItem('authProvider') || 'unknown';
  }

  // Messages d'erreur Firebase en français
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/operation-not-allowed': 'Opération non autorisée',
      'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
      'auth/user-disabled': 'Ce compte a été désactivé',
      'auth/user-not-found': 'Aucun compte trouvé avec cette adresse email',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
      'auth/network-request-failed': 'Erreur de connexion. Vérifiez votre connexion internet',
      'auth/invalid-credential': 'Identifiants invalides',
      'auth/invalid-login-credentials': 'Email ou mot de passe incorrect'
    };
    
    return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
  }

  // Configuration des headers pour les requêtes API
  getAxiosConfig() {
    const token = this.getToken();
    if (token) {
      return {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
    }
    return {};
  }

  isApiEnabled() {
    try {
      const apiHost = new URL(API_URL).hostname;
      const isLocalApi = ["localhost", "127.0.0.1", "10.0.2.2"].includes(apiHost);
      const appHost = window?.location?.hostname;

      if (isLocalApi && appHost && !["localhost", "127.0.0.1"].includes(appHost)) {
        return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  isNetworkError(error) {
    return (
      !error.response &&
      (error.code === "ERR_NETWORK" ||
        error.code === "ECONNABORTED" ||
        String(error.message || "").includes("Network Error") ||
        String(error.message || "").includes("ERR_CONNECTION_REFUSED"))
    );
  }
}

export default new AuthService();