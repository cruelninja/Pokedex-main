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

// Function to update the version
function incrementVersion(version) {
  let versionParts = version.split('.').map(Number);

  if (versionParts.length < 2 || versionParts.some(isNaN)) {
    throw new Error('Invalid version format. Expected "X.Y"');
  }

  let [major, minor] = versionParts;

  // If minor reaches 9, reset to 0 and increment major
  minor = minor >= 9 ? 0 : minor + 1;
  major = minor === 0 ? major + 1 : major;

  return `${major}.${minor}`;
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
