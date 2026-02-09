import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Filesystem, Directory } from '@capacitor/filesystem';

class CapacitorService {
  constructor() {
    // this.isNative = window.Capacitor && window.Capacitor.isNativePlatform;
    this.isNative = false;
  }

  // Vérifier si on est sur une plateforme native
  isNativePlatform() {
    // return this.isNative;
    return false;
  }

  // === CAMERA ===
  async takePhoto() {
    try {
      if (this.isNative) {
        // Utiliser Capacitor Camera
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera
        });

        return {
          success: true,
          dataUrl: image.dataUrl,
          format: image.format,
          saved: false
        };
      } else {
        // Fallback HTML5
        return this.takePhotoHTML5();
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  takePhotoHTML5() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Pour utiliser la caméra arrière si disponible
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve({ success: false, error: 'Aucun fichier sélectionné' });
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            success: true,
            dataUrl: event.target.result,
            file: file,
            saved: false
          });
        };
        reader.onerror = () => resolve({ success: false, error: 'Erreur lecture fichier' });
        reader.readAsDataURL(file);
      };
      
      input.oncancel = () => resolve({ success: false, error: 'Annulé par l\'utilisateur' });
      
      input.click();
    });
  }

  // === GALERIE PHOTOS (SIMPLE) ===
  async pickPhotoFromGallery() {
    try {
      if (this.isNative) {
        // Utiliser Capacitor Camera avec source Photos
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos // ← Galerie de photos
        });

        return {
          success: true,
          dataUrl: image.dataUrl,
          format: image.format,
          saved: false
        };
      } else {
        // Fallback HTML5 pour une seule photo
        return this.pickPhotoFromGalleryHTML5();
      }
    } catch (error) {
      console.error('Erreur sélection photo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // === GALERIE PHOTOS MULTIPLES ===
  async pickMultiplePhotos(maxCount = 5) {
    try {
      // Capacitor Camera ne supporte pas nativement la sélection multiple
      // On utilise toujours le fallback HTML5
      return await this.pickMultiplePhotosHTML5(maxCount);
    } catch (error) {
      console.error('Erreur sélection photos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  pickPhotoFromGalleryHTML5() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve({ success: false, error: 'Aucun fichier sélectionné' });
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            success: true,
            dataUrl: event.target.result,
            file: file,
            saved: false
          });
        };
        reader.onerror = () => resolve({ success: false, error: 'Erreur lecture fichier' });
        reader.readAsDataURL(file);
      };
      
      input.oncancel = () => resolve({ success: false, error: 'Annulé par l\'utilisateur' });
      
      input.click();
    });
  }

  pickMultiplePhotosHTML5(maxCount) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      
      input.onchange = async (e) => {
        const files = Array.from(e.target.files || []);
        const photosToProcess = files.slice(0, maxCount);
        const results = [];

        for (const file of photosToProcess) {
          const dataUrl = await this.fileToDataURL(file);
          results.push({
            dataUrl: dataUrl,
            file: file,
            name: file.name
          });
        }

        resolve({
          success: true,
          photos: results,
          count: results.length
        });
      };
      
      input.oncancel = () => resolve({ success: false, error: 'Annulé par l\'utilisateur' });
      
      input.click();
    });
  }

  // === GÉOLOCALISATION ===
  async getCurrentPosition() {
    try {
      if (this.isNative) {
        // Utiliser Capacitor Geolocation
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        return {
          success: true,
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
          accuracy: coordinates.coords.accuracy,
          source: 'capacitor'
        };
      } else {
        // Fallback HTML5 Geolocation
        return this.getCurrentPositionHTML5();
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getCurrentPositionHTML5() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ success: false, error: 'Géolocalisation non supportée' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            success: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'html5'
          });
        },
        (error) => {
          resolve({
            success: false,
            error: this.getGeolocationError(error.code)
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  // === NOTIFICATIONS PUSH ===
  async setupPushNotifications() {
    try {
      if (!this.isNative) {
        console.log('Notifications push non disponibles sur web');
        return { success: false, error: 'Non disponible sur web' };
      }

      // Demander la permission
      let permission = await PushNotifications.checkPermissions();
      
      if (permission.receive !== 'granted') {
        permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
          return { success: false, error: 'Permission refusée' };
        }
      }

      // S'inscrire aux notifications
      await PushNotifications.register();

      // Écouter l'inscription
      PushNotifications.addListener('registration', (token) => {
        console.log('Token push enregistré:', token.value);
        localStorage.setItem('pushToken', token.value);
      });

      // Écouter les erreurs
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Erreur enregistrement push:', error);
      });

      // Écouter les notifications reçues
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notification reçue:', notification);
        this.handlePushNotification(notification);
      });

      // Écouter les clics sur les notifications
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Notification cliquée:', notification);
        this.handleNotificationClick(notification);
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur configuration push:', error);
      return { success: false, error: error.message };
    }
  }

  // === FICHIERS ===
  async saveImageToDevice(blob, filename) {
    try {
      if (this.isNative) {
        // Convertir blob en base64
        const base64 = await this.blobToBase64(blob);
        const data = base64.split(',')[1]; // Enlever le prefix data:image/jpeg;base64,
        
        await Filesystem.writeFile({
          path: `RoadWatch/${filename}`,
          data: data,
          directory: Directory.Data,
          recursive: true
        });

        return { success: true, message: 'Image sauvegardée' };
      } else {
        // Fallback web
        return this.saveImageToDeviceWeb(blob, filename);
      }
    } catch (error) {
      console.error('Erreur sauvegarde image:', error);
      return { success: false, error: error.message };
    }
  }

  saveImageToDeviceWeb(blob, filename) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      resolve({ success: true, message: 'Téléchargement démarré' });
    });
  }

  // === MÉTHODES UTILITAIRES ===
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  blobToBase64(blob) {
    return this.blobToDataURL(blob);
  }

  getGeolocationError(code) {
    switch(code) {
      case 1: return 'Permission refusée';
      case 2: return 'Position indisponible';
      case 3: return 'Timeout';
      default: return 'Erreur inconnue';
    }
  }

  handlePushNotification(notification) {
    // Afficher la notification localement
    if (notification.title && notification.body) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/assets/icon/favicon.png'
        });
      }
    }
  }

  handleNotificationClick(notification) {
    // Rediriger selon le type de notification
    const data = notification.notification?.data || {};
    
    if (data.reportId) {
      window.location.href = `/my-reports#${data.reportId}`;
    } else if (data.type === 'status_change') {
      window.location.href = '/my-reports';
    } else {
      window.location.href = '/map';
    }
  }
}

export default new CapacitorService();