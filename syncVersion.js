const fs = require('fs').promises;
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const manifestPath = path.join(__dirname, 'manifest.json');

async function syncVersions() {
  try {
    // Read package.json
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    if (!packageJson.version) {
      throw new Error('Version not found in package.json');
    }

    // Read manifest.json
    const manifestJson = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    
    // Update manifest version to match package.json
    manifestJson.version = packageJson.version;

    // Write updated manifest.json
    await fs.writeFile(manifestPath, JSON.stringify(manifestJson, null, 2), 'utf8');
    console.log('✅ Synced manifest.json version to', packageJson.version);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

// Run the sync
syncVersions();
