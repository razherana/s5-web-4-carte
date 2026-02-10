// src/services/reportService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';

class ReportService {
  constructor() {
    this.collectionName = 'reporting';
  }

  // Créer un nouveau signalement
  async createReport(reportData) {
    try {
      console.log('Données reçues pour création:', reportData);
      
      // Valider les données - CORRIGÉ
      if (!reportData.description || !reportData.problem_type) {
        throw new Error('Description et type de problème sont obligatoires');
      }

      if (!reportData.user_id) {
        throw new Error('Utilisateur non identifié');
      }

      // Préparer les données pour Firestore
      const dataToSave = {
        description: reportData.description,
        problem_type: reportData.problem_type,
        lat: reportData.lat || reportData.location?.lat || 0,
        lng: reportData.lng || reportData.location?.lng || 0,
        surface: reportData.surface || null,
        budget: reportData.budget || null,
        entreprise_id: reportData.entreprise_id || reportData.company || null,
        user_id: reportData.user_id,
        user_email: reportData.user_email || null,
        reporting_date: Timestamp.now(),
        status: reportData.status || 'nouveau'
      };

      console.log('Données à sauvegarder:', dataToSave);

      const docRef = await addDoc(collection(db, this.collectionName), dataToSave);
      
      console.log('Document créé avec ID:', docRef.id);
      
      return {
        success: true,
        id: docRef.id,
        message: 'Signalement créé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la création du signalement:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création'
      };
    }
  }

  // Récupérer tous les signalements
  async getAllReports() {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('reporting_date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reportingDate = data.reporting_date?.toDate() || new Date();
        
        reports.push({
          id: doc.id,
          title: `Signalement - ${data.problem_type || 'Problème routier'}`,
          description: data.description,
          problemType: data.problem_type,
          latitude: data.lat,
          longitude: data.lng,
          surface: data.surface,
          budget: data.budget,
          company: data.entreprise_id,
          userId: data.user_id,
          status: data.status || 'nouveau',
          createdAt: reportingDate,
          reporting_date: data.reporting_date,
          // Ajout pour compatibilité avec MapComponent
          status: data.status || 'new',
          surface: data.surface,
          budget: data.budget
        });
      });
      
      console.log(`${reports.length} signalements récupérés`);
      
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Récupérer les signalements d'un utilisateur spécifique
  async getUserReports(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // Créer l'index composite si ce n'est pas fait
      const q = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId),
        orderBy('reporting_date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const reportingDate = data.reporting_date?.toDate() || new Date();
        
        reports.push({
          id: doc.id,
          title: `Signalement - ${data.problem_type || 'Problème routier'}`,
          description: data.description,
          problemType: data.problem_type,
          latitude: data.lat,
          longitude: data.lng,
          surface: data.surface,
          budget: data.budget,
          company: data.entreprise_id,
          userId: data.user_id,
          status: data.status || 'nouveau',
          createdAt: reportingDate
        });
      });
      
      console.log(`${reports.length} signalements trouvés pour l'utilisateur ${userId}`);
      
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des signalements utilisateur:', error);
      // Si l'erreur est liée à l'index, proposer une solution alternative
      if (error.code === 'failed-precondition') {
        console.warn('Index manquant. Utilisation d\'une requête simplifiée...');
        return this.getUserReportsWithoutIndex(userId);
      }
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Méthode alternative sans index composite
  async getUserReportsWithoutIndex(userId) {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('user_id', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          title: `Signalement - ${data.problem_type || 'Problème routier'}`,
          description: data.description,
          problemType: data.problem_type,
          latitude: data.lat,
          longitude: data.lng,
          surface: data.surface,
          budget: data.budget,
          company: data.entreprise_id,
          userId: data.user_id,
          status: data.status || 'nouveau',
          createdAt: data.reporting_date?.toDate() || new Date()
        });
      });
      
      // Trier manuellement par date
      reports.sort((a, b) => b.createdAt - a.createdAt);
      
      return {
        success: true,
        data: reports
      };
    } catch (error) {
      console.error('Erreur dans la méthode alternative:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Les autres méthodes restent inchangées...
  // Supprimer un signalement
  async deleteReport(reportId) {
    try {
      if (!reportId) {
        throw new Error('ID du signalement requis');
      }

      await deleteDoc(doc(db, this.collectionName, reportId));
      
      console.log('Signalement supprimé:', reportId);
      
      return {
        success: true,
        message: 'Signalement supprimé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mettre à jour un signalement
  async updateReport(reportId, updates) {
    try {
      if (!reportId) {
        throw new Error('ID du signalement requis');
      }

      const docRef = doc(db, this.collectionName, reportId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      
      console.log('Signalement mis à jour:', reportId);
      
      return {
        success: true,
        message: 'Signalement mis à jour avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculer les statistiques
  calculateStats(reports) {
    const defaultStats = {
      totalReports: 0,
      totalSurface: 0,
      totalBudget: 0,
      progress: 0,
      statusCounts: {
        nouveau: 0,
        en_cours: 0,
        termine: 0
      }
    };

    if (!reports || !Array.isArray(reports)) {
      return defaultStats;
    }

    const stats = { ...defaultStats };
    
    reports.forEach(report => {
      stats.totalReports++;
      stats.totalSurface += parseFloat(report.surface) || 0;
      stats.totalBudget += parseFloat(report.budget) || 0;
      
      const status = report.status?.toLowerCase() || 'nouveau';
      
      if (status.includes('nouveau') || status === 'new') {
        stats.statusCounts.nouveau++;
      } else if (status.includes('cours') || status.includes('progress')) {
        stats.statusCounts.en_cours++;
      } else if (status.includes('termine') || status.includes('complete')) {
        stats.statusCounts.termine++;
      } else {
        stats.statusCounts.nouveau++;
      }
    });

    const completedCount = stats.statusCounts.termine || 0;
    stats.progress = stats.totalReports > 0 
      ? Math.round((completedCount / stats.totalReports) * 100) 
      : 0;

    return stats;
  }
}

export default new ReportService();