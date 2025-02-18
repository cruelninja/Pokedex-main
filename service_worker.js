try {
  importScripts("background.js", "libs/pokeapi.js", "libs/pokerogueutils.js", "libs/utils.js", "libs/enums/Nature.js", "libs/enums/Stat.js", "libs/enums/WeatherType.js");
} catch (e) {
  console.error("Error while importing script:", e);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_BATTLE_DATA') {
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${request.myPokemon}`),
      fetch(`https://pokeapi.co/api/v2/pokemon/${request.oppPokemon}`)
    ])
    .then(responses => {
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error('One or both Pokémon not found');
      }
      return Promise.all(responses.map(r => r.json()));
    })
    .then(([myData, oppData]) => {
      // Fetch species data (for evolution chain) for each Pokémon.
      return Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${myData.id}`).then(r => r.json()),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${oppData.id}`).then(r => r.json())
      ]).then(([mySpecies, oppSpecies]) => {
        return Promise.all([
          fetch(mySpecies.evolution_chain.url).then(r => r.json()),
          fetch(oppSpecies.evolution_chain.url).then(r => r.json())
        ]).then(([myEvoChain, oppEvoChain]) => {
          sendResponse({
            success: true,
            myPokemon: { data: myData, species: mySpecies, evolutionChain: myEvoChain },
            oppPokemon: { data: oppData, species: oppSpecies, evolutionChain: oppEvoChain }
          });
        });
      });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keeps the messaging channel open for asynchronous response.
  }
});
