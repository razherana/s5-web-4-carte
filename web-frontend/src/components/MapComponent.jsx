import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  X,
  CalendarDays,
  MapPin,
  Ruler,
  Wallet,
  Building2,
  User,
  Pencil,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Trash2,
  CircleDot,
} from "lucide-react";
import { createPortal } from "react-dom";
import "./MapComponent.css";

/* ── Sync helpers ────────────────────────────────────────── */
const SYNC_META = {
  synced: { color: "#10b981", label: "Synchronisé", Icon: CheckCircle2 },
  created: { color: "#3b82f6", label: "Créé (non sync.)", Icon: PlusCircle },
  updated: { color: "#f59e0b", label: "Modifié (non sync.)", Icon: RefreshCw },
  deleted: { color: "#ef4444", label: "Supprimé (en attente)", Icon: Trash2 },
};

const getSyncMeta = (synced) =>
  SYNC_META[synced] ?? {
    color: "#6366f1",
    label: synced ?? "—",
    Icon: CircleDot,
  };

/* ── Detail row component ───────────────────────────────── */
// eslint-disable-next-line no-unused-vars
const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="detail-card">
    <div className="detail-card-icon">
      <Icon size={16} strokeWidth={2} />
    </div>
    <div className="detail-card-text">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  </div>
);

