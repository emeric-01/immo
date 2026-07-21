"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import styles from "./property.module.css";

type Props = { accessToken: string; center: { latitude: number; longitude: number }; radiusMeters: number };

function circle(center: [number, number], radiusMeters: number) {
  const coordinates = Array.from({ length: 73 }, (_, index) => {
    const angle = (index / 72) * Math.PI * 2;
    return [center[0] + (radiusMeters * Math.sin(angle)) / (111_320 * Math.cos((center[1] * Math.PI) / 180)), center[1] + (radiusMeters * Math.cos(angle)) / 111_320];
  });
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coordinates] } };
}

function circleBounds(center: [number, number], radiusMeters: number) {
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeDelta = radiusMeters / (111_320 * Math.cos((center[1] * Math.PI) / 180));
  return new mapboxgl.LngLatBounds(
    [center[0] - longitudeDelta, center[1] - latitudeDelta],
    [center[0] + longitudeDelta, center[1] + latitudeDelta],
  );
}

export function PropertyLocationMap({ accessToken, center, radiusMeters }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(!accessToken);
  useEffect(() => {
    if (!containerRef.current || !accessToken) return;
    mapboxgl.accessToken = accessToken;
    const publicCenter: [number, number] = [center.longitude, center.latitude];
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: publicCenter,
      zoom: 13.2,
      interactive: true,
      scrollZoom: false,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }), "top-right");
    map.on("load", () => {
      map.addSource("approximate-area", { type: "geojson", data: circle(publicCenter, radiusMeters) });
      map.addLayer({ id: "approximate-area-fill", type: "fill", source: "approximate-area", paint: { "fill-color": "#c37a48", "fill-opacity": 0.2 } });
      map.addLayer({ id: "approximate-area-line", type: "line", source: "approximate-area", paint: { "line-color": "#b86f3d", "line-width": 2, "line-opacity": 0.8 } });
      map.fitBounds(circleBounds(publicCenter, radiusMeters), { padding: 28, duration: 0, maxZoom: 13.6 });
    });
    map.on("error", () => setFailed(true));
    return () => map.remove();
  }, [accessToken, center.latitude, center.longitude, radiusMeters]);
  if (failed) return <div className={styles.locationMapFallback}>Localisation approximative du bien</div>;
  return <div className={styles.locationMapStage}><div aria-label="Carte interactive du secteur du bien. Utilisez les boutons plus et moins pour zoomer." className={styles.locationMapCanvas} ref={containerRef}/></div>;
}
