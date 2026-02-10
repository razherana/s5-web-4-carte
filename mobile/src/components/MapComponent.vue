<template>
  <div class="map-container" ref="mapContainer">
    <div v-if="!mapInitialized" class="map-loading">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Chargement de la carte...</p>
    </div>

    <!-- Photo Gallery Modal -->
    <photo-gallery
      :is-open="photoGalleryOpen"
      :photos="selectedPhotos"
      :initial-index="0"
      @close="photoGalleryOpen = false"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IonSpinner } from "@ionic/vue";
import PhotoGallery from "./PhotoGallery.vue";
import capacitorService from "@/services/capacitorService";
import imageService from "@/services/imageService";

export default {
  name: "MapComponent",
  components: {
    IonSpinner,
    PhotoGallery,
  },
  props: {
    reports: {
      type: Array,
      default: () => [],
    },
    canReport: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["add-report", "marker-clicked"],
  setup(props, { emit }) {
    const mapContainer = ref(null);
    const map = ref(null);
    const markers = ref([]);
    const tempMarker = ref(null);
    const mapInitialized = ref(false);
    const mapDestroyed = ref(false);
    const isUpdatingMarkers = ref(false);
    const updateToken = ref(0);

    // Pour la galerie photo
    const photoGalleryOpen = ref(false);
    const selectedPhotos = ref([]);

    const fixLeafletIcons = () => {
      if (typeof L !== "undefined" && L.Icon && L.Icon.Default) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }
    };

    const initMap = () => {
      if (mapDestroyed.value) return;
      if (!mapContainer.value || map.value) return;

      // Attendre que le DOM soit prêt
      nextTick(() => {
        setTimeout(() => {
          if (!mapContainer.value || mapDestroyed.value) return;

          const containerHeight = mapContainer.value.clientHeight;
          const containerWidth = mapContainer.value.clientWidth;

          if (containerHeight <= 0 || containerWidth <= 0) {
            setTimeout(initMap, 100);
            return;
          }

          try {
            fixLeafletIcons();
            const antananarivoCoords = [-18.8792, 47.5079];

            map.value = L.map(mapContainer.value, {
              renderer: L.canvas(),
              preferCanvas: true,
              zoomControl: true,
              attributionControl: true,
              zoomAnimation: false,
              fadeAnimation: false,
              markerZoomAnimation: false,
            }).setView(antananarivoCoords, 13);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "© OpenStreetMap contributors",
              maxZoom: 19,
              minZoom: 8,
            }).addTo(map.value);

            if (props.canReport) {
              map.value.on("click", handleMapClick);
            }

            mapInitialized.value = true;
            console.log("🗺️ Carte initialisée avec succès");
            
            // Initialiser les marqueurs après un court délai
            setTimeout(() => {
              if (map.value && !mapDestroyed.value) {
                updateMarkers();
              }
            }, 500);

            getCurrentLocation();
          } catch (error) {
            console.error("Erreur lors de la création de la carte:", error);
            mapInitialized.value = false;
          }
        }, 200);
      });
    };

    const getCurrentLocation = async () => {
      try {
        const location = await capacitorService.getCurrentPosition();

        if (location.success && map.value && !mapDestroyed.value) {
          const userCoords = [location.latitude, location.longitude];
          const blueIcon = L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            shadowSize: [41, 41],
          });

          L.marker(userCoords, { icon: blueIcon })
            .addTo(map.value)
            .bindPopup("Votre position")
            .openPopup();

          // Centrer la carte sur la position
          setTimeout(() => {
            if (map.value && !mapDestroyed.value) {
              map.value.setView(userCoords, 15, {
                animate: true,
                duration: 1,
              });
            }
          }, 1000);
        } else {
          console.log("Géolocalisation non disponible:", location.error);
        }
      } catch (error) {
        console.error("Erreur géolocalisation:", error);
      }
    };

    // Fonction pour charger les images d'un signalement
    const loadReportImages = async (reportId) => {
      try {
        const result = await imageService.getReportImages(reportId);
        if (result.success && result.images.length > 0) {
          return result.images.map((img) => img.data);
        }
      } catch (error) {
        console.error("Erreur chargement images:", error);
      }
      return [];
    };

    const updateMarkers = async () => {
      if (!map.value || !mapInitialized.value || mapDestroyed.value || isUpdatingMarkers.value) {
        console.log("Carte non prête pour la mise à jour des marqueurs");
        return;
      }

      isUpdatingMarkers.value = true;
      const token = ++updateToken.value;
      console.log("🔄 Mise à jour des marqueurs...");

      try {
        // Supprimer les anciens marqueurs
        markers.value.forEach((marker) => {
          if (marker && marker._map && map.value) {
            try {
              map.value.removeLayer(marker);
            } catch (e) {
              console.warn("Erreur suppression marqueur:", e);
            }
          }
        });
        markers.value = [];

        let addedCount = 0;
        const newMarkers = [];

        // Pour chaque signalement, charger les images
        for (const report of props.reports) {
          const lat = report.latitude || report.lat || report.Lat;
          const lng = report.longitude || report.lng || report.Lng;

          if (lat && lng) {
            try {
              if (!map.value || mapDestroyed.value || token !== updateToken.value) {
                console.log("Carte détruite ou mise à jour annulée");
                break;
              }

              const reportImages = await loadReportImages(report.id);

              if (!map.value || mapDestroyed.value || token !== updateToken.value) {
                console.log("Carte détruite ou mise à jour annulée");
                break;
              }

              const markerColor = getMarkerColor(report.status);
              const icon = L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl:
                  "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                shadowSize: [41, 41],
              });

              const popupContent = createPopupContent(report, reportImages);

              if (reportImages.length > 0) {
                window[`openPhotoGallery_${report.id}`] = () => {
                  openPhotoGallery(reportImages);
                };
              }

              if (!map.value) {
                console.warn("Carte indisponible au moment d'ajouter le marqueur");
                continue;
              }

              const marker = L.marker([lat, lng], { icon })
                .addTo(map.value)
                .bindPopup(popupContent, {
                  maxWidth: 300,
                  className: "custom-leaflet-popup",
                })
                .on("click", () => {
                  emit("marker-clicked", report);
                });

              newMarkers.push(marker);
              addedCount++;
              console.log(`Marqueur ajouté pour ${report.id}`);
            } catch (error) {
              console.error(`Erreur ajout marqueur ${report.id}:`, error);
            }
          } else {
            console.warn(`Signalement ${report.id} sans coordonnées`);
          }
        }

        markers.value = newMarkers;
        console.log(`${addedCount} marqueurs ajoutés sur ${props.reports.length} signalements`);
      } catch (error) {
        console.error("Erreur lors de la mise à jour des marqueurs:", error);
      } finally {
        isUpdatingMarkers.value = false;
      }
    };

    // Mettre à jour createPopupContent pour accepter les images
    const createPopupContent = (report, images = []) => {
      let content = `
    <div class="custom-popup">
      <strong class="popup-title">${report.title || "Signalement"}</strong>
  `;

      // Utiliser les images passées en paramètre, sinon utiliser report.photos
      const displayImages = images.length > 0 ? images : report.photos || [];

      // Ajouter les photos si présentes
      if (displayImages.length > 0) {
        content += `
      <div class="popup-photos">
    `;

        // Afficher jusqu'à 3 images
        const imagesToShow = displayImages.slice(0, 3);

        imagesToShow.forEach((img, index) => {
          content += `
        <img 
          src="${img}" 
          alt="Photo ${index + 1}"
          class="popup-photo"
          onclick="window.openPhotoGallery_${report.id}()"
        />
      `;
        });

        if (displayImages.length > 3) {
          content += `
        <div class="photo-count" onclick="window.openPhotoGallery_${
          report.id
        }()">
          +${displayImages.length - 3}
        </div>
      `;
        }

        content += `</div>`;
      }

      content += `
      <p class="popup-description">${
        report.description || "Aucune description"
      }</p>
      <div class="popup-info">
        <span class="popup-status status-${report.status}">${getStatusText(
        report.status
      )}</span>
        ${report.surface ? `<span>Surface: ${report.surface} m²</span>` : ""}
        ${
          report.budget
            ? `<span>Budget: ${report.budget.toLocaleString()} Ar</span>`
            : ""
        }
        <span>Type: ${report.problemType || "Non spécifié"}</span>
      </div>
    </div>
  `;

      return content;
    };

    const handleMapClick = (e) => {
      if (!map.value || mapDestroyed.value) return;

      map.value.stop();
      map.value.closePopup();

      const { lat, lng } = e.latlng;
      clearTempMarker();

      const redIcon = L.icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
      });

      tempMarker.value = L.marker([lat, lng], {
        icon: redIcon,
        draggable: true,
      })
        .addTo(map.value)
        .bindPopup("Nouveau signalement<br>Cliquez pour confirmer")
        .openPopup()
        .on("click", () => {
          emit("add-report", { lat, lng });
        });
    };

    const clearTempMarker = () => {
      if (tempMarker.value && map.value && !mapDestroyed.value) {
        if (tempMarker.value._map) {
          map.value.removeLayer(tempMarker.value);
        }
        tempMarker.value = null;
      }
    };

    /**
     * Ouvrir la galerie photo
     */
    const openPhotoGallery = (photos) => {
      selectedPhotos.value = photos;
      photoGalleryOpen.value = true;
    };

    const getMarkerColor = (status) => {
      switch (status) {
        case "new":
        case "nouveau":
          return "red";
        case "in_progress":
        case "en_cours":
          return "yellow";
        case "completed":
        case "termine":
          return "green";
        default:
          return "grey";
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case "new":
        case "nouveau":
          return "Nouveau";
        case "in_progress":
        case "en_cours":
          return "En cours";
        case "completed":
        case "termine":
          return "Terminé";
        default:
          return "Inconnu";
      }
    };

    const cleanupMap = () => {
      console.log("🧹 Nettoyage de la carte...");
      updateToken.value++;
      if (map.value) {
        try {
          map.value.off("click");

          markers.value.forEach((marker) => {
            if (marker && marker._map) {
              map.value.removeLayer(marker);
            }
          });
          markers.value = [];

          if (tempMarker.value && tempMarker.value._map) {
            map.value.removeLayer(tempMarker.value);
            tempMarker.value = null;
          }

          map.value.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
              map.value.removeLayer(layer);
            }
          });

          map.value.remove();
          map.value = null;

          mapDestroyed.value = true;
          mapInitialized.value = false;
          console.log("Carte nettoyée");
        } catch (error) {
          console.error("Erreur lors du nettoyage de la carte:", error);
        }
      }
    };

    onMounted(() => {
      console.log("🚀 Montage du composant MapComponent");
      setTimeout(initMap, 300);

      const resizeObserver = new ResizeObserver(() => {
        if (
          map.value &&
          mapInitialized.value &&
          !mapDestroyed.value &&
          !map.value._animatingZoom
        ) {
          setTimeout(() => {
            if (map.value && !map.value._animatingZoom) {
              map.value.invalidateSize({ animate: false });
            }
          }, 200);
        }
      });

      if (mapContainer.value) {
        resizeObserver.observe(mapContainer.value);
      }

      window.mapResizeObserver = resizeObserver;
    });

    onUnmounted(() => {
      console.log("🗑️ Démontage du composant MapComponent");
      if (window.mapResizeObserver && mapContainer.value) {
        window.mapResizeObserver.unobserve(mapContainer.value);
      }

      cleanupMap();
    });

    watch(
      () => props.reports,
      (newReports, oldReports) => {
        console.log("👀 Watch: Les signalements ont changé");
        console.log("Anciens signalements:", oldReports?.length || 0);
        console.log("Nouveaux signalements:", newReports?.length || 0);

        if (map.value && mapInitialized.value && !mapDestroyed.value) {
          updateMarkers();
        } else {
          console.log("Carte pas prête pour la mise à jour");
        }
      },
      { deep: true, immediate: false }
    );

    watch(
      () => props.canReport,
      (newVal) => {
        console.log("👀 Watch: canReport changé:", newVal);
        if (map.value && !mapDestroyed.value) {
          map.value.off("click");

          if (newVal) {
            map.value.on("click", handleMapClick);
          }
        }
      }
    );

    const stopMapAnimations = () => {
      if (map.value && !mapDestroyed.value) {
        map.value.stop();
        map.value.closePopup();
      }
    };

    return {
      mapContainer,
      clearTempMarker,
      mapInitialized,
      stopMapAnimations,
      photoGalleryOpen,
      selectedPhotos,
    };
  },
};
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  z-index: 1;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(14px);
  color: var(--app-text-primary);
  font-size: 0.95rem;
  z-index: 10;
}

.map-loading p {
  margin-top: 10px;
}

ion-spinner {
  --color: var(--ion-color-primary);
  width: 40px;
  height: 40px;
}
</style>

<style>
/* Styles globaux pour les popups Leaflet */
.custom-leaflet-popup .leaflet-popup-content-wrapper {
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
}

.custom-popup {
  padding: 16px;
}

.popup-title {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.popup-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 12px;
  position: relative;
}

.popup-photo {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.popup-photo:hover {
  transform: scale(1.05);
}

.photo-count {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.popup-description {
  font-size: 0.9rem;
  color: #475569;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.popup-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #64748b;
}

.popup-status {
  font-weight: 600;
  color: #2563eb;
}
</style>