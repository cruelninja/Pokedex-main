const POKEAPI_BASE = "https://pokeapi.co/api/v2/";
const CACHE = new Map(); // ✅ Cache for faster Pokémon loading

// ✅ Fetch Pokémon Data from PokeAPI (With Caching)
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

    CACHE.set(pokemonName, data); // ✅ Store in cache
    return data;
  } catch (error) {
    console.error(`❌ Error fetching Pokémon details:`, error);
    return null;
  }
}

// ✅ Fetch Pokémon Species Data (For Evolution & Forms)
async function fetchPokemonSpecies(name) {
  try {
    const response = await fetch(`${POKEAPI_BASE}pokemon-species/${name.toLowerCase()}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching Pokémon species:`, error);
    return null;
  }
}

// ✅ Fetch Evolution Chain Data
async function fetchEvolutionChain(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching evolution chain:`, error);
    return null;
  }
}

// ✅ Extract ID from URL
function getIdFromUrl(url) {
  return url.split('/').filter(Boolean).pop();
}

// ✅ Get the Fully Evolved Pokémon Name & ID (Final Evolution)
function getFinalEvolution(chain) {
  let finalEvo = chain;
  while (finalEvo.evolves_to.length > 0) {
    finalEvo = finalEvo.evolves_to[0]; // Move to the next evolution
  }
  return {
    name: finalEvo.species.name,
    id: getIdFromUrl(finalEvo.species.url),
  };
}

// ✅ Update Pokémon Detail Page
function updatePokemonDetail(pokemon) {
  if (!pokemon) return;

  const { id, name, types, stats, sprites } = pokemon;
  const spriteUrl = sprites?.other?.["official-artwork"]?.front_default || sprites?.front_default || "default-pokemon.png";

  // Create Type Labels
  const typeLabels = types.map(t => `<span class="type-label ${t.type.name}">${t.type.name}</span>`).join(" ");

  // Create Stats Section
  const statRows = stats.map(stat => `
    <div class="stat-row">
      <span class="stat-name">${stat.stat.name.toUpperCase()}:</span>
      <span class="stat-value">${stat.base_stat}</span>
    </div>`).join("");

  // ✅ Update the #pokemon-info container
  const infoDiv = document.getElementById("pokemon-info");
  if (!infoDiv) return;

  infoDiv.innerHTML = `
    <div class="pokemon-detail-container">
      <div class="sprite-wrapper">
        <img class="pokemon-image" src="${spriteUrl}" alt="${name}" onerror="this.src='default-pokemon.png';" />
      </div>
      <h2 class="pokemon-name">${name.charAt(0).toUpperCase() + name.slice(1)} (#${id})</h2>
      <div class="type-container">${typeLabels}</div>
      <div class="stats-container">
        <h3>Base Stats</h3>
        ${statRows}
      </div>
      <div class="evo-container">
        <h3>Evolutions</h3>
        <div class="evo-chain"></div>
      </div>
      <div class="mega-evo-container">
        <h3>Mega Evolutions</h3>
        <div class="mega-evo-chain"></div>
      </div>
      <div class="alt-forms-container">
        <h3>Alternative Forms</h3>
        <div class="alt-forms-chain"></div>
      </div>
    </div>
  `;
}

// ✅ Fetch & Update Alternative Forms (Mega & Gigantamax)
async function updateAlternativeForms(pokemon) {
  const speciesData = await fetchPokemonSpecies(pokemon.name);
  if (!speciesData) return;

  const evoData = await fetchEvolutionChain(speciesData.evolution_chain.url);
  if (!evoData) return;

  // ✅ Fix: Now correctly gets the final evolution form
  const finalEvo = getFinalEvolution(evoData.chain);
  const finalEvoName = finalEvo.name;
  const finalEvoId = finalEvo.id;

  const megaEvoContainer = document.querySelector(".mega-evo-chain");
  if (megaEvoContainer) {
    megaEvoContainer.innerHTML = `
      <div class="mega-evo-item">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${finalEvoId}.png" 
          alt="${finalEvoName}" 
          onerror="this.src='default-pokemon.png';" />
        <span class="mega-evo-name">${finalEvoName}</span>
      </div>
      <div class="mega-evo-arrow">⇅</div>
      <div class="mega-evo-item">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${finalEvoId}.png" 
          alt="Mega ${finalEvoName}" 
          onerror="this.src='default-pokemon.png';" />
        <span class="mega-evo-name">Mega ${finalEvoName}</span>
      </div>
    `;
  }
}

// ✅ Initialize Page
document.addEventListener("DOMContentLoaded", async () => {
  const pokemonName = new URLSearchParams(window.location.search).get("name") || "bulbasaur";
  const pokemon = await fetchPokemonDetail(pokemonName);

  if (pokemon) {
    updatePokemonDetail(pokemon);
    updateAlternativeForms(pokemon);
  } else {
    console.error("❌ Failed to load Pokémon details.");
  }
});
