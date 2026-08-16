"use client";

import * as maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

type Stop = { name: string; lat: number; lng: number; type: "CTA" | "Metra" };
type ListingMarker = { id: string; address: string; lat: number; lng: number; price: string; status: string };

const CTA_COLOR = "#2563eb";
const METRA_COLOR = "#ea580c";

const STOPS: Stop[] = [
  { name: "Forest Park", lat: 41.8777, lng: -87.8153, type: "CTA" },
  { name: "Harlem/Lake", lat: 41.8862, lng: -87.8053, type: "CTA" },
  { name: "Oak Park", lat: 41.8877, lng: -87.7892, type: "CTA" },
  { name: "Ridgeland", lat: 41.8872, lng: -87.7835, type: "CTA" },
  { name: "Oak Park", lat: 41.8936, lng: -87.7865, type: "Metra" },
  { name: "River Forest", lat: 41.8961, lng: -87.8242, type: "Metra" },
  { name: "Maywood", lat: 41.8789, lng: -87.8493, type: "Metra" },
];

const AREA_BOUNDARIES: Record<string, [number, number][]> = {
  "Forest Park": [
    [-87.840, 41.890], [-87.800, 41.890], [-87.800, 41.868], [-87.840, 41.868], [-87.840, 41.890],
  ],
  "Oak Park": [
    [-87.800, 41.902], [-87.770, 41.902], [-87.770, 41.868], [-87.800, 41.868], [-87.800, 41.902],
  ],
};

const STREET_LABELS: { name: string; lng: number; lat: number }[] = [
  { name: "Madison St", lng: -87.81, lat: 41.8755 },
  { name: "Roosevelt Rd", lng: -87.81, lat: 41.866 },
  { name: "Harlem Ave", lng: -87.802, lat: 41.885 },
  { name: "Lake St", lng: -87.79, lat: 41.888 },
  { name: "North Ave", lng: -87.79, lat: 41.906 },
  { name: "Austin Blvd", lng: -87.772, lat: 41.895 },
];

export function NeighborhoodMap({ listings }: { listings: ListingMarker[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors, © CARTO",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [-87.81, 41.885],
      zoom: 14,
    });

    mapRef.current = map;

    map.on("load", () => {
      const ctaStops = STOPS.filter((s) => s.type === "CTA");
      const metraStops = STOPS.filter((s) => s.type === "Metra");

      const allBoundaries = Object.entries(AREA_BOUNDARIES);
      map.addSource("boundaries", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: allBoundaries.map(([name, coords]) => ({
            type: "Feature" as const,
            geometry: { type: "Polygon", coordinates: [coords] },
            properties: { name },
          })),
        },
      });

      map.addLayer({
        id: "boundary-fill",
        type: "fill",
        source: "boundaries",
        paint: {
          "fill-color": "#2f5445",
          "fill-opacity": 0.06,
        },
      });

      map.addLayer({
        id: "boundary-line",
        type: "line",
        source: "boundaries",
        paint: {
          "line-color": "#2f5445",
          "line-width": 2,
          "line-dasharray": [4, 3],
        },
      });

      map.addSource("street-labels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: STREET_LABELS.map((street) => ({
            type: "Feature" as const,
            geometry: { type: "Point", coordinates: [street.lng, street.lat] },
            properties: { name: street.name },
          })),
        },
      });

      map.addLayer({
        id: "street-label-layer",
        type: "symbol",
        source: "street-labels",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#4a5a50",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
        },
      });

      map.addSource("cta", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: ctaStops.map((stop) => ({
            type: "Feature" as const,
            geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
            properties: { name: stop.name },
          })),
        },
      });

      map.addSource("metra", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: metraStops.map((stop) => ({
            type: "Feature" as const,
            geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
            properties: { name: stop.name },
          })),
        },
      });

      map.addLayer({
        id: "cta-circles",
        type: "circle",
        source: "cta",
        paint: {
          "circle-radius": 8,
          "circle-color": CTA_COLOR,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "metra-circles",
        type: "circle",
        source: "metra",
        paint: {
          "circle-radius": 8,
          "circle-color": METRA_COLOR,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cta-labels",
        type: "symbol",
        source: "cta",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": CTA_COLOR,
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      map.addLayer({
        id: "metra-labels",
        type: "symbol",
        source: "metra",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": METRA_COLOR,
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      map.on("click", "cta-circles", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (feature) {
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>CTA: ${feature.properties?.name}</strong>`)
            .addTo(map);
        }
      });

      map.on("click", "metra-circles", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (feature) {
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>Metra: ${feature.properties?.name}</strong>`)
            .addTo(map);
        }
      });

      map.getCanvas().style.cursor = "pointer";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateListings = () => {
      if (!map.getSource("listings")) {
        map.addSource("listings", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: listings.map((listing) => ({
              type: "Feature" as const,
              geometry: { type: "Point", coordinates: [listing.lng, listing.lat] },
              properties: listing,
            })),
          },
        });

        map.addLayer({
          id: "listing-circles",
          type: "circle",
          source: "listings",
          paint: {
            "circle-radius": 10,
            "circle-color": "#2f5445",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "listing-labels",
          type: "symbol",
          source: "listings",
          layout: {
            "text-field": ["get", "address"],
            "text-size": 11,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#2f5445",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
          },
        });

        map.on("click", "listing-circles", (e: maplibregl.MapLayerMouseEvent) => {
          const f = e.features?.[0];
          if (f) {
            new maplibregl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`<strong>${f.properties?.address}</strong><br/>${f.properties?.price} · ${f.properties?.status}`)
              .addTo(map);
          }
        });
      } else {
        (map.getSource("listings") as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: listings.map((listing) => ({
            type: "Feature" as const,
            geometry: { type: "Point", coordinates: [listing.lng, listing.lat] },
            properties: listing,
          })),
        });
      }
    };

    if (map.loaded()) updateListings();
    else map.once("load", updateListings);
  }, [listings]);

  return (
    <div className="real-map">
      <div className="real-map-legend">
        <span><span className="legend-dot cta" /> CTA</span>
        <span><span className="legend-dot metra" /> Metra</span>
        <span><span className="legend-dot listing" /> Saved homes</span>
      </div>
      <div ref={containerRef} className="real-map-canvas" />
    </div>
  );
}
