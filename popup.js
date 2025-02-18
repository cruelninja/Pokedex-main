document.getElementById('battleButton').addEventListener('click', () => {
  const myPokemon = document.getElementById('myPokemon').value.trim().toLowerCase();
  const oppPokemon = document.getElementById('oppPokemon').value.trim().toLowerCase();
  if (myPokemon && oppPokemon) {
    chrome.runtime.sendMessage({ type: 'FETCH_BATTLE_DATA', myPokemon, oppPokemon }, (response) => {
      if (response.success) {
        // Create HTML content for each Pokémon
        const myHtml = createPokemonHTML(response.myPokemon, 'Your Pokémon');
        const oppHtml = createPokemonHTML(response.oppPokemon, 'Opponent Pokémon');
        const combinedHTML = `<div class="battle-info">${myHtml}<hr>${oppHtml}</div>`;
        // Post message to content script to display the overlay
        window.postMessage({ type: 'SHOW_BATTLE_INFO', html: combinedHTML }, '*');
      } else {
        alert('Error: ' + response.error);
      }
    });
  } else {
    alert("Please enter both Pokémon names or IDs.");
  }
});

function createPokemonHTML(pokemonObj, title) {
  const data = pokemonObj.data;
  const species = pokemonObj.species;
  const evoChain = pokemonObj.evolutionChain;
  return `
    <h2>${title}: ${capitalizeFirstLetter(data.name)}</h2>
    <img src="${data.sprites.front_default}" alt="${data.name}">
    <p>Height: ${(data.height / 10).toFixed(1)} m</p>
    <p>Weight: ${(data.weight / 10).toFixed(1)} kg</p>
    <p>Types: ${data.types.map(t => capitalizeFirstLetter(t.type.name)).join(', ')}</p>
    <p>Evolution: ${displayEvolutionChain(evoChain)}</p>
  `;
}

function displayEvolutionChain(chain) {
  // Recursively traverse the evolution chain to build a simple representation.
  let evoHtml = '';
  function traverse(node) {
    evoHtml += capitalizeFirstLetter(node.species.name);
    if (node.evolves_to && node.evolves_to.length > 0) {
      // For simplicity, display the first evolution path.
      evoHtml += ' ➔ ';
      traverse(node.evolves_to[0]);
    }
  }
  traverse(chain);
  return evoHtml;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
