import { z } from 'zod';
import * as piexif from 'piexifjs';

export const ExifSectionSchema = z.record(z.string(), z.unknown());

export const ExifDataSchema = z.object({
  '0th': ExifSectionSchema.default({}),
  'Exif': ExifSectionSchema.default({}),
  'GPS': ExifSectionSchema.default({}),
  '1st': ExifSectionSchema.default({}),
  'thumbnail': z.unknown().nullable().default(null),
});

export type ExifData = z.infer<typeof ExifDataSchema>;
export type ExifSection = z.infer<typeof ExifSectionSchema>;

export function safeParseExifData(data: unknown): ExifData | null {
  const result = ExifDataSchema.safeParse(data);
  return result.success ? result.data : null;
}

export function ensureExifSection(data: ExifData, section: keyof ExifData): ExifSection {
  const existing = data[section];
  if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
    return existing as ExifSection;
  }
  const newSection: ExifSection = {};
  data[section] = newSection;
  return newSection;
}

export function getExifValue(data: ExifData, section: keyof ExifData, tagCode: number): string {
  const sectionData = ensureExifSection(data, section);
  const value = sectionData[tagCode];
  return value !== undefined && value !== null ? String(value) : '';
}

export function setExifValue(data: ExifData, section: keyof ExifData, tagCode: number, value: string): void {
  const sectionData = ensureExifSection(data, section);
  sectionData[tagCode] = value;
}

export function createEmptyExif(): ExifData {
  return ExifDataSchema.parse({
    '0th': {},
    'Exif': {},
    'GPS': {},
    '1st': {},
    'thumbnail': null,
  });
}

// GPS rational format: [[degNum, degDen], [minNum, minDen], [secNum, secDen]]
export type GpsRational = [[number, number], [number, number], [number, number]];

export function dmsToDecimal(dms: GpsRational, ref: string): number {
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

export function decimalToDms(value: number, isLatitude: boolean): { dms: GpsRational; ref: string } {
  const ref = isLatitude
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W';

  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutesFloat = (absValue - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return {
    dms: [
      [degrees, 1],
      [minutes, 1],
      [Math.round(seconds * 10000), 10000],
    ] as GpsRational,
    ref,
  };
}

export function getGpsCoordinates(data: ExifData): { lat: number; lng: number } | null {
  const gps = data.GPS;
  if (!gps || typeof gps !== 'object') return null;

  const latDms = gps[piexif.GPSIFD.GPSLatitude];
  const latRef = gps[piexif.GPSIFD.GPSLatitudeRef];
  const lngDms = gps[piexif.GPSIFD.GPSLongitude];
  const lngRef = gps[piexif.GPSIFD.GPSLongitudeRef];

  if (
    !Array.isArray(latDms) || latDms.length !== 3 ||
    !Array.isArray(lngDms) || lngDms.length !== 3 ||
    typeof latRef !== 'string' || typeof lngRef !== 'string'
  ) {
    return null;
  }

  try {
    const lat = dmsToDecimal(latDms as GpsRational, latRef);
    const lng = dmsToDecimal(lngDms as GpsRational, lngRef);
    return { lat, lng };
  } catch {
    return null;
  }
}

export function setGpsCoordinates(data: ExifData, lat: number, lng: number): void {
  const gps = ensureExifSection(data, 'GPS');
  const latData = decimalToDms(lat, true);
  const lngData = decimalToDms(lng, false);

  gps[piexif.GPSIFD.GPSLatitude] = latData.dms;
  gps[piexif.GPSIFD.GPSLatitudeRef] = latData.ref;
  gps[piexif.GPSIFD.GPSLongitude] = lngData.dms;
  gps[piexif.GPSIFD.GPSLongitudeRef] = lngData.ref;
}

export function clearGpsCoordinates(data: ExifData): void {
  const gps = ensureExifSection(data, 'GPS');
  delete gps[piexif.GPSIFD.GPSLatitude];
  delete gps[piexif.GPSIFD.GPSLatitudeRef];
  delete gps[piexif.GPSIFD.GPSLongitude];
  delete gps[piexif.GPSIFD.GPSLongitudeRef];
  delete gps[piexif.GPSIFD.GPSAltitude];
  delete gps[piexif.GPSIFD.GPSAltitudeRef];
}
