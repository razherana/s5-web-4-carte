// src/services/authService.js
import axios from "axios";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const API_URL = "http://localhost:3000/api";

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Trouver un utilisateur par email dans Firestore
  async findUserByEmail(email) {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data(),
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la recherche de l'utilisateur:", error);
      return null;
    }
  }

  // Connexion SIMPLE avec Firestore (juste par email)
  async loginWithFirestore(email) {
    try {
      // 1. Trouver l'utilisateur par email
      const user = await this.findUserByEmail(email);

      if (!user) {
        return {
          success: false,
          error: "Aucun compte trouvé avec cette adresse email",
        };
      }

      // 2. Vérifier si le compte est verrouillé
      if (user.locked_until) {
        const lockTime = new Date(user.locked_until);
        if (lockTime > new Date()) {
          return {
            success: false,
            error: `Compte temporairement verrouillé. Réessayez après ${lockTime.toLocaleTimeString()}`,
          };
        }
      }

      // 3. Authentification réussie (pas de vérification de mot de passe)
      this.currentUser = {
        uid: user.id,
        id: user.id || user.firebase_uid || user.id,
        email: user.email,
        role: user.role || "user",
        login_attempts: user.login_attempts || 0,
        locked_until: user.locked_until || null,
        name: user.name || "",
        firstName: user.firstName || "",
      };

      localStorage.setItem("user", JSON.stringify(this.currentUser));
      localStorage.setItem("authProvider", "firestore");

      // Réinitialiser les tentatives de connexion en cas de succès
      if (user.login_attempts > 0) {
        await this.resetLoginAttempts(user.id);
      }

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error("Erreur Firestore login:", error);
      return {
        success: false,
        error: "Erreur lors de la connexion",
      };
    }
  }

  // Inscription avec Firestore (sans mot de passe)
  async registerWithFirestore(email, userData = {}) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: "Cette adresse email est déjà utilisée",
        };
      }

      // Créer un ID unique
      const userId = this.generateUserId();

      // Créer le document utilisateur dans Firestore
      const userDoc = {
        id: userId,
        email: email,
        locked_until: null,
        login_attempts: 0,
        role: "user",
        createdAt: new Date().toISOString(),
        ...userData, // Inclure name, firstName, etc.
      };

      // Ajouter l'utilisateur à la collection users
      await setDoc(doc(db, "users", userId), userDoc);

      this.currentUser = {
        uid: userId,
        id: userId,
        email: email,
        role: "user",
        login_attempts: 0,
        locked_until: null,
        ...userData,
      };

      localStorage.setItem("user", JSON.stringify(this.currentUser));
      localStorage.setItem("authProvider", "firestore");

      return {
        success: true,
        user: this.currentUser,
      };
    } catch (error) {
      console.error("Erreur Firestore register:", error);
      return {
        success: false,
        error: "Erreur lors de l'inscription",
      };
    }
  }

  // Générer un ID utilisateur
  generateUserId() {
    return "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Réinitialiser les tentatives de connexion
  async resetLoginAttempts(userId) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        login_attempts: 0,
        locked_until: null,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation des tentatives:",
        error
      );
    }
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser() {
    // Essayer d'abord depuis la mémoire
    if (this.currentUser) {
      return this.currentUser;
    }

    // Vérifier localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        return this.currentUser;
      } catch (error) {
        console.error("Erreur lors de la lecture de l'utilisateur:", error);
        localStorage.removeItem("user");
        return null;
      }
    }

    return null;
  }

  // Connexion principale (juste par email)
  async login(email) {
    if (!email) {
      return {
        success: false,
        error: "Email requis",
      };
    }

    // Utiliser Firestore
    const firestoreResult = await this.loginWithFirestore(email);

    if (firestoreResult.success) {
      console.log("✅ Connexion réussie avec Firestore");
      return firestoreResult;
    }

    // Fallback API si disponible
    if (this.isApiEnabled()) {
      console.log("⚠️ Firestore login échoué, tentative avec API...");
      const apiResult = await this.loginWithAPI(email, "");

      if (apiResult.success) {
        console.log("✅ Connexion réussie avec API");
        return apiResult;
      }
    }

    return firestoreResult;
  }

  // Inscription principale
  async register(email, userData = {}) {
    if (!email) {
      return {
        success: false,
        error: "Email requis",
      };
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Adresse email invalide",
      };
    }

    const firestoreResult = await this.registerWithFirestore(email, userData);

    if (firestoreResult.success) {
      console.log("✅ Inscription réussie avec Firestore");
      return firestoreResult;
    }

    return firestoreResult;
  }

  // Déconnexion
  async logout() {
    try {
      this.currentUser = null;
      localStorage.removeItem("user");
      localStorage.removeItem("authProvider");

      console.log("✅ Déconnexion réussie");

      return {
        success: true,
      };
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);

      this.currentUser = null;
      localStorage.removeItem("user");
      localStorage.removeItem("authProvider");

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Reste des méthodes inchangées (adaptées)
  async loginWithAPI(email, password) {
    // Similaire mais sans mot de passe
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email,
          // Pas de mot de passe
        },
        {
          timeout: 5000,
        }
      );

      if (response.data.token) {
        this.currentUser = {
          uid: response.data.user?.id || response.data.userId,
          id: response.data.user?.id || response.data.userId,
          email: response.data.user?.email || email,
          role: response.data.user?.role || "user",
        };

        localStorage.setItem("user", JSON.stringify(this.currentUser));
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("authProvider", "api");
      }

      return {
        success: true,
        user: this.currentUser,
        token: response.data.token,
      };
    } catch (error) {
      const isNet = this.isNetworkError(error);
      return {
        success: false,
        error: isNet
          ? "API indisponible"
          : error.response?.data?.message || "Erreur de connexion",
      };
    }
  }

  // Dans authService.js, ajoutez :
  isMobilePlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  }

  // Modifiez la méthode login pour mieux gérer les erreurs
  async login(email) {
    if (!email) {
      return {
        success: false,
        error: "Email requis",
      };
    }

    // Debug info
    console.log("📱 Platform:", this.isMobilePlatform() ? "Mobile" : "Desktop");
    console.log("📧 Email:", email);

    try {
      // Essayer Firestore d'abord
      const firestoreResult = await this.loginWithFirestore(email);

      if (firestoreResult.success) {
        console.log("✅ Connexion réussie avec Firestore");
        return firestoreResult;
      }

      // Si mobile, on peut avoir des problèmes de réseau
      if (this.isMobilePlatform()) {
        console.log("📱 Mode mobile détecté - vérification réseau");

        // Vérifier la connectivité
        const isOnline = navigator.onLine;
        if (!isOnline) {
          return {
            success: false,
            error: "Pas de connexion internet. Vérifiez votre réseau.",
          };
        }
      }

      return {
        success: false,
        error: firestoreResult.error || "Email non reconnu",
      };
    } catch (error) {
      console.error("❌ Erreur de connexion:", error);
      return {
        success: false,
        error: this.isMobilePlatform()
          ? "Problème de connexion au serveur. Vérifiez votre réseau."
          : "Erreur lors de la connexion",
      };
    }
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }

  // Obtenir le rôle
  getUserRole() {
    return this.currentUser?.role || "user";
  }

  isManager() {
    return this.getUserRole() === "manager";
  }

  // Reste des méthodes utilitaires inchangées...
  getAuthProvider() {
    return localStorage.getItem("authProvider") || "unknown";
  }

  isApiEnabled() {
    try {
      const apiHost = new URL(API_URL).hostname;
      const isLocalApi = ["localhost", "127.0.0.1", "10.0.2.2"].includes(
        apiHost
      );
      const appHost = window?.location?.hostname;

      if (
        isLocalApi &&
        appHost &&
        !["localhost", "127.0.0.1"].includes(appHost)
      ) {
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
        String(error.message || "").includes("Network Error"))
    );
  }
}

export default new AuthService();
