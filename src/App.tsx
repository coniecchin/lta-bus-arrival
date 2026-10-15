/**
 * Singapore Real-Time LTA Bus Arrival & Live Tracking Application
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Search,
  Bus,
  Layers,
  Star,
  Bell,
  Clock,
  Sliders,
  CheckCircle,
  X,
  Volume2,
} from 'lucide-react';
import {
  BusStop,
  LtaBusServiceArrival,
  LiveBusVehicle,
  SavedBusStop,
  UserLocationPreset,
  ArrivalReminder,
  LtaNextBus,
} from './types/bus';
import {
  SG_BUS_STOPS,
  SG_LOCATION_PRESETS,
  calculateDistanceMeters,
} from './data/singaporeTransitData';
import {
  getBusArrival,
  getBusStops,
  getLiveBuses,
  getStoredApiConfig,
} from './services/ltaApi';
import { Header } from './components/Header';
import { NearbyView } from './components/NearbyView';
import { SearchView } from './components/SearchView';
import { RouteExplorer } from './components/RouteExplorer';
import { LiveTransitMap } from './components/LiveTransitMap';
import { BookmarksView } from './components/BookmarksView';
import { BackendConfigModal } from './components/BackendConfigModal';
import { ReminderModal } from './components/ReminderModal';

const SAVED_STOPS_KEY = 'sg_bus_saved_stops';
const PINNED_SERVICES_KEY = 'sg_bus_pinned_services';
const TIME_FORMAT_KEY = 'sg_bus_time_format';

export default function App() {
  const [activeTab, setActiveTab] = useState<'nearby' | 'search' | 'routes' | 'map' | 'saved'>('nearby');
  const [stops, setStops] = useState<BusStop[]>(SG_BUS_STOPS);

  // Active location (simulated or real GPS)
  const [currentLocation, setCurrentLocation] = useState<UserLocationPreset>(
    SG_LOCATION_PRESETS[0]
  );
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  // Selection states
  const [selectedStopCode, setSelectedStopCode] = useState<string>('08057');
  const [selectedServiceNo, setSelectedServiceNo] = useState<string>('190');

  // Arrivals for the currently selected stop
  const [arrivals, setArrivals] = useState<LtaBusServiceArrival[]>([]);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState<boolean>(false);

  // Arrivals map for bookmarked stops
  const [savedArrivalsMap, setSavedArrivalsMap] = useState<Record<string, LtaBusServiceArrival[]>>({});

  // Live buses fleet
  const [liveBuses, setLiveBuses] = useState<LiveBusVehicle[]>([]);

  // Refresh interval ticker
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Saved stops & pinned services
  const [savedStops, setSavedStops] = useState<SavedBusStop[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_STOPS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      { busStopCode: '08057', customLabel: 'Dhoby Ghaut Stn', savedAt: Date.now() },
      { busStopCode: '09048', customLabel: 'Orchard Lucky Plaza', savedAt: Date.now() },
    ];
  });

  const [pinnedServices, setPinnedServices] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(PINNED_SERVICES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return ['08057-190', '08057-65'];
  });

  // Time format: 'relative' (3 min) or 'clock' (08:42)
  const [timeFormat, setTimeFormat] = useState<'relative' | 'clock'>(() => {
    try {
      const stored = localStorage.getItem(TIME_FORMAT_KEY);
      if (stored === 'clock') return 'clock';
    } catch {
      // ignore
    }
    return 'relative';
  });

  // Modals
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [reminderModalData, setReminderModalData] = useState<{
    isOpen: boolean;
    serviceNo: string;
    busStopCode: string;
    busStopDesc: string;
    currentWaitMins: number;
  }>({
    isOpen: false,
    serviceNo: '',
    busStopCode: '',
    busStopDesc: '',
    currentWaitMins: 2,
  });

  // Active reminders
  const [activeReminders, setActiveReminders] = useState<ArrivalReminder[]>([]);
  const [triggeredAlert, setTriggeredAlert] = useState<string | null>(null);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_STOPS_KEY, JSON.stringify(savedStops));
    } catch {
      // ignore
    }
  }, [savedStops]);

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_SERVICES_KEY, JSON.stringify(pinnedServices));
    } catch {
      // ignore
    }
  }, [pinnedServices]);

  useEffect(() => {
    try {
      localStorage.setItem(TIME_FORMAT_KEY, timeFormat);
    } catch {
      // ignore
    }
  }, [timeFormat]);

  // Fetch stops list once on mount
  useEffect(() => {
    getBusStops().then((res) => {
      if (res && res.length > 0) setStops(res);
    });
  }, []);

  // Fetch arrivals for selected stop
  const fetchArrivalsForStop = useCallback(
    async (stopCode: string, silent = false) => {
      if (!silent) setIsLoadingArrivals(true);
      try {
        const data = await getBusArrival(stopCode);
        setArrivals(data.Services || []);
      } catch (err) {
        console.error('Failed to fetch arrivals:', err);
      } finally {
        if (!silent) setIsLoadingArrivals(false);
      }
    },
    []
  );

  // Fetch arrivals for saved stops
  const fetchSavedStopsArrivals = useCallback(async () => {
    const map: Record<string, LtaBusServiceArrival[]> = {};
    for (const saved of savedStops) {
      try {
        const data = await getBusArrival(saved.busStopCode);
        map[saved.busStopCode] = data.Services || [];
      } catch {
        // ignore
      }
    }
    setSavedArrivalsMap(map);
  }, [savedStops]);

  // Master refresh function
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshCountdown(15);

    // Update live buses
    const nowSec = Math.floor(Date.now() / 1000);
    setLiveBuses(getLiveBuses(nowSec));

    // Update active stop arrivals
    await fetchArrivalsForStop(selectedStopCode, true);

    // Update bookmarks
    if (savedStops.length > 0) {
      await fetchSavedStopsArrivals();
    }

    setIsRefreshing(false);
  }, [selectedStopCode, fetchArrivalsForStop, savedStops, fetchSavedStopsArrivals]);

  // Initial load when selectedStopCode changes
  useEffect(() => {
    fetchArrivalsForStop(selectedStopCode);
  }, [selectedStopCode, fetchArrivalsForStop]);

  // Initial live buses & saved stops
  useEffect(() => {
    setLiveBuses(getLiveBuses(Math.floor(Date.now() / 1000)));
    fetchSavedStopsArrivals();
  }, [fetchSavedStopsArrivals]);

  // Auto-refresh countdown interval (every 1s, trigger refresh at 0)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          handleRefresh();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  // Handle GPS location request
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const { latitude, longitude } = pos.coords;

        // Find closest known stop to name the location
        let closestStop = stops[0];
        let minDistance = Infinity;

        stops.forEach((s) => {
          const d = calculateDistanceMeters(latitude, longitude, s.Latitude, s.Longitude);
          if (d < minDistance) {
            minDistance = d;
            closestStop = s;
          }
        });

        setCurrentLocation({
          name: minDistance < 1500 ? closestStop.Description : 'Current GPS Position',
          area: 'Singapore',
          lat: latitude,
          lng: longitude,
        });

        // Automatically select the nearest stop
        setSelectedStopCode(closestStop.BusStopCode);
      },
      (err) => {
        setIsGpsLoading(false);
        console.warn('GPS location access denied or unavailable:', err);
        // Fallback gracefully
        setCurrentLocation(SG_LOCATION_PRESETS[0]);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Toggle bookmark stop
  const isStopSaved = (code: string) => savedStops.some((s) => s.busStopCode === code);

  const handleToggleSaveStop = (code: string) => {
    if (isStopSaved(code)) {
      setSavedStops(savedStops.filter((s) => s.busStopCode !== code));
    } else {
      const stop = stops.find((s) => s.BusStopCode === code);
      setSavedStops([
        ...savedStops,
        {
          busStopCode: code,
          customLabel: stop?.Description,
          savedAt: Date.now(),
        },
      ]);
    }
  };

  const handleUpdateStopLabel = (code: string, newLabel: string) => {
    setSavedStops(
      savedStops.map((s) =>
        s.busStopCode === code ? { ...s, customLabel: newLabel } : s
      )
    );
  };

  // Pin service toggle
  const handlePinService = (serviceNo: string) => {
    const key = `${selectedStopCode}-${serviceNo}`;
    if (pinnedServices.includes(key)) {
      setPinnedServices(pinnedServices.filter((k) => k !== key));
    } else {
      setPinnedServices([...pinnedServices, key]);
    }
  };

  // Reminder trigger
  const handleOpenReminderModal = (serviceNo: string, arrivalIso: string, mins: number) => {
    const stop = stops.find((s) => s.BusStopCode === selectedStopCode);
    setReminderModalData({
      isOpen: true,
      serviceNo,
      busStopCode: selectedStopCode,
      busStopDesc: stop?.Description || 'Selected Stop',
      currentWaitMins: mins,
    });
  };

  const handleConfirmReminder = (targetMins: number) => {
    const newReminder: ArrivalReminder = {
      id: `rem-${Date.now()}`,
      busStopCode: reminderModalData.busStopCode,
      serviceNo: reminderModalData.serviceNo,
      targetMins,
      triggerTime: Date.now() + Math.max(1, targetMins) * 60 * 1000,
      busStopDesc: reminderModalData.busStopDesc,
      isActive: true,
    };

    setActiveReminders((prev) => [...prev, newReminder]);
    setTriggeredAlert(
      `Reminder set! We will alert you when Bus ${reminderModalData.serviceNo} is ${targetMins} min away.`
    );
    setTimeout(() => setTriggeredAlert(null), 4000);
  };

  // View on map action
  const handleViewOnMap = (serviceNo: string, bus?: LtaNextBus) => {
    setSelectedServiceNo(serviceNo);
    setActiveTab('map');
  };

  // Active stop object
  const activeStopObj = stops.find((s) => s.BusStopCode === selectedStopCode) || stops[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentLocation={currentLocation}
        onSelectLocation={(preset) => {
          setCurrentLocation(preset);
          // Find nearest stop to preset
          const closest = stops.reduce((prev, curr) => {
            const dPrev = calculateDistanceMeters(preset.lat, preset.lng, prev.Latitude, prev.Longitude);
            const dCurr = calculateDistanceMeters(preset.lat, preset.lng, curr.Latitude, curr.Longitude);
            return dCurr < dPrev ? curr : prev;
          }, stops[0]);
          setSelectedStopCode(closest.BusStopCode);
        }}
        onUseGps={handleUseGps}
        isGpsLoading={isGpsLoading}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        refreshCountdown={refreshCountdown}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        savedCount={savedStops.length}
      />

      {/* Global Alert Notification Banner */}
      {triggeredAlert && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between sticky top-16 z-30 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{triggeredAlert}</span>
          </div>
          <button
            onClick={() => setTriggeredAlert(null)}
            className="p-1 hover:bg-emerald-600 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'nearby' && (
          <NearbyView
            stops={stops}
            currentLocation={currentLocation}
            selectedStopCode={selectedStopCode}
            onSelectStopCode={(code) => setSelectedStopCode(code)}
            arrivals={arrivals}
            isLoadingArrivals={isLoadingArrivals}
            onSetReminder={handleOpenReminderModal}
            onPinService={handlePinService}
            pinnedServices={pinnedServices}
            isStopSaved={isStopSaved}
            onToggleSaveStop={handleToggleSaveStop}
            onViewOnMap={handleViewOnMap}
            timeFormat={timeFormat}
          />
        )}

        {activeTab === 'search' && (
          <SearchView
            stops={stops}
            onSelectStop={(code) => {
              setSelectedStopCode(code);
              setActiveTab('nearby');
            }}
            onSelectRoute={(srv) => {
              setSelectedServiceNo(srv);
              setActiveTab('routes');
            }}
          />
        )}

        {activeTab === 'routes' && (
          <RouteExplorer
            selectedServiceNo={selectedServiceNo}
            onSelectServiceNo={setSelectedServiceNo}
            onSelectStopCode={(code) => {
              setSelectedStopCode(code);
              setActiveTab('nearby');
            }}
            liveBuses={liveBuses}
          />
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Singapore Live Bus & Transit Fleet Map
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time GPS vehicle coordinates, bearing telemetry, and route corridors across Singapore.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setTimeFormat(timeFormat === 'relative' ? 'clock' : 'relative')
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Format: {timeFormat === 'relative' ? 'Minutes (Arr)' : 'Clock (08:45)'}
                  </span>
                </button>
              </div>
            </div>

            <LiveTransitMap
              stops={stops}
              liveBuses={liveBuses}
              selectedStopCode={selectedStopCode}
              onSelectStopCode={(code) => {
                setSelectedStopCode(code);
                setActiveTab('nearby');
              }}
              selectedServiceNo={selectedServiceNo}
              onSelectServiceNo={setSelectedServiceNo}
            />
          </div>
        )}

        {activeTab === 'saved' && (
          <BookmarksView
            savedStops={savedStops}
            stops={stops}
            onSelectStopCode={(code) => {
              setSelectedStopCode(code);
              setActiveTab('nearby');
            }}
            onRemoveSavedStop={handleToggleSaveStop}
            onUpdateStopLabel={handleUpdateStopLabel}
            pinnedServices={pinnedServices}
            onPinService={handlePinService}
            arrivalsMap={savedArrivalsMap}
            onSetReminder={handleOpenReminderModal}
            timeFormat={timeFormat}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Touch-first ergonomic navigation, strictly < 15% viewport height) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-16 pb-safe">
        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'nearby' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Nearby</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'search' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Search</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'routes' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Bus className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Routes</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeTab === 'map' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Live Map</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            activeTab === 'saved' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">Saved</span>
          {savedStops.length > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </nav>

      {/* Modals */}
      <BackendConfigModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onConfigSaved={() => {
          handleRefresh();
        }}
      />

      <ReminderModal
        isOpen={reminderModalData.isOpen}
        onClose={() =>
          setReminderModalData({ ...reminderModalData, isOpen: false })
        }
        serviceNo={reminderModalData.serviceNo}
        busStopCode={reminderModalData.busStopCode}
        busStopDesc={reminderModalData.busStopDesc}
        currentWaitMins={reminderModalData.currentWaitMins}
        onConfirmReminder={handleConfirmReminder}
      />
    </div>
  );
}
