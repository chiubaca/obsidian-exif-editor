export class JsonTreeEditor {
  private container: HTMLElement;
  private data: unknown;
  private onChange: (data: unknown) => void;
  private orientation: number;
  private expandedPaths: Set<string> = new Set();
  private expandedThumbnails: Set<string> = new Set();
  private editingPath: string | null = null;
  private editingKeyPath: string | null = null;

  constructor(
    container: HTMLElement,
    data: unknown,
    onChange: (data: unknown) => void,
    orientation: number = 1
  ) {
    this.container = container;
    this.data = data;
    this.onChange = onChange;
    this.orientation = orientation;
    this.render();
  }

  setData(data: unknown): void {
    this.data = data;
    this.render();
  }

  getData(): unknown {
    return this.data;
  }

  private render(): void {
    this.container.empty();
    this.container.addClass('json-tree-editor');
    const tree = this.container.createDiv('json-tree');
    this.renderValue(tree, this.data, '', 0);
  }

  private renderValue(
    container: HTMLElement,
    value: unknown,
    path: string,
    depth: number
  ): void {
    if (value === null) {
      const span = container.createSpan({ text: 'null', cls: 'json-null json-editable' });
      if (this.editingPath !== path) {
        span.addEventListener('click', () => this.startEdit(path, value));
      }
    } else if (typeof value === 'boolean') {
      const span = container.createSpan({ text: String(value), cls: 'json-boolean json-editable' });
      if (this.editingPath !== path) {
        span.addEventListener('click', () => this.startEdit(path, value));
      }
    } else if (typeof value === 'number') {
      const span = container.createSpan({ text: String(value), cls: 'json-number json-editable' });
      if (this.editingPath !== path) {
        span.addEventListener('click', () => this.startEdit(path, value));
      }
    } else if (typeof value === 'string') {
      const span = container.createSpan({ cls: 'json-string json-editable' });
      span.textContent = `"${value}"`;
      if (this.editingPath !== path) {
        span.addEventListener('click', () => this.startEdit(path, value));
      }
    } else if (Array.isArray(value)) {
      this.renderArray(container, value, path, depth);
    } else if (typeof value === 'object') {
      this.renderObject(container, value as Record<string, unknown>, path, depth);
    }
  }

  private startEdit(path: string, originalValue: unknown): void {
    this.editingPath = path;
    this.render();

    const input = this.container.querySelector(`[data-path="${path}"]`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  private getValueAtPath(path: string): unknown {
    if (path === '') return this.data;
    const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
    let current: unknown = this.data;
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  private setValueAtPath(path: string, newValue: unknown): void {
    if (path === '') {
      this.data = newValue;
      return;
    }

    const parts = path.split(/\.|\[(\d+)\]/).filter(Boolean);
    const lastKey = parts.pop()!;
    let current: unknown = this.data;

    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      }
    }

    if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[lastKey] = newValue;
    }
  }

  private parseValue(input: string, originalValue: unknown): unknown {
    const trimmed = input.trim();

    if (trimmed === 'null') return null;
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }

    return trimmed;
  }

  private isThumbnailData(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    if (value.length < 100) return false;
    // Thumbnail data from piexifjs is a raw binary string, not Base64
    return true;
  }

  private calculateBinarySize(binaryString: string): string {
    const bytes = binaryString.length;
    if (bytes < 1024) {
      return `${bytes}B`;
    }
    return `${(bytes / 1024).toFixed(1)}KB`;
  }

  private toggleThumbnail(path: string): void {
    if (this.expandedThumbnails.has(path)) {
      this.expandedThumbnails.delete(path);
    } else {
      this.expandedThumbnails.add(path);
    }
    this.render();
  }

  private commitEdit(path: string, input: HTMLInputElement): void {
    const rawValue = input.value;
    const originalValue = this.getValueAtPath(path);
    const newValue = this.parseValue(rawValue, originalValue);

    this.setValueAtPath(path, newValue);
    this.editingPath = null;
    this.onChange(this.data);
    this.render();
  }

  private cancelEdit(): void {
    this.editingPath = null;
    this.render();
  }

  private renderEditableValue(
    container: HTMLElement,
    path: string,
    value: unknown
  ): void {
    const input = container.createEl('input', {
      cls: 'json-inline-input',
      attr: { 'data-path': path },
    });

    if (value === null) {
      input.value = 'null';
    } else if (typeof value === 'boolean') {
      input.value = String(value);
    } else if (typeof value === 'number') {
      input.value = String(value);
    } else if (typeof value === 'string') {
      input.value = value;
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.commitEdit(path, input);
      } else if (e.key === 'Escape') {
        this.cancelEdit();
      }
    });

    input.addEventListener('blur', () => {
      this.commitEdit(path, input);
    });
  }

  private renderThumbnail(
    container: HTMLElement,
    binaryData: string,
    path: string
  ): void {
    const isExpanded = this.expandedThumbnails.has(path);
    const size = this.calculateBinarySize(binaryData);

    if (!isExpanded) {
      const placeholder = container.createSpan({
        cls: 'json-thumbnail-placeholder',
        text: `<embedded image: ${size}>`,
      });
      placeholder.addEventListener('click', () => this.toggleThumbnail(path));
    } else {
      const previewContainer = container.createDiv('json-thumbnail-preview');

      try {
        // Convert raw binary string to Uint8Array
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        // Create blob and object URL
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);

        const img = previewContainer.createEl('img', {
          cls: `json-thumbnail-image json-orientation-${this.orientation}`,
        });
        img.src = url;
        img.alt = 'Thumbnail preview';

        // Clean up object URL after image loads to prevent memory leaks
        img.addEventListener('load', () => {
          URL.revokeObjectURL(url);
        });
      } catch {
        previewContainer.createSpan({
          text: 'Unable to render thumbnail',
          cls: 'json-thumbnail-error',
        });
      }

      const hideBtn = previewContainer.createEl('button', {
        text: 'Hide',
        cls: 'json-thumbnail-hide-btn',
      });
      hideBtn.addEventListener('click', () => this.toggleThumbnail(path));
    }
  }

  private renderObject(
    container: HTMLElement,
    obj: Record<string, unknown>,
    path: string,
    depth: number
  ): void {
    const keys = Object.keys(obj);
    const isEmpty = keys.length === 0;

    if (isEmpty) {
      container.createSpan({ text: '{}', cls: 'json-bracket' });
      return;
    }

    const isExpanded = this.expandedPaths.has(path) || depth < 1;

    const header = container.createDiv('json-object-header');
    const toggle = header.createSpan({
      cls: `json-toggle ${isExpanded ? 'is-expanded' : ''}`,
      text: isExpanded ? '▼' : '▶',
    });

    header.createSpan({ text: '{', cls: 'json-bracket' });

    if (!isExpanded) {
      header.createSpan({
        text: ` ${keys.length} ${keys.length === 1 ? 'item' : 'items'} `,
        cls: 'json-collapsed-info',
      });
      header.createSpan({ text: '}', cls: 'json-bracket' });
    }

    toggle.addEventListener('click', () => {
      if (isExpanded) {
        this.expandedPaths.delete(path);
      } else {
        this.expandedPaths.add(path);
      }
      this.render();
    });

    if (isExpanded) {
      const body = container.createDiv('json-object-body');

      keys.forEach((key, index) => {
        const row = body.createDiv('json-row');
        const childPath = path ? `${path}.${key}` : key;

        if (this.editingKeyPath === childPath) {
          this.renderEditableKey(row, obj, key, childPath);
        } else {
          const keySpan = row.createSpan({
            text: `"${key}": `,
            cls: 'json-key',
          });

          keySpan.addEventListener('click', () => {
            this.startKeyEdit(childPath);
          });
        }

        const valueContainer = row.createSpan('json-value-container');

        if (key === 'thumbnail' && this.isThumbnailData(obj[key])) {
          this.renderThumbnail(valueContainer, obj[key] as string, childPath);
        } else if (this.editingPath === childPath) {
          this.renderEditableValue(valueContainer, childPath, obj[key]);
        } else {
          this.renderValue(valueContainer, obj[key], childPath, depth + 1);
        }

        if (index < keys.length - 1) {
          row.createSpan({ text: ',', cls: 'json-comma' });
        }
      });

      const closing = container.createDiv('json-closing-bracket');
      closing.createSpan({ text: '}', cls: 'json-bracket' });
    }
  }

  private renderArray(
    container: HTMLElement,
    arr: unknown[],
    path: string,
    depth: number
  ): void {
    if (arr.length === 0) {
      container.createSpan({ text: '[]', cls: 'json-bracket' });
      return;
    }

    const isExpanded = this.expandedPaths.has(path) || depth < 1;

    const header = container.createDiv('json-array-header');
    const toggle = header.createSpan({
      cls: `json-toggle ${isExpanded ? 'is-expanded' : ''}`,
      text: isExpanded ? '▼' : '▶',
    });

    header.createSpan({ text: '[', cls: 'json-bracket' });

    if (!isExpanded) {
      header.createSpan({
        text: ` ${arr.length} ${arr.length === 1 ? 'item' : 'items'} `,
        cls: 'json-collapsed-info',
      });
      header.createSpan({ text: ']', cls: 'json-bracket' });
    }

    toggle.addEventListener('click', () => {
      if (isExpanded) {
        this.expandedPaths.delete(path);
      } else {
        this.expandedPaths.add(path);
      }
      this.render();
    });

    if (isExpanded) {
      const body = container.createDiv('json-array-body');

      arr.forEach((item, index) => {
        const row = body.createDiv('json-row');
        const valueContainer = row.createSpan('json-value-container');
        const childPath = path ? `${path}[${index}]` : `[${index}]`;

        if (this.editingPath === childPath) {
          this.renderEditableValue(valueContainer, childPath, item);
        } else {
          this.renderValue(valueContainer, item, childPath, depth + 1);
        }

        if (index < arr.length - 1) {
          row.createSpan({ text: ',', cls: 'json-comma' });
        }
      });

      const closing = container.createDiv('json-closing-bracket');
      closing.createSpan({ text: ']', cls: 'json-bracket' });
    }
  }

  private startKeyEdit(path: string): void {
    this.editingKeyPath = path;
    this.render();
  }

  private renderEditableKey(
    container: HTMLElement,
    obj: Record<string, unknown>,
    oldKey: string,
    path: string
  ): void {
    const input = container.createEl('input', {
      cls: 'json-inline-input json-key-input',
    });
    input.value = oldKey;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.commitKeyEdit(obj, oldKey, input.value, path);
      } else if (e.key === 'Escape') {
        this.cancelKeyEdit();
      }
    });

    input.addEventListener('blur', () => {
      this.commitKeyEdit(obj, oldKey, input.value, path);
    });

    requestAnimationFrame(() => {
      input.focus();
      input.select();
    });

    container.createSpan({ text: ': ', cls: 'json-key' });
  }

  private commitKeyEdit(
    obj: Record<string, unknown>,
    oldKey: string,
    newKey: string,
    path: string
  ): void {
    this.editingKeyPath = null;
    if (newKey && newKey !== oldKey) {
      obj[newKey] = obj[oldKey];
      delete obj[oldKey];
      this.onChange(this.data);
    }
    this.render();
  }

  private cancelKeyEdit(): void {
    this.editingKeyPath = null;
    this.render();
  }
}
