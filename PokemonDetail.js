const POKEAPI_BASE = "https://pokeapi.co/api/v2/";
const CACHE = new Map(); // Cache for Pokémon details

/**
 * Fetch Pokémon Data from PokeAPI (with caching).
 * @param {string} name - The Pokémon's name.
 * @returns {Promise<Object|null>} The fetched Pokémon data or null on failure.
 */
async function fetchPokemonDetail(name) {
  if (!name) return null;
  const pokemonName = name.toLowerCase();

  if (CACHE.has(pokemonName)) {
    console.log(`✅ Loaded from cache: ${pokemonName}`);
    return CACHE.get(pokemonName);
  }

  try {
    const response = await fetch(`${POKEAPI_BASE}pokemon/${pokemonName}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    CACHE.set(pokemonName, data);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching Pokémon details for ${pokemonName}:`, error);
    return null;
  }
}

/**
 * Fetch Pokémon Species Data (for evolution & forms).
 * @param {string} name - The Pokémon's name.
 * @returns {Promise<Object|null>} The species data or null on failure.
 */
async function fetchPokemonSpecies(name) {
  try {
    const response = await fetch(`${POKEAPI_BASE}pokemon-species/${name.toLowerCase()}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching Pokémon species for ${name}:`, error);
    return null;
  }
}

/**
 * Fetch Evolution Chain Data.
 * @param {string} url - The URL for the evolution chain.
 * @returns {Promise<Object|null>} The evolution chain data or null on failure.
 */
async function fetchEvolutionChain(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching evolution chain:", error);
    return null;
  }
}

/**
 * Extracts the Pokémon ID from a given URL.
 * @param {string} url - The URL containing the Pokémon's ID.
 * @returns {string} The extracted ID.
 */
const getIdFromUrl = (url) => url.split('/').filter(Boolean).pop();

/**
 * Retrieves the final evolution in the chain.
 * @param {Object} chain - The evolution chain object.
 * @returns {Object} An object containing the final evolution's name and ID.
 */
const getFinalEvolution = (chain) => {
  let current = chain;
  while (current.evolves_to.length > 0) {
    current = current.evolves_to[0];
  }
  return {
    name: current.species.name,
    id: getIdFromUrl(current.species.url),
  };
};

/**
 * Recursively retrieves all evolution stages from the evolution chain.
 * @param {Object} chain - The evolution chain object.
 * @returns {Array} Array of evolution objects containing the name and id.
 */
const getAllEvolutions = (chain) => {
  const evolutions = [];
  const traverse = (node) => {
    evolutions.push({
      name: node.species.name,
      id: getIdFromUrl(node.species.url)
    });
    if (node.evolves_to.length > 0) {
      node.evolves_to.forEach(child => traverse(child));
    }
  };
  traverse(chain);
  return evolutions;
};

/**
 * Updates the Pokémon Detail Page with fetched data.
 * @param {Object} pokemon - The Pokémon detail object.
 */
function updatePokemonDetail(pokemon) {
  if (!pokemon) return;

  const { id, name, types, stats, sprites } = pokemon;
  const spriteUrl =
    sprites?.other?.["official-artwork"]?.front_default ||
    sprites?.front_default ||
    "default-pokemon.png";

  // Create type labels markup
  const typeLabels = types
    .map((t) => `<span class="type-label ${t.type.name}">${t.type.name}</span>`)
    .join(" ");

  // Create stats rows markup
  const statRows = stats
    .map(
      (stat) => `
    <div class="stat-row">
      <span class="stat-name">${stat.stat.name.toUpperCase()}:</span>
      <span class="stat-value">${stat.base_stat}</span>
    </div>`
    )
    .join("");

  const detailsHTML = `
    <div class="pokemon-detail-container">
      <div class="sprite-wrapper">
        <img class="pokemon-image" src="${spriteUrl}" alt="${name}" />
      </div>
      <h2 class="pokemon-name">${name.charAt(0).toUpperCase() + name.slice(1)} (#${id})</h2>
      <div class="type-container">${typeLabels}</div>
      <section class="stats-container" aria-labelledby="stats-title">
        <h3 id="stats-title">Base Stats</h3>
        ${statRows}
      </section>
      <section class="evo-container" aria-labelledby="evo-title">
        <h3 id="evo-title">Standard Evolution</h3>
        <div class="evo-chain"></div>
      </section>
      <section class="mega-evo-container" aria-labelledby="mega-evo-title">
        <h3 id="mega-evo-title">Mega Evolution</h3>
        <div class="mega-evo-chain"></div>
      </section>
      <section class="alt-forms-container" aria-labelledby="alt-forms-title">
        <h3 id="alt-forms-title">Alternative Forms</h3>
        <div class="alt-forms-chain"></div>
      </section>
    </div>
  `;

  const infoDiv = document.getElementById("pokemon-info");
  if (infoDiv) {
    infoDiv.innerHTML = detailsHTML;
  } else {
    console.error("❌ Error: #pokemon-info element not found.");
  }
}

