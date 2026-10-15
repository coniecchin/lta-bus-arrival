import React, { useState } from 'react';
import {
  Accessibility,
  Bell,
  Layers,
  MapPin,
  Pin,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { LtaBusServiceArrival, LtaNextBus, BusLoad } from '../types/bus';
import { formatArrivalMinutes } from '../data/singaporeTransitData';

interface BusArrivalCardProps {
  serviceArrival: LtaBusServiceArrival;
  busStopCode: string;
  busStopDesc: string;
  onSetReminder: (serviceNo: string, arrivalIso: string, mins: number) => void;
  onPinService: (serviceNo: string) => void;
  isPinned: boolean;
  onViewOnMap?: (serviceNo: string, bus?: LtaNextBus) => void;
  timeFormat?: 'relative' | 'clock'; // 'relative' = 4 min; 'clock' = 08:34
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  serviceArrival,
  busStopCode,
  busStopDesc,
  onSetReminder,
  onPinService,
  isPinned,
  onViewOnMap,
  timeFormat = 'relative',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { ServiceNo, Operator, NextBus, NextBus2, NextBus3 } = serviceArrival;

  // Load styling helper
  const getLoadConfig = (load?: BusLoad) => {
    switch (load) {
      case 'SEA':
        return {
          label: 'Seats Available',
          shortLabel: 'Seats',
          textColor: 'text-emerald-400',
          barColor: 'bg-emerald-500',
          bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        };
      case 'SDA':
        return {
          label: 'Standing Available',
          shortLabel: 'Standing',
          textColor: 'text-amber-400',
          barColor: 'bg-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'LSD':
        return {
          label: 'Limited Standing',
          shortLabel: 'Crowded',
          textColor: 'text-rose-400',
          barColor: 'bg-rose-500',
          bgColor: 'bg-rose-500/10 border-rose-500/20',
        };
      default:
        return {
          label: 'No Data',
          shortLabel: '-',
          textColor: 'text-slate-500',
          barColor: 'bg-slate-700',
          bgColor: 'bg-slate-800/40 border-slate-700/30',
        };
    }
  };

  const getDeckLabel = (type?: string) => {
    if (type === 'DD') return 'Double Deck';
    if (type === 'BD') return 'Bendy Bus';
    return 'Single Deck';
  };

  const getOperatorName = (op: string) => {
    switch (op) {
      case 'SBST': return 'SBS Transit';
      case 'SMRT': return 'SMRT Buses';
      case 'TTS': return 'Tower Transit';
      case 'GAS': return 'Go-Ahead';
      default: return op;
    }
  };

  const renderArrivalBlock = (bus?: LtaNextBus, labelText: string = 'Next') => {
    if (!bus || !bus.EstimatedArrival) {
      return (
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-slate-600 min-w-[88px]">
          <span className="text-[10px] text-slate-500 font-medium">{labelText}</span>
          <span className="text-sm font-mono mt-1">-</span>
        </div>
      );
    }

    const { display, minutes, isArriving } = formatArrivalMinutes(bus.EstimatedArrival);
    const loadInfo = getLoadConfig(bus.Load);

    let formattedDisplay = display;
    if (timeFormat === 'clock' && bus.EstimatedArrival) {
      try {
        const d = new Date(bus.EstimatedArrival);
        formattedDisplay = d.toLocaleTimeString('en-SG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
      } catch {
        formattedDisplay = display;
      }
    }

    return (
      <div
        className={`flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${
          isArriving
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
        } min-w-[92px] sm:min-w-[104px]`}
      >
        <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-medium">
          <span>{labelText}</span>
          {bus.Feature === 'WAB' && (
            <span title="Wheelchair Accessible">
              <Accessibility className="w-3 h-3 text-emerald-400" />
            </span>
          )}
        </div>

        {/* Arrival Time */}
        <div className="my-1.5 text-center">
          <span
            className={`text-lg sm:text-xl font-bold font-mono tabular-nums tracking-tight ${
              isArriving ? 'text-emerald-400' : 'text-white'
            }`}
          >
            {formattedDisplay}
          </span>
        </div>

        {/* Load Bar & Deck indicator */}
        <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60 text-[10px]">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${loadInfo.barColor}`} />
            <span className={`font-mono text-[9px] ${loadInfo.textColor}`}>
              {loadInfo.shortLabel}
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[9px]">
            {bus.Type || 'SD'}
          </span>
        </div>
      </div>
    );
  };

  const next1Wait = NextBus?.EstimatedArrival ? formatArrivalMinutes(NextBus.EstimatedArrival).minutes : -1;

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all">
      {/* Top Card Bar */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
              {ServiceNo}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-slate-300">{getOperatorName(Operator)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{busStopCode}</span>
            </div>
            <div className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs mt-0.5">
              To: {busStopDesc}
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPinService(ServiceNo)}
            className={`p-2 rounded-lg border transition-colors ${
              isPinned
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title={isPinned ? 'Unpin service' : 'Pin for quick glance'}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-amber-400' : ''}`} />
          </button>

          {NextBus && NextBus.EstimatedArrival && (
            <button
              onClick={() => onSetReminder(ServiceNo, NextBus.EstimatedArrival, Math.max(1, next1Wait))}
              className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors"
              title="Set Arrival Reminder"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}

          {onViewOnMap && (
            <button
              onClick={() => onViewOnMap(ServiceNo, NextBus)}
              className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors"
              title="View on Live Map"
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Arrival Timings Grid (NextBus, NextBus2, NextBus3) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {renderArrivalBlock(NextBus, 'Next Bus')}
        {renderArrivalBlock(NextBus2, '2nd Bus')}
        {renderArrivalBlock(NextBus3, '3rd Bus')}
      </div>

      {/* Expandable vehicle telematics details */}
      {NextBus && (
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Next Vehicle Telematics ({NextBus.VehiclePlate || 'LTA GPS Active'})</span>
            </span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isExpanded && (
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Vehicle Plate</span>
                  <span className="font-bold text-white">{NextBus.VehiclePlate || 'SG5482M'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Speed</span>
                  <span className="tabular-nums">{NextBus.Speed || 28} km/h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Deck Type</span>
                  <span>{getDeckLabel(NextBus.Type)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Capacity Status</span>
                  <span className={getLoadConfig(NextBus.Load).textColor}>
                    {getLoadConfig(NextBus.Load).label}
                  </span>
                </div>
              </div>

              {NextBus.DistanceMeters && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Approx Distance to Stop:</span>
                  <span className="font-mono text-emerald-400 tabular-nums">
                    {NextBus.DistanceMeters > 1000
                      ? `${(NextBus.DistanceMeters / 1000).toFixed(1)} km`
                      : `${NextBus.DistanceMeters} m`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
