import React, { useState, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Bus,
  Layers,
  MapPin,
  ChevronRight,
  X,
  Gauge,
  Users,
} from 'lucide-react';
import { BusStop, LiveBusVehicle, BusRoute } from '../types/bus';
import { SG_BUS_ROUTES } from '../data/singaporeTransitData';

interface LiveTransitMapProps {
  stops: BusStop[];
  liveBuses: LiveBusVehicle[];
  selectedStopCode?: string;
  onSelectStopCode: (code: string) => void;
  selectedServiceNo?: string;
  onSelectServiceNo?: (service: string) => void;
}

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({
  stops,
  liveBuses,
  selectedStopCode,
  onSelectStopCode,
  selectedServiceNo,
  onSelectServiceNo,
}) => {
  // Singapore map coordinate boundaries
  const SG_BOUNDS = {
    minLat: 1.230,
    maxLat: 1.470,
    minLng: 103.620,
    maxLng: 104.020,
  };

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1.8); // 1 to 4
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedBus, setSelectedBus] = useState<LiveBusVehicle | null>(null);
  const [filterService, setFilterService] = useState<string>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Convert GPS (lat, lng) to SVG coordinates (0 - 1000, 0 - 650)
  const coordsToSvg = (lat: number, lng: number) => {
    const x = ((lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng)) * 1000;
    // Invert Y because latitude goes North (+) but SVG Y goes down (+)
    const y = ((SG_BOUNDS.maxLat - lat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat)) * 650;
    return { x, y };
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 4.5));
  };

  const resetView = () => {
    setZoom(1.8);
    setPan({ x: 0, y: 0 });
    setSelectedBus(null);
  };

  const jumpToArea = (lat: number, lng: number, targetZoom: number = 2.8) => {
    const target = coordsToSvg(lat, lng);
    // Center of 1000x650
    const centerX = 500;
    const centerY = 325;
    setZoom(targetZoom);
    setPan({
      x: (centerX - target.x) * targetZoom,
      y: (centerY - target.y) * targetZoom,
    });
  };

  // Filtered buses
  const filteredBuses = useMemo(() => {
    if (filterService === 'all') return liveBuses;
    return liveBuses.filter((b) => b.serviceNo === filterService);
  }, [liveBuses, filterService]);

  // Active route polylines
  const activeRoutes = useMemo(() => {
    if (filterService === 'all') return SG_BUS_ROUTES;
    return SG_BUS_ROUTES.filter((r) => r.ServiceNo === filterService);
  }, [filterService]);

  // Selected stop object
  const activeStop = useMemo(() => {
    return stops.find((s) => s.BusStopCode === selectedStopCode);
  }, [stops, selectedStopCode]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col h-[750px]">
      {/* Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Filter service tabs */}
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl flex items-center gap-1 shadow-lg pointer-events-auto max-w-full overflow-x-auto">
          <button
            onClick={() => setFilterService('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterService === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            All Buses ({liveBuses.length})
          </button>
          {SG_BUS_ROUTES.map((route) => (
            <button
              key={route.ServiceNo}
              onClick={() => setFilterService(route.ServiceNo)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-colors ${
                filterService === route.ServiceNo
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Bus {route.ServiceNo}
            </button>
          ))}
        </div>

        {/* Quick jump presets & zoom */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg text-xs">
            <button
              onClick={() => jumpToArea(1.2992, 103.8458, 3.2)}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Orchard / CBD
            </button>
            <button
              onClick={() => jumpToArea(1.3331, 103.7423, 3.0)}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Jurong
            </button>
            <button
              onClick={() => jumpToArea(1.3532, 103.9400, 3.0)}
              className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Tampines
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg">
            <button
              onClick={() => handleZoom(0.3)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.3)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Reset Map View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full bg-[#0b1329] cursor-grab active:cursor-grabbing select-none relative overflow-hidden"
      >
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '500px 325px',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="transitGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>

            {/* Bus vehicle glow */}
            <filter id="busGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="650" fill="#090e1f" />
          <rect width="1000" height="650" fill="url(#transitGrid)" />

          {/* Singapore Strait & Water boundaries */}
          <path
            d="M 0,0 L 1000,0 L 1000,650 L 0,650 Z"
            fill="#060c1d"
          />

          {/* Singapore Mainland Outline (Authentic geometry representation) */}
          <path
            d="M 230,120 
               C 270,95 340,90 410,110
               C 470,120 540,115 620,135
               C 700,160 780,185 860,240
               C 920,290 950,350 930,410
               C 900,450 830,470 750,470
               C 660,475 580,490 510,510
               C 440,530 360,545 310,520
               C 260,490 220,440 180,390
               C 140,340 110,290 130,220
               C 150,170 190,140 230,120 Z"
            fill="#131e38"
            stroke="#1e2d52"
            strokeWidth="3"
          />

          {/* Sentosa Island */}
          <ellipse cx="440" cy="555" rx="42" ry="16" fill="#131e38" stroke="#1e2d52" strokeWidth="2" />
          {/* Pulau Ubin */}
          <ellipse cx="780" cy="180" rx="45" ry="18" fill="#131e38" stroke="#1e2d52" strokeWidth="2" />
          {/* Jurong Island */}
          <polygon points="190,460 270,440 280,490 220,530 160,500" fill="#131e38" stroke="#1e2d52" strokeWidth="2" />

          {/* Major Singapore Expressways Network (PIE, AYE, CTE, ECP, SLE, BKE) */}
          <g stroke="rgba(255, 255, 255, 0.12)" strokeWidth="2.5" fill="none">
            {/* PIE (Tuas to Changi) */}
            <path d="M 160,380 Q 300,320 500,330 T 880,350" />
            {/* AYE (Tuas to CBD) */}
            <path d="M 170,440 Q 320,430 480,480" />
            {/* CTE (Ang Mo Kio to CBD) */}
            <path d="M 540,160 Q 520,300 500,490" />
            {/* ECP (CBD to Changi Airport) */}
            <path d="M 500,490 Q 680,470 890,380" />
            {/* BKE (Woodlands to PIE) */}
            <path d="M 410,130 Q 390,240 380,330" />
            {/* TPE (Seletar to Changi) */}
            <path d="M 580,180 Q 750,220 860,320" />
          </g>

          {/* Bus Route Polylines (Glowing tracks) */}
          {activeRoutes.map((route) => {
            const pathPoints = route.Coordinates.map((c) => {
              const svgPt = coordsToSvg(c[0], c[1]);
              return `${svgPt.x},${svgPt.y}`;
            }).join(' L ');

            const isRouteHighlighted =
              filterService === route.ServiceNo ||
              selectedBus?.serviceNo === route.ServiceNo;

            return (
              <g key={`route-${route.ServiceNo}`}>
                {/* Glow backdrop */}
                <path
                  d={`M ${pathPoints}`}
                  fill="none"
                  stroke={isRouteHighlighted ? '#10b981' : '#334155'}
                  strokeWidth={isRouteHighlighted ? 6 : 2}
                  strokeOpacity={isRouteHighlighted ? 0.4 : 0.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Main line */}
                <path
                  d={`M ${pathPoints}`}
                  fill="none"
                  stroke={isRouteHighlighted ? '#34d399' : '#475569'}
                  strokeWidth={isRouteHighlighted ? 3 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={isRouteHighlighted ? 'none' : '4,3'}
                />
              </g>
            );
          })}

          {/* Bus Stops (Circles) */}
          {stops.map((stop) => {
            const pt = coordsToSvg(stop.Latitude, stop.Longitude);
            const isSelected = stop.BusStopCode === selectedStopCode;

            return (
              <g
                key={stop.BusStopCode}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStopCode(stop.BusStopCode);
                }}
              >
                {/* Hit target */}
                <circle r="14" fill="transparent" />

                {/* Selected halo */}
                {isSelected && (
                  <circle
                    r="9"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="2,2"
                    className="animate-spin"
                  />
                )}

                {/* Stop marker dot */}
                <circle
                  r={isSelected ? 5 : 3}
                  fill={isSelected ? '#10b981' : '#94a3b8'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Hover label at high zoom */}
                {zoom >= 2.2 && (
                  <text
                    y="-8"
                    textAnchor="middle"
                    fill={isSelected ? '#34d399' : '#cbd5e1'}
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    className="pointer-events-none select-none drop-shadow"
                  >
                    {stop.BusStopCode}
                  </text>
                )}
              </g>
            );
          })}

          {/* Live Buses (Animated vehicles with heading arrow & service label) */}
          {filteredBuses.map((bus) => {
            const pt = coordsToSvg(bus.latitude, bus.longitude);
            const isSelected = selectedBus?.id === bus.id;

            return (
              <g
                key={bus.id}
                transform={`translate(${pt.x}, ${pt.y})`}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBus(bus);
                }}
              >
                {/* Large clickable target */}
                <circle r="18" fill="transparent" />

                {/* Pulsing ring */}
                <circle
                  r="12"
                  fill="#10b981"
                  fillOpacity="0.25"
                  className="animate-ping"
                  style={{ animationDuration: '2.5s' }}
                />

                {/* Bus vehicle marker background */}
                <circle
                  r="9"
                  fill={isSelected ? '#34d399' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  filter="url(#busGlow)"
                />

                {/* Direction arrow based on bearing */}
                <path
                  d="M 0,-6 L 3,3 L 0,1 L -3,3 Z"
                  fill="#042f2e"
                  transform={`rotate(${bus.bearing})`}
                />

                {/* Service Badge Tag */}
                <g transform="translate(0, 16)">
                  <rect
                    x="-14"
                    y="-6"
                    width="28"
                    height="12"
                    rx="4"
                    fill="#042f2e"
                    stroke="#10b981"
                    strokeWidth="1"
                  />
                  <text
                    textAnchor="middle"
                    y="3"
                    fill="#34d399"
                    fontSize="8"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {bus.serviceNo}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Live Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl shadow-xl text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300 font-mono text-[11px]">Live GPS Bus ({filteredBuses.length} online)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-400 font-mono text-[11px]">Bus Stop ({stops.length} mapped)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-400 rounded" />
            <span className="text-slate-400 font-mono text-[11px]">Active Route Corridor</span>
          </div>
        </div>

        {/* Selected Bus Inspection Modal Popup */}
        {selectedBus && (
          <div className="absolute bottom-4 right-4 z-30 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-lg text-white">
                  {selectedBus.serviceNo}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                    <span>{selectedBus.plate}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{selectedBus.operator}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Heading {selectedBus.bearing}° · {selectedBus.type === 'DD' ? 'Double Deck' : selectedBus.type === 'BD' ? 'Bendy' : 'Single Deck'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBus(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CURRENT SPEED</span>
                <span className="font-bold text-white tabular-nums">{selectedBus.speed} km/h</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">CROWD STATUS</span>
                <span className={selectedBus.load === 'SEA' ? 'text-emerald-400 font-bold' : selectedBus.load === 'SDA' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                  {selectedBus.load === 'SEA' ? 'Seats Available' : selectedBus.load === 'SDA' ? 'Standing Only' : 'Crowded'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs mb-3">
              <span className="text-[10px] text-slate-500 block mb-0.5">NEXT STOP</span>
              <div className="flex items-center justify-between text-white font-medium">
                <span className="truncate">{selectedBus.nextStopDesc}</span>
                <span className="font-mono text-emerald-400 shrink-0 ml-2">~{selectedBus.estimatedArrivalMins} min</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectStopCode(selectedBus.nextStopCode);
                setSelectedBus(null);
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Stop Arrivals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
