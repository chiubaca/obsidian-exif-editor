declare module 'piexifjs' {
  export interface ExifData {
    '0th'?: Record<string, unknown>;
    'Exif'?: Record<string, unknown>;
    'GPS'?: Record<string, unknown>;
    '1st'?: Record<string, unknown>;
    'thumbnail'?: unknown;
  }

  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;
  export const IopIFD: Record<string, number>;

  export function load(binary: string): ExifData;
  export function dump(data: ExifData): string;
  export function insert(dump: string, binary: string): string;
}
