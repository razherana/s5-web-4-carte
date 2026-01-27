<template>
  <div class="map-container" ref="mapContainer">
    <div v-if="!mapInitialized" class="map-loading">
      <ion-spinner name="crescent"></ion-spinner>
      <p>Chargement de la carte...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IonSpinner } from "@ionic/vue";

export default {
  name: "MapComponent",
  components: {
    IonSpinner,
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

    // Correction des icônes Leaflet une seule fois
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
      // Ne pas initialiser si déjà détruit
      if (mapDestroyed.value) return;

      if (!mapContainer.value || map.value) return;

      // Attendre que le conteneur ait une taille
      setTimeout(() => {
        if (!mapContainer.value || mapDestroyed.value) return;

        const containerHeight = mapContainer.value.clientHeight;
        const containerWidth = mapContainer.value.clientWidth;

        if (containerHeight <= 0 || containerWidth <= 0) {
          // Réessayer plus tard si le conteneur n'a pas encore de taille
          setTimeout(initMap, 100);
          return;
        }

        try {
          // Corriger les icônes
          fixLeafletIcons();

          // Centre sur Antananarivo
          const antananarivoCoords = [-18.8792, 47.5079];

          // Créer la carte avec des options de rendu
          map.value = L.map(mapContainer.value, {
            renderer: L.canvas(),
            preferCanvas: true,
            zoomControl: true,
            attributionControl: true,
            zoomAnimation: false,
            fadeAnimation: false,
            markerZoomAnimation: false,
          }).setView(antananarivoCoords, 13);

          // Utiliser OpenStreetMap
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
            minZoom: 8,
          }).addTo(map.value);

          // Si on peut signaler, activer le clic sur la carte
          if (props.canReport) {
            map.value.on("click", handleMapClick);
          }

          // Géolocalisation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                if (!map.value || mapDestroyed.value) return;

                const userCoords = [
                  position.coords.latitude,
                  position.coords.longitude,
                ];

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

                // Centrer doucement sur la position
                setTimeout(() => {
                  if (map.value) {
                    map.value.setView(userCoords, 15, {
                      animate: true,
                      duration: 1,
                    });
                  }
                }, 1000);
              },
              (error) => {
                console.log("Géolocalisation non disponible:", error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          }

          mapInitialized.value = true;
          console.log('🗺️ Carte initialisée');
          updateMarkers();
        } catch (error) {
          console.error("Erreur lors de la création de la carte:", error);
          mapInitialized.value = false;
        }
      }, 200);
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

    const updateMarkers = () => {
      if (!map.value || !mapInitialized.value || mapDestroyed.value) {
        console.log('⚠️ Impossible de mettre à jour les marqueurs - carte non prête');
        return;
      }

      console.log('🔄 Mise à jour des marqueurs');
      console.log('Nombre de signalements à afficher:', props.reports.length);

      // Supprimer les anciens marqueurs
      markers.value.forEach((marker) => {
        if (marker && map.value) {
          try {
            map.value.removeLayer(marker);
          } catch (e) {
            console.warn('Erreur lors de la suppression du marqueur:', e);
          }
        }
      });
      markers.value = [];

      // Ajouter les nouveaux marqueurs
      let addedCount = 0;
      props.reports.forEach((report, index) => {
        console.log(`Signalement ${index}:`, {
          id: report.id,
          title: report.title,
          latitude: report.latitude,
          longitude: report.longitude,
          lat: report.lat,
          lng: report.lng
        });

        // Vérifier à la fois latitude/longitude et lat/lng
        const lat = report.latitude || report.lat;
        const lng = report.longitude || report.lng;

        if (lat && lng) {
          try {
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

            const marker = L.marker([lat, lng], { icon })
              .addTo(map.value)
              .bindPopup(
                `
                  <strong>${report.title || "Signalement"}</strong><br>
                  ${report.description ? `<em>${report.description}</em><br>` : ""}
                  Statut: ${getStatusText(report.status)}<br>
                  ${report.surface ? `Surface: ${report.surface} m²<br>` : ""}
                  ${report.budget ? `Budget: ${report.budget} Ar<br>` : ""}
                  Type: ${report.problemType || "Non spécifié"}
                `
              )
              .on("click", () => {
                emit("marker-clicked", report);
              });

            markers.value.push(marker);
            addedCount++;
            console.log(`✅ Marqueur ajouté pour le signalement ${report.id}`);
          } catch (error) {
            console.error(`❌ Erreur lors de l'ajout du marqueur ${report.id}:`, error);
          }
        } else {
          console.warn(`⚠️ Signalement ${report.id} sans coordonnées valides`);
        }
      });

      console.log(`✅ ${addedCount} marqueurs ajoutés sur ${props.reports.length} signalements`);
    };

    const getMarkerColor = (status) => {
      switch (status) {
        case "new":
          return "red";
        case "in_progress":
          return "yellow";
        case "completed":
          return "green";
        default:
          return "grey";
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case "new":
          return "Nouveau";
        case "in_progress":
          return "En cours";
        case "completed":
          return "Terminé";
        default:
          return "Inconnu";
      }
    };

    const cleanupMap = () => {
      if (map.value) {
        try {
          // Désactiver les événements
          map.value.off("click");

          // Supprimer tous les marqueurs
          markers.value.forEach((marker) => {
            if (marker) {
              map.value.removeLayer(marker);
            }
          });
          markers.value = [];

          if (tempMarker.value) {
            map.value.removeLayer(tempMarker.value);
            tempMarker.value = null;
          }

          // Supprimer toutes les couches
          map.value.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
              map.value.removeLayer(layer);
            }
          });

          // Supprimer la carte
          map.value.remove();
          map.value = null;

          mapDestroyed.value = true;
          mapInitialized.value = false;
        } catch (error) {
          console.error("Erreur lors du nettoyage de la carte:", error);
        }
      }
    };

    onMounted(() => {
      // Initialiser la carte après le montage
      setTimeout(initMap, 300);

      // Réinitialiser la carte si la taille du conteneur change
      const resizeObserver = new ResizeObserver(() => {
        if (
          map.value &&
          mapInitialized.value &&
          !mapDestroyed.value &&
          !map.value._animatingZoom
        ) {
          // Attendre un peu pour éviter les recalculs trop fréquents
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

      // Stocker l'observateur pour le nettoyer plus tard
      window.mapResizeObserver = resizeObserver;
    });

    onUnmounted(() => {
      // Nettoyer l'observateur de redimensionnement
      if (window.mapResizeObserver && mapContainer.value) {
        window.mapResizeObserver.unobserve(mapContainer.value);
      }

      // Nettoyer la carte
      cleanupMap();
    });

    watch(
      () => props.reports,
      (newReports, oldReports) => {
        console.log('👀 Watch: Les signalements ont changé');
        console.log('Anciens signalements:', oldReports?.length || 0);
        console.log('Nouveaux signalements:', newReports?.length || 0);
        
        if (map.value && mapInitialized.value && !mapDestroyed.value) {
          updateMarkers();
        } else {
          console.log('⚠️ Carte pas prête pour la mise à jour');
        }
      },
      { deep: true, immediate: false }
    );

    watch(
      () => props.canReport,
      (newVal) => {
        console.log('👀 Watch: canReport changé:', newVal);
        if (map.value && !mapDestroyed.value) {
          // Retirer l'ancien gestionnaire d'événements
          map.value.off("click");

          // Ajouter le nouveau gestionnaire si canReport est true
          if (props.canReport) {
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
