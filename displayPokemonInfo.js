async function displayPokemonInfo(pokemonName) {
    try {
      const data = await fetchPokemonData(pokemonName);
      if (!data) return;
      const types = data.types.map(t => t.type.name);
      const effectiveness = getTypeEffectiveness(types);
  
      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `
        <h2>${pokemonName.toUpperCase()}</h2>
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
  
  displayPokemonInfo('pikachu');