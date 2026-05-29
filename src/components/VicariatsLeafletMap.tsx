"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { VICARIATS, VICARIATS_DETAILS } from "@/lib/vicariats-data";

type MapPoint = (typeof VICARIATS)[number] & { lat: number; lon: number };

function FitToMarkers({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);
  return null;
}

export default function VicariatsLeafletMap() {
  const points = useMemo<MapPoint[]>(
    () =>
      VICARIATS.flatMap((v) => {
        const detail = VICARIATS_DETAILS[v.slug];
        if (!detail) return [];
        return [{ ...v, lat: detail.lat, lon: detail.lon }];
      }),
    []
  );

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-100 relative z-0">
      <MapContainer
        center={[6.45, 2.3]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "min(70vh, 560px)", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers points={points} />

        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={p.isHub ? 11 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: p.hexColor,
              fillOpacity: 0.92,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} opacity={1}>
              <span style={{ fontWeight: 700 }}>
                {p.id} · {p.name}
              </span>
            </Tooltip>

            <Popup>
              <div style={{ minWidth: 160 }}>
                <div
                  style={{
                    display: "inline-block",
                    background: p.hexColor,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    padding: "2px 8px",
                    borderRadius: 999,
                    marginBottom: 6,
                  }}
                >
                  Vicariat {p.id}
                </div>
                <p style={{ margin: 0, fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                  {p.name}
                </p>
                <p style={{ margin: "2px 0 8px", color: "#94a3b8", fontSize: 12 }}>{p.zone}</p>
                <p style={{ margin: "0 0 10px", color: "#475569", fontSize: 12 }}>
                  <strong>{p.paroisses}</strong> paroisses ·{" "}
                  <strong>{p.lecteurs.toLocaleString()}</strong> lecteurs
                </p>
                <Link
                  href={`/nos-vicariats/${p.slug}`}
                  style={{ color: "#92400e", fontWeight: 700, fontSize: 12 }}
                >
                  Voir le vicariat →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
