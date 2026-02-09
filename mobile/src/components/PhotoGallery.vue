<template>
    <ion-modal :is-open="isOpen" @ionModalDidDismiss="handleClose">
      <ion-header>
        <ion-toolbar>
          <ion-title>Photos ({{ currentIndex + 1 }}/{{ photos.length }})</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="handleClose">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div v-if="photos.length > 0" class="gallery-container">
          <div class="photo-container">
            <img 
              :src="currentPhoto" 
              :alt="`Photo ${currentIndex + 1}`" 
              class="photo" 
            />
          </div>
          
          <div class="navigation-controls">
            <ion-button 
              :disabled="currentIndex === 0" 
              @click="prevPhoto"
              fill="clear"
            >
              <ion-icon :icon="chevronBackOutline" />
            </ion-button>
            
            <div class="thumbnails">
              <div 
                v-for="(photo, index) in photos" 
                :key="index"
                class="thumbnail"
                :class="{ active: index === currentIndex }"
                @click="goToPhoto(index)"
              >
                <img :src="photo" :alt="`Miniature ${index + 1}`" />
              </div>
            </div>
            
            <ion-button 
              :disabled="currentIndex === photos.length - 1" 
              @click="nextPhoto"
              fill="clear"
            >
              <ion-icon :icon="chevronForwardOutline" />
            </ion-button>
          </div>
        </div>
        <div v-else class="no-photos">
          <ion-icon :icon="imageOutline" size="large" />
          <p>Aucune photo disponible</p>
        </div>
      </ion-content>
    </ion-modal>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { 
    IonModal, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonContent 
  } from '@ionic/vue';
  import { 
    closeOutline, 
    chevronBackOutline, 
    chevronForwardOutline,
    imageOutline 
  } from 'ionicons/icons';
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    },
    photos: {
      type: Array,
      default: () => []
    },
    initialIndex: {
      type: Number,
      default: 0
    }
  });
  
  const emit = defineEmits(['close']);
  
  const currentIndex = ref(props.initialIndex);
  
  const currentPhoto = computed(() => {
    return props.photos[currentIndex.value] || '';
  });
  
  const handleClose = () => {
    emit('close');
  };
  
  const nextPhoto = () => {
    if (currentIndex.value < props.photos.length - 1) {
      currentIndex.value++;
    }
  };
  
  const prevPhoto = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  };
  
  const goToPhoto = (index) => {
    currentIndex.value = index;
  };
  
  // Réinitialiser l'index quand les photos changent
  watch(() => props.photos, () => {
    currentIndex.value = props.initialIndex;
  });
  
  watch(() => props.initialIndex, (newIndex) => {
    currentIndex.value = newIndex;
  });
  </script>
  
  <style scoped>
  .gallery-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .photo-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 16px;
    min-height: 0; /* Important pour flex */
  }
  
  .photo {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
  
  .navigation-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: rgba(var(--ion-color-light-rgb, 244, 245, 248), 0.5);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .thumbnails {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px 0;
    max-width: 70%;
  }
  
  .thumbnail {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.2s ease;
    border: 2px solid transparent;
  }
  
  .thumbnail:hover {
    opacity: 0.8;
  }
  
  .thumbnail.active {
    opacity: 1;
    border-color: var(--ion-color-primary, #3880ff);
  }
  
  .thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .no-photos {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--ion-color-medium, #92949c);
    gap: 16px;
  }
  
  .no-photos p {
    margin: 0;
    font-size: 1rem;
  }
  </style>