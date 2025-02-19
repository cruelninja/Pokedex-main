const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'manifest.json');

fs.readFile(manifestPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading manifest.json:', err);
        return;
    }

    try {
        const manifest = JSON.parse(data);

        if (!manifest.version) {
            console.error('Error: "version" field missing in manifest.json');
            return;
        }

        const versionParts = manifest.version.split('.').map(Number);

        if (versionParts.length !== 3 || versionParts.some(isNaN)) {
            console.error('Error: Invalid version format in manifest.json');
            return;
        }

        versionParts[2] += 1; // Increment patch version
        manifest.version = versionParts.join('.');

        fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing to manifest.json:', err);
                return;
            }
            console.log('✅ Manifest version updated to', manifest.version);
        });

    } catch (jsonErr) {
        console.error('Error parsing manifest.json:', jsonErr);
    }
});
