import React, { useState, useMemo } from 'react';
import { Search, MapPin, Bus, ArrowRight, Compass, Sparkles } from 'lucide-react';
import { BusStop, BusRoute } from '../types/bus';
import { SG_BUS_ROUTES } from '../data/singaporeTransitData';

interface SearchViewProps {
  stops: BusStop[];
  onSelectStop: (busStopCode: string) => void;
  onSelectRoute: (serviceNo: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  stops,
  onSelectStop,
  onSelectRoute,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const popularHubs = [
    { code: '08057', label: 'Dhoby Ghaut Stn' },
    { code: '09048', label: 'Orchard Stn / Lucky Plaza' },
    { code: '80019', label: 'Bugis Stn' },
    { code: '04168', label: 'Fullerton Sq / CBD' },
    { code: '10169', label: 'Opp VivoCity' },
    { code: '84009', label: 'Tampines Int' },
    { code: '20009', label: 'Jurong East Int' },
    { code: '46009', label: 'Woodlands Temp Int' },
  ];

  const popularServices = ['190', '65', '10', '147', '106', '960', '36', '7'];

  // All unique services across all stops
  const allServices = useMemo(() => {
    const set = new Set<string>();
    stops.forEach((s) => s.Services.forEach((srv) => set.add(srv)));
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [stops]);

  // Filtered stops and services
  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchingStops: [], matchingServices: [] };
    }

    const matchingStops = stops.filter(
      (s) =>
        s.BusStopCode.toLowerCase().includes(q) ||
        s.Description.toLowerCase().includes(q) ||
        s.RoadName.toLowerCase().includes(q)
    );

    const matchingServices = allServices.filter((srv) =>
      srv.toLowerCase().includes(q)
    );

    return { matchingStops, matchingServices };
  }, [searchQuery, stops, allServices]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white tracking-tight mb-1">
          Search All Singapore LTA Bus Stops & Services
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Enter any 5-digit bus stop code, road name, MRT/landmark, or service number.
        </p>

        <div className="relative">
          <Search className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., 08057, Orchard, Dhoby Ghaut, 190, Fullerton..."
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-md"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick popular chips */}
        {!searchQuery && (
          <div className="mt-5 space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Popular Transit Hubs
              </span>
              <div className="flex flex-wrap gap-2">
                {popularHubs.map((hub) => (
                  <button
                    key={hub.code}
                    onClick={() => onSelectStop(hub.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <span className="font-mono text-emerald-400">{hub.code}</span>
                    <span>{hub.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Major Bus Services
              </span>
              <div className="flex flex-wrap gap-2">
                {popularServices.map((srv) => (
                  <button
                    key={srv}
                    onClick={() => onSelectRoute(srv)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-white transition-colors font-mono font-bold"
                  >
                    <Bus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Service {srv}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-6">
          {/* Matching Bus Services */}
          {results.matchingServices.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <Bus className="w-4 h-4 text-emerald-400" />
                <span>Matching Bus Services ({results.matchingServices.length})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {results.matchingServices.map((srv) => (
                  <button
                    key={srv}
                    onClick={() => onSelectRoute(srv)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-left group"
                  >
                    <div>
                      <span className="text-lg font-black font-mono text-white group-hover:text-emerald-400 transition-colors">
                        {srv}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        View Route
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Bus Stops */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Matching Bus Stops ({results.matchingStops.length})</span>
            </div>

            {results.matchingStops.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No bus stops found matching &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="space-y-2">
                {results.matchingStops.slice(0, 20).map((stop) => (
                  <button
                    key={stop.BusStopCode}
                    onClick={() => onSelectStop(stop.BusStopCode)}
                    className="w-full text-left p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850/60 transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {stop.BusStopCode}
                        </span>
                        <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                          {stop.Description}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {stop.RoadName} · {stop.Services.join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 shrink-0">
                      <span>Live Arrivals</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
