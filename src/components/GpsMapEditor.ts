import * as L from 'leaflet';
import { type ExifData, getGpsCoordinates, setGpsCoordinates, clearGpsCoordinates } from '../schemas/exif';

export class GpsMapEditor {
  private container: HTMLElement;
  private exifData: ExifData;
  private onChange: (data: ExifData) => void;
  private mapContainer: HTMLElement;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private latInput: HTMLInputElement | null = null;
  private lngInput: HTMLInputElement | null = null;
  private originalCoords: { lat: number; lng: number } | null = null;
  private overviewMap: L.Map | null = null;
  private overviewMarker: L.CircleMarker | null = null;

  constructor(
    container: HTMLElement,
    exifData: ExifData,
    onChange: (data: ExifData) => void
  ) {
    this.container = container;
    this.exifData = exifData;
    this.onChange = onChange;
    this.mapContainer = this.container.createDiv('gps-map-container');
    this.render();
  }

  setData(exifData: ExifData): void {
    this.exifData = exifData;
    this.updateMarkerFromData();
  }

  private render(): void {
    this.mapContainer.empty();

    const mapEl = this.mapContainer.createDiv('gps-map');

    const coords = getGpsCoordinates(this.exifData);
    if (coords) {
      this.originalCoords = { ...coords };
    }
    const initialLat = coords?.lat ?? 0;
    const initialLng = coords?.lng ?? 0;

    this.map = L.map(mapEl, {
      center: [initialLat, initialLng],
      zoom: coords ? 14 : 2,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);

    const customIcon = L.divIcon({
      className: 'gps-map-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    this.marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker!.setLatLng(e.latlng);
      this.updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    // Overview / viewfinder map
    const overviewEl = mapEl.createDiv('gps-overview-map');
    this.overviewMap = L.map(overviewEl, {
      center: [initialLat, initialLng],
      zoom: 3,
      dragging: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.overviewMap);

    this.overviewMarker = L.circleMarker([initialLat, initialLng], {
      radius: 4,
      fillColor: 'var(--interactive-accent)',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(this.overviewMap);

    const inputsRow = this.mapContainer.createDiv('gps-map-inputs');

    const latWrapper = inputsRow.createDiv('gps-map-input-wrapper');
    latWrapper.createEl('label', { text: 'Latitude' });
    this.latInput = latWrapper.createEl('input', {
      type: 'text',
      cls: 'gps-map-input',
    });
    this.latInput.value = coords ? String(coords.lat.toFixed(6)) : '';
    this.latInput.addEventListener('change', () => this.handleManualInput());

    const lngWrapper = inputsRow.createDiv('gps-map-input-wrapper');
    lngWrapper.createEl('label', { text: 'Longitude' });
    this.lngInput = lngWrapper.createEl('input', {
      type: 'text',
      cls: 'gps-map-input',
    });
    this.lngInput.value = coords ? String(coords.lng.toFixed(6)) : '';
    this.lngInput.addEventListener('change', () => this.handleManualInput());

    const actionsRow = this.mapContainer.createDiv('gps-map-actions');

    const resetBtn = actionsRow.createEl('button', {
      text: 'Reset Location',
      cls: 'gps-map-btn',
    });
    resetBtn.addEventListener('click', () => {
      if (this.originalCoords) {
        this.marker!.setLatLng([this.originalCoords.lat, this.originalCoords.lng]);
        this.map!.setView([this.originalCoords.lat, this.originalCoords.lng], 14);
        this.updateCoordinates(this.originalCoords.lat, this.originalCoords.lng);
      } else {
        clearGpsCoordinates(this.exifData);
        this.onChange(this.exifData);
        this.marker!.setLatLng([0, 0]);
        this.map!.setView([0, 0], 2);
        if (this.latInput) this.latInput.value = '';
        if (this.lngInput) this.lngInput.value = '';
      }
    });
  }

  private updateCoordinates(lat: number, lng: number): void {
    setGpsCoordinates(this.exifData, lat, lng);
    this.onChange(this.exifData);
    if (this.latInput) this.latInput.value = lat.toFixed(6);
    if (this.lngInput) this.lngInput.value = lng.toFixed(6);
    if (this.overviewMarker) this.overviewMarker.setLatLng([lat, lng]);
    if (this.overviewMap) this.overviewMap.setView([lat, lng], 3);
  }

  private handleManualInput(): void {
    if (!this.latInput || !this.lngInput) return;
    const lat = parseFloat(this.latInput.value);
    const lng = parseFloat(this.lngInput.value);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    this.marker!.setLatLng([lat, lng]);
    this.map!.setView([lat, lng], 14);
    setGpsCoordinates(this.exifData, lat, lng);
    this.onChange(this.exifData);
  }

  private updateMarkerFromData(): void {
    const coords = getGpsCoordinates(this.exifData);
    if (!coords || !this.marker || !this.map) return;
    this.marker.setLatLng([coords.lat, coords.lng]);
    this.map.setView([coords.lat, coords.lng], 14);
    if (this.latInput) this.latInput.value = coords.lat.toFixed(6);
    if (this.lngInput) this.lngInput.value = coords.lng.toFixed(6);
    if (this.overviewMarker) this.overviewMarker.setLatLng([coords.lat, coords.lng]);
    if (this.overviewMap) this.overviewMap.setView([coords.lat, coords.lng], 3);
  }
}
