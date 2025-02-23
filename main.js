// Pokemon App Main Module
import fetchPokemonData, { renderTypeLabels } from './fetchPokemonData.js';
import { getTypeEffectiveness } from './typeEffectiveness.js';

// Constants
const API_BASE_URL = 'https://pokeapi.co/api/v2';
const FADE_DURATION = 150;

// State management
const state = {
  pokemonNames: [],
  currentGen: null
};

// Form variations mapping
const formVariants = {
  'toxtricity': ['toxtricity-amped', 'toxtricity-low-key'],
  'urshifu': ['urshifu-single-strike', 'urshifu-rapid-strike'],
  'indeedee': ['indeedee-male', 'indeedee-female'],
  'eiscue': ['eiscue-ice', 'eiscue-noice'],
  'morpeko': ['morpeko', 'morpeko-hangry', 'morpeko-full-belly'],
  'oricorio': ['oricorio-pom-pom', 'oricorio-pau', 'oricorio-baile', 'oricorio-sensu'],
  'lycanroc': ['lycanroc-midday', 'lycanroc-midnight', 'lycanroc-dusk'],
  'wishiwashi': ['wishiwashi-solo', 'wishiwashi-school'],
  'meowstic': ['meowstic-male', 'meowstic-female'],
  'aegislash': ['aegislash-shield', 'aegislash-blade'],
  'wormadam': ['wormadam-plant', 'wormadam-sandy', 'wormadam-trash'],
  'minior': ['minior-red', 'minior-blue', 'minior-green', 'minior-indigo', 'minior-orange', 'minior-yellow', 'minior-violet'],
  'mimikyu': ['mimikyu-disguised', 'mimikyu-busted']
};

// UI Helper Functions
const UI = {
  fadeOut: async (element, duration = FADE_DURATION) => {
    if (!element) return;
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = 0;
    await new Promise(resolve => setTimeout(resolve, duration));
    element.style.display = 'none';
  },

  fadeIn: (element, duration = FADE_DURATION, display = 'block') => {
    if (!element) return;
    element.style.opacity = 0;
    element.style.display = display;
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    requestAnimationFrame(() => element.style.opacity = 1);
  },

  createElement: (tag, className, content = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  },

  getElement: (id) => {
    const element = document.getElementById(id);
    if (!element) console.warn(`Element with id '${id}' not found`);
    return element;
  }
};

