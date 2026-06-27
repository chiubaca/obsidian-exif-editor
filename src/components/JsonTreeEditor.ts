export class JsonTreeEditor {
  private container: HTMLElement;
  private data: unknown;
  private onChange: (data: unknown) => void;
  private expandedPaths: Set<string> = new Set();

  constructor(
    container: HTMLElement,
    data: unknown,
    onChange: (data: unknown) => void
  ) {
    this.container = container;
    this.data = data;
    this.onChange = onChange;
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
      container.createSpan({ text: 'null', cls: 'json-null' });
    } else if (typeof value === 'boolean') {
      container.createSpan({ text: String(value), cls: 'json-boolean' });
    } else if (typeof value === 'number') {
      container.createSpan({ text: String(value), cls: 'json-number' });
    } else if (typeof value === 'string') {
      const span = container.createSpan({ cls: 'json-string' });
      span.textContent = `"${value}"`;
    } else if (Array.isArray(value)) {
      this.renderArray(container, value, path, depth);
    } else if (typeof value === 'object') {
      this.renderObject(container, value as Record<string, unknown>, path, depth);
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
      body.style.marginLeft = '20px';

      keys.forEach((key, index) => {
        const row = body.createDiv('json-row');
        const keySpan = row.createSpan({
          text: `"${key}": `,
          cls: 'json-key',
        });

        keySpan.addEventListener('click', () => {
          this.editKey(obj, key, path, () => this.render());
        });

        const valueContainer = row.createSpan('json-value-container');
        this.renderValue(valueContainer, obj[key], `${path}.${key}`, depth + 1);

        if (index < keys.length - 1) {
          row.createSpan({ text: ',', cls: 'json-comma' });
        }
      });

      const closing = container.createDiv('json-closing-bracket');
      closing.style.marginLeft = `${depth * 20}px`;
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
      body.style.marginLeft = '20px';

      arr.forEach((item, index) => {
        const row = body.createDiv('json-row');
        const valueContainer = row.createSpan('json-value-container');
        this.renderValue(valueContainer, item, `${path}[${index}]`, depth + 1);

        if (index < arr.length - 1) {
          row.createSpan({ text: ',', cls: 'json-comma' });
        }
      });

      const closing = container.createDiv('json-closing-bracket');
      closing.style.marginLeft = `${depth * 20}px`;
      closing.createSpan({ text: ']', cls: 'json-bracket' });
    }
  }

  private editKey(
    obj: Record<string, unknown>,
    oldKey: string,
    path: string,
    onUpdate: () => void
  ): void {
    const newKey = prompt('Rename key:', oldKey);
    if (newKey && newKey !== oldKey) {
      obj[newKey] = obj[oldKey];
      delete obj[oldKey];
      this.onChange(this.data);
      onUpdate();
    }
  }
}
