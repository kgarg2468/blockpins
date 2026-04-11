"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";

import { CHAPMAN_CENTER, DEFAULT_MAP_STYLE, DEFAULT_ZOOM } from "@/lib/map/constants";
import type { Coordinates, Pin } from "@/types/pins";

type PinsMapProps = {
  mapboxToken: string;
  pins: Pin[];
  selectedPinId: string | null;
  onMapClick: (coordinates: Coordinates) => void;
  onSelectPin: (pinId: string) => void;
};

export function PinsMap({
  mapboxToken,
  pins,
  selectedPinId,
  onMapClick,
  onSelectPin,
}: PinsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const selectedPin = useMemo(() => {
    return pins.find((pin) => pin.id === selectedPinId) ?? null;
  }, [pins, selectedPinId]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxToken) {
      return;
    }

    const markers = markersRef.current;
    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: DEFAULT_MAP_STYLE,
      center: [CHAPMAN_CENTER.longitude, CHAPMAN_CENTER.latitude],
      zoom: DEFAULT_ZOOM,
      projection: { name: "mercator" },
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    map.on("click", (event) => {
      onMapClick({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;

      markers.forEach((marker) => marker.remove());
      markers.clear();

      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    pins.forEach((pin) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = "map-pin-marker";
      markerElement.setAttribute("aria-label", `Open pin ${pin.title}`);

      if (pin.id === selectedPinId) {
        markerElement.classList.add("is-selected");
      }

      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: "bottom",
      })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(map);

      markerElement.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelectPin(pin.id);
      });

      markersRef.current.set(pin.id, marker);
    });
  }, [pins, selectedPinId, onSelectPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    popupRef.current?.remove();
    popupRef.current = null;

    if (!selectedPin) {
      return;
    }

    const content = document.createElement("div");
    content.className = "pin-popup";

    const title = document.createElement("p");
    title.className = "pin-popup-title";
    title.textContent = selectedPin.title;

    const note = document.createElement("p");
    note.className = "pin-popup-note";
    note.textContent = selectedPin.note || "No note for this pin.";

    content.append(title, note);

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      offset: 18,
      className: "pin-popup-shell",
    })
      .setLngLat([selectedPin.longitude, selectedPin.latitude])
      .setDOMContent(content)
      .addTo(map);

    map.flyTo({
      center: [selectedPin.longitude, selectedPin.latitude],
      essential: true,
      duration: 650,
      zoom: Math.max(map.getZoom(), 15.2),
    });
  }, [selectedPin]);

  if (!mapboxToken) {
    return (
      <div className="map-fallback">
        <p>Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to load the map.</p>
      </div>
    );
  }

  return <div ref={mapContainerRef} className="map-canvas" />;
}