/**
 * Updates the evolutions and forms sections:
 * - Standard Evolutions: Lists all evolution stages using sprites from the PokeAPI GitHub repository.
 * - Mega Evolution: Uses the fully evolved Pokémon’s name to load an image from the local file path.
 * - Alternative Forms: Uses the fully evolved Pokémon’s name to load an image from the local file path.
 * @param {Object} pokemon - The Pokémon detail object.
 */
async function updateForms(pokemon) {
  const speciesData = await fetchPokemonSpecies(pokemon.name);
  if (!speciesData) return;

  const evoData = await fetchEvolutionChain(speciesData.evolution_chain.url);
  if (!evoData) return;

  // Standard Evolutions: List all evolution stages.
  const standardEvolutions = getAllEvolutions(evoData.chain);
  const evoContainer = document.querySelector(".evo-chain");
  if (evoContainer) {
    evoContainer.innerHTML = standardEvolutions.map(evo => `
      <div class="evo-item">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png" 
             alt="${evo.name}" />
        <span class="evo-name">${evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</span>
      </div>
    `).join('');
  } else {
    console.error("❌ Error: .evo-chain element not found.");
  }

  // Retrieve the final evolution as the fully evolved Pokémon.
  const finalEvo = getFinalEvolution(evoData.chain);
  const nameForUrl = finalEvo.name.toLowerCase().replace(/\s/g, '');

  // Mega Evolution: Use the local file path
  const megaPath = `D:\\pampalipas oras\\Pokedex\\sprites\\pokemon\\Mega\\${nameForUrl}.png`;
  const capName = finalEvo.name
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const megaLabel = "Mega " + capName;

  // Alternative Forms (G-Max): Use the local file path
  const gmaxPath = `D:\\pampalipas oras\\Pokedex\\sprites\\pokemon\\G-Max\\${nameForUrl}.png`;
  const gmaxLabel = "Gigantamax " + capName;

  // Mega Evolution: Use the constructed Mega path.
  const megaContainer = document.querySelector(".mega-evo-chain");
  if (megaContainer) {
    megaContainer.innerHTML = `
      <div class="mega-evo-item">
        <img src="${megaPath}" 
             alt="${megaLabel}" />
        <span class="mega-evo-name">${megaLabel}</span>
      </div>
    `;
  } else {
    console.error("❌ Error: .mega-evo-chain element not found.");
  }

  // Alternative Forms (G-Max): Use the constructed G-Max path.
  const altContainer = document.querySelector(".alt-forms-chain");
  if (altContainer) {
    altContainer.innerHTML = `
      <div class="alt-forms-item">
        <img src="${gmaxPath}" 
             alt="${gmaxLabel}" />
        <span class="alt-forms-name">${gmaxLabel}</span>
      </div>
    `;
  } else {
    console.error("❌ Error: .alt-forms-chain element not found.");
  }

  // Attach error handlers to images.
  attachImageErrorHandlers();
}

/**
 * Attaches error event listeners to images to handle fallback.
 */
function attachImageErrorHandlers() {
  const fallbackSrc = "default-pokemon.png";
  const images = document.querySelectorAll(
    ".evo-chain img, .mega-evo-chain img, .alt-forms-chain img, .sprite-wrapper img"
  );
  images.forEach(img => {
    img.addEventListener("error", function () {
      this.src = fallbackSrc;
    });
  });
}

/**
 * Main initialization: Fetch Pokémon detail based on URL query and update the page.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const pokemonName = params.get("name") || "bulbasaur";

  const pokemon = await fetchPokemonDetail(pokemonName);
  if (pokemon) {
    updatePokemonDetail(pokemon);
    updateForms(pokemon);
  } else {
    console.error("❌ Failed to load Pokémon details.");
    const infoDiv = document.getElementById("pokemon-info");
    if (infoDiv) {
      infoDiv.innerHTML = `<p class="error-message">Failed to load Pokémon details. Please try again later.</p>`;
    }
  }
});
