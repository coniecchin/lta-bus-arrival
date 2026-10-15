import React, { useState, useMemo } from 'react';
import {
  Bus,
  Clock,
  Repeat,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { BusRoute, LiveBusVehicle } from '../types/bus';
import { SG_BUS_ROUTES } from '../data/singaporeTransitData';

interface RouteExplorerProps {
  selectedServiceNo: string;
  onSelectServiceNo: (serviceNo: string) => void;
  onSelectStopCode: (code: string) => void;
  liveBuses: LiveBusVehicle[];
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  selectedServiceNo,
  onSelectServiceNo,
  onSelectStopCode,
  liveBuses,
}) => {
  const [direction, setDirection] = useState<1 | 2>(1);

  // Available routes
  const availableServices = useMemo(() => {
    return SG_BUS_ROUTES.map((r) => r.ServiceNo);
  }, []);

  const currentRoute = useMemo(() => {
    return (
      SG_BUS_ROUTES.find((r) => r.ServiceNo === selectedServiceNo) ||
      SG_BUS_ROUTES[0]
    );
  }, [selectedServiceNo]);

  // Live buses on this route
  const activeBusesOnRoute = useMemo(() => {
    return liveBuses.filter(
      (b) => b.serviceNo === currentRoute.ServiceNo
    );
  }, [liveBuses, currentRoute]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Route Selector & Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        {/* Service selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-thin">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            Service:
          </span>
          {availableServices.map((srv) => (
            <button
              key={srv}
              onClick={() => onSelectServiceNo(srv)}
              className={`px-3 py-1.5 rounded-xl font-mono text-sm font-bold transition-all shrink-0 ${
                currentRoute.ServiceNo === srv
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              {srv}
            </button>
          ))}
        </div>

        {/* Route Info Lockup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black font-mono text-white">
                {currentRoute.ServiceNo}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">
                  {currentRoute.Operator}
                </span>
                <span aria-hidden="true">·</span>
                <span>{currentRoute.Category} Service</span>
                <span aria-hidden="true">·</span>
                <span>{currentRoute.Stops.length} Stops</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {currentRoute.OriginDesc} <span className="text-emerald-400">→</span> {currentRoute.DestinationDesc}
              </h2>
            </div>
          </div>

          {/* Active fleet count */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs shrink-0">
            <Zap className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">
                Active Fleet
              </span>
              <span className="font-bold text-white font-mono tabular-nums">
                {activeBusesOnRoute.length} Live Buses Tracked
              </span>
            </div>
          </div>
        </div>

        {/* Operating Hours & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">
              Operating Hours
            </span>
            <span className="font-semibold text-white font-mono">
              {currentRoute.OperatingHours}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">
              Peak Frequency
            </span>
            <span className="font-semibold text-emerald-400 font-mono">
              {currentRoute.FrequencyPeak}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-mono mb-1">
              Off-Peak Frequency
            </span>
            <span className="font-semibold text-slate-300 font-mono">
              {currentRoute.FrequencyOffPeak}
            </span>
          </div>
        </div>
      </div>

      {/* Stop Sequence List with Live Bus Tracking */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Route Stop Sequence & Live Vehicles
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any stop to view incoming bus arrivals across all services.
            </p>
          </div>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-4">
          {/* Vertical route line */}
          <div className="absolute left-[15px] sm:left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-emerald-500 via-emerald-600 to-slate-700 rounded-full" />

          {currentRoute.Stops.map((stop, index) => {
            // Check if any live bus has this stop as next stop
            const arrivingBus = activeBusesOnRoute.find(
              (b) => b.nextStopCode === stop.BusStopCode
            );

            return (
              <div key={stop.BusStopCode} className="relative group">
                {/* Node circle on the route line */}
                <div
                  className={`absolute -left-[27px] sm:-left-[31px] top-3.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    arrivingBus
                      ? 'bg-emerald-500 border-white text-slate-950 shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                      : 'bg-slate-950 border-emerald-500 text-emerald-400'
                  }`}
                >
                  <span className="text-[10px] font-bold font-mono">
                    {stop.StopSequence}
                  </span>
                </div>

                {/* Stop Card */}
                <div
                  onClick={() => onSelectStopCode(stop.BusStopCode)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    arrivingBus
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {stop.BusStopCode}
                      </span>
                      <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                        {stop.Description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>{stop.RoadName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-500">
                        {stop.DistanceKm.toFixed(1)} km from origin
                      </span>
                    </div>
                  </div>

                  {/* Arriving bus telemetry badge or view arrivals link */}
                  {arrivingBus ? (
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs shrink-0">
                      <Bus className="w-4 h-4 animate-bounce" />
                      <div>
                        <span className="font-bold font-mono block">
                          Bus {arrivingBus.plate} Approaching
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">
                          ETA ~{arrivingBus.estimatedArrivalMins} min · {arrivingBus.speed} km/h · {arrivingBus.type}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0">
                      <span>View Arrivals</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
