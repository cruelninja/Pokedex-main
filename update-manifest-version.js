const fs = require('fs');
const path = require('path');

// Path to the manifest file
const manifestPath = path.join(__dirname, 'manifest.json');

// Read the manifest file
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Split the version into parts (e.g., "1.0.0" -> ["1", "0", "0"])
const versionParts = manifest.version.split('.');

// Increment the patch version (e.g., "1.0.0" -> "1.0.1")
versionParts[2] = parseInt(versionParts[2]) + 1;

// Join the parts back into a version string
manifest.version = versionParts.join('.');

// Write the updated manifest back to the file
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Version updated to ${manifest.version}`);
