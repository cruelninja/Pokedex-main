import { loadPokemon } from "./SidePanel.js";
import fetchPokemonData from "./fetchPokemonData.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Header script initialized.");
  if (await ensureHeaderLoaded()) {
    setupHeaderEvents();
    await preloadPokemonNames();
  }
});

/**
 * Ensures header elements exist before running event listeners.
 * If we're NOT on the detail page, it creates the search input and suggestions container.
 */
async function ensureHeaderLoaded(retries = 5) {
  for (let i = 0; i < retries; i++) {
    const headerContainer = document.getElementById("header-container");
    if (!headerContainer) {
      console.warn(`⚠️ Header container not found, retrying... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, 300));
      continue;
    }
    
    // Only create search elements if NOT on the detail page.
    if (!window.location.pathname.includes("pokemonDetail.html")) {
      let searchInput = document.getElementById("pokemon-input");
      let suggestionsBox = document.getElementById("search-suggestions");

      if (!searchInput) {
        // Create search input if not found
        searchInput = document.createElement("input");
        searchInput.id = "pokemon-input";
        searchInput.type = "text";
        searchInput.placeholder = "Search Pokémon...";
        headerContainer.appendChild(searchInput);
      }

      if (!suggestionsBox) {
        // Create suggestions container if not found
        suggestionsBox = document.createElement("div");
        suggestionsBox.id = "search-suggestions";
        suggestionsBox.className = "suggestions-box";
        headerContainer.appendChild(suggestionsBox);
      }
    }
    
    console.log("✅ Header elements found. Initializing events...");
    return true;
  }
  console.error("❌ Error: Header elements not found after maximum retries.");
  return false;
}

/**
 * Sets up header interactions.
 * - On pages with search controls, sets up search events.
 * - On the detail page (where search controls are not created), adds a header click event to go back to SidePanel.html.
 */
function setupHeaderEvents() {
  const headerContainer = document.getElementById("header-container");
  const searchInput = document.getElementById("pokemon-input");
  const suggestionsBox = document.getElementById("search-suggestions");

  // If search elements aren't present, assume we're on the detail page.
  if (!searchInput || !suggestionsBox) {
    headerContainer.addEventListener("click", () => {
      // Navigate back to SidePanel.html when header is clicked.
      window.location.href = "SidePanel.html";
    });
    console.log("✅ Detail page header click event initialized (back button).");
    return;
  }

  // Otherwise, set up search controls.
  searchInput.addEventListener("input", debounce(() => {
    const searchQuery = searchInput.value.trim().toLowerCase();
    showSearchSuggestions(searchQuery);
  }, 300));

  searchInput.addEventListener("keydown", handleKeyboardNavigation);

  document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
      suggestionsBox.style.display = "none";
    }
  });

  console.log("✅ Header events initialized!");
}

// Global variable for search suggestions (mirroring SidePanel.js)
window.allPokemonNames = [];

/**
 * Fetch all Pokémon names for instant search and store them globally.
 */
async function preloadPokemonNames() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
    if (!response.ok) throw new Error("Failed to fetch Pokémon names.");
    const data = await response.json();
    window.allPokemonNames = data.results.map(pokemon => pokemon.name.toLowerCase());
    console.log("✅ Pokémon names preloaded for search suggestions.");
  } catch (error) {
    console.error("❌ Error preloading Pokémon names:", error);
  }
}

/**
 * Displays search suggestions (autocomplete) based on the query.
 */
function showSearchSuggestions(query) {
  const searchInput = document.getElementById("pokemon-input");
  const suggestionsBox = document.getElementById("search-suggestions");

  if (!suggestionsBox || !searchInput) return;
  
  suggestionsBox.innerHTML = query 
    ? window.allPokemonNames
        .filter(name => name.includes(query))
        .slice(0, 10)
        .map(name => `<p class="suggestion-item">${name.replace(new RegExp(`(${query})`, "gi"), `<strong>$1</strong>`)}</p>`)
        .join("") || `<p class="no-suggestions">No results found.</p>`
    : "";
    
  suggestionsBox.style.display = query ? "block" : "none";

  document.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      searchInput.value = item.textContent.replace(/<\/?strong>/g, "");
      suggestionsBox.style.display = "none";
      console.log("Suggestion selected:", searchInput.value);
    });
  });
}

/**
 * Handles keyboard navigation (Arrow keys, Enter) for search suggestions.
 */
function handleKeyboardNavigation(event) {
  const suggestions = document.querySelectorAll(".suggestion-item");
  if (suggestions.length === 0) return;

  let activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains("active"));

  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex = (activeIndex + 1) % suggestions.length;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (activeIndex >= 0) suggestions[activeIndex].click();
    return;
  }

  suggestions.forEach(item => item.classList.remove("active"));
  suggestions[activeIndex].classList.add("active");
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
