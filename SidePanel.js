import fetchPokemonData from "./fetchPokemonData.js";

// 🔹 Global Variables
let isLoading = false;
let detailedPokemonList = []; // Stores fully loaded Pokémon details
const MAX_BATCH_SIZE = 50; // Consider increasing this to reduce network requests
let offset = 0;
export const POKEMON_CACHE = new Map(); // Cache for detailed Pokémon data

// Global cache for the full Pokémon list and search names.
let allPokemonData = null;
window.allPokemonNames = [];

// Total Pokémon count from the API (set from the first fetch)
let totalPokemonCount = 0;

// Track the current search query and generation filter.
let currentSearchQuery = "";
let currentGeneration = "all";

// Predefined generation ranges based on PokémonDB's National Dex data
const generationRanges = {
  "1": [1, 151],
  "2": [152, 251],
  "3": [252, 386],
  "4": [387, 493],
  "5": [494, 649],
  "6": [650, 721],
  "7": [722, 809],
  "8": [810, 905],
  "9": [906, 1010]
};

// Track if generation filter is active.
let isGenerationFilterActive = false;

// Predefined starter Pokémon for each generation.
const generationStarters = {
  "1": ["bulbasaur", "charmander", "squirtle"],
  "2": ["chikorita", "cyndaquil", "totodile"],
  "3": ["treecko", "torchic", "mudkip"],
  "4": ["turtwig", "chimchar", "piplup"],
  "5": ["snivy", "tepig", "oshawott"],
  "6": ["chespin", "fennekin", "froakie"],
  "7": ["rowlet", "litten", "popplio"],
  "8": ["grookey", "scorbunny", "sobble"],
  "9": ["sprigatito", "fuecoco", "quaxly"]
};

// Cache DOM elements selectors
const selectors = {
  pokemonLibraryWrapper: "#pokemon-library-wrapper",
  pokemonLibrary: "#pokemon-library",
  searchInput: "#pokemon-input",
  generationDropdown: "#gen-dropdown",
  scrollSentinel: "#scroll-sentinel"
};

// Cache DOM elements
let elements = {};

// IntersectionObserver instance
let scrollObserver = null;

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize element cache
  initElementCache();
  
  if (!elements.pokemonLibraryWrapper) {
    console.log("SidePanel elements not found. Skipping initialization.");
    return;
  }
  
  console.log("🚀 SidePanel initialized...");
  await preloadPokemonData(); // Preload full list & names.
  setupSearchBar();
  setupGenerationDropdown();
  setupInfiniteScroll();
  
  if (elements.pokemonLibrary) {
    elements.pokemonLibrary.innerHTML = '<p class="loading">Loading Pokémon...</p>';
  }
  
  if (currentGeneration === "all") {
    await loadPokemon();
  } else {
    await setGeneration(currentGeneration);
  }
});

// Initialize DOM element cache
function initElementCache() {
  Object.keys(selectors).forEach(key => {
    elements[key] = document.querySelector(selectors[key]);
  });
  
  // Log missing critical elements
  if (!elements.pokemonLibraryWrapper || !elements.pokemonLibrary) {
    console.error("Critical DOM elements missing");
  }
}

// Helper: Fetch Pokémon details with caching and retry on 403 errors.
const getPokemonDetail = async (pokemonName, retries = 3) => {
  if (!pokemonName) return null;
  
  if (POKEMON_CACHE.has(pokemonName)) return POKEMON_CACHE.get(pokemonName);
  
  try {
    const data = await fetchPokemonData(pokemonName);
    if (data?.id) {
      POKEMON_CACHE.set(pokemonName, data);
      return data;
    }
  } catch (error) {
    if (retries > 0 && error.message.includes("403")) {
      console.warn(`⚠️ 403 for ${pokemonName}. Retrying in 2 seconds... (${retries} left)`);
      await new Promise(res => setTimeout(res, 2000));
      return getPokemonDetail(pokemonName, retries - 1);
    }
    console.warn(`⚠️ Error fetching data for ${pokemonName}:`, error);
  }
  return null;
};

