import "./libs/pokeapi.js";
import "./libs/pokerogueutils.js";
import "./libs/utils.js";
import "./libs/enums/Nature.js";
import "./libs/enums/Stat.js";
import "./libs/enums/WeatherType.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_BATTLE_DATA") {
    (async () => {
      try {
        const fetchPokemonData = async (name) => {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
          if (!res.ok) throw new Error(`Pokémon ${name} not found`);
          return res.json();
        };

        const fetchSpeciesData = async (id) => {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
          if (!res.ok) throw new Error(`Species data not found for Pokémon ID ${id}`);
          return res.json();
        };

        const fetchEvolutionChain = async (url) => {
          if (!url) return null; // Some Pokémon don’t have evolution chains
          const res = await fetch(url);
          if (!res.ok) throw new Error("Evolution chain data not found");
          return res.json();
        };

        // Fetch Pokémon and species data
        const [myData, oppData] = await Promise.all([
          fetchPokemonData(request.myPokemon),
          fetchPokemonData(request.oppPokemon),
        ]);

        const [mySpecies, oppSpecies] = await Promise.all([
          fetchSpeciesData(myData.id),
          fetchSpeciesData(oppData.id),
        ]);

        // Fetch evolution chains
        const [myEvoChain, oppEvoChain] = await Promise.all([
          fetchEvolutionChain(mySpecies.evolution_chain?.url),
          fetchEvolutionChain(oppSpecies.evolution_chain?.url),
        ]);

        sendResponse({
          success: true,
          myPokemon: { data: myData, species: mySpecies, evolutionChain: myEvoChain },
          oppPokemon: { data: oppData, species: oppSpecies, evolutionChain: oppEvoChain },
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keeps the messaging channel open for async response
  }
});
