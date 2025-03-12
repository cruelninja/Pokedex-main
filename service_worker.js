// Use ES module import instead of importScripts
import typeChart from "./typeChart.js";

// ✅ Local Cache for Pokémon Data
const pokemonCache = new Map();
const pokemonList = [];

// ✅ Fetch the Pokémon list from PokéAPI
async function fetchPokemonList() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();
    data.results.forEach((pokemon, index) => {
      pokemonList.push({ name: pokemon.name, number: index + 1 });
    });

    // Store in Chrome storage for persistence
    chrome.storage.local.set({ pokemonList });
    console.log("✅ Pokémon list stored in Chrome storage.");
  } catch (error) {
    console.error("❌ Error fetching Pokémon list:", error);
  }
}

// ✅ Fetch Pokémon details (with caching)
async function fetchPokemonData(pokemonName) {
  const lowerName = pokemonName.toLowerCase();
  if (pokemonCache.has(lowerName)) {
    console.log(`✅ Loaded from cache: ${lowerName}`);
    return { success: true, myPokemon: pokemonCache.get(lowerName) };
  }

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${lowerName}`);
    if (!response.ok) throw new Error("Pokémon not found");

    const data = await response.json();
    pokemonCache.set(lowerName, data); // ✅ Cache the data

    return { success: true, myPokemon: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ✅ Get type effectiveness based on type chart
function getTypeEffectiveness(types) {
  const weaknesses = new Set();
  const resistances = new Set();
  const immunities = new Set();

  types.forEach((type) => {
    const info = typeChart[type];
    if (info) {
      info.weakTo.forEach((w) => weaknesses.add(w));
      info.resistantTo.forEach((r) => resistances.add(r));
      info.immuneTo.forEach((i) => immunities.add(i));
    }
  });

  // Remove resistances from weaknesses and immunities from all
  resistances.forEach((r) => weaknesses.delete(r));
  immunities.forEach((i) => {
    weaknesses.delete(i);
    resistances.delete(i);
  });

  return {
    weaknesses: Array.from(weaknesses),
    resistances: Array.from(resistances),
    immunities: Array.from(immunities),
  };
}

// ✅ Fetch additional Pokémon details (species & evolution chain)
async function fetchSpeciesAndEvolution(pokemonId) {
  try {
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    if (!speciesResponse.ok) throw new Error("Species data not found");

    const speciesData = await speciesResponse.json();
    const evoChainUrl = speciesData.evolution_chain?.url;

    let evoData = null;
    if (evoChainUrl) {
      const evoResponse = await fetch(evoChainUrl);
      if (evoResponse.ok) evoData = await evoResponse.json();
    }

    return { species: speciesData, evolutionChain: evoData };
  } catch (error) {
    console.error("❌ Error fetching species/evolution data:", error);
    return { species: null, evolutionChain: null };
  }
}

// ✅ Handle messages from extension scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.type === "GET_POKEMON_LIST") {
        // Retrieve the list from Chrome storage
        const { pokemonList } = await chrome.storage.local.get("pokemonList");
        sendResponse(pokemonList || []);
      } else if (request.type === "FETCH_BATTLE_DATA") {
        // Fetch both Pokémon data
        const [myPokemonResponse, oppPokemonResponse] = await Promise.all([
          fetchPokemonData(request.myPokemon),
          fetchPokemonData(request.oppPokemon),
        ]);

        if (myPokemonResponse.success && oppPokemonResponse.success) {
          // Get type effectiveness
          const myTypes = myPokemonResponse.myPokemon.types.map((t) => t.type.name);
          myPokemonResponse.myPokemon.effectiveness = getTypeEffectiveness(myTypes);

          const oppTypes = oppPokemonResponse.myPokemon.types.map((t) => t.type.name);
          oppPokemonResponse.myPokemon.effectiveness = getTypeEffectiveness(oppTypes);

          // Fetch species & evolution data
          const [myExtraData, oppExtraData] = await Promise.all([
            fetchSpeciesAndEvolution(myPokemonResponse.myPokemon.id),
            fetchSpeciesAndEvolution(oppPokemonResponse.myPokemon.id),
          ]);

          sendResponse({
            success: true,
            myPokemon: { ...myPokemonResponse.myPokemon, ...myExtraData },
            oppPokemon: { ...oppPokemonResponse.myPokemon, ...oppExtraData },
          });
        } else {
          sendResponse({ success: false, error: "Pokémon data not found" });
        }
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // Keeps message channel open for async response
});

// ✅ Initialize Pokémon list on service worker startup
fetchPokemonList();
