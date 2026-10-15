import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import type { LatLngTuple } from "leaflet";
import { Store, Warehouse as WarehouseIcon, type LucideIcon } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type {
  DestinationStats,
  RouteStats,
  WarehouseStats,
} from "@/lib/distribution-network";
import {
  DESTINATIONS,
  formatHours,
  type AllocationRow,
} from "@/lib/distribution-planner";
import { WAREHOUSES } from "@/lib/inventory-batches";

const MAP_HEIGHT = 420;
const INITIAL_CENTER: LatLngTuple = [30.9, 75.85];
const INITIAL_ZOOM = 7;
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';

const COLORS = {
  warehouse: "#34d399",
  destination: "#22d3ee",
  route: "#2563eb",
  delay: "#fbbf24",
  infeasible: "#f87171",
};

const kg = (value: number) => `${value.toLocaleString("en-IN")} kg`;

const FIT_POINTS: LatLngTuple[] = [...WAREHOUSES, ...DESTINATIONS].flatMap(
  (item) => (item.location ? [[item.location.lat, item.location.lng]] : []),
);

function markerIcon(Icon: LucideIcon, color: string, selected = false) {
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
    html: renderToStaticMarkup(
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 9999,
          background: color,
          border: `2px solid ${selected ? "#e5e7eb" : "#0f172a"}`,
          boxShadow: selected
            ? "0 0 0 3px rgba(229,231,235,0.35)"
            : "0 1px 4px rgba(0,0,0,0.45)",
        }}
      >
        <Icon size={15} color="#0f172a" strokeWidth={2.25} aria-hidden="true" />
      </span>,
    ),
  });
}

const WAREHOUSE_ICON = markerIcon(WarehouseIcon, COLORS.warehouse);
const DESTINATION_ICON = markerIcon(Store, COLORS.destination);
const DESTINATION_ICON_SELECTED = markerIcon(Store, COLORS.destination, true);

function PopupRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

function PopupNotice() {
  return (
    <p className="mt-2 text-xs text-slate-500">
      Synthetic demo location, not a real business.
    </p>
  );
}

function MapController({
  points,
  fitSignal,
}: {
  points: LatLngTuple[];
  fitSignal: number;
}) {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [map, points, fitSignal]);

  return null;
}

export interface NetworkMapProps {
  warehouses: WarehouseStats[];
  destinations: DestinationStats[];
  routes: RouteStats[];
  hasPlan: boolean;
  routeDelayHours: number;
  selectedDestinationId: string | null;
  selectedRouteKey: string | null;
  fitSignal: number;
  onSelectDestination: (id: string) => void;
  onSelectRoute: (route: RouteStats) => void;
  onOpenAllocation: (row: AllocationRow) => void;
}

