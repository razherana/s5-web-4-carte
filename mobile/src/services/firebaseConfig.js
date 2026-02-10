// src/services/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from 'firebase/messaging';

// Configuration Firebase (remplacer avec vos propres clés)
const firebaseConfig = {
    apiKey: "AIzaSyD0Tms7mzZP0hMxQghg3xnSQOgATluQXrc",
    authDomain: "route-project-c44ce.firebaseapp.com",
    projectId: "route-project-c44ce",
    storageBucket: "route-project-c44ce.firebasestorage.app",
    messagingSenderId: "875716847528",
    appId: "1:875716847528:web:be0569614612a76b419f9d",
    measurementId: "G-WDWP5R1DW8"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialiser les services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export default app;