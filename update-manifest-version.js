const fs = require('fs');
const manifestPath = './manifest.json';

// Read the manifest file
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update the version
manifest.version = process.argv[2];

// Write the updated manifest back to the file
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Updated manifest.json to version ${manifest.version}`);
