import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Star,
  Search,
  Filter,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { BusStop, LtaBusServiceArrival, LtaNextBus } from '../types/bus';
import { calculateDistanceMeters } from '../data/singaporeTransitData';
import { BusArrivalCard } from './BusArrivalCard';

interface NearbyViewProps {
  stops: BusStop[];
  currentLocation: { lat: number; lng: number; name: string };
  selectedStopCode: string;
  onSelectStopCode: (code: string) => void;
  arrivals: LtaBusServiceArrival[];
  isLoadingArrivals: boolean;
  onSetReminder: (serviceNo: string, arrivalIso: string, mins: number) => void;
  onPinService: (serviceNo: string) => void;
  pinnedServices: string[];
  isStopSaved: (code: string) => boolean;
  onToggleSaveStop: (code: string) => void;
  onViewOnMap: (serviceNo: string, bus?: LtaNextBus) => void;
  timeFormat: 'relative' | 'clock';
}

export const NearbyView: React.FC<NearbyViewProps> = ({
  stops,
  currentLocation,
  selectedStopCode,
  onSelectStopCode,
  arrivals,
  isLoadingArrivals,
  onSetReminder,
  onPinService,
  pinnedServices,
  isStopSaved,
  onToggleSaveStop,
  onViewOnMap,
  timeFormat,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterDoubleDeckOnly, setFilterDoubleDeckOnly] = useState(false);
  const [filterSeatsOnly, setFilterSeatsOnly] = useState(false);
  const [filterWheelchairOnly, setFilterWheelchairOnly] = useState(false);

  // Compute distance for all stops and sort by proximity
  const sortedStops = useMemo(() => {
    const list = stops.map((stop) => {
      const distance = calculateDistanceMeters(
        currentLocation.lat,
        currentLocation.lng,
        stop.Latitude,
        stop.Longitude
      );
      return {
        ...stop,
        DistanceMeters: distance,
      };
    });

    list.sort((a, b) => (a.DistanceMeters || 0) - (b.DistanceMeters || 0));

    if (!filterQuery.trim()) return list;

    const q = filterQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.BusStopCode.toLowerCase().includes(q) ||
        s.Description.toLowerCase().includes(q) ||
        s.RoadName.toLowerCase().includes(q) ||
        s.Services.some((srv) => srv.toLowerCase() === q)
    );
  }, [stops, currentLocation, filterQuery]);

  const activeStop = useMemo(() => {
    return (
      sortedStops.find((s) => s.BusStopCode === selectedStopCode) ||
      sortedStops[0]
    );
  }, [sortedStops, selectedStopCode]);

  // Apply service-level filters
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((arrival) => {
      if (filterDoubleDeckOnly) {
        if (arrival.NextBus?.Type !== 'DD') return false;
      }
      if (filterSeatsOnly) {
        if (arrival.NextBus?.Load !== 'SEA') return false;
      }
      if (filterWheelchairOnly) {
        if (arrival.NextBus?.Feature !== 'WAB') return false;
      }
      return true;
    });
  }, [arrivals, filterDoubleDeckOnly, filterSeatsOnly, filterWheelchairOnly]);

  const formatDistance = (meters?: number) => {
    if (meters === undefined) return '';
    if (meters < 1000) return `${meters}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Nearby Bus Stops List */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Search & Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Nearby Bus Stops
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <span>Near</span>
                <span className="text-emerald-400 font-medium">
                  {currentLocation.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{sortedStops.length} stops</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by code, road, or service..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Stops List */}
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {sortedStops.slice(0, 15).map((stop) => {
            const isSelected = stop.BusStopCode === (activeStop?.BusStopCode || '');
            const saved = isStopSaved(stop.BusStopCode);

            return (
              <div
                key={stop.BusStopCode}
                onClick={() => onSelectStopCode(stop.BusStopCode)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-850 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {stop.Description}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-emerald-400 font-semibold">
                        {stop.BusStopCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{stop.RoadName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                      <span className="text-slate-400">
                        {formatDistance(stop.DistanceMeters)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{stop.Services.length} services</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSaveStop(stop.BusStopCode);
                    }}
                    className={`p-2 rounded-lg border transition-colors ${
                      saved
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                    title={saved ? 'Remove bookmark' : 'Bookmark stop'}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${saved ? 'fill-amber-400' : ''}`}
                    />
                  </button>

                  <ChevronRight
                    className={`w-4 h-4 ${
                      isSelected ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Stop Arrivals Board */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {activeStop && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    STOP {activeStop.BusStopCode}
                  </span>
                  <span>{activeStop.RoadName}</span>
                  {activeStop.DistanceMeters !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-400">
                        {formatDistance(activeStop.DistanceMeters)}
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  {activeStop.Description}
                </h1>
              </div>

              <button
                onClick={() => onToggleSaveStop(activeStop.BusStopCode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  isStopSaved(activeStop.BusStopCode)
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isStopSaved(activeStop.BusStopCode) ? 'fill-amber-400' : ''
                  }`}
                />
                <span>
                  {isStopSaved(activeStop.BusStopCode) ? 'Bookmarked' : 'Save Stop'}
                </span>
              </button>
            </div>

            {/* Quick Filter Toggles */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </span>

              <button
                onClick={() => setFilterDoubleDeckOnly(!filterDoubleDeckOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  filterDoubleDeckOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Double Deck (DD)
              </button>
              <button
                onClick={() => setFilterSeatsOnly(!filterSeatsOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  filterSeatsOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Seats Available
              </button>
              <button
                onClick={() => setFilterWheelchairOnly(!filterWheelchairOnly)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                  filterWheelchairOnly
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Wheelchair Accessible
              </button>
            </div>
          </div>
        )}

        {/* Services Arrival Cards */}
        {isLoadingArrivals ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Fetching real-time arrivals from LTA DataMall...
            </p>
          </div>
        ) : filteredArrivals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-base font-semibold text-white mb-1">
              No services match current filters
            </p>
            <p className="text-xs text-slate-400">
              Try turning off filters or selecting a different bus stop.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArrivals.map((arrival) => (
              <BusArrivalCard
                key={arrival.ServiceNo}
                serviceArrival={arrival}
                busStopCode={activeStop?.BusStopCode || ''}
                busStopDesc={activeStop?.Description || ''}
                onSetReminder={onSetReminder}
                onPinService={onPinService}
                isPinned={pinnedServices.includes(
                  `${activeStop?.BusStopCode}-${arrival.ServiceNo}`
                )}
                onViewOnMap={onViewOnMap}
                timeFormat={timeFormat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