// API Functions
const API = {
  async fetchWithFallback(specName) {
    const namesToTry = formVariants[specName] || [specName];

    // Try each variant name
    for (const name of namesToTry) {
      try {
        const data = await fetchPokemonData(name);
        if (data?.sprites?.front_default) return data;
      } catch (error) {
        console.warn(`Fetch error for "${name}":`, error);
      }
    }

    // Try species endpoint as fallback
    try {
      const speciesData = await this.fetchJson(`${API_BASE_URL}/pokemon-species/${specName}`);
      if (speciesData?.varieties) {
        for (const variety of speciesData.varieties) {
          try {
            const data = await fetchPokemonData(variety.pokemon.name);
            if (data?.sprites?.front_default) return data;
          } catch (error) {
            console.warn(`Variant fetch error for "${variety.pokemon.name}":`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Species fetch error for "${specName}":`, error);
    }

    return null;
  },

  async fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async getEvolutionChain(url) {
    try {
      const data = await this.fetchJson(url);
      return this.parseEvolutionChain(data.chain);
    } catch (error) {
      console.warn('Evolution chain fetch error:', error);
      return [];
    }
  },

  parseEvolutionChain(chain) {
    const evolutions = [];

    function traverse(node) {
      if (!node) return;

      evolutions.push({
        name: node.species.name,
        details: node.evolves_to[0]?.evolution_details[0] || null
      });

      node.evolves_to.forEach(traverse);
    }

    traverse(chain);
    return evolutions;
  }
};

// Pokemon Library Functions
class PokemonLibrary {
  static async loadGeneration(gen) {
    if (state.currentGen === gen) return;
    state.currentGen = gen;

    const libraryDiv = UI.getElement('library');
    const genButtons = UI.getElement('gen-buttons');

    if (!libraryDiv) return;
    if (genButtons) genButtons.style.display = 'flex';

    libraryDiv.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const data = await API.fetchJson(`${API_BASE_URL}/generation/${gen}`);
      const species = data.pokemon_species.sort((a, b) => {
        return this.extractId(a.url) - this.extractId(b.url);
      });

      state.pokemonNames = species.map(spec => spec.name);
      await this.renderPokemonCards(species, libraryDiv);

      UI.fadeIn(libraryDiv, FADE_DURATION, 'grid');
    } catch (error) {
      console.error('Generation load error:', error);
      libraryDiv.innerHTML = `<p class="error">Error loading generation ${gen}</p>`;
    }
  }

  static async renderPokemonCards(species, container) {
    container.innerHTML = '';

    for (const spec of species) {
      try {
        const data = await API.fetchWithFallback(spec.name);
        if (!data) continue;

        const card = this.createPokemonCard(data);
        container.appendChild(card);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Card render error for ${spec.name}:`, error);
      }
    }
  }

  static createPokemonCard(data) {
    const card = UI.createElement('div', 'library-card');

    const img = UI.createElement('img');
    img.src = data.sprites.front_default;
    img.alt = `${data.name} sprite`;
    img.onerror = () => {
      img.src = 'assets/placeholder.png';
      img.alt = 'Sprite unavailable';
    };

    const name = UI.createElement('p', '', data.name.charAt(0).toUpperCase() + data.name.slice(1));
    const info = UI.createElement('div', 'lib-info', `
            <p>#${data.id}</p>
            <p>${data.types.map(t => t.type.name).join(', ')}</p>
        `);

    card.append(img, name, info);
    card.addEventListener('click', () => this.handleCardClick(data.name));

    return card;
  }

  static async handleCardClick(pokemonName) {
    const libraryDiv = UI.getElement('library');
    const genButtons = UI.getElement('gen-buttons');

    await UI.fadeOut(libraryDiv);
    if (genButtons) genButtons.style.display = 'none';
    await PokemonDetail.load(pokemonName);
  }

  static extractId(url) {
    return parseInt(url.split('/').filter(Boolean).pop(), 10);
  }
}

// Pokemon Detail View
class PokemonDetail {
  static async load(pokemonId) {
    const infoDiv = UI.getElement('pokemon-info');
    if (!infoDiv) return;

    infoDiv.innerHTML = '<p class="loading">Loading...</p>';

    try {
      const data = await fetchPokemonData(pokemonId);
      if (!data) throw new Error('Failed to fetch Pokemon data');

      const types = data.types.map(t => t.type.name);
      const effectiveness = getTypeEffectiveness(types);

      const speciesData = await API.fetchJson(`${API_BASE_URL}/pokemon-species/${pokemonId}`);
      const evolutionHTML = await this.generateEvolutionHTML(speciesData);

      await this.renderDetail(infoDiv, data, types, effectiveness, evolutionHTML);
      this.setupFormToggle(infoDiv, pokemonId);

      UI.fadeIn(infoDiv);

      const libraryDiv = UI.getElement('library');
      const backButton = UI.getElement('back-button');

      if (libraryDiv) libraryDiv.style.display = 'none';
      if (backButton) backButton.style.display = 'block';
    } catch (error) {
      console.error('Detail load error:', error);
      infoDiv.innerHTML = `<p class="error">Error loading Pokemon details</p>`;
    }
  }

  static async generateEvolutionHTML(speciesData) {
    if (!speciesData.evolution_chain?.url) return '<p>No evolutions available</p>';

    const evolutions = await API.getEvolutionChain(speciesData.evolution_chain.url);
    if (!evolutions.length) return '<p>No evolution data available</p>';

    const evoCards = await Promise.all(evolutions.map(async evo => {
      try {
        const data = await fetchPokemonData(evo.name);
        return this.createEvolutionCard(data, evo.details);
      } catch (error) {
        console.warn(`Evolution card error for ${evo.name}:`, error);
        return '';
      }
    }));

    return `<div class="evo-container">${evoCards.join('')}</div>`;
  }

  static createEvolutionCard(data, details) {
    const minLevel = details?.min_level || 'N/A';
    const trigger = details?.trigger?.name || 'N/A';
    const isMega = details?.item?.name.includes('mega');

    return `
            <div class="evo-card">
                <img src="${data.sprites.front_default || 'assets/placeholder.png'}" 
                     alt="${data.name.toUpperCase()} sprite"
                     onerror="this.src='assets/placeholder.png'">
                ${isMega ? '<div class="mega-label">Mega Evolution</div>' : ''}
                <p>${data.name.toUpperCase()}</p>
                <p class="evo-info">Level: ${minLevel} | Trigger: ${trigger}</p>
            </div>
        `;
  }

  static async renderDetail(container, data, types, effectiveness, evolutionHTML) {
    container.innerHTML = `
            <div class="main-pokemon">
                <h2>${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h2>
                <img src="${data.sprites.front_default}" alt="${data.name} sprite" 
                     onerror="this.src='assets/placeholder.png'">
                <p><strong>Types:</strong> ${renderTypeLabels(types)}</p>
                <p><strong>Weaknesses:</strong> ${effectiveness.weaknesses.length ?
        renderTypeLabels(effectiveness.weaknesses) : 'None'}</p>
                <p><strong>Resistances:</strong> ${effectiveness.resistances.length ?
        renderTypeLabels(effectiveness.resistances) : 'None'}</p>
                <p><strong>Immunities:</strong> ${effectiveness.immunities.length ?
        renderTypeLabels(effectiveness.immunities) : 'None'}</p>
            </div>
            <h3>Evolution Chain</h3>
            ${evolutionHTML}
        `;
  }

  static setupFormToggle(container, pokemonId) {
    const forms = this.getFormVariants(pokemonId);
    if (!forms) return;

    const button = UI.createElement('button', 'mega-toggle-button');
    button.textContent = pokemonId === forms.default ? 'View Alternate Form' : 'View Default Form';
    button.onclick = () => this.load(pokemonId === forms.default ? forms.alternate : forms.default);

    container.insertAdjacentElement('afterbegin', button);
  }

  static getFormVariants(pokemonName) {
    if (formVariants[pokemonName]) {
      const alternates = formVariants[pokemonName].filter(name => name !== pokemonName);
      if (alternates.length) return { default: pokemonName, alternate: alternates[0] };
    }

    for (const [key, variants] of Object.entries(formVariants)) {
      if (variants.includes(pokemonName)) {
        return { default: key, alternate: pokemonName };
      }
    }

    return null;
  }
}

// Search Functionality
class PokemonSearch {
  static init() {
    const input = UI.getElement('pokemon-input');
    const suggestions = UI.getElement('suggestions');
    if (!input || !suggestions) return;

    let selectedIndex = -1;

    input.addEventListener('input', () => this.handleInput(input, suggestions));
    input.addEventListener('keydown', (e) => this.handleKeydown(e, input, suggestions));

    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = 'none';
      }
    });
  }

  static handleInput(input, suggestions) {
    const query = input.value.toLowerCase().trim();
    suggestions.innerHTML = '';

    if (!query) {
      suggestions.style.display = 'none';
      return;
    }

    const matches = state.pokemonNames.filter(name => name.includes(query));
    if (!matches.length) {
      suggestions.style.display = 'none';
      return;
    }

    matches.forEach((name, index) => {
      const li = UI.createElement('li', '', name);
      li.dataset.index = index;
      li.onclick = () => this.selectSuggestion(input, suggestions, name);
      suggestions.appendChild(li);
    });

    suggestions.style.display = 'block';
  }

  static handleKeydown(event, input, suggestions) {
    const items = suggestions.getElementsByTagName('li');
    if (!items.length) return;

    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        this.updateSelection(items, selectedIndex);
        break;

      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        this.updateSelection(items, selectedIndex);
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          const selectedName = items[selectedIndex].textContent;
          this.selectSuggestion(input, suggestions, selectedName);
        }
        break;
    }
  }

  static updateSelection(items, selectedIndex) {
    Array.from(items).forEach((item, index) => {
      item.classList.toggle('selected', index === selectedIndex);
      if (index === selectedIndex) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  static selectSuggestion(input, suggestions, name) {
    input.value = name;
    suggestions.style.display = 'none';
    PokemonDetail.load(name);
  }
}

// Back Button Handler
class NavigationHandler {
  static init() {
    const backButton = UI.getElement('back-button');
    if (!backButton) return;

    backButton.addEventListener('click', async () => {
      const infoDiv = UI.getElement('pokemon-info');
      const libraryDiv = UI.getElement('library');

      if (infoDiv && libraryDiv) {
        await UI.fadeOut(infoDiv);
        backButton.style.display = 'none';
        await PokemonLibrary.loadGeneration(state.currentGen);
      }
    });
  }
}

// Generation Selection Handler
class GenerationHandler {
  static init() {
    const genSelect = UI.getElement('gen-select');
    if (!genSelect) {
      console.warn('Generation select not found, defaulting to Gen 1');
      PokemonLibrary.loadGeneration(1);
      return;
    }

    genSelect.addEventListener('change', (event) => {
      PokemonLibrary.loadGeneration(event.target.value);
    });

    // Load initial generation
    PokemonLibrary.loadGeneration(genSelect.value || 1);
  }
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  try {
    NavigationHandler.init();
    GenerationHandler.init();
    PokemonSearch.init();
  } catch (error) {
    console.error('Initialization error:', error);
  }
});

// Export necessary functions and classes
export {
  PokemonLibrary,
  PokemonDetail,
  PokemonSearch,
  NavigationHandler,
  GenerationHandler
};