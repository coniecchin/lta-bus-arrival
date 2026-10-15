/**
 * Singapore LTA DataMall API Service Layer
 * 
 * Provides unified access to LTA bus arrival predictions, stops, and routes.
 * Operates in high-fidelity simulation mode by default, and seamlessly routes
 * to an Express/Cloud Run proxy backend when configured.
 */

import {
  BusStop,
  BusRoute,
  LiveBusVehicle,
  LtaBusArrivalResponse
} from '../types/bus';
import {
  SG_BUS_STOPS,
  SG_BUS_ROUTES,
  generateMockLtaArrival,
  generateLiveBuses
} from '../data/singaporeTransitData';

export interface LtaApiConfig {
  useMockFallback: boolean;
  backendBaseUrl: string; // e.g. "/api/lta" or "http://localhost:3000/api/lta"
  accountKeyHeader?: string; // Optional LTA AccountKey header
}

const STORAGE_KEY = 'sg_bus_api_config';

export function getStoredApiConfig(): LtaApiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    useMockFallback: true,
    backendBaseUrl: '/api/lta',
  };
}

export function saveApiConfig(config: LtaApiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

/**
 * Fetch real-time bus arrivals for a given 5-digit bus stop code.
 * Follows LTA DataMall v2: /BusArrivalv2?BusStopCode={code}&ServiceNo={serviceNo}
 */
export async function getBusArrival(
  busStopCode: string,
  serviceNo?: string,
  config: LtaApiConfig = getStoredApiConfig()
): Promise<LtaBusArrivalResponse> {
  if (!config.useMockFallback && config.backendBaseUrl) {
    try {
      const url = new URL(
        `${config.backendBaseUrl}/bus-arrival`,
        window.location.origin
      );
      url.searchParams.set('BusStopCode', busStopCode);
      if (serviceNo) {
        url.searchParams.set('ServiceNo', serviceNo);
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (config.accountKeyHeader) {
        headers['AccountKey'] = config.accountKeyHeader;
      }

      const res = await fetch(url.toString(), { headers });
      if (res.ok) {
        const data = await res.json();
        return data as LtaBusArrivalResponse;
      }
      console.warn(`Backend returned ${res.status}, falling back to local simulation`);
    } catch (err) {
      console.warn('Backend request failed, falling back to local simulation:', err);
    }
  }

  // Frontend simulation mode
  return generateMockLtaArrival(busStopCode);
}

/**
 * Fetch all bus stops
 */
export async function getBusStops(
  config: LtaApiConfig = getStoredApiConfig()
): Promise<BusStop[]> {
  if (!config.useMockFallback && config.backendBaseUrl) {
    try {
      const res = await fetch(`${config.backendBaseUrl}/bus-stops`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.value)) {
          return data.value;
        }
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // fallback
    }
  }

  return SG_BUS_STOPS;
}

/**
 * Fetch routes
 */
export async function getBusRoutes(
  serviceNo?: string,
  config: LtaApiConfig = getStoredApiConfig()
): Promise<BusRoute[]> {
  if (!config.useMockFallback && config.backendBaseUrl) {
    try {
      const url = new URL(`${config.backendBaseUrl}/bus-routes`, window.location.origin);
      if (serviceNo) url.searchParams.set('ServiceNo', serviceNo);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // fallback
    }
  }

  if (serviceNo) {
    return SG_BUS_ROUTES.filter(r => r.ServiceNo === serviceNo);
  }
  return SG_BUS_ROUTES;
}

/**
 * Fetch live bus vehicle positions
 */
export function getLiveBuses(timestampSec: number = Math.floor(Date.now() / 1000)): LiveBusVehicle[] {
  return generateLiveBuses(timestampSec);
}
