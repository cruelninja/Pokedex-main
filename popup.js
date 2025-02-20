document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Fetch and apply your CSS
  fetch(chrome.runtime.getURL('styles.css'))
    .then(response => response.text())
    .then(css => {
      const styleElement = document.createElement('style');
      styleElement.textContent = css;
      shadowRoot.appendChild(styleElement);

      // Create your popup content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div class="battle-container">
          <h2>Pokéédex</h2>
          <input type="text" id="pokemonSearch" placeholder="Enter Pokémon name">
          <button id="searchButton">Search</button>
          <div id="pokemonInfo"></div>
        </div>
      `;
      shadowRoot.appendChild(popupContent);

      // Attach event listeners or any additional scripts here
      const searchButton = shadowRoot.getElementById('searchButton');
      searchButton.addEventListener('click', () => {
        const pokemonSearch = shadowRoot.getElementById('pokemonSearch').value.trim().toLowerCase();
        if (pokemonSearch) {
          // Your existing fetch logic here
        } else {
          alert("Please enter a Pokémon name.");
        }
      });
    });

  document.body.appendChild(container);
});

