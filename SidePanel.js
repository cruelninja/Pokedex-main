import fetchPokemonData from "./fetchPokemonData.js";

// ✅ Global variables
let offset = 0;
const limit = 20;
let isLoading = false;

/**
 * ✅ Ensures #pokemon-library exists before executing code
 * @param {Function} callback - Function to execute when element exists
 * @param {number} retries - Number of retries (default: 10)
 */
function ensurePokemonLibraryExists(callback, retries = 10) {
  const pokemonLibrary = document.getElementById("pokemon-library");

  if (pokemonLibrary) {
    console.log("✅ #pokemon-library found. Running callback...");
    callback();
    return;
  }

  if (retries > 0) {
    console.warn(`⚠️ #pokemon-library not found. Retrying... (${11 - retries}/10)`);
    setTimeout(() => ensurePokemonLibraryExists(callback, retries - 1), 300); // Retry every 300ms
  } else {
    console.error("❌ #pokemon-library not found after maximum retries. Ensure it's in the HTML.");
  }
}

// ✅ Initialize Side Panel
document.addEventListener("DOMContentLoaded", () => {
  ensurePokemonLibraryExists(() => {
    console.log("🚀 #pokemon-library confirmed, loading Pokémon...");
    loadPokemon();
  });
});

/**
 * ✅ Load Pokémon List from PokeAPI
 */
export async function loadPokemon() {
  const pokemonLibrary = document.getElementById("pokemon-library");
  if (!pokemonLibrary) {
    console.error("❌ Error: #pokemon-library not found in loadPokemon().");
    return;
  }

  if (isLoading) return;
  isLoading = true;

  console.log(`📢 Loading Pokémon from ${offset} to ${offset + limit}...`);

  try {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

    const data = await response.json();

    for (const pokemon of data.results) {
      try {
        const details = await fetchPokemonData(pokemon.name);
        if (details) addPokemonCard(details);
      } catch (error) {
        console.warn(`⚠️ Failed to load details for ${pokemon.name}:`, error);
      }
    }

    offset += limit;
  } catch (error) {
    console.error("❌ Error loading Pokémon:", error);
  } finally {
    isLoading = false;
  }
}

/**
 * ✅ Creates Pokémon Card
 * @param {Object} data - Pokémon data object
 */
export function addPokemonCard(data) {
  const pokemonLibrary = document.getElementById("pokemon-library");
  if (!pokemonLibrary) {
    console.error("❌ Error: #pokemon-library not found in addPokemonCard().");
    return;
  }

  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.innerHTML = `
    <img 
      src="${data.sprites.other["official-artwork"].front_default || data.sprites.front_default || 'default-pokemon.png'}" 
      alt="${data.name}" 
      class="pokemon-image"
      loading="lazy"
      onerror="this.onerror=null;this.src='default-pokemon.png'"
    >
    <p class="pokemon-name">${data.name.toUpperCase()} (#${data.id})</p>
  `;

  card.addEventListener("click", () => {
    window.location.href = `pokemonDetail.html?name=${data.name}`;
  });

  pokemonLibrary.appendChild(card);
}