export function NetworkMap({
  warehouses,
  destinations,
  routes,
  hasPlan,
  routeDelayHours,
  selectedDestinationId,
  selectedRouteKey,
  fitSignal,
  onSelectDestination,
  onSelectRoute,
  onOpenAllocation,
}: NetworkMapProps) {
  const [tilesFailed, setTilesFailed] = useState(false);
  const tileHandlers = useMemo(
    () => ({
      tileerror: () => setTilesFailed(true),
      tileload: () => setTilesFailed(false),
    }),
    [],
  );

  const maxKg = Math.max(1, ...routes.map((route) => route.allocatedKg));
  const delayed = routeDelayHours > 0;

  return (
    <div className="flex flex-col gap-2">
      {tilesFailed && (
        <p
          role="alert"
          className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning"
        >
          Map tiles could not load. The Allocation Table above shows the full plan.
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-slate-900">
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          scrollWheelZoom={false}
          style={{ height: MAP_HEIGHT, width: "100%" }}
          attributionControl
        >
          <TileLayer
            url={TILE_URL}
            attribution={TILE_ATTRIBUTION}
            eventHandlers={tileHandlers}
          />
          <MapController points={FIT_POINTS} fitSignal={fitSignal} />

          {routes.map((route) => {
            const from = route.warehouse.location;
            const to = route.destination.location;
            if (!from || !to) return null;

            const positions: LatLngTuple[] = [
              [from.lat, from.lng],
              [to.lat, to.lng],
            ];
            const isSelected = selectedRouteKey === route.key;
            const dimmed =
              (selectedRouteKey !== null && !isSelected) ||
              (selectedDestinationId !== null &&
                route.destination.id !== selectedDestinationId);
            const color = route.infeasible
              ? COLORS.infeasible
              : delayed
                ? COLORS.delay
                : COLORS.route;

            return (
              <Fragment key={route.key}>
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color,
                    weight: 2 + (route.allocatedKg / maxKg) * 8,
                    opacity: dimmed ? 0.25 : isSelected ? 1 : 0.85,
                    lineCap: "round",
                    dashArray: "8, 12",
                    className: "animate-transit-flow",
                    interactive: false,
                  }}
                />
                <Polyline
                  positions={positions}
                  pathOptions={{ color, weight: 18, opacity: 0 }}
                  eventHandlers={{ click: () => onSelectRoute(route) }}
                >
                  <Popup>
                    <RoutePopup
                      route={route}
                      routeDelayHours={routeDelayHours}
                      onOpenAllocation={onOpenAllocation}
                    />
                  </Popup>
                </Polyline>
              </Fragment>
            );
          })}

          {destinations.map((stat) => {
            const { destination } = stat;
            if (!destination.location) return null;
            const isSelected = selectedDestinationId === destination.id;
            return (
              <Marker
                key={destination.id}
                position={[destination.location.lat, destination.location.lng]}
                icon={isSelected ? DESTINATION_ICON_SELECTED : DESTINATION_ICON}
                title={destination.name}
                alt={destination.name}
                eventHandlers={{ click: () => onSelectDestination(destination.id) }}
              >
                <Popup>
                  <div className="w-60 text-sm text-slate-800">
                    <p className="font-semibold text-slate-900">{destination.name}</p>
                    <dl className="mt-2 flex flex-col gap-1">
                      <PopupRow label="Demand" value={kg(destination.demandKg)} />
                      <PopupRow
                        label="Allocated"
                        value={hasPlan ? kg(stat.allocatedKg) : "No plan run"}
                      />
                      <PopupRow
                        label="Capacity used"
                        value={hasPlan ? `${stat.capacityUsedPct}%` : "—"}
                      />
                    </dl>
                    <PopupNotice />
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {warehouses.map((stat) => {
            const { warehouse } = stat;
            if (!warehouse.location) return null;
            return (
              <Marker
                key={warehouse.id}
                position={[warehouse.location.lat, warehouse.location.lng]}
                icon={WAREHOUSE_ICON}
                title={warehouse.name}
                alt={warehouse.name}
              >
                <Popup>
                  <div className="w-60 text-sm text-slate-800">
                    <p className="font-semibold text-slate-900">{warehouse.name}</p>
                    <dl className="mt-2 flex flex-col gap-1">
                      <PopupRow label="Stock" value={kg(stat.stockKg)} />
                      <PopupRow label="Batches" value={String(stat.batches.length)} />
                    </dl>
                    <PopupNotice />
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}

function RoutePopup({
  route,
  routeDelayHours,
  onOpenAllocation,
}: {
  route: RouteStats;
  routeDelayHours: number;
  onOpenAllocation: (row: AllocationRow) => void;
}) {
  const travelHours = route.destination.travelHours + routeDelayHours;

  return (
    <div className="w-72 text-sm text-slate-800">
      <p className="font-semibold text-slate-900">
        {route.warehouse.name} → {route.destination.name}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Connection shows an allocation link, not a road route.
      </p>
      <dl className="mt-2 flex flex-col gap-1">
        <PopupRow label="Allocated" value={kg(route.allocatedKg)} />
        <PopupRow
          label="Travel time (dataset)"
          value={formatHours(travelHours)}
        />
      </dl>
      {route.infeasible && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          Infeasible: a constraint check fails on this connection.
        </p>
      )}
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Affected batches
      </p>
      <ul className="mt-1 flex flex-col gap-1">
        {route.rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs">
              {row.batchId} · {kg(row.allocatedKg)}
            </span>
            <button
              type="button"
              onClick={() => onOpenAllocation(row)}
              className="rounded border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Explain
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
