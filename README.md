# Obsidian EXIF Editor

Edit EXIF data directly within Obsidian.

## Features

- **Edit common EXIF fields** Description, Artist, Copyright, Date Taken, Software, Lens Model, User Comment)
- **Map view** to display GPS data

- **Advanced JSON editor** for editing the raw EXIF data if you know what you're doing

## Installation

### From Obsidian Community Plugins

1. Open **Settings → Community plugins**
2. Turn on **Community plugins** if not already enabled
3. Click **Browse** and search for "EXIF Editor"
4. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/chiubaca/obsidian-exif-editor/releases)
2. Extract the release assets (`main.js`, `manifest.json`, `styles.css`) to your vault's `.obsidian/plugins/exif-editor/` directory
3. Restart Obsidian or reload with `Ctrl/Cmd + R`
4. Go to **Settings → Community plugins → Installed plugins**
5. Find "EXIF Editor" and enable it

### From Source

```bash
git clone https://github.com/chiubaca/obsidian-exif-editor.git
cd obsidian-exif-editor
npm install
npm run build
```

Then copy `dist/main.js`, `dist/styles.css`, and `manifest.json` to your vault's `.obsidian/plugins/exif-editor/` directory.

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/chiubaca/obsidian-exif-editor.git
cd obsidian-exif-editor

# Install dependencies
npm install
```

### Build

```bash
# Production build (outputs to dist/)
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Obsidian](https://obsidian.md) for the amazing note-taking app
- [piexifjs](https://github.com/hMatoba/piexifjs) for EXIF handling
