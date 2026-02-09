// src/services/imageService.js
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

class ImageService {
  constructor() {
    this.maxImageSize = 5 * 1024 * 1024; // 5MB
    this.maxBase64Size = 1000000; // 1MB pour Firestore
  }

  // Convertir File/Blob en Base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Compresser une image
  async compressImage(file, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en blob compressé
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = url;
    });
  }

  // Stocker une image dans la collection 'images'
  async storeImage(imageData, reportId, userId, index = 0) {
    try {
      // Valider la taille
      if (imageData.size > this.maxImageSize) {
        throw new Error(`Image trop grande (max ${this.maxImageSize / 1024 / 1024}MB)`);
      }

      // Compresser l'image
      const compressedBlob = await this.compressImage(imageData);
      
      // Convertir en Base64 pour Firestore
      const base64Data = await this.fileToBase64(compressedBlob);
      
      // Vérifier si la taille Base64 est acceptable
      if (base64Data.length > this.maxBase64Size) {
        throw new Error('Image trop grande pour Firestore (max 1MB)');
      }

      // Créer un document dans la collection 'images'
      const imageDoc = {
        reporting_id: reportId,
        user_id: userId,
        image_data: base64Data,
        image_size: compressedBlob.size,
        created_at: new Date(),
        image_index: index,
        mime_type: compressedBlob.type
      };

      const docRef = await addDoc(collection(db, 'images'), imageDoc);
      
      console.log(`✅ Image ${index} sauvegardée pour le signalement ${reportId}`);
      
      return {
        success: true,
        imageId: docRef.id,
        data: base64Data,
        size: compressedBlob.size
      };
    } catch (error) {
      console.error('❌ Erreur sauvegarde image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Récupérer toutes les images d'un signalement
  async getReportImages(reportId) {
    try {
      console.log(`🔍 Récupération des images pour le signalement: ${reportId}`);
      
      const q = query(
        collection(db, 'images'),
        where('reporting_id', '==', reportId)
      );
      
      const querySnapshot = await getDocs(q);
      const images = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📄 Document trouvé pour image:`, doc.id, data);
        
        if (data.image_data) {
          images.push({
            id: doc.id,
            data: data.image_data,
            size: data.image_size,
            created_at: data.created_at?.toDate() || new Date(),
            index: data.image_index || 0
          });
        }
      });
      
      // Trier par index
      images.sort((a, b) => a.index - b.index);
      
      console.log(`📸 ${images.length} image(s) récupérée(s) pour le signalement ${reportId}`);
      
      return {
        success: true,
        images: images
      };
    } catch (error) {
      console.error('❌ Erreur récupération images:', error);
      return {
        success: false,
        error: error.message,
        images: []
      };
    }
  }

  // Sauvegarder plusieurs images pour un signalement
  async saveMultipleImages(files, reportId, userId) {
    try {
      console.log(`💾 Sauvegarde de ${files.length} image(s) pour le signalement ${reportId}`);
      
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const result = await this.storeImage(files[i], reportId, userId, i);
        results.push(result);
      }
      
      const successful = results.filter(r => r.success).length;
      
      console.log(`✅ ${successful}/${files.length} image(s) sauvegardée(s) avec succès`);
      
      return {
        success: true,
        results: results,
        total: files.length,
        successful: successful
      };
    } catch (error) {
      console.error('❌ Erreur sauvegarde multiple images:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new ImageService();