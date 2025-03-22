import { loadPokemon, addPokemonCard, POKEMON_CACHE } from "./SidePanel.js";
import fetchPokemonData from "./fetchPokemonData.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Header script initialized.");
  if (await ensureHeaderLoaded()) {
    // Only attach search input events; generation dropdown is removed.
    await preloadPokemonNames();
    attachSearchInputEvents();
  }
});

// Global variable for search suggestions
window.allPokemonNames = [];

/**
 * Ensures header elements exist before running event listeners.
 * Creates search input and suggestions container if they don't exist.
 */
async function ensureHeaderLoaded(retries = 5) {
  for (let i = 0; i < retries; i++) {
    // Update the selector to match your HTML
    const headerContainer = document.getElementById("pokedex-header");
    if (!headerContainer) {
      console.warn(`⚠️ Header container not found, retrying... (${i + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, 300));
      continue;
    }
    // ... rest of your code
    console.log("✅ Header elements found. Initializing events...");
    return true;
  }
  console.error("❌ Error: Header elements not found after maximum retries.");
  return false;
}


/**
 * Preloads all Pokémon names for search suggestions.
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
 * Attaches events to the search input for handling suggestions and keyboard navigation.
 */
function attachSearchInputEvents() {
  const searchInput = document.getElementById("pokemon-input");
  const suggestionsBox = document.getElementById("search-suggestions");

  if (!searchInput || !suggestionsBox) return;

  // Show suggestions on input (debounced)
  searchInput.addEventListener("input", debounce(() => {
    const query = searchInput.value.trim().toLowerCase();
    showSearchSuggestions(query);
  }, 300));

  // Handle keyboard navigation for suggestions
  searchInput.addEventListener("keydown", handleKeyboardNavigation);
}

/**
 * Escapes special characters in a string for safe regex usage.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Displays search suggestions based on the query.
 */
function showSearchSuggestions(query) {
  const searchInput = document.getElementById("pokemon-input");
  const suggestionsBox = document.getElementById("search-suggestions");
  if (!searchInput || !suggestionsBox) return;

  // Clear previous suggestions
  suggestionsBox.innerHTML = "";
  if (!query) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matchingNames = window.allPokemonNames.filter(name => name.includes(query)).slice(0, 10);
  
  if (matchingNames.length === 0) {
    suggestionsBox.innerHTML = `<p class="no-suggestions">No results found.</p>`;
  } else {
    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    matchingNames.forEach(name => {
      const suggestionItem = document.createElement("p");
      suggestionItem.className = "suggestion-item";
      suggestionItem.innerHTML = name.replace(regex, `<strong>$1</strong>`);
      suggestionItem.addEventListener("click", () => {
        searchInput.value = name;
        suggestionsBox.style.display = "none";
        console.log("Suggestion selected:", name);
      });
      suggestionsBox.appendChild(suggestionItem);
    });
  }
  suggestionsBox.style.display = "block";
}

/**
 * Handles keyboard navigation for search suggestions.
 */
function handleKeyboardNavigation(event) {
  const suggestionsBox = document.getElementById("search-suggestions");
  const suggestions = suggestionsBox.querySelectorAll(".suggestion-item");
  if (!suggestions.length || suggestionsBox.style.display === "none") return;

  let activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains("active"));

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
      break;
    case "ArrowUp":
      event.preventDefault();
      activeIndex = activeIndex < 0 ? suggestions.length - 1 : (activeIndex - 1 + suggestions.length) % suggestions.length;
      break;
    case "Enter":
      event.preventDefault();
      if (activeIndex >= 0) suggestions[activeIndex].click();
      else if (suggestions.length > 0) suggestions[0].click();
      return;
    case "Escape":
      suggestionsBox.style.display = "none";
      return;
    default:
      return;
  }

  suggestions.forEach(item => item.classList.remove("active"));
  if (activeIndex >= 0) suggestions[activeIndex].classList.add("active");
}

/**
 * A simple debounce utility to limit rapid calls.
 */
function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
