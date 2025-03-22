console.log("✅ contentScript.js loaded successfully.");

// Example: Modify the page to confirm script injection
document.body.insertAdjacentHTML('beforeend', '<p style="position:fixed;bottom:0;left:0;background:black;color:white;padding:5px;z-index:1000;">Pokédex Extension Active</p>');
