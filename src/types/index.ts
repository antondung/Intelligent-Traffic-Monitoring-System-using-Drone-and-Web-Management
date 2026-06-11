// ══════════════════════════════════════════════════════
// SENTINEL — Type Definitions
// ══════════════════════════════════════════════════════

export interface VehicleDetection {
  id: number;
  trackId: number;
  type: 'car' | 'motorbike' | 'truck' | 'bus' | 'person' | 'bicycle';
  confidence: number;
  speed: number;
  bbox: { x: number; y: number; w: number; h: number };
  color: string;
  licensePlate?: string;
}

export interface TrafficViolation {
  id: string;
  timestamp: string;
  licensePlate: string;
  vehicleType: string;
  violationType: 'wrong_lane' | 'red_light' | 'opposite_direction' | 'illegal_parking' | 'speeding';
  ocrScore: number;
  aiConfidence: number;
  location: string;
  snapshot: string;
  plateUrl?: string;
  status: 'pending' | 'confirmed' | 'dismissed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: {
    type: 'traffic' | 'route' | 'violation' | 'stats';
    payload: Record<string, unknown>;
  };
}

export interface AlertData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export type VehicleType = 'car' | 'motorbike' | 'truck' | 'bus' | 'person' | 'bicycle';

export const VEHICLE_COLORS: Record<VehicleType, string> = {
  car: '#00D4FF',
  motorbike: '#A855F7',
  truck: '#F59E0B',
  bus: '#22C55E',
  person: '#EC4899',
  bicycle: '#10B981',
};

export const VIOLATION_LABELS: Record<string, string> = {
  wrong_lane: 'Sai làn đường',
  red_light: 'Vượt đèn đỏ',
  opposite_direction: 'Đi ngược chiều',
  illegal_parking: 'Đỗ xe trái phép',
  speeding: 'Quá tốc độ',
};
