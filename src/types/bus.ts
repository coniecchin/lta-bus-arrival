/**
 * Singapore LTA DataMall Bus API Types & Domain Models
 */

// LTA DataMall Load Standards
export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available | Standing Available | Limited Standing

// LTA DataMall Vehicle Type Standards
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck | Double Deck | Bendy

// LTA Bus Operators in Singapore
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS'; // SBS Transit, SMRT, Tower Transit, Go-Ahead Singapore

export interface LtaNextBus {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO-8601 string, e.g., "2026-10-15T08:12:30+08:00"
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: 'WAB' | ''; // Wheelchair Accessible Bus
  Type: BusType;
  // Augmented real-time telemetry (simulated or enriched via backend)
  VehiclePlate?: string;
  Speed?: number; // km/h
  Bearing?: number; // heading degrees 0-360
  DistanceMeters?: number;
}

export interface LtaBusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: LtaNextBus;
  NextBus2?: LtaNextBus;
  NextBus3?: LtaNextBus;
}

export interface LtaBusArrivalResponse {
  'odata.metadata'?: string;
  BusStopCode: string;
  Services: LtaBusServiceArrival[];
}

export interface BusStop {
  BusStopCode: string;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  Services: string[];
  DistanceMeters?: number;
  Region?: 'Central' | 'East' | 'West' | 'North' | 'North-East';
}

export interface BusRouteStop {
  BusStopCode: string;
  StopSequence: number;
  DistanceKm: number;
  RoadName: string;
  Description: string;
  Latitude: number;
  Longitude: number;
  EstimatedWaitMins?: number;
}

export interface BusRoute {
  ServiceNo: string;
  Operator: BusOperator;
  Direction: 1 | 2;
  OriginCode: string;
  OriginDesc: string;
  DestinationCode: string;
  DestinationDesc: string;
  Category: 'Trunk' | 'Feeder' | 'Express';
  OperatingHours: string;
  FrequencyPeak: string;
  FrequencyOffPeak: string;
  Stops: BusRouteStop[];
  Coordinates: [number, number][]; // [lat, lng] path
}

export interface LiveBusVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  plate: string;
  type: BusType;
  load: BusLoad;
  feature: 'WAB' | '';
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number;
  nextStopCode: string;
  nextStopDesc: string;
  estimatedArrivalMins: number;
  direction: 1 | 2;
  routeProgress: number; // 0 to 1 along the route
}

export interface SavedBusStop {
  busStopCode: string;
  customLabel?: string;
  savedAt: number;
}

export interface PinnedService {
  busStopCode: string;
  serviceNo: string;
  customNote?: string;
}

export interface ArrivalReminder {
  id: string;
  busStopCode: string;
  serviceNo: string;
  targetMins: number;
  triggerTime: number;
  busStopDesc: string;
  isActive: boolean;
}

export interface UserLocationPreset {
  name: string;
  area: string;
  lat: number;
  lng: number;
}
