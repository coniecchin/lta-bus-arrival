import React, { useState } from 'react';
import {
  Star,
  Pin,
  Trash2,
  Edit2,
  Check,
  MapPin,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { BusStop, SavedBusStop, LtaBusServiceArrival } from '../types/bus';
import { BusArrivalCard } from './BusArrivalCard';

interface BookmarksViewProps {
  savedStops: SavedBusStop[];
  stops: BusStop[];
  onSelectStopCode: (code: string) => void;
  onRemoveSavedStop: (code: string) => void;
  onUpdateStopLabel: (code: string, newLabel: string) => void;
  pinnedServices: string[];
  onPinService: (serviceNo: string) => void;
  arrivalsMap: Record<string, LtaBusServiceArrival[]>;
  onSetReminder: (serviceNo: string, arrivalIso: string, mins: number) => void;
  timeFormat: 'relative' | 'clock';
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  savedStops,
  stops,
  onSelectStopCode,
  onRemoveSavedStop,
  onUpdateStopLabel,
  pinnedServices,
  onPinService,
  arrivalsMap,
  onSetReminder,
  timeFormat,
}) => {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editLabelInput, setEditLabelInput] = useState('');

  const startEdit = (code: string, currentLabel: string = '') => {
    setEditingCode(code);
    setEditLabelInput(currentLabel);
  };

  const saveEdit = (code: string) => {
    onUpdateStopLabel(code, editLabelInput.trim());
    setEditingCode(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Saved Bus Stops & Pinned Commutes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick 1-tap glance for your daily commute to home, work, or school.
            </p>
          </div>
        </div>
      </div>

      {/* Bookmarked Bus Stops */}
      {savedStops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            No saved bus stops yet
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Click the star icon on any bus stop in the Nearby or Search tab to pin it here for instant access.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 mr-2">Suggested Hubs:</span>
            {['08057', '09048', '84009', '20009'].map((code) => {
              const stop = stops.find((s) => s.BusStopCode === code);
              if (!stop) return null;
              return (
                <button
                  key={code}
                  onClick={() => onSelectStopCode(code)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <span className="font-mono text-emerald-400 mr-1.5">{code}</span>
                  <span>{stop.Description}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {savedStops.map((saved) => {
            const stop = stops.find((s) => s.BusStopCode === saved.busStopCode);
            if (!stop) return null;

            const arrivals = arrivalsMap[stop.BusStopCode] || [];

            return (
              <div
                key={stop.BusStopCode}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
              >
                {/* Stop Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>

                    <div>
                      {editingCode === stop.BusStopCode ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabelInput}
                            onChange={(e) => setEditLabelInput(e.target.value)}
                            placeholder="e.g. Home, Office, Gym..."
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(stop.BusStopCode)}
                            className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg"
                            title="Save label"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white tracking-tight">
                            {saved.customLabel ? (
                              <>
                                <span className="text-emerald-400 mr-2">
                                  [{saved.customLabel}]
                                </span>
                                <span>{stop.Description}</span>
                              </>
                            ) : (
                              stop.Description
                            )}
                          </h3>
                          <button
                            onClick={() =>
                              startEdit(stop.BusStopCode, saved.customLabel || '')
                            }
                            className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
                            title="Edit label"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono text-emerald-400 font-semibold">
                          {stop.BusStopCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{stop.RoadName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectStopCode(stop.BusStopCode)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs text-emerald-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium"
                    >
                      <span>Full Stop View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveSavedStop(stop.BusStopCode)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Arriving Services at this saved stop */}
                {arrivals.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center font-mono">
                    Loading arrivals for Stop {stop.BusStopCode}...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {arrivals.slice(0, 4).map((arrival) => (
                      <BusArrivalCard
                        key={arrival.ServiceNo}
                        serviceArrival={arrival}
                        busStopCode={stop.BusStopCode}
                        busStopDesc={stop.Description}
                        onSetReminder={onSetReminder}
                        onPinService={onPinService}
                        isPinned={pinnedServices.includes(
                          `${stop.BusStopCode}-${arrival.ServiceNo}`
                        )}
                        timeFormat={timeFormat}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
