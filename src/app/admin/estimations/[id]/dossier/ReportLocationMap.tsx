"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import styles from "../../../admin.module.css";

export function ReportLocationMap({ accessToken, address, latitude, longitude }: { accessToken: string; address: string; latitude: number; longitude: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(!accessToken);

  useEffect(() => {
    if (!accessToken || !containerRef.current) return;
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      attributionControl: false,
      center: [longitude, latitude],
      container: containerRef.current,
      interactive: true,
      scrollZoom: false,
      style: "mapbox://styles/mapbox/light-v11",
      zoom: 14.2,
    });
    const marker = document.createElement("span");
    marker.className = styles.reportMapMarker;
    new mapboxgl.Marker({ element: marker }).setLngLat([longitude, latitude]).addTo(map);
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => setFailed(true));
    return () => map.remove();
  }, [accessToken, latitude, longitude]);

  if (failed) return <div className={styles.reportMapFallback}><MapPin size={24} /><strong>{address}</strong><span>Coordonnées : {latitude.toFixed(5)}, {longitude.toFixed(5)}</span></div>;
  return <div aria-label={`Carte de ${address}`} className={styles.reportMapCanvas} ref={containerRef} />;
}
