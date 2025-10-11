export interface Vehicle {
  출품번호: string;
  차량명: string;
  출품가: number;
  연식: number;
  주행거리: string;
  색상: string;
  연료: string;
  변속기?: string;
  평가점: string;
}

export interface RawVehicleData {
  출품번호: string;
  차량명: string;
  출품가: string;
  연식: string;
  주행거리: string;
  색상: string;
  연료: string;
  변속기?: string;
  평가점: string;
}

export interface VehicleStats {
  totalVehicles: number;
  averagePrice: number;
  averageMileage: number;
  yearRange: {
    min: number;
    max: number;
  };
  fuelTypes: Record<string, number>;
  transmissionTypes: Record<string, number>;
}

export interface ParseResult {
  data: Vehicle[];
  stats: VehicleStats;
  error?: string;
}
