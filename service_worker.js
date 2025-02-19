import "./background.js";
import "./libs/pokeapi.js";
import "./libs/pokerogueutils.js";
import "./libs/utils.js";
import "./libs/enums/Nature.js";
import "./libs/enums/Stat.js";
import "./libs/enums/WeatherType.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_BATTLE_DATA') {
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${request.myPokemon}`),
      fetch(`https://pokeapi.co/api/v2/pokemon/${request.oppPokemon}`)
    ])
    .then(async responses => {
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error('One or both Pokémon not found');
      }
      const [myData, oppData] = await Promise.all(responses.map(r => r.json()));

      // Fetch species data (for evolution chain)
      const [mySpecies, oppSpecies] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${myData.id}`).then(r => r.json()),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${oppData.id}`).then(r => r.json())
      ]);

      // Fetch evolution chains
      const [myEvoChain, oppEvoChain] = await Promise.all([
        fetch(mySpecies.evolution_chain.url).then(r => r.json()),
        fetch(oppSpecies.evolution_chain.url).then(r => r.json())
      ]);

      sendResponse({
        success: true,
        myPokemon: { data: myData, species: mySpecies, evolutionChain: myEvoChain },
        oppPokemon: { data: oppData, species: oppSpecies, evolutionChain: oppEvoChain }
      });
    })
    .catch(error => {
      sendResponse({ success: false, error: error.message });
    });

    return true; // Keeps the messaging channel open for async response
  }
});
