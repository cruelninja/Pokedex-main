import typeChart from './typeChart.js';

async function fetchPokemonData(pokemonName) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
  if (!response.ok) throw new Error('Pokémon not found');
  return response.json();
}

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEARCH_POKEMON') {
      chrome.runtime.sendMessage(
          { type: 'FETCH_BATTLE_DATA', myPokemon: message.pokemonSearch },
          (response) => {
              if (response.success) {
                  displayPokemonInfo(response.myPokemon);
              } else {
                  console.error("Failed to fetch Pokémon data: ", response.error);
              }
          }
      );
  }
});

function displayPokemonInfo(pokemon) {
  try {
      const types = pokemon.types.map(t => t.type.name);
      const effectiveness = pokemon.effectiveness;

      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `
          <h2>${pokemon.name.toUpperCase()}</h2>
          <p>Types: ${types.join(', ')}</p>
          <p>Weaknesses: ${effectiveness.weaknesses.join(', ') || 'None'}</p>
          <p>Resistances: ${effectiveness.resistances.join(', ') || 'None'}</p>
          <p>Immunities: ${effectiveness.immunities.join(', ') || 'None'}</p>
      `;
      document.body.appendChild(infoDiv);
  } catch (error) {
      console.error('Error displaying Pokémon data:', error);
  }
}

