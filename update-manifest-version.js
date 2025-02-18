const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'manifest.json');

// Load the manifest file
fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) throw err;

    const manifest = JSON.parse(data);
    
    // Increment version
    const versionParts = manifest.version.split('.').map(Number);
    versionParts[2] += 1; // Increment patch version
    manifest.version = versionParts.join('.');

    // Save the updated manifest
    fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8', (err) => {
        if (err) throw err;
        console.log('Manifest version updated to', manifest.version);
    });
});
