console.log("✅ contentScript.js loaded successfully.");

// Insert a confirmation message (optional)
document.body.insertAdjacentHTML(
  'beforeend',
  '<p style="position:fixed;bottom:0;left:0;background:black;color:white;padding:5px;z-index:1000;">Pokédex Extension Active</p>'
);

// Automatically open the side panel if the API is available
if (chrome && chrome.sidePanel && chrome.sidePanel.open) {
  chrome.sidePanel.open()
    .then(() => {
      console.log("✅ Side panel opened automatically.");
    })
    .catch(err => {
      console.error("❌ Failed to open side panel:", err);
    });
}
