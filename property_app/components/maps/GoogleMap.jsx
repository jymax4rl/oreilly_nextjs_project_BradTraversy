"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsApi } from "@/utils/googleMaps";

export default function GoogleMap({
  lat,
  lng,
  zoom = 15,
  draggable = false,
  onPositionChange,
  className = "h-64 w-full rounded-2xl",
  approximate = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null || !containerRef.current) return;

    let cancelled = false;

    loadGoogleMapsApi([])
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        const center = { lat: Number(lat), lng: Number(lng) };

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: "greedy",
          });
        } else {
          mapRef.current.setCenter(center);
        }

        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
        if (circleRef.current) {
          circleRef.current.setMap(null);
        }

        markerRef.current = new google.maps.Marker({
          map: mapRef.current,
          position: center,
          draggable,
        });

        if (draggable && onPositionChange) {
          markerRef.current.addListener("dragend", () => {
            const pos = markerRef.current.getPosition();
            if (pos) {
              onPositionChange({ lat: pos.lat(), lng: pos.lng() });
            }
          });

          mapRef.current.addListener("click", (e) => {
            const nextLat = e.latLng.lat();
            const nextLng = e.latLng.lng();
            markerRef.current.setPosition({ lat: nextLat, lng: nextLng });
            onPositionChange({ lat: nextLat, lng: nextLng });
          });
        }

        if (approximate) {
          circleRef.current = new google.maps.Circle({
            map: mapRef.current,
            center,
            radius: 400,
            fillColor: "#7C3AED",
            fillOpacity: 0.12,
            strokeColor: "#7C3AED",
            strokeOpacity: 0.35,
            strokeWeight: 1,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, zoom, draggable, onPositionChange, approximate]);

  if (lat == null || lng == null) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-sm text-zinc-500 ${className}`}
      >
        Set a location to preview the map
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-sm text-zinc-500 ${className}`}
      >
        Map unavailable — check Google Maps API key
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
