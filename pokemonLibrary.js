import fetchPokemonData from "./fetchPokemonData.js";

/**
 * ✅ Renders Pokémon details in the DOM
 * @param {Object} pokemon - Pokémon data object
 */
function renderPokemonDetails(pokemon) {
  if (!pokemon) {
    displayError("Pokémon data is missing.");
    return;
  }

  const { id, name, sprites, types, stats } = pokemon;
  const sprite =
    sprites.other?.["official-artwork"]?.front_default ||
    sprites.front_default ||
    "default-pokemon.png";

  // ✅ Create type labels
  const typeLabels = types
    .map(
      (type) =>
        `<span class="type-label ${type.type.name}">${type.type.name}</span>`
    )
    .join(" ");

  // ✅ Create stat rows
  const statRows = stats
    .map(
      (stat) => `
      <div class="stat-row">
        <span class="stat-name">${stat.stat.name
          .replace(/-/g, " ")
          .toUpperCase()}:</span>
        <span class="stat-value">${stat.base_stat}</span>
      </div>
    `
    )
    .join("");

  const pokemonInfo = document.getElementById("pokemon-info");
  if (!pokemonInfo) {
    console.error("❌ Error: #pokemon-info not found in DOM.");
    return;
  }

  // ✅ Update the DOM with Pokémon details
  pokemonInfo.innerHTML = `
    <div class="pokemon-detail-container">
      <div class="sprite-wrapper">
        <img 
          class="pokemon-image" 
          src="${sprite}" 
          alt="${name} official artwork" 
          onerror="this.onerror=null;this.src='default-pokemon.png'"
        >
      </div>
      <h2 class="pokemon-name">${name.toUpperCase()} (#${id})</h2>
      <div class="type-container">${typeLabels}</div>
      <div class="stats-container">
        <h3>Base Stats</h3>
        ${statRows}
      </div>
    </div>
  `;
}

/**
 * ✅ Displays an error message in the Pokémon info container with a retry button
 * @param {string} message - Error message to display
 */
function displayError(message) {
  const pokemonInfo = document.getElementById("pokemon-info");
  if (!pokemonInfo) return;

  pokemonInfo.innerHTML = `
    <div class="error-container">
      <h3>⚠️ Error</h3>
      <p>${message}</p>
      <button id="retry-button">🔄 Retry</button>
    </div>
  `;

  // ✅ Attach retry event listener
  document.getElementById("retry-button")?.addEventListener("click", init);
}

/**
 * ✅ Displays a loading message in the Pokémon info container
 */
function displayLoading() {
  const pokemonInfo = document.getElementById("pokemon-info");
  if (!pokemonInfo) return;

  pokemonInfo.innerHTML = `
    <div class="loading-container">
      <p>⏳ Loading Pokémon details...</p>
    </div>
  `;
}

/**
 * ✅ Main initialization function
 */
async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const pokemonName = urlParams.get("name")?.trim().toLowerCase();

  if (!pokemonName) {
    displayError("No Pokémon specified in the URL parameters.");
    return;
  }

  try {
    displayLoading();
    const pokemonData = await fetchPokemonData(pokemonName);

    if (!pokemonData) {
      throw new Error("No data returned from the API.");
    }

    renderPokemonDetails(pokemonData);
    console.log(`✅ Successfully loaded details for ${pokemonName}`);
  } catch (error) {
    console.error("❌ Failed to load Pokémon details:", error);
    displayError(
      `Failed to load details for ${pokemonName}. Please try again.`
    );
  }
}

// ✅ Start the application when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", init);
