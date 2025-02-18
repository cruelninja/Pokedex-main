function displayPokedex(pokemon) {
    // Create or update the Pokedex overlay with Pokémon data
    let overlay = document.getElementById('pokedex-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pokedex-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '10px';
        overlay.style.right = '10px';
        overlay.style.backgroundColor = 'white';
        overlay.style.border = '1px solid #ccc';
        overlay.style.padding = '10px';
        overlay.style.zIndex = '1000';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <h2>${capitalizeFirstLetter(pokemon.data.name)}</h2>
        <img src="${pokemon.data.sprites.front_default}" alt="${pokemon.data.name}">
        <div class="types">${pokemon.data.types.map(type => `<span>${capitalizeFirstLetter(type.type.name)}</span>`).join(', ')}</div>
        <div class="stats">
            <h3>Stats</h3>
            <ul>
                ${pokemon.data.stats.map(stat => `<li>${capitalizeFirstLetter(stat.stat.name)}: ${stat.base_stat}</li>`).join('')}
            </ul>
        </div>
        <div class="abilities">
            <h3>Abilities</h3>
            <ul>
                ${pokemon.data.abilities.map(ability => `<li>${capitalizeFirstLetter(ability.ability.name)}</li>`).join('')}
            </ul>
        </div>
        <div class="evolution-chain">
            <h3>Evolution Chain</h3>
            ${pokemon.evolutionChain.chain.map(evo => `<img src="${evo.species.url}" alt="${evo.species.name}">`).join('')}
        </div>
    `;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}