import { z } from 'zod';

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