const createMarkerIcon = (synced) => {
  const { color } = getSyncMeta(synced);
  const svg = `
    <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${color}" flood-opacity=".35"/>
        </filter>
      </defs>
      <path d="M18 1C9.163 1 2 8.163 2 17c0 12.5 16 27 16 27s16-14.5 16-27C34 8.163 26.837 1 18 1z"
            fill="${color}" stroke="#fff" stroke-width="2.5" filter="url(#s)"/>
      <circle cx="18" cy="17" r="6.5" fill="#fff" opacity=".95"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    tooltipAnchor: [0, -46],
  });
};

/* ── Component ───────────────────────────────────────────── */
const MapComponent = ({
  reports,
  onReportClick,
  readOnly = false,
  canAddReport = false,
  onAddReport,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);
  const [selectedReport, setSelectedReport] = useState(null);

  /* ── Map init ─────────────────────────────────────────── */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    mapInstance.current = L.map(mapRef.current, {
      center: [-18.8792, 47.5079],
      zoom: 13,
      zoomControl: true,
    });
    const tileServerUrl =
      import.meta.env.VITE_TILE_SERVER_URL || "http://localhost:8080";
    L.tileLayer(`${tileServerUrl}/tile/{z}/{x}/{y}.png`, {
      attribution: "&copy; OpenStreetMap contributors",
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

  /* ── Temp marker (add-report) ─────────────────────────── */
  const clearTempMarker = () => {
    if (tempMarkerRef.current && mapInstance.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  };

  const createTempMarkerIcon = () =>
    L.icon({
      iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      shadowSize: [41, 41],
    });

  const handleMapClick = useCallback(
    (event) => {
      if (!mapInstance.current || !canAddReport) return;
      const { lat, lng } = event.latlng;
      clearTempMarker();
      tempMarkerRef.current = L.marker([lat, lng], {
        icon: createTempMarkerIcon(),
        draggable: true,
      })
        .addTo(mapInstance.current)
        .bindPopup(
          "Nouveau signalement<br/>Cliquez sur le marqueur pour confirmer",
        )
        .openPopup()
        .on("click", () => {
          const pos = tempMarkerRef.current?.getLatLng();
          if (onAddReport)
            onAddReport({ lat: pos?.lat ?? lat, lng: pos?.lng ?? lng });
          clearTempMarker();
        });
    },
    [canAddReport, onAddReport],
  );

  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.off("click", handleMapClick);
    if (canAddReport) mapInstance.current.on("click", handleMapClick);
    return () => mapInstance.current?.off("click", handleMapClick);
  }, [canAddReport, handleMapClick]);

  /* ── Report markers ───────────────────────────────────── */
  useEffect(() => {
    if (!mapInstance.current || !reports) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    reports.forEach((report) => {
      const lat = report.lat ?? report.latitude;
      const lng = report.lng ?? report.longitude;
      if (lat == null || lng == null) return;

      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(report.synced),
      });
      const entrepriseName = report.entreprise?.name ?? "";

      const tooltipHtml = `
        <div class="marker-tooltip">
          <strong>Signalement #${report.id}</strong>
          <span class="marker-tooltip-date">📅 ${report.date_signalement ?? ""}</span>
          ${entrepriseName ? `<span class="marker-tooltip-company">🏢 ${entrepriseName}</span>` : ""}
          <span class="marker-tooltip-status">📊 ${report.status ?? "—"}</span>
          <span class="marker-tooltip-budget">💰 ${parseFloat(report.budget ?? 0).toLocaleString()} Ar</span>
          <span class="marker-tooltip-surface">📐 ${report.surface ?? 0} m²</span>
        </div>`;

      marker.bindTooltip(tooltipHtml, {
        direction: "top",
        offset: [0, -48],
        className: "custom-tooltip",
        opacity: 1,
      });

      marker.on("click", () => {
        setSelectedReport(report);
      });

      marker.addTo(mapInstance.current);
      markersRef.current.push(marker);
    });
  }, [reports, onReportClick]);

  /* ── Sidebar close ────────────────────────────────────── */
  const closeSidebar = () => setSelectedReport(null);

  /* ── Render ───────────────────────────────────────────── */
  const syncMeta = selectedReport ? getSyncMeta(selectedReport.synced) : null;
  const SyncIcon = syncMeta?.Icon;

  return (
    <div className={`map-wrapper${selectedReport ? " sidebar-visible" : ""}`}>
      <div ref={mapRef} className="map-container" />

      {/* Overlay backdrop on mobile */}
      {selectedReport &&
        createPortal(
          <div className="detail-overlay" onClick={closeSidebar} />,
          document.body,
        )}

      {/* Detail sidebar */}
      <div className={`detail-sidebar${selectedReport ? " open" : ""}`}>
        {selectedReport && (
          <>
            <button
              type="button"
              className="detail-sidebar-close"
              onClick={closeSidebar}
              aria-label="Fermer"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            <div className="detail-sidebar-header">
              <div className="detail-sidebar-id">
                <MapPin
                  size={18}
                  strokeWidth={2.5}
                  style={{ color: syncMeta.color }}
                />
                <h3>Signalement #{selectedReport.id}</h3>
              </div>
              <span
                className={`sync-badge sync-${selectedReport.synced ?? "unknown"}`}
              >
                <SyncIcon size={12} strokeWidth={2.5} />
                {syncMeta.label}
              </span>
            </div>

            <div className="detail-sidebar-body">
              <DetailRow
                icon={CalendarDays}
                label="Date du signalement"
                value={selectedReport.date_signalement ?? "—"}
              />

              <DetailRow
                icon={MapPin}
                label="Coordonnées"
                value={`${Number(selectedReport.lat).toFixed(6)}, ${Number(selectedReport.lng).toFixed(6)}`}
              />

              <div className="detail-grid-2">
                <DetailRow
                  icon={Ruler}
                  label="Surface"
                  value={`${selectedReport.surface ?? 0} m²`}
                />
                <DetailRow
                  icon={Wallet}
                  label="Budget"
                  value={`${parseFloat(selectedReport.budget ?? 0).toLocaleString()} Ar`}
                />
              </div>

              {selectedReport.entreprise?.name && (
                <DetailRow
                  icon={Building2}
                  label="Entreprise"
                  value={selectedReport.entreprise.name}
                />
              )}

              {selectedReport.user?.email && (
                <DetailRow
                  icon={User}
                  label="Utilisateur"
                  value={selectedReport.user.email}
                />
              )}
            </div>

            {!readOnly && (
              <button
                type="button"
                className="detail-sidebar-edit-btn"
                onClick={() => {
                  if (onReportClick) onReportClick(selectedReport);
                }}
              >
                <Pencil size={16} strokeWidth={2.5} />
                Voir les détails
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
