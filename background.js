const pokemonList = [];

// Fetch the Pokémon list from the PokéAPI
async function fetchPokemonList() {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await response.json();
    data.results.forEach((pokemon, index) => {
        pokemonList.push({
            name: pokemon.name,
            number: index + 1
        });
    });
}

// Fetch the Pokémon list when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    fetchPokemonList();
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_POKEMON_LIST') {
        sendResponse(pokemonList);
    }
});