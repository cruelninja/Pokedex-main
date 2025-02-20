// Use ES module import instead of importScripts
import typeChart from './typeChart.js';

const pokemonList = [];

// Fetch the Pokémon list from the PokéAPI
async function fetchPokemonList() {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await response.json();
    data.results.forEach((pokemon, index) => {
      pokemonList.push({
        name: pokemon.name,
        number: index + 1
      });
    });
    // Store the list in chrome storage for persistence
    chrome.storage.local.set({ pokemonList });
  } catch (error) {
    console.error('Error fetching Pokémon list:', error);
  }
}

// Fetch Pokémon details
async function fetchPokemonData(pokemonName) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    if (!response.ok) {
      throw new Error('Pokémon not found');
    }
    const data = await response.json();
    return { success: true, myPokemon: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get type effectiveness
function getTypeEffectiveness(types) {
  const weaknesses = new Set();
  const resistances = new Set();
  const immunities = new Set();

  types.forEach(type => {
    const info = typeChart[type];
    if (info) {
      info.weakTo.forEach(w => weaknesses.add(w));
      info.resistantTo.forEach(r => resistances.add(r));
      info.immuneTo.forEach(i => immunities.add(i));
    }
  });

  resistances.forEach(r => weaknesses.delete(r));
  immunities.forEach(i => {
    weaknesses.delete(i);
    resistances.delete(i);
  });

  return {
    weaknesses: Array.from(weaknesses),
    resistances: Array.from(resistances),
    immunities: Array.from(immunities)
  };
}

// Initialize Pokémon list on service worker startup
fetchPokemonList();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    if (request.type === 'GET_POKEMON_LIST') {
      // Retrieve the list from storage
      const { pokemonList } = await chrome.storage.local.get('pokemonList');
      sendResponse(pokemonList || []);
    } else if (request.type === 'FETCH_BATTLE_DATA') {
      const pokemonResponse = await fetchPokemonData(request.myPokemon);
      if (pokemonResponse.success) {
        const types = pokemonResponse.myPokemon.types.map(t => t.type.name);
        pokemonResponse.myPokemon.effectiveness = getTypeEffectiveness(types);
      }
      sendResponse(pokemonResponse);
    }
  })();
  return true; // Keeps the message channel open for sendResponse
});
