import { Plugin, Notice, Setting, TFile, ItemView, WorkspaceLeaf } from 'obsidian';
import * as piexif from 'piexifjs';
import type { ExifData } from 'piexifjs';

export const VIEW_TYPE_EXIF = 'exif-editor-view';

interface TagConfig {
  section: string;
  tag: string;
  label: string;
  placeholder: string;
}

export class ExifEditorView extends ItemView {
  plugin: ExifEditorPlugin;
  file: TFile | null = null;
  exifData: ExifData | null = null;
  originalBinary: string = '';

  constructor(leaf: WorkspaceLeaf, plugin: ExifEditorPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_EXIF;
  }

  getDisplayText(): string {
    return 'EXIF Editor';
  }

  getIcon(): string {
    return 'camera';
  }

  async setFile(file: TFile): Promise<void> {
    this.file = file;
    await this.loadExifData();
    this.redraw();
  }

  async loadExifData(): Promise<void> {
    if (!this.file) return;

    try {
      const arrayBuffer = await this.plugin.app.vault.readBinary(this.file);
      this.originalBinary = this.plugin.arrayBufferToBinaryString(arrayBuffer);

      try {
        this.exifData = piexif.load(this.originalBinary);
      } catch {
        this.exifData = this.plugin.createEmptyExif();
      }
    } catch (error) {
      new Notice('Error reading image file');
      console.error(error);
    }
  }

  redraw(): void {
    const { contentEl } = this;
    contentEl.empty();

    if (!this.file) {
      contentEl.createEl('p', { text: 'No EXIF data' });
      return;
    }

    contentEl.createEl('h3', { text: this.file.name });

    const form = contentEl.createDiv('exif-form');

    const tagsToEdit: TagConfig[] = [
      { section: '0th', tag: 'ImageDescription', label: 'Description', placeholder: 'Image description' },
      { section: '0th', tag: 'Artist', label: 'Artist', placeholder: 'Photographer name' },
      { section: '0th', tag: 'Copyright', label: 'Copyright', placeholder: 'Copyright notice' },
      { section: 'Exif', tag: 'DateTimeOriginal', label: 'Date Taken', placeholder: 'YYYY:MM:DD HH:MM:SS' },
      { section: 'Exif', tag: 'Software', label: 'Software', placeholder: 'Software used' },
      { section: 'Exif', tag: 'LensModel', label: 'Lens Model', placeholder: 'Lens model' },
      { section: 'Exif', tag: 'UserComment', label: 'User Comment', placeholder: 'Tags, notes, or any free text...' },
    ];

    const sectionMap: Record<string, Record<string, number>> = {
      '0th': piexif.ImageIFD,
      'Exif': piexif.ExifIFD,
      'GPS': piexif.GPSIFD,
      '1st': piexif.IopIFD,
    };

    tagsToEdit.forEach(({ section, tag, label, placeholder }) => {
      const setting = new Setting(form)
        .setName(label)
        .setDesc(`${section}.${tag}`);

      const sectionObj = sectionMap[section];
      const tagCode = sectionObj?.[tag];
      const sectionData = this.exifData?.[section as keyof ExifData];
      const value = (typeof sectionData === 'object' && sectionData !== null && tagCode !== undefined)
        ? String((sectionData as Record<string, unknown>)[tagCode] ?? '')
        : '';

      setting.addText(text => {
        text.setPlaceholder(placeholder)
          .setValue(value)
          .onChange((newValue) => {
            if (!this.exifData) this.exifData = this.plugin.createEmptyExif();
            const sectionKey = section as keyof ExifData;
            if (!this.exifData[sectionKey] || typeof this.exifData[sectionKey] !== 'object') {
              this.exifData[sectionKey] = {};
            }
            if (tagCode !== undefined) {
              (this.exifData[sectionKey] as Record<string, unknown>)[tagCode] = newValue;
            }
          });
      });
    });

    contentEl.createEl('h4', { text: 'Advanced: Raw EXIF JSON' });
    const jsonArea = contentEl.createEl('textarea', {
      cls: 'exif-json-editor',
      attr: { rows: '8', style: 'width: 100%; font-family: monospace;' }
    });
    jsonArea.value = JSON.stringify(this.exifData, null, 2);

    const updateJson = () => {
      try {
        this.exifData = JSON.parse(jsonArea.value) as ExifData;
        new Notice('JSON parsed successfully');
      } catch {
        new Notice('Invalid JSON');
      }
    };

    const buttonContainer = contentEl.createDiv({ cls: 'exif-button-container' });

    buttonContainer.createEl('button', { text: 'Update from JSON', cls: 'mod-cta' }).addEventListener('click', updateJson);

    const saveBtn = buttonContainer.createEl('button', { text: 'Save EXIF', cls: 'mod-cta' });
    saveBtn.addEventListener('click', () => {
      void this.plugin.saveExifData(this.file!, this.originalBinary, this.exifData);
    });
  }

  async onClose(): Promise<void> {
    this.contentEl.empty();
  }

  clearView(): void {
    this.file = null;
    this.exifData = null;
    this.originalBinary = '';
    this.redraw();
  }
}

export default class ExifEditorPlugin extends Plugin {
  view: ExifEditorView | null = null;

  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_EXIF, (leaf) => new ExifEditorView(leaf, this));

    this.addCommand({
      id: 'edit-exif',
      name: 'Edit EXIF data of current photo',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && this.isImageFile(file)) {
          if (!checking) {
            void this.activateView(file);
          }
          return true;
        }
        return false;
      }
    });

    this.addRibbonIcon('camera', 'Edit EXIF', () => {
      const file = this.app.workspace.getActiveFile();
      if (file && this.isImageFile(file)) {
        void this.activateView(file);
      } else {
        void this.activateView();
      }
    });

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXIF)[0]?.view as ExifEditorView | undefined;
        if (view) {
          const file = this.app.workspace.getActiveFile();
          if (file && this.isImageFile(file)) {
            void view.setFile(file);
          } else {
            view.clearView();
          }
        }
      })
    );
  }

  isImageFile(file: TFile): boolean {
    return ['jpg', 'jpeg', 'JPG', 'JPEG'].includes(file.extension);
  }

  async activateView(file?: TFile): Promise<void> {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_EXIF)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false)!;
      await leaf.setViewState({ type: VIEW_TYPE_EXIF });
    }

    workspace.revealLeaf(leaf);

    const view = leaf.view as ExifEditorView;
    if (file) {
      await view.setFile(file);
    }
  }

  createEmptyExif(): ExifData {
    return {
      '0th': {},
      'Exif': {},
      'GPS': {},
      '1st': {},
      'thumbnail': null
    };
  }

  arrayBufferToBinaryString(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return binary;
  }

  binaryStringToArrayBuffer(binary: string): ArrayBuffer {
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  async saveExifData(file: TFile, originalBinary: string, exifData: ExifData | null): Promise<void> {
    if (!exifData) {
      new Notice('No EXIF data to save');
      return;
    }

    try {
      const exifDump = piexif.dump(exifData);
      const newBinary = piexif.insert(exifDump, originalBinary);
      const arrayBuffer = this.binaryStringToArrayBuffer(newBinary);
      await this.app.vault.modifyBinary(file, arrayBuffer);
      new Notice('EXIF data saved successfully');
    } catch (error) {
      new Notice('Error saving EXIF data');
      console.error(error);
    }
  }
}
