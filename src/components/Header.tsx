import React, { useState, useEffect } from 'react';
import { Bus, MapPin, RefreshCw, Server, Navigation } from 'lucide-react';
import { UserLocationPreset } from '../types/bus';
import { SG_LOCATION_PRESETS } from '../data/singaporeTransitData';

interface HeaderProps {
  activeTab: 'nearby' | 'search' | 'routes' | 'map' | 'saved';
  onSelectTab: (tab: 'nearby' | 'search' | 'routes' | 'map' | 'saved') => void;
  currentLocation: { lat: number; lng: number; name: string };
  onSelectLocation: (preset: UserLocationPreset) => void;
  onUseGps: () => void;
  isGpsLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  refreshCountdown: number;
  onOpenBackendModal: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  currentLocation,
  onSelectLocation,
  onUseGps,
  isGpsLoading,
  onRefresh,
  isRefreshing,
  refreshCountdown,
  onOpenBackendModal,
  savedCount,
}) => {
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [sgtTime, setSgtTime] = useState('');

  // Clock in SGT (UTC+8)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in SGT
      const timeStr = now.toLocaleTimeString('en-SG', {
        timeZone: 'Asia/Singapore',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setSgtTime(timeStr);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single element) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bus className="w-5 h-5" />
            </div>
            <button
              onClick={() => onSelectTab('nearby')}
              className="text-left group cursor-pointer"
            >
              <span className="text-base font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                SG Bus Arrival
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span>LTA Live</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 tabular-nums">{sgtTime || '00:00:00'} SGT</span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (single-line, clean unboxed buttons/tabs) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab('nearby')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'nearby'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Nearby Stops
            </button>
            <button
              onClick={() => onSelectTab('search')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => onSelectTab('routes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'routes'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Routes
            </button>
            <button
              onClick={() => onSelectTab('map')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'map'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Live Map
            </button>
            <button
              onClick={() => onSelectTab('saved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
                activeTab === 'saved'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Bookmarks
              {savedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-slate-800 text-emerald-400 rounded-md font-mono">
                  {savedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Actions & Location Picker */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Location selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-200 transition-colors"
                title="Change active location"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="max-w-[110px] truncate text-slate-300 font-medium">
                  {currentLocation.name}
                </span>
              </button>

              {isLocationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulated GPS Hubs
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {SG_LOCATION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          onSelectLocation(preset);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          currentLocation.name === preset.name
                            ? 'text-emerald-400 bg-slate-800/50 font-medium'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">{preset.area}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 mt-2 pt-2 px-2">
                    <button
                      onClick={() => {
                        onUseGps();
                        setIsLocationDropdownOpen(false);
                      }}
                      disabled={isGpsLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
                      <span>{isGpsLoading ? 'Locating...' : 'Use Real Browser GPS'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh countdown & manual refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-300 transition-colors"
              title="Refresh arrivals now"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-emerald-400 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span className="font-mono tabular-nums text-slate-400 w-4 text-center">
                {refreshCountdown}s
              </span>
            </button>

            {/* Backend config trigger */}
            <button
              onClick={onOpenBackendModal}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors"
              title="Backend Connection Setup"
            >
              <Server className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
