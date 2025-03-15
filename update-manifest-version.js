const fs = require('fs').promises;
const path = require('path');

const manifestPath = path.join(__dirname, 'manifest.json');

// Function to read the manifest file
async function readManifest() {
  try {
    const data = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Error reading manifest.json:', err.message);
    process.exit(1); // Exit to prevent further execution
  }
}

// Function to increment the patch version (X.Y.Z -> X.Y.(Z+1))
function incrementVersion(version) {
  let versionParts = version.split('.').map(Number);

  if (versionParts.length < 3 || versionParts.some(isNaN)) {
    throw new Error('Invalid version format. Expected "X.Y.Z"');
  }

  let [major, minor, patch] = versionParts;

  // Increment only the patch version
  patch++;

  return `${major}.${minor}.${patch}`;
}

// Function to write the updated manifest file
async function writeManifest(manifest) {
  try {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('✅ Manifest version updated to', manifest.version);
  } catch (err) {
    console.error('❌ Error writing to manifest.json:', err.message);
  }
}

// Main function to update the version
async function updateVersion() {
  const manifest = await readManifest();

  if (!manifest.version) {
    console.error('❌ Error: "version" field missing in manifest.json');
    return;
  }

  try {
    manifest.version = incrementVersion(manifest.version);
    await writeManifest(manifest);
  } catch (err) {
    console.error('❌', err.message);
  }
}

// Run the update
updateVersion();
