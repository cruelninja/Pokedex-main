(function() {
  // Create a draggable overlay for battle info if not already present.
  let overlay = document.getElementById('battle-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'battle-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.right = '10px';
    overlay.style.zIndex = '10000';
    overlay.style.background = 'rgba(0, 0, 0, 0.85)';
    overlay.style.color = '#fff';
    overlay.style.padding = '15px';
    overlay.style.borderRadius = '8px';
    overlay.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
    overlay.style.cursor = 'move';
    overlay.style.maxWidth = '300px';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    
    // Make the overlay draggable.
    overlay.addEventListener('mousedown', function(e) {
      const offsetX = e.clientX - overlay.getBoundingClientRect().left;
      const offsetY = e.clientY - overlay.getBoundingClientRect().top;
      function mouseMoveHandler(e) {
        overlay.style.top = (e.clientY - offsetY) + 'px';
        overlay.style.left = (e.clientX - offsetX) + 'px';
      }
      function mouseUpHandler() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      }
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }

  // Listen for window messages from the popup.
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_BATTLE_INFO') {
      overlay.innerHTML = event.data.html;
      overlay.style.display = 'block';
    }
  });

  // Optionally, listen for game events from the service worker.
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GAME_EVENT') {
      console.log('Received game event:', request.info);
      // Additional logic for real-time game events could be added here.
    }
  });
})();