// Loads a batch of Pokémon and updates the display (used in "all" mode).
export async function loadPokemon(retries = 1) {
  if (!elements.pokemonLibrary || isLoading || isGenerationFilterActive || currentSearchQuery) return;
  
  // Stop if we've loaded all Pokémon.
  if (totalPokemonCount && offset >= totalPokemonCount) {
    console.log("All Pokémon loaded.");
    return;
  }
  
  isLoading = true;
  console.log(`⏳ Loading Pokémon batch from offset ${offset}...`);
  
  const loadingIndicator = document.createElement("p");
  loadingIndicator.className = "loading";
  loadingIndicator.textContent = "Loading more Pokémon...";
  elements.pokemonLibrary.appendChild(loadingIndicator);
  
  try {
    // FIX: Add a unique timestamp to prevent caching issues
    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${MAX_BATCH_SIZE}&_=${Date.now()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (retries > 0 && response.status === 403) {
        console.log("Rate limit hit, retrying after delay...");
        await new Promise(res => setTimeout(res, 3000));
        loadingIndicator.remove();
        isLoading = false;
        return loadPokemon(retries - 1);
      }
      throw new Error(`Failed to fetch Pokémon data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Set total count if not already set.
    if (!totalPokemonCount) {
      totalPokemonCount = data.count;
      console.log(`Total Pokémon count: ${totalPokemonCount}`);
    }
    
    const pokemonBatch = data.results;
    console.log(`Fetched ${pokemonBatch.length} Pokémon from offset ${offset}`);
    
    // IMPROVEMENT: Use Promise.allSettled instead of Promise.all for better error handling
    const results = await Promise.allSettled(pokemonBatch.map(pokemon => getPokemonDetail(pokemon.name)));
    const validResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    // FIX: Make sure we're not duplicating Pokémon in the list
    const newPokemonIds = new Set(validResults.map(pokemon => pokemon.id));
    const uniqueNewPokemon = validResults.filter(pokemon => 
      !detailedPokemonList.some(existing => existing.id === pokemon.id)
    );
    
    detailedPokemonList = [...detailedPokemonList, ...uniqueNewPokemon];
    
    // Sort by ID to maintain order
    detailedPokemonList.sort((a, b) => a.id - b.id);
    
    // FIX: Ensure offset is updated correctly
    offset += MAX_BATCH_SIZE;
    console.log(`Updated offset to ${offset}`);
    
    updatePokemonDisplay();
  } catch (error) {
    console.error("❌ Error loading Pokémon:", error);
    elements.pokemonLibrary.innerHTML = `<p class="error">Error loading Pokémon. Please try again later.</p>`;
  } finally {
    isLoading = false;
    loadingIndicator.remove();
  }
}

// Sets up IntersectionObserver for infinite scrolling.
function setupInfiniteScroll() {
  if (!elements.pokemonLibraryWrapper) {
    console.error("❌ Error: pokemonLibraryWrapper not found.");
    return;
  }
  
  // Remove existing sentinel if it exists
  const existingSentinel = document.getElementById("scroll-sentinel");
  if (existingSentinel) existingSentinel.remove();
  
  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  elements.pokemonLibraryWrapper.appendChild(sentinel);
  
  // Disconnect existing observer if it exists
  if (scrollObserver) {
    scrollObserver.disconnect();
  }
  
  // IMPROVEMENT: More reliable intersection observer settings
  scrollObserver = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && !isLoading && !currentSearchQuery && currentGeneration === "all") {
        if (totalPokemonCount && offset >= totalPokemonCount) {
          console.log("All Pokémon loaded. Disconnecting observer.");
          scrollObserver.disconnect();
          return;
        }
        console.log("🔄 Infinite scroll triggered. Loading more Pokémon...");
        loadPokemon();
      }
    },
    { 
      root: elements.pokemonLibraryWrapper, 
      rootMargin: "200px 0px",  // Increased margin to load earlier
      threshold: 0.1 
    }
  );
  
  scrollObserver.observe(sentinel);
  console.log("✅ Infinite scroll observer set up.");
}

// After updating the display, check if content height is insufficient and load more if needed.
function checkAndLoadMore() {
  if (!elements.pokemonLibrary || !elements.pokemonLibraryWrapper) return;
  
  // IMPROVEMENT: More reliable height check
  const contentHeight = elements.pokemonLibrary.scrollHeight;
  const containerHeight = elements.pokemonLibraryWrapper.clientHeight;
  
  if (contentHeight < containerHeight && offset < totalPokemonCount && currentGeneration === "all" && !currentSearchQuery) {
    console.log(`Content height (${contentHeight}) < container height (${containerHeight}), loading more...`);
    loadPokemon();
  }
}

// Preloads the full Pokémon list and names (cached globally).
async function preloadPokemonData() {
  try {
    // IMPROVEMENT: Use a higher limit to get all Pokémon at once
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1200");
    if (!response.ok) throw new Error(`Failed to fetch Pokémon data: ${response.status}`);
    
    const data = await response.json();
    allPokemonData = data.results;
    
    // IMPROVEMENT: Add ID to each Pokémon during preload
    allPokemonData = allPokemonData.map(pokemon => {
      const urlParts = pokemon.url.split("/");
      const id = parseInt(urlParts[urlParts.length - 2]);
      return { ...pokemon, id };
    });
    
    window.allPokemonNames = allPokemonData.map(pokemon => pokemon.name.toLowerCase());
    console.log(`✅ Preloaded ${window.allPokemonNames.length} Pokémon names.`);
  } catch (error) {
    console.error("❌ Error preloading Pokémon data:", error);
  }
}

// Sets up the search input for filtering Pokémon.
function setupSearchBar() {
  if (!elements.searchInput) {
    console.error("❌ Error: Search input not found.");
    return;
  }
  
  // Clean up any existing event listeners
  const newSearchInput = elements.searchInput.cloneNode(true);
  elements.searchInput.parentNode.replaceChild(newSearchInput, elements.searchInput);
  elements.searchInput = newSearchInput;
  
  elements.searchInput.addEventListener("input", debounce(() => {
    currentSearchQuery = elements.searchInput.value.trim().toLowerCase();
    console.log("🔍 Search query:", currentSearchQuery);
    filterPokemonByName(currentSearchQuery);
  }, 300));
  
  console.log("✅ Search bar set up.");
}

// Sets up the generation dropdown event
function setupGenerationDropdown() {
  if (!elements.generationDropdown) {
    console.error("❌ Generation dropdown not found in side panel.");
    return;
  }
  
  // Clean up any existing event listeners
  const newDropdown = elements.generationDropdown.cloneNode(true);
  elements.generationDropdown.parentNode.replaceChild(newDropdown, elements.generationDropdown);
  elements.generationDropdown = newDropdown;
  
  elements.generationDropdown.addEventListener("change", () => {
    const selectedGeneration = elements.generationDropdown.value;
    console.log("Generation dropdown changed to:", selectedGeneration);
    setGeneration(selectedGeneration);
  });
  
  console.log("✅ Generation dropdown event attached.");
}

// Filters the displayed Pokémon list based on the search query.
async function filterPokemonByName(query) {
  if (!elements.pokemonLibrary) return;
  
  elements.pokemonLibrary.innerHTML = '<p class="loading">Searching...</p>';
  
  if (!query) {
    if (currentGeneration === "all") {
      updatePokemonDisplay(detailedPokemonList);
    } else {
      updatePokemonDisplay(applyGenerationFilter(detailedPokemonList));
    }
    return;
  }
  
  try {
    // IMPROVEMENT: More efficient search using preloaded data
    if (!window.allPokemonNames.length) {
      await preloadPokemonData();
    }
    
    const matchingNames = window.allPokemonNames.filter(name => name.includes(query));
    
    if (!matchingNames.length) {
      elements.pokemonLibrary.innerHTML = '<p class="no-results">No Pokémon found.</p>';
      return;
    }
    
    // IMPROVEMENT: Use Promise.allSettled for better error handling
    const promises = matchingNames.map(name => getPokemonDetail(name));
    const results = await Promise.allSettled(promises);
    
    const searchResults = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    const finalResults = currentGeneration !== "all" 
      ? applyGenerationFilter(searchResults)
      : searchResults;
    
    updatePokemonDisplay(finalResults, query);
  } catch (error) {
    console.error("❌ Error fetching search results:", error);
    elements.pokemonLibrary.innerHTML = '<p class="error">Error searching Pokémon. Please try again.</p>';
  }
}

// Updates the Pokémon display area.
function updatePokemonDisplay(pokemonList = null, query = "") {
  if (!elements.pokemonLibrary) return;
  
  if (pokemonList === null) {
    if (currentSearchQuery) {
      pokemonList = detailedPokemonList.filter(pokemon => 
        pokemon.name.toLowerCase().includes(currentSearchQuery)
      );
    } else if (currentGeneration !== "all") {
      pokemonList = applyGenerationFilter(detailedPokemonList);
    } else {
      pokemonList = detailedPokemonList;
    }
    query = currentSearchQuery;
  }
  
  elements.pokemonLibrary.innerHTML = "";
  
  if (!pokemonList.length) {
    elements.pokemonLibrary.innerHTML = `<p class="no-results">No Pokémon found.</p>`;
    return;
  }
  
  // IMPROVEMENT: Sort by ID for consistency
  pokemonList.sort((a, b) => a.id - b.id);
  
  // IMPROVEMENT: Use DocumentFragment for better performance
  const fragment = document.createDocumentFragment();
  
  pokemonList.forEach(pokemon => {
    if (pokemon && pokemon.id) {
      fragment.appendChild(addPokemonCard(pokemon, query));
    }
  });
  
  elements.pokemonLibrary.appendChild(fragment);
  
  // Add debug information
  if (currentGeneration === "all" && !currentSearchQuery) {
    const debugInfo = document.createElement("div");
    debugInfo.className = "debug-info";
    debugInfo.style.fontSize = "10px";
    debugInfo.style.color = "#999";
    debugInfo.style.marginTop = "10px";
    debugInfo.textContent = `Displaying ${pokemonList.length} Pokémon. Offset: ${offset}/${totalPokemonCount}`;
    elements.pokemonLibrary.appendChild(debugInfo);
  }
  
  // Reposition the sentinel for infinite scrolling
  if (currentGeneration === "all" && !currentSearchQuery) {
    const sentinel = document.getElementById("scroll-sentinel");
    if (sentinel) elements.pokemonLibrary.after(sentinel);
  }
  
  // Check if the loaded content is less than the wrapper height.
  setTimeout(checkAndLoadMore, 100);
}

// Applies the current generation filter to a given list of Pokémon.
function applyGenerationFilter(list) {
  if (currentGeneration === "all") return list;
  
  const [start, end] = generationRanges[currentGeneration] || [0, 0];
  if (start === 0 && end === 0) {
    console.error(`❌ Invalid generation: ${currentGeneration}`);
    return list;
  }
  
  return list.filter(pokemon => pokemon.id >= start && pokemon.id <= end);
}

// Sets the current generation filter and loads Pokémon accordingly.
export async function setGeneration(gen) {
  if (!elements.pokemonLibrary) return;
  
  // Reset state
  detailedPokemonList = [];
  elements.pokemonLibrary.innerHTML = `<p class="loading">Loading Generation ${gen} Pokémon...</p>`;
  currentGeneration = gen;
  isGenerationFilterActive = gen !== "all";
  console.log(`Setting generation filter to: ${gen}`);
  
  // Clear any active search query.
  if (elements.searchInput) {
    elements.searchInput.value = "";
    currentSearchQuery = "";
  }
  
  if (currentGeneration === "all") {
    // Reset and load fresh
    offset = 0;
    await loadPokemon();
    return;
  }
  
  const [start, end] = generationRanges[currentGeneration] || [0, 0];
  if (start === 0 && end === 0) {
    console.error(`❌ Invalid generation: ${currentGeneration}`);
    return;
  }
  
  try {
    // Use preloaded data if available
    let pokemonList = allPokemonData;
    if (!pokemonList) {
      await preloadPokemonData();
      pokemonList = allPokemonData;
    }
    
    if (!pokemonList) {
      throw new Error("Failed to load Pokémon data");
    }
    
    const pokemonInRange = pokemonList.filter(pokemon => 
      pokemon.id >= start && pokemon.id <= end
    );
      
    console.log(`Found ${pokemonInRange.length} Pokémon in Generation ${currentGeneration} range`);
    
    // IMPROVEMENT: Use Promise.allSettled for better error handling
    const promises = pokemonInRange.map(pokemon => getPokemonDetail(pokemon.name));
    const resultsSettled = await Promise.allSettled(promises);
    
    const validResults = resultsSettled
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    validResults.sort((a, b) => a.id - b.id);
    
    detailedPokemonList = prioritizeStarters(
      validResults, 
      generationStarters[currentGeneration] || []
    );
    
    updatePokemonDisplay();
  } catch (error) {
    console.error("❌ Error in setGeneration:", error);
    elements.pokemonLibrary.innerHTML = `<p class="error">Error loading Generation ${gen}. Please try again.</p>`;
  }
}

// Prioritizes starter Pokémon in the given list.
function prioritizeStarters(pokemonList, starters) {
  if (!starters.length) return pokemonList;
  
  const starterSet = new Set(starters.map(s => s.toLowerCase()));
  const startersList = pokemonList.filter(pokemon => 
    pokemon && pokemon.name && starterSet.has(pokemon.name.toLowerCase())
  );
  const nonStartersList = pokemonList.filter(pokemon => 
    pokemon && pokemon.name && !starterSet.has(pokemon.name.toLowerCase())
  );
  
  return [...startersList, ...nonStartersList];
}

// Creates and returns a clickable Pokémon card element.
export function addPokemonCard(data, query = "") {
  if (!data || !data.id) {
    console.warn("Invalid Pokémon data:", data);
    return document.createDocumentFragment();
  }
  
  const anchor = document.createElement("a");
  anchor.href = `pokemonDetail.html?id=${data.id}`;
  anchor.className = "pokemon-card-link";
  
  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.style.cursor = "pointer";
  
  const infoContainer = document.createElement("div");
  infoContainer.className = "pokemon-info";
  
  const img = document.createElement("img");
  img.loading = "lazy"; // IMPROVEMENT: Add lazy loading
  img.src = data.sprites?.front_default || "default-sprite.png";
  img.alt = data.name;
  img.className = "pokemon-sprite";
  
  const nameContainer = document.createElement("div");
  nameContainer.className = "pokemon-name-container";
  
  // Process name
  const formattedName = data.name
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
  
  let displayName = formattedName;
  if (query) {
    const regex = new RegExp(`(${query})`, "gi");
    displayName = formattedName.replace(regex, '<span class="highlight">$1</span>');
  }
  
  const nameEl = document.createElement("div");
  nameEl.className = "pokemon-name";
  nameEl.innerHTML = displayName;
  
  const numberEl = document.createElement("div");
  numberEl.className = "pokemon-number";
  numberEl.textContent = ` (#${data.id})`;
  
  nameContainer.appendChild(nameEl);
  nameContainer.appendChild(numberEl);
  infoContainer.appendChild(nameContainer);
  
  const typesContainer = document.createElement("div");
  typesContainer.className = "pokemon-types";
  
  if (data.types && Array.isArray(data.types)) {
    data.types.forEach(({ type }) => {
      if (type && type.name) {
        const typeSpan = document.createElement("span");
        const typeName = type.name;
        typeSpan.textContent = typeName.charAt(0).toUpperCase() + typeName.slice(1);
        typeSpan.classList.add("type-" + typeName.toLowerCase());
        typesContainer.appendChild(typeSpan);
      }
    });
  }
  
  // Build card structure:
  const spriteContainer = document.createElement("div");
  spriteContainer.className = "pokemon-sprite-container";
  spriteContainer.appendChild(img);
  
  card.appendChild(spriteContainer);
  card.appendChild(infoContainer);
  card.appendChild(typesContainer);
  anchor.appendChild(card);
  
  return anchor;
}

// Debounce utility function.
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}