# Install steps
1. Clone the repository
2. Run the following command to install the dependencies
```bash
pnpm install
```
3. Copy the ffmpeg files from node_modules to public folder
```bash
mkdir -p public/ffmpeg 
cp node_modules/@ffmpeg/core/dist/esm/* public/ffmpeg
```