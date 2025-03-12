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
    console.log("🔍 Current version:", manifest.version);

    if (!manifest.version) {
      console.error('❌ Error: "version" field missing in manifest.json');
      return;
    }

    // Split version string by '.' and ensure at least major and minor exist.
    const versionParts = manifest.version.split('.');
    if (versionParts.length < 2) {
      console.error('❌ Error: Version format is invalid. Expected at least two segments (major.minor).');
      return;
    }

    const major = Number(versionParts[0]);
    const minor = Number(versionParts[1]);

    if (isNaN(major) || isNaN(minor)) {
      console.error('❌ Error: Major or minor version is not a number.');
      return;
    }

    // Increment the minor (middle) version
    manifest.version = `${major}.${minor + 1}`;

    fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8', (err) => {
      if (err) {
        console.error('❌ Error writing to manifest.json:', err);
        return;
      }
      console.log('✅ Version updated to:', manifest.version);
    });

  } catch (jsonErr) {
    console.error('❌ Error parsing manifest.json:', jsonErr);
  }
});
