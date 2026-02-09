// IMPORTANT: Ce fichier doit utiliser la syntaxe ES5 (pas d'import ES6)
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD0Tms7mzZP0hMxQghg3xnSQOgATluQXrc",
  authDomain: "route-project-c44ce.firebaseapp.com",
  projectId: "route-project-c44ce",
  storageBucket: "route-project-c44ce.firebasestorage.app",
  messagingSenderId: "875716847528",
  appId: "1:875716847528:web:be0569614612a76b419f9d",
  measurementId: "G-WDWP5R1DW8"
});

const messaging = firebase.messaging();

// Gestionnaire de background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Message reçu en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/icon/favicon.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});