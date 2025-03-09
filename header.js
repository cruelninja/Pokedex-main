import fetchPokemonData from "./fetchPokemonData.js";
import { addPokemonCard, loadPokemon } from "./SidePanel.js";

document.addEventListener("DOMContentLoaded", async () => {
  const headerContainer = document.getElementById("header-container");
  if (!headerContainer) {
    console.error("❌ Error: #header-container not found.");
    return;
  }

  try {
    const response = await fetch("header.html");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    headerContainer.innerHTML = await response.text();
    console.log("✅ Header loaded successfully!");

    // ✅ Attach Click Event to Pokédex Header
    const header = headerContainer.querySelector(".pokedex-header");
    if (header) {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        if (!window.location.pathname.includes("sidepanel.html")) {
          window.location.href = "sidepanel.html";
        }
      });
    } else {
      console.error("❌ Error: `.pokedex-header` element not found.");
    }

    // ✅ Ensure Search Bar Exists Before Attaching Event Listener
    const searchBar = document.getElementById("pokemon-input");
    const pokemonLibrary = document.getElementById("pokemon-library");

    if (!searchBar) {
      console.warn("⚠️ Search bar not found. Skipping search functionality.");
      return;
    }

    if (!pokemonLibrary) {
      console.error("❌ Error: #pokemon-library not found.");
      return;
    }

    let debounceTimer = null;
    let offset = 0; // ✅ Fix: Define `offset` for pagination

    // ✅ Optimized Search with Debounce
    searchBar.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const searchQuery = searchBar.value.trim().toLowerCase();

        if (!searchQuery) {
          console.log("🔄 Resetting Pokémon list...");
          pokemonLibrary.innerHTML = "";
          offset = 0;
          loadPokemon();
          return;
        }

        console.log(`🔍 Searching for: ${searchQuery}`);

        try {
          const details = await fetchPokemonData(searchQuery);
          pokemonLibrary.innerHTML = "";

          if (details) {
            addPokemonCard(details);
          } else {
            console.warn(`⚠️ Pokémon '${searchQuery}' not found.`);
            pokemonLibrary.innerHTML = `<p class="error-message">⚠️ Pokémon not found!</p>`;
          }
        } catch (error) {
          console.error("❌ Error fetching Pokémon details:", error);
          pokemonLibrary.innerHTML = `<p class="error-message">⚠️ Unable to fetch data.</p>`;
        }
      }, 500);
    });

    console.log("✅ Search bar event listener attached!");

  } catch (error) {
    console.error("❌ Error loading header:", error);
  }
});
