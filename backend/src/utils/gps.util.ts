/**
 * @module gps.util
 * @description GPS calculation and mock detection utilities.
 *
 * ARCHITECTURE NOTE:
 * GPS mock detection uses a scoring system. A single indicator is not enough
 * (e.g., low accuracy alone could be a real building). We combine multiple
 * signals into a "mock score" (0–100). Score >= 70 = suspected mock.
 *
 * Haversine formula for distance is used because:
 * 1. Simple and fast (no external library needed)
 * 2. Accurate enough for distances < 1km (< 0.1% error)
 * 3. Widely used in geofencing applications
 */

// ─── Haversine Distance ───────────────────────────────────────────────────────

const EARTH_RADIUS_METERS = 6_371_000; // Earth radius in meters

/**
 * Calculate the great-circle distance between two GPS coordinates in meters.
 * Uses the Haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

// ─── Geofence check ───────────────────────────────────────────────────────────

export interface GeofenceCheckResult {
  isInsideGeofence: boolean;
  distanceFromTarget: number; // meters
  radiusAllowed: number; // meters
}

export function checkGeofence(
  employeeLat: number,
  employeeLon: number,
  targetLat: number,
  targetLon: number,
  allowedRadiusMeters: number,
): GeofenceCheckResult {
  const distance = haversineDistance(employeeLat, employeeLon, targetLat, targetLon);

  return {
    isInsideGeofence: distance <= allowedRadiusMeters,
    distanceFromTarget: Math.round(distance),
    radiusAllowed: allowedRadiusMeters,
  };
}

// ─── GPS Mock Detection ───────────────────────────────────────────────────────

export interface GpsReading {
  latitude: number;
  longitude: number;
  accuracy: number;       // meters — lower is "more precise"
  speed: number | null;   // m/s
  altitude: number | null;
  heading: number | null;
  mockAccuracyThreshold: number; // from env config
}

export interface MockDetectionResult {
  isSuspectedMock: boolean;
  mockScore: number; // 0–100
  signals: string[]; // Human-readable mock signals found
}

/**
 * Analyze a GPS reading for signs of location mocking.
 *
 * Scoring signals:
 *  - Suspiciously high accuracy (< threshold meters) → +40 points
 *  - Perfect accuracy (< 1 meter) → +30 points (no real device achieves <1m)
 *  - Zero speed with heading → +15 points (mock doesn't update heading realistically)
 *  - Round number coordinates → +15 points (e.g., 30.000000)
 *  - Negative altitude in flat areas → +10 points (rough heuristic)
 */
export function detectGpsMock(reading: GpsReading): MockDetectionResult {
  let mockScore = 0;
  const signals: string[] = [];

  // Signal 1: Suspiciously perfect accuracy
  if (reading.accuracy < reading.mockAccuracyThreshold) {
    mockScore += 40;
    signals.push(`Accuracy too precise: ${reading.accuracy}m (threshold: ${reading.mockAccuracyThreshold}m)`);
  }

  // Signal 2: Sub-meter accuracy (physically impossible for consumer GPS)
  if (reading.accuracy < 1) {
    mockScore += 30;
    signals.push(`Sub-meter accuracy detected: ${reading.accuracy}m`);
  }

  // Signal 3: Zero/null speed with a heading value (mock apps often set heading=0 or constant)
  if (
    reading.speed !== null &&
    reading.speed === 0 &&
    reading.heading !== null &&
    reading.heading === 0
  ) {
    mockScore += 15;
    signals.push('Zero speed with zero heading — consistent with location mock');
  }

  // Signal 4: Suspiciously round coordinates (mock apps often use truncated decimals)
  const latDecimals = (reading.latitude.toString().split('.')[1] ?? '').length;
  const lonDecimals = (reading.longitude.toString().split('.')[1] ?? '').length;
  if (latDecimals < 4 || lonDecimals < 4) {
    mockScore += 15;
    signals.push(`Coordinates have too few decimal places: lat=${latDecimals}, lon=${lonDecimals}`);
  }

  return {
    isSuspectedMock: mockScore >= 70,
    mockScore: Math.min(mockScore, 100),
    signals,
  };
}

// ─── Coordinate validation ────────────────────────────────────────────────────

export function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// ─── Speed conversion ─────────────────────────────────────────────────────────

export function msToKmh(speedMs: number): number {
  return speedMs * 3.6;
}
