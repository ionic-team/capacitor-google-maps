const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

const tempPath = path.resolve('tmp_geojson_backup');
let geojsonPath = ''

try {
  geojsonPath = geojsonDependencyPath();
  if (geojsonPath && fs.existsSync(geojsonPath)) {
    fs.renameSync(geojsonPath, tempPath);
  }
  execSync('docgen --api GoogleMapInterface --output-readme README.md --output-json dist/docs.json', { stdio: 'inherit' });
} finally {
  if (fs.existsSync(tempPath) && geojsonPath) {
    fs.renameSync(tempPath, geojsonPath);
  }
}

/**
 * Returns the @types/geojson dependency path
 * 
 * This dependency had interfaces with the exact name that as this plugin's.
 * This was causing docgen to generate documentation from geojson instead of our interfaces.
 * This script gets wherever geojson is installed to temporarily remove it from installed packages so that docgen gets our interfaces.
 */
function geojsonDependencyPath() {
  // 1. check npm install path
  const geojsonPathNpm = path.resolve('../node_modules/@types/geojson');
  if (fs.existsSync(geojsonPath)) {
    return geojsonPathNpm;
  }
  // 2. check pnpm-style path
  const pnpmGlobs = glob.sync('../node_modules/.pnpm/@types+geojson@*/node_modules/@types/geojson');
  if (pnpmGlobs.length > 0) {
    const geojsonPathPnpm = path.resolve(pnpmGlobs[0]);
    if (fs.existsSync(geojsonPathPnpm)) {
      return geojsonPathPnpm;
    }
  }
  // 3. no geojson found
  return '';
}