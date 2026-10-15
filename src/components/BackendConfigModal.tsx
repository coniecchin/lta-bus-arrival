import React, { useState } from 'react';
import {
  Server,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  ExternalLink,
} from 'lucide-react';
import {
  LtaApiConfig,
  getStoredApiConfig,
  saveApiConfig,
} from '../services/ltaApi';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<LtaApiConfig>(getStoredApiConfig());
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiConfig(config);
    onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (config.useMockFallback) {
      setTestStatus('success');
      setTestMessage('Simulation mode active. Real-time predictions running smoothly!');
      return;
    }

    setTestStatus('testing');
    try {
      const endpoint = config.backendBaseUrl.endsWith('/busarrival')
        ? config.backendBaseUrl
        : `${config.backendBaseUrl}/busarrival`;
      const url = `${endpoint}?BusStopCode=83139`;
      const res = await fetch(url);
      if (res.ok) {
        setTestStatus('success');
        setTestMessage('Backend connection verified! Received response from LTA proxy.');
      } else {
        setTestStatus('failed');
        setTestMessage(`Backend responded with HTTP status ${res.status}. Falling back to simulation if unreached.`);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestMessage(`Cannot connect to ${config.backendBaseUrl}: ${err.message || 'Network error'}`);
    }
  };

  const sampleExpressBackend = `// Sample Express Backend Route (server.ts)
// For Singapore LTA DataMall v2/v3 Proxy
import express from 'express';

const app = express();
const LTA_API_KEY = process.env.LTA_DATAMALL_KEY || 'YOUR_LTA_KEY_HERE';

// 1. Bus Arrival Endpoint
app.get('/api/lta/bus-arrival', async (req, res) => {
  const { BusStopCode, ServiceNo } = req.query;
  try {
    const url = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
    url.searchParams.set('BusStopCode', String(BusStopCode));
    if (ServiceNo) url.searchParams.set('ServiceNo', String(ServiceNo));

    const response = await fetch(url.toString(), {
      headers: { 'AccountKey': LTA_API_KEY, 'Accept': 'application/json' },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch LTA data' });
  }
});`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleExpressBackend);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Backend Connection & LTA DataMall Integration
              </h2>
              <p className="text-xs text-slate-400">
                Configure your future backend bridge or run in high-fidelity simulation.
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

        {/* Mode Toggle */}
        <div className="my-5 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-white block">
                  Frontend Simulation Mode
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Uses realistic Singapore LTA DataMall v2 simulation engine with live countdowns and GPS bus positions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={config.useMockFallback}
                onChange={(e) =>
                  setConfig({ ...config, useMockFallback: e.target.checked })
                }
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          {!config.useMockFallback && (
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Backend API Base URL
                </label>
                <input
                  type="text"
                  value={config.backendBaseUrl}
                  onChange={(e) =>
                    setConfig({ ...config, backendBaseUrl: e.target.value })
                  }
                  placeholder="/api/lta or https://api.mytransit.sg"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Optional LTA AccountKey Header (Passed if client-direct)
                </label>
                <input
                  type="password"
                  value={config.accountKeyHeader || ''}
                  onChange={(e) =>
                    setConfig({ ...config, accountKeyHeader: e.target.value })
                  }
                  placeholder="LTA DataMall API Key (Optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                {testStatus === 'testing' ? 'Testing Connection...' : 'Test Backend Connection'}
              </button>

              {testMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testStatus === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {testStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Copyable Backend Snippet for easy reference */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Ready-to-use Express Proxy Backend Template
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 scrollbar-thin">
              {sampleExpressBackend}
            </pre>
            <p className="text-[11px] text-slate-500">
              When you are ready to connect to your real LTA account key, mount this route in your backend server and the frontend will automatically fetch live official arrivals!
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-colors shadow-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
