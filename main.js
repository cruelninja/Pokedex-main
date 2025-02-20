import fetchPokemonData from './fetchPokemonData.js';
import { getTypeEffectiveness } from './typeEffectiveness.js';

// Helper function to render types as bordered labels
function renderTypeLabels(types) {
  return types
    .map(type => `<span class="type-label ${type}">${type}</span>`)
    .join(' ');
}

async function handleUserInput(event) {
  event.preventDefault(); // Prevent form submission

  const userInput = document.getElementById('pokemon-input').value;
  const pokemonName = userInput.trim().toLowerCase();

  if (!pokemonName) {
    console.error('No Pokémon name provided');
    return;
  }

  try {
    // Fetch main Pokémon data
    const data = await fetchPokemonData(pokemonName);
    const types = data.types.map(t => t.type.name);
    const effectiveness = getTypeEffectiveness(types);
    const spriteUrl = data.sprites.front_default;

    // Fetch species data for evolution chain URL
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}`);
    const speciesData = await speciesResponse.json();

    let evolutionSprites = [];
    if (speciesData.evolution_chain && speciesData.evolution_chain.url) {
      const evoResponse = await fetch(speciesData.evolution_chain.url);
      const evoData = await evoResponse.json();
      const evolutionNames = parseEvolutionChain(evoData.chain); // Array of evolution names

      // Fetch sprite for each evolution
      evolutionSprites = await Promise.all(
        evolutionNames.map(async (evoName) => {
          try {
            const evoData = await fetchPokemonData(evoName);
            return {
              name: evoName,
              sprite: evoData.sprites.front_default
            };
          } catch (error) {
            console.error(`Error fetching data for ${evoName}:`, error);
            return { name: evoName, sprite: null };
          }
        })
      );
    }

    // Build evolution chain HTML with sprites
    let evolutionHTML = '';
    if (evolutionSprites.length > 0) {
      evolutionHTML = '<div class="evo-container">';
      evolutionSprites.forEach(evo => {
        evolutionHTML += `
          <div class="evo-card">
            <img src="${evo.sprite ? evo.sprite : ''}" alt="${evo.name} sprite" />
            <p>${evo.name.toUpperCase()}</p>
          </div>
        `;
      });
      evolutionHTML += '</div>';
    } else {
      evolutionHTML = '<p>Evolution Chain: None</p>';
    }

    // Update the DOM with Pokémon info using bordered type labels
    const infoDiv = document.getElementById('pokemon-info');
    infoDiv.innerHTML = `
      <div class="main-pokemon">
        <h2>${pokemonName.toUpperCase()}</h2>
        <img src="${spriteUrl}" alt="${pokemonName} sprite" />
        <p><strong>Types:</strong> ${renderTypeLabels(types)}</p>
        <p><strong>Weaknesses:</strong> ${
          effectiveness.weaknesses.length
            ? renderTypeLabels(effectiveness.weaknesses)
            : 'None'
        }</p>
        <p><strong>Resistances:</strong> ${
          effectiveness.resistances.length
            ? renderTypeLabels(effectiveness.resistances)
            : 'None'
        }</p>
        <p><strong>Immunities:</strong> ${
          effectiveness.immunities.length
            ? renderTypeLabels(effectiveness.immunities)
            : 'None'
        }</p>
      </div>
      <h3>Evolution Chain</h3>
      ${evolutionHTML}
    `;
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
    const infoDiv = document.getElementById('pokemon-info');
    infoDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
  }
}

// Recursively parse the evolution chain to build an array of species names
function parseEvolutionChain(chain) {
  let evoNames = [];
  if (!chain) return evoNames;
  evoNames.push(chain.species.name);
  chain.evolves_to.forEach(evo => {
    evoNames = evoNames.concat(parseEvolutionChain(evo));
  });
  return evoNames;
}

document.getElementById('pokemon-form').addEventListener('submit', handleUserInput);
