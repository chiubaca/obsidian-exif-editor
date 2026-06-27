# Obsidian EXIF Editor

Edit EXIF metadata of JPEG photos directly within Obsidian. This plugin allows you to view and modify photo metadata including description, artist, copyright, date taken, camera settings, user comments/tags, and more.

## Features

- **Edit common EXIF fields** through a user-friendly form (Description, Artist, Copyright, Date Taken, Software, Lens Model, User Comment)
- **Interactive JSON tree editor** for raw EXIF data with collapsible nodes, syntax highlighting, and inline editing
- **Toggle between Tree and Text views** for the advanced JSON editor
- **Type-safe EXIF validation** using Zod schemas
- Supports JPEG/JPG image files
- Works entirely within Obsidian - no external tools needed

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

## Usage

### Editing EXIF Data

1. Open a JPEG image file in Obsidian
2. Use one of these methods:
   - **Command Palette**: Press `Ctrl/Cmd + P`, type "Edit EXIF", select "Edit EXIF data of current photo"
   - **Ribbon Icon**: Click the camera icon in the left ribbon
3. Modify the fields in the sidebar panel:
   - **Description**: Image description or caption
   - **Artist**: Photographer name
   - **Copyright**: Copyright notice
   - **Date Taken**: Format as `YYYY:MM:DD HH:MM:SS`
   - **Software**: Software used to edit the photo
   - **Lens Model**: Camera lens information
   - **User Comment**: Tags, notes, or any free text
4. Use the **"Advanced: Raw EXIF JSON"** section for full control over all EXIF data
   - **Tree View**: Click values to edit inline. Supports smart type parsing (numbers, booleans, null)
   - **Text View**: Raw JSON textarea for power users
5. Click **"Save EXIF"** to write changes to the file

### Supported Image Formats

- `.jpg`, `.jpeg`, `.JPG`, `.JPEG`

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

# Development with watch mode (auto-rebuilds on changes)
npm run dev
```

The compiled plugin will be output to `dist/`:
- `dist/main.js` - Compiled plugin bundle
- `dist/styles.css` - Plugin styles (copied from src/)

### Copy to Local Vault

```bash
npm run copy-to-vault
```

This copies `dist/main.js`, `dist/styles.css`, and `manifest.json` to your local Obsidian vault for testing.

### Local Development with Hot Reload

1. Build the plugin: `npm run dev`
2. Create a symbolic link from your vault's plugins folder to the dist directory:
   ```bash
   ln -s /path/to/obsidian-exif-editor/dist ~/.obsidian/plugins/exif-editor
   cp manifest.json ~/.obsidian/plugins/exif-editor/
   ```
3. Enable the plugin in Obsidian settings
4. Changes will automatically rebuild - reload Obsidian with `Ctrl/Cmd + R` to see updates

### Project Structure

```
obsidian-exif-editor/
├── src/                     # Source files
│   ├── main.ts              # Plugin entry point
│   ├── schemas/
│   │   └── exif.ts          # Zod schemas for EXIF validation
│   ├── components/
│   │   └── JsonTreeEditor.ts # Interactive JSON tree editor
│   └── styles.css           # Plugin styles
├── dist/                    # Build output (not tracked in git)
│   ├── main.js              # Compiled plugin bundle
│   └── styles.css           # Copied styles
├── manifest.json            # Plugin manifest (Obsidian reads this)
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript configuration
├── esbuild.config.mjs       # Build configuration
├── LICENSE                  # MIT License
└── README.md                # This file
```

## Dependencies

- [piexifjs](https://github.com/hMatoba/piexifjs) - Pure JavaScript library for reading/writing EXIF data
- [zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation with static type inference
- [obsidian](https://github.com/obsidianmd/obsidian-api) - Obsidian API types
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler

## Known Limitations

- Only supports JPEG/JPG files (EXIF standard format)
- PNG, WebP, and other formats are not supported
- GPS data editing is available through the JSON editor
- Some specialized EXIF tags may require manual JSON editing
- Thumbnail data appears as Base64-encoded text in the JSON view (this is normal)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please file an issue on the [GitHub repository](https://github.com/chiubaca/obsidian-exif-editor/issues).

## Acknowledgments

- [Obsidian](https://obsidian.md) for the amazing note-taking app
- [piexifjs](https://github.com/hMatoba/piexifjs) for EXIF handling
