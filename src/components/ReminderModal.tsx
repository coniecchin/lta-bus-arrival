import React, { useState } from 'react';
import { Bell, X, Check, Volume2, Clock } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceNo: string;
  busStopCode: string;
  busStopDesc: string;
  currentWaitMins: number;
  onConfirmReminder: (targetMins: number) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  serviceNo,
  busStopCode,
  busStopDesc,
  currentWaitMins,
  onConfirmReminder,
}) => {
  const [targetMinutes, setTargetMinutes] = useState<number>(
    Math.max(1, Math.min(2, currentWaitMins - 1))
  );

  if (!isOpen) return null;

  const playChimePreview = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // ignore
    }
  };

  const handleConfirm = () => {
    playChimePreview();
    onConfirmReminder(targetMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Set Arrival Reminder
              </h2>
              <p className="text-xs text-slate-400">
                Service {serviceNo} at {busStopCode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block mb-1">Target Stop</span>
            <span className="text-white font-bold block">{busStopDesc}</span>
            <span className="text-emerald-400 font-mono mt-0.5 block">
              Currently arriving in ~{currentWaitMins} min
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Alert me when bus is:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mins: 1, label: '1 min away' },
                { mins: 2, label: '2 mins away' },
                { mins: 5, label: '5 mins away' },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  onClick={() => setTargetMinutes(opt.mins)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    targetMinutes === opt.mins
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={playChimePreview}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors py-1"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test notification chime</span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Set Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
