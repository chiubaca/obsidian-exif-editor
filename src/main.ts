import { Plugin, Notice, Setting, TFile, ItemView, WorkspaceLeaf } from 'obsidian';
// @ts-ignore
import * as piexif from 'piexifjs';

export const VIEW_TYPE_EXIF = 'exif-editor-view';

export class ExifEditorView extends ItemView {
  plugin: ExifEditorPlugin;
  file: TFile | null = null;
  exifData: any = null;
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

  async setFile(file: TFile) {
    this.file = file;
    await this.loadExifData();
    this.redraw();
  }

  async loadExifData() {
    if (!this.file) return;
    
    try {
      const arrayBuffer = await this.plugin.app.vault.readBinary(this.file);
      this.originalBinary = this.plugin.arrayBufferToBinaryString(arrayBuffer);
      
      try {
        this.exifData = piexif.load(this.originalBinary);
      } catch (e) {
        this.exifData = this.plugin.createEmptyExif();
      }
    } catch (error) {
      new Notice('Error reading image file');
      console.error(error);
    }
  }

  redraw() {
    const { contentEl } = this;
    contentEl.empty();
    
    if (!this.file) {
      contentEl.createEl('p', { text: 'No EXIF data' });
      return;
    }

    contentEl.createEl('h3', { text: this.file.name });
    
    const form = contentEl.createDiv('exif-form');
    
    const tagsToEdit = [
      { section: '0th', tag: 'ImageDescription', label: 'Description', placeholder: 'Image description' },
      { section: '0th', tag: 'Artist', label: 'Artist', placeholder: 'Photographer name' },
      { section: '0th', tag: 'Copyright', label: 'Copyright', placeholder: 'Copyright notice' },
      { section: 'Exif', tag: 'DateTimeOriginal', label: 'Date Taken', placeholder: 'YYYY:MM:DD HH:MM:SS' },
      { section: 'Exif', tag: 'Software', label: 'Software', placeholder: 'Software used' },
      { section: 'Exif', tag: 'LensModel', label: 'Lens Model', placeholder: 'Lens model' },
      { section: 'Exif', tag: 'UserComment', label: 'User Comment', placeholder: 'Tags, notes, or any free text...' },
    ];

    const sectionMap: Record<string, any> = {
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
      const value = this.exifData?.[section]?.[tagCode] || '';
      
      setting.addText(text => {
        text.setPlaceholder(placeholder)
          .setValue(value)
          .onChange((newValue) => {
            if (!this.exifData[section]) this.exifData[section] = {};
            if (tagCode !== undefined) {
              this.exifData[section][tagCode] = newValue;
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
        this.exifData = JSON.parse(jsonArea.value);
        new Notice('JSON parsed successfully');
      } catch (e) {
        new Notice('Invalid JSON');
      }
    };
    
    const buttonContainer = contentEl.createDiv({ cls: 'exif-button-container' });
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';

    buttonContainer.createEl('button', { text: 'Update from JSON', cls: 'mod-cta' }).addEventListener('click', updateJson);

    const saveBtn = buttonContainer.createEl('button', { text: 'Save EXIF', cls: 'mod-cta' });
    saveBtn.addEventListener('click', async () => {
      await this.plugin.saveExifData(this.file!, this.originalBinary, this.exifData);
    });
  }

  async onClose() {
    this.contentEl.empty();
  }

  clearView() {
    this.file = null;
    this.exifData = null;
    this.originalBinary = '';
    this.redraw();
  }
}

export default class ExifEditorPlugin extends Plugin {
  view: ExifEditorView | null = null;

  async onload() {
    this.registerView(VIEW_TYPE_EXIF, (leaf) => new ExifEditorView(leaf, this));

    this.addCommand({
      id: 'edit-exif',
      name: 'Edit EXIF data of current photo',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (file && this.isImageFile(file)) {
          if (!checking) {
            this.activateView(file);
          }
          return true;
        }
        return false;
      }
    });

    this.addRibbonIcon('camera', 'Edit EXIF', () => {
      const file = this.app.workspace.getActiveFile();
      if (file && this.isImageFile(file)) {
        this.activateView(file);
      } else {
        this.activateView();
      }
    });

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXIF)[0]?.view as ExifEditorView;
        if (view) {
          const file = this.app.workspace.getActiveFile();
          if (file && this.isImageFile(file)) {
            view.setFile(file);
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

  async activateView(file?: TFile) {
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

  createEmptyExif() {
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

  async saveExifData(file: TFile, originalBinary: string, exifData: any) {
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
