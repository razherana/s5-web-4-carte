import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'road.project',
  appName: 'Travaux Routiers',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // Pour la géolocalisation
    Geolocation: {
      permissions: {
        android: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
        ios: ['LOCATION_WHEN_IN_USE']
      },
      displayLocationPermissionRationale: {
        android: {
          title: 'Localisation requise',
          message: "Cette application a besoin d'accéder à votre localisation pour afficher les signalements autour de vous."
        }
      }
    },
    
    // Pour la caméra et les photos
    Camera: {
      androidPermissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ],
      iosPermissions: [
        'NSCameraUsageDescription',
        'NSPhotoLibraryUsageDescription',
        'NSPhotoLibraryAddUsageDescription'
      ]
    },
    
    // Pour la galerie de photos
    Photos: {
      iosPermissions: ['NSPhotoLibraryUsageDescription'],
      androidPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ]
    },
    
    // Pour les notifications push
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    
    // Pour les permissions de stockage
    Filesystem: {
      iosPermissions: ['NSDocumentsFolderUsageDescription'],
      androidPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ]
    }
  }
};

export default config;