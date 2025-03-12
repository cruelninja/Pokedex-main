import fetchPokemonData from "./fetchPokemonData.js";

// 🔹 Global Variables
let isLoading = false;
let detailedPokemonList = []; // Stores fully loaded Pokémon details (from infinite scroll)
const MAX_BATCH_SIZE = 50;
let offset = 0;
const POKEMON_CACHE = new Map(); // Cache for detailed Pokémon data

// Preloaded names for search filtering
window.allPokemonNames = [];

// Track the current search query (empty when no search is active)
let currentSearchQuery = "";

/**
 * Initialize SidePanel functionality if we're on the correct page.
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Only run if the side panel container exists.
  if (!document.getElementById("pokemon-library-wrapper")) {
    console.log("SidePanel elements not found. Skipping SidePanel initialization.");
    return;
  }

  console.log("🚀 SidePanel initialized...");
  await preloadPokemonNames();
  await loadPokemon();
  setupInfiniteScroll();
  setupSearchBar();
});

/**
 * Loads a batch of Pokémon and updates the display.
 */
export async function loadPokemon() {
  const pokemonLibrary = document.getElementById("pokemon-library");
  if (!pokemonLibrary || isLoading) return;
  // Prevent loading more when a search query is active
  if (currentSearchQuery) return;

  isLoading = true;
  console.log(`⏳ Loading Pokémon batch from offset ${offset}...`);

  try {
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${MAX_BATCH_SIZE}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch Pokémon data.");

    const data = await response.json();
    const pokemonBatch = data.results;

    for (const pokemon of pokemonBatch) {
      if (POKEMON_CACHE.has(pokemon.name)) {
        detailedPokemonList.push(POKEMON_CACHE.get(pokemon.name));
        continue;
      }
      const fetchedData = await fetchPokemonData(pokemon.name);
      if (fetchedData && typeof fetchedData.id === "number") {
        POKEMON_CACHE.set(pokemon.name, fetchedData);
        detailedPokemonList.push(fetchedData);
      } else {
        console.warn(`⚠️ Skipping incomplete data for: ${pokemon.name}`);
      }
    }

    updatePokemonDisplay();
    offset += MAX_BATCH_SIZE;
  } catch (error) {
    console.error("❌ Error loading Pokémon:", error);
  } finally {
    isLoading = false;
  }
}

/**
 * Sets up an IntersectionObserver to implement infinite scrolling.
 */
function setupInfiniteScroll() {
  const wrapper = document.getElementById("pokemon-library-wrapper");
  if (!wrapper) {
    console.error("❌ Error: #pokemon-library-wrapper not found.");
    return;
  }
  
  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  wrapper.appendChild(sentinel);

  new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isLoading && !currentSearchQuery) {
        console.log("🔄 Infinite scroll triggered. Loading more Pokémon...");
        loadPokemon();
      }
    },
    { rootMargin: "200px" }
  ).observe(sentinel);
}

/**
 * Preloads all Pokémon names for search filtering.
 */
async function preloadPokemonNames() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    if (!response.ok) throw new Error("Failed to fetch Pokémon names.");
    const data = await response.json();
    window.allPokemonNames = data.results.map(pokemon => pokemon.name);
    console.log("✅ Pokémon names preloaded.");
  } catch (error) {
    console.error("❌ Error preloading names:", error);
  }
}

/**
 * Sets up the search input for filtering Pokémon.
 * If no search input exists, one is injected into the header.
 */
function setupSearchBar() {
  let searchInput = document.getElementById("pokemon-input");
  if (!searchInput) {
    searchInput = document.createElement("input");
    searchInput.id = "pokemon-input";
    searchInput.type = "text";
    searchInput.placeholder = "Search Pokémon...";
    const header = document.getElementById("header-container");
    if (!header) {
      console.error("❌ Error: #header-container not found.");
      return;
    }
    header.appendChild(searchInput);
  }
  console.log("✅ Search bar set up.");

  searchInput.addEventListener("input", debounce(() => {
    currentSearchQuery = searchInput.value.trim().toLowerCase();
    console.log("🔍 Search query:", currentSearchQuery);
    filterPokemonByName(currentSearchQuery);
  }, 300));
}

/**
 * Filters the displayed Pokémon list based on the search query.
 * Uses preloaded names to fetch any missing matching Pokémon details.
 */
function filterPokemonByName(query) {
  if (!query) {
    updatePokemonDisplay();
    return;
  }

  // Get all matching names from preloaded list
  const matchingNames = window.allPokemonNames.filter(name =>
    name.toLowerCase().includes(query)
  );

  // Create promises to fetch detailed data for matching Pokémon if not already cached
  const fetchPromises = matchingNames.map(name => {
    if (POKEMON_CACHE.has(name)) {
      return Promise.resolve(POKEMON_CACHE.get(name));
    } else {
      return fetchPokemonData(name).then(data => {
        if (data && typeof data.id === "number") {
          POKEMON_CACHE.set(name, data);
          return data;
        }
        return null;
      });
    }
  });

  Promise.all(fetchPromises)
    .then(results => {
      const searchResults = results.filter(item => item !== null);
      updatePokemonDisplay(searchResults, query);
    })
    .catch(error => {
      console.error("❌ Error fetching search results:", error);
    });
}

/**
 * Updates the Pokémon display area.
 * If no list is provided, it filters the full list using the current search query.
 */
function updatePokemonDisplay(pokemonList = null, query = "") {
  const pokemonLibrary = document.getElementById("pokemon-library");
  if (!pokemonLibrary) return;

  if (pokemonList === null) {
    pokemonList = currentSearchQuery
      ? detailedPokemonList.filter(pokemon =>
          pokemon.name.toLowerCase().includes(currentSearchQuery)
        )
      : detailedPokemonList;
    query = currentSearchQuery;
  }

  pokemonLibrary.innerHTML = "";
  if (pokemonList.length === 0) {
    pokemonLibrary.innerHTML = `<p class="no-results">No Pokémon found.</p>`;
    return;
  }
  pokemonList.forEach(pokemon => {
    pokemonLibrary.appendChild(addPokemonCard(pokemon, query));
  });
}

/**
 * Creates and returns a clickable Pokémon card element.
 * Uses local sprites from "sprites/pokemon/" as a fallback.
 * Highlights matching text if a query is provided.
 * The card is wrapped in an anchor element for navigation.
 */
export function addPokemonCard(data, query = "") {
  // Create an anchor element that wraps the card
  const anchor = document.createElement("a");
  // Update the href to point to the correct file (pokemonDetail.html)
  anchor.href = `pokemonDetail.html?id=${data.id}`;
  anchor.className = "pokemon-card-link";

  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.style.cursor = "pointer";

  // Fallback ID if data.id is missing
  const id = (data.id && !isNaN(data.id)) ? data.id.toString() : "000";

  // Determine sprite path: try official artwork, then default sprite, then local fallback
  let spritePath = data.sprites?.other["official-artwork"]?.front_default ||
                   data.sprites?.front_default ||
                   `sprites/pokemon/${id}.png`;
  if (!spritePath) {
    spritePath = "sprites/pokemon/0.png";
  }

  const img = document.createElement("img");
  img.src = spritePath;
  img.alt = data.name || "Unknown Pokémon";
  img.className = "pokemon-image";
  img.loading = "lazy";
  img.onerror = function () {
    console.warn(`⚠️ Sprite missing for ${data.name}; using fallback image.`);
    img.src = "sprites/pokemon/0.png";
  };

  const nameEl = document.createElement("p");
  nameEl.className = "pokemon-name";

  // Format the Pokémon name; highlight matching text if provided
  const originalName = data.name.toUpperCase();
  let displayName = originalName;
  if (query) {
    const regex = new RegExp(`(${query.toUpperCase()})`, "gi");
    displayName = originalName.replace(regex, '<span class="highlight">$1</span>');
  }
  nameEl.innerHTML = `${displayName} (#${data.id || "000"})`;

  card.appendChild(img);
  card.appendChild(nameEl);
  anchor.appendChild(card);

  return anchor;
}

/**
 * A simple debounce function to delay rapid calls.
 */
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
