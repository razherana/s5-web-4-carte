import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

const MapComponent = ({ reports, onReportClick, readOnly = false, canAddReport = false, onAddReport }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);

  // Status colors and icons
  const getMarkerColor = (status) => {
    switch (status) {
      case 'new':
        return '#3b82f6'; // blue
      case 'in_progress':
        return '#f59e0b'; // orange
      case 'completed':
        return '#10b981'; // green
      default:
        return '#6366f1'; // default purple
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const createCustomIcon = (status) => {
    const color = getMarkerColor(status);
    const svgIcon = `
      <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26c0-8.837-7.163-16-16-16z" 
              fill="${color}" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42],
    });
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map centered on Antananarivo
    mapInstance.current = L.map(mapRef.current, {
      center: [-18.8792, 47.5079],
      zoom: 13,
      zoomControl: true,
    });

    // Use tile server from Docker (offline OpenStreetMap)
    const tileServerUrl = import.meta.env.VITE_TILE_SERVER_URL || 'http://localhost:8080';
    L.tileLayer(`${tileServerUrl}/tile/{z}/{x}/{y}.png`, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 10,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const clearTempMarker = () => {
    if (tempMarkerRef.current && mapInstance.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  };

  const createTempMarkerIcon = () => {
    return L.icon({
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: [41, 41],
    });
  };

  const handleMapClick = (event) => {
    if (!mapInstance.current || !canAddReport) return;

    const { lat, lng } = event.latlng;
    clearTempMarker();

    tempMarkerRef.current = L.marker([lat, lng], {
      icon: createTempMarkerIcon(),
      draggable: true,
    })
      .addTo(mapInstance.current)
      .bindPopup('Nouveau signalement<br/>Cliquez sur le marqueur pour confirmer')
      .openPopup()
      .on('click', () => {
        const currentPosition = tempMarkerRef.current?.getLatLng();
        if (onAddReport) {
          onAddReport({
            lat: currentPosition?.lat ?? lat,
            lng: currentPosition?.lng ?? lng,
          });
        }
        clearTempMarker();
      });
  };

  useEffect(() => {
    if (!mapInstance.current) return;

    mapInstance.current.off('click', handleMapClick);

    if (canAddReport) {
      mapInstance.current.on('click', handleMapClick);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.off('click', handleMapClick);
      }
    };
  }, [canAddReport, onAddReport]);

  useEffect(() => {
    if (!mapInstance.current || !reports) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      const latitude = report.latitude ?? report.lat;
      const longitude = report.longitude ?? report.lng;

      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude], {
          icon: createCustomIcon(report.status),
        });

        // Create popup content
        const popupContent = `
          <div class="map-popup">
            <h3 class="popup-title">Report #${report.id}</h3>
            <div class="popup-content">
              <div class="popup-row">
                <span class="popup-label">Status:</span>
                <span class="status-badge status-${report.status}">${getStatusLabel(report.status)}</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Date:</span>
                <span>${new Date(report.created_at || report.date).toLocaleDateString()}</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Surface:</span>
                <span>${report.surface || 0} m²</span>
              </div>
              <div class="popup-row">
                <span class="popup-label">Budget:</span>
                <span>${parseFloat(report.budget || 0).toLocaleString()} Ar</span>
              </div>
              ${report.entreprise_id ? `
                <div class="popup-row">
                  <span class="popup-label">Company:</span>
                  <span>${report.entreprise_id}</span>
                </div>
              ` : ''}
              ${report.description ? `
                <div class="popup-row">
                  <span class="popup-label">Description:</span>
                  <span class="popup-description">${report.description}</span>
                </div>
              ` : ''}
            </div>
            ${!readOnly ? `
              <button class="popup-edit-btn" onclick="window.editReport(${report.id})">
                Edit Report
              </button>
            ` : ''}
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: 'custom-popup',
        });

        if (onReportClick) {
          marker.on('click', () => onReportClick(report));
        }

        marker.addTo(mapInstance.current);
        markersRef.current.push(marker);
      }
    });
  }, [reports, readOnly, onReportClick]);

  // Make edit function available globally for popup
  useEffect(() => {
    window.editReport = (reportId) => {
      if (onReportClick) {
        const report = reports.find(r => r.id === reportId);
        if (report) onReportClick(report);
      }
    };

    return () => {
      delete window.editReport;
    };
  }, [reports, onReportClick]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-container" />
    </div>
  );
};

export default MapComponent;
