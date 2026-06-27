# Obsidian EXIF Editor

Edit EXIF metadata of JPEG photos directly within Obsidian. This plugin allows you to view and modify photo metadata including description, artist, copyright, date taken, camera settings, and more.

## Features

- Edit common EXIF fields through a user-friendly form
- Advanced JSON editor for raw EXIF data manipulation
- Supports JPEG/JPG image files
- Works entirely within Obsidian - no external tools needed

## Installation

### Manual Installation

1. Download or clone this repository
2. Build the plugin: `npm install && npm run build`
3. Copy these files to your vault's `.obsidian/plugins/exif-editor/` directory:
   - `main.js` (compiled plugin)
   - `manifest.json`
   - `styles.css`
4. Restart Obsidian or reload with `Ctrl/Cmd + R`
5. Go to Settings → Community plugins → Installed plugins
6. Find "EXIF Editor" and enable it

**Note:** You only need the three files listed above. The `src/`, `node_modules/`, and config files are not needed in the plugins folder.

### From Source

```bash
git clone https://github.com/yourusername/obsidian-exif-editor.git
cd obsidian-exif-editor
npm install
npm run build
```

Then copy the folder to your vault's `.obsidian/plugins/` directory.

## Usage

### Editing EXIF Data

1. Open a JPEG image file in Obsidian
2. Use one of these methods:
   - **Command Palette**: Press `Ctrl/Cmd + P`, type "Edit EXIF", select "Edit EXIF data of current photo"
   - **Ribbon Icon**: Click the camera icon in the left ribbon
3. Modify the fields in the modal:
   - **Description**: Image description or caption
   - **Artist**: Photographer name
   - **Copyright**: Copyright notice
   - **Date Taken**: Format as `YYYY:MM:DD HH:MM:SS`
   - **Software**: Software used to edit the photo
   - **Lens Model**: Camera lens information
4. Use the "Advanced: Raw EXIF JSON" section for full control over all EXIF data
5. Click "Save EXIF" to write changes to the file

### Supported Image Formats

- `.jpg`, `.jpeg`, `.JPG`, `.JPEG`

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/obsidian-exif-editor.git
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

The compiled plugin will be output to `dist/main.js`.

### Local Development with Hot Reload

1. Build the plugin: `npm run dev`
2. Create a symbolic link from your vault's plugins folder to this directory:
   ```bash
   ln -s /path/to/obsidian-exif-editor ~/.obsidian/plugins/exif-editor
   ```
3. Enable the plugin in Obsidian settings
4. Changes will automatically rebuild - reload Obsidian with `Ctrl/Cmd + R` to see updates

### Project Structure

```
obsidian-exif-editor/
├── src/
│   └── main.ts          # Plugin source code
├── main.js              # Compiled plugin (generated)
├── manifest.json         # Plugin manifest
├── styles.css           # Plugin styles
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
└── README.md            # This file
```

## Dependencies

- [piexifjs](https://github.com/hMatoba/piexifjs) - Pure JavaScript library for reading/writing EXIF data
- [obsidian](https://github.com/obsidianmd/obsidian-api) - Obsidian API types
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler

## Known Limitations

- Only supports JPEG/JPG files (EXIF standard format)
- PNG, WebP, and other formats are not supported
- GPS data editing is available through the JSON editor
- Some specialized EXIF tags may require manual JSON editing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have feature requests, please file an issue on the GitHub repository.

## Acknowledgments

- [Obsidian](https://obsidian.md) for the amazing note-taking app
- [piexifjs](https://github.com/hMatoba/piexifjs) for EXIF handling
