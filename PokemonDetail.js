// Define local image paths
const LOCAL_SPRITE_BASE = "sprites/pokemon/";
const LOCAL_MEGA_BASE = "sprites/pokemon/mega/";
const LOCAL_GMAX_BASE = "sprites/pokemon/G-Max/";

// API configuration
const POKEAPI_BASE = "https://pokeapi.co/api/v2/";
const CACHE = new Map();

// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Fetch with caching and timeout
async function fetchWithCache(url, timeout = 10000) {
  if (CACHE.has(url)) {
    return CACHE.get(url);
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    CACHE.set(url, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// Fetch Pokémon data by ID
async function fetchPokemonDetailById(id) {
  try {
    return await fetchWithCache(`${POKEAPI_BASE}pokemon/${id}`);
  } catch (error) {
    console.error(`Error fetching Pokémon by ID ${id}:`, error);
    return null;
  }
}

// Fetch Pokémon species data
async function fetchPokemonSpecies(name) {
  try {
    return await fetchWithCache(`${POKEAPI_BASE}pokemon-species/${name}`);
  } catch (error) {
    console.error(`Error fetching species: ${name}`, error);
    return null;
  }
}

// Fetch evolution chain
async function fetchEvolutionChain(url) {
  try {
    return await fetchWithCache(url);
  } catch (error) {
    console.error("Error fetching evolution chain:", error);
    return null;
  }
}

const getIdFromUrl = (url) => url.split('/').filter(Boolean).pop();

const getAllEvolutions = (chain) => {
  const evolutions = [];
  function traverse(node) {
    evolutions.push({
      name: node.species.name,
      id: getIdFromUrl(node.species.url)
    });
    node.evolves_to.forEach(traverse);
  }
  traverse(chain);
  return evolutions;
};

// Format a Pokémon name to capitalize first letter
function formatPokemonName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Create a loading spinner element
function createLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = `
    <div class="spinner"></div>
    <p>Loading Pokémon data...</p>
  `;
  return spinner;
}

// New helper function to add flavor text description to the detail card
async function addDescription(pokemon, card) {
  try {
    const speciesData = await fetchPokemonSpecies(pokemon.name);
    if (speciesData && speciesData.flavor_text_entries) {
      // Filter for English flavor text entries
      const englishEntries = speciesData.flavor_text_entries.filter(
        entry => entry.language.name === "en"
      );
      
      // For consistency, try to pick the entry from 'firered' version; if not available, take the first one
      const flavorEntry = englishEntries.find(entry => entry.version.name === "firered") || englishEntries[0];
      
      if (flavorEntry && flavorEntry.flavor_text) {
        // Replace newline and form-feed characters with spaces
        const descriptionText = flavorEntry.flavor_text.replace(/[\n\f]/g, " ");
        
        // Create the description element
        const descriptionElem = document.createElement("div");
        descriptionElem.className = "pokemon-description";
        
        // Create a span for the text to ensure it appears above the background pokeball
        const textSpan = document.createElement("span");
        textSpan.textContent = descriptionText;
        descriptionElem.appendChild(textSpan);
        
        // Add the version badge
        const versionBadge = document.createElement("span");
        versionBadge.className = "version-badge";
        versionBadge.textContent = flavorEntry.version.name;
        descriptionElem.appendChild(versionBadge);
        
        // Insert the description right after the top section
        const topSection = card.querySelector(".detail-top-section");
        if (topSection) {
          card.insertBefore(descriptionElem, topSection.nextSibling);
        } else {
          card.appendChild(descriptionElem);
        }
      }
    }
  } catch (error) {
    console.error("Error adding description:", error);
  }
}

// Create detailed Pokémon information card
function createDetailCard(pokemon) {
  const card = document.createElement("div");
  card.className = "pokemon-detail-card";

  // Top Section
  const topSection = document.createElement("div");
  topSection.className = "detail-top-section";

  // Container for sprite and name together
  const spriteNameContainer = document.createElement("div");
  spriteNameContainer.className = "sprite-name-container";
  spriteNameContainer.style.display = "flex";
  spriteNameContainer.style.flexDirection = "column";
  spriteNameContainer.style.alignItems = "center";
  spriteNameContainer.style.marginBottom = "0.75rem";

  // Sprite container to ensure centering
  const spriteContainer = document.createElement("div");
  spriteContainer.className = "sprite-container";
  spriteContainer.style.marginBottom = "0.75rem";

  const img = document.createElement("img");
  img.src = `${LOCAL_SPRITE_BASE}${pokemon.id}.png`;
  img.alt = pokemon.name;
  img.className = "pokemon-sprite";
  img.style.width = "150px";
  img.style.height = "150px";
  img.onerror = () => {
    img.src = "default-pokemon.png";
    console.warn(`Failed to load sprite for ${pokemon.name}`);
  };
  spriteContainer.appendChild(img);

  spriteNameContainer.appendChild(spriteContainer);

  // Pokémon name element
  const nameElem = document.createElement("h2");
  nameElem.className = "pokemon-name";
  nameElem.textContent = `${formatPokemonName(pokemon.name)} (#${pokemon.id})`;
  nameElem.style.marginBottom = "0.75rem";
  spriteNameContainer.appendChild(nameElem);

  // Type container
  const typeContainer = document.createElement("div");
  typeContainer.className = "type-container";
  typeContainer.style.marginBottom = "0.75rem";
  pokemon.types.forEach(type => {
    const typeLabel = document.createElement("span");
    typeLabel.className = "type-label";
    typeLabel.textContent = type.type.name;
    typeLabel.style.backgroundColor = `var(--type-${type.type.name})`;
    typeContainer.appendChild(typeLabel);
  });

  topSection.append(spriteNameContainer, typeContainer);

  // Stats Section
  const statsSection = document.createElement("div");
  statsSection.className = "stats-section";
  statsSection.style.marginBottom = "1.5rem";

  const statsTitle = document.createElement("h3");
  statsTitle.textContent = "Base Stats";
  statsTitle.style.marginBottom = "0.5rem";

  const statList = document.createElement("div");
  statList.className = "stat-list";
  statList.style.gap = "0.5rem";

  const statDisplayNames = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SP-ATK',
    'special-defense': 'SP-DEF',
    'speed': 'SPEED'
  };

  // Calculate total stats
  let totalStats = 0;
  pokemon.stats.forEach(stat => totalStats += stat.base_stat);

  pokemon.stats.forEach(stat => {
    const statItem = document.createElement("div");
    statItem.className = "stat-item";
    statItem.style.display = "flex";
    statItem.style.flexDirection = "column";
    statItem.style.gap = "0.25rem";

    // Row for stat name and value
    const textRow = document.createElement("div");
    textRow.style.display = "flex";
    textRow.style.justifyContent = "space-between";
    textRow.style.width = "100%";

    const statName = document.createElement("span");
    statName.className = "stat-name";
    statName.textContent = statDisplayNames[stat.stat.name] || stat.stat.name.toUpperCase();

    const statValue = document.createElement("span");
    statValue.className = "stat-value";
    statValue.textContent = stat.base_stat;

    textRow.append(statName, statValue);
    statItem.appendChild(textRow);

    // Bar indicator
    const statBarContainer = document.createElement("div");
    statBarContainer.style.backgroundColor = "rgba(255,255,255,0.3)";
    statBarContainer.style.width = "100%";
    statBarContainer.style.height = "6px";
    statBarContainer.style.borderRadius = "3px";

    const statBar = document.createElement("div");
    const statPercent = Math.min((stat.base_stat / 255) * 100, 100);
    statBar.style.height = "100%";
    statBar.style.width = `${statPercent}%`;
    statBar.style.backgroundColor = getStatColor(stat.base_stat);
    statBar.style.borderRadius = "3px";

    statBarContainer.appendChild(statBar);
    statItem.appendChild(statBarContainer);

    statList.appendChild(statItem);
  });

  // Add total stats row
  const totalStatItem = document.createElement("div");
  totalStatItem.className = "stat-item total-stats";
  totalStatItem.style.display = "flex";
  totalStatItem.style.flexDirection = "column";
  totalStatItem.style.gap = "0.25rem";
  totalStatItem.style.marginTop = "0.5rem";
  totalStatItem.style.borderTop = "1px solid rgba(255,255,255,0.2)";
  totalStatItem.style.paddingTop = "0.5rem";

  const totalTextRow = document.createElement("div");
  totalTextRow.style.display = "flex";
  totalTextRow.style.justifyContent = "space-between";
  totalTextRow.style.width = "100%";

  const totalName = document.createElement("span");
  totalName.className = "stat-name";
  totalName.style.fontWeight = "bold";
  totalName.textContent = "TOTAL";

  const totalValue = document.createElement("span");
  totalValue.className = "stat-value";
  totalValue.style.fontWeight = "bold";
  totalValue.textContent = totalStats;

  totalTextRow.append(totalName, totalValue);
  totalStatItem.appendChild(totalTextRow);
  statList.appendChild(totalStatItem);

  statsSection.append(statsTitle, statList);

  // Evolution Section
  const evolutionSection = document.createElement("div");
  evolutionSection.className = "evolution-section";
  evolutionSection.style.marginBottom = "1.5rem";

  const evoTitle = document.createElement("h3");
  evoTitle.textContent = "Evolution";
  evoTitle.style.marginBottom = "0.5rem";

  const evoChain = document.createElement("div");
  evoChain.className = "evolution-chain";
  evoChain.style.display = "flex";
  evoChain.style.alignItems = "center";
  evoChain.style.justifyContent = "center";
  evoChain.style.flexWrap = "wrap";
  evoChain.style.gap = "0.5rem";

  const evoLoading = document.createElement("div");
  evoLoading.className = "loading-indicator";
  evoLoading.textContent = "Loading evolution data...";
  evoChain.appendChild(evoLoading);

  evolutionSection.append(evoTitle, evoChain);

  // Mega Evolution Section
  const megaSection = document.createElement("div");
  megaSection.className = "mega-section";
  megaSection.style.marginBottom = "1.5rem";

  const megaTitle = document.createElement("h3");
  megaTitle.textContent = "Mega Evolution";
  megaTitle.style.marginBottom = "0.5rem";

  const megaChain = document.createElement("div");
  megaChain.className = "mega-chain";
  megaChain.style.display = "flex";
  megaChain.style.alignItems = "center";
  megaChain.style.justifyContent = "center";
  megaChain.style.gap = "1rem";

  const megaLoading = document.createElement("div");
  megaLoading.className = "loading-indicator";
  megaLoading.textContent = "Loading mega evolution data...";
  megaChain.appendChild(megaLoading);

  megaSection.append(megaTitle, megaChain);

  // Gigantamax Section
  const gmaxSection = document.createElement("div");
  gmaxSection.className = "gmax-section";
  gmaxSection.style.marginBottom = "1.5rem";

  const gmaxTitle = document.createElement("h3");
  gmaxTitle.textContent = "Gigantamax";
  gmaxTitle.style.marginBottom = "0.5rem";

  const gmaxChain = document.createElement("div");
  gmaxChain.className = "gmax-chain";
  gmaxChain.style.display = "flex";
  gmaxChain.style.alignItems = "center";
  gmaxChain.style.justifyContent = "center";
  gmaxChain.style.gap = "1rem";

  const gmaxLoading = document.createElement("div");
  gmaxLoading.className = "loading-indicator";
  gmaxLoading.textContent = "Loading gigantamax data...";
  gmaxChain.appendChild(gmaxLoading);

  gmaxSection.append(gmaxTitle, gmaxChain);

  // Abilities Section
  const abilitiesSection = document.createElement("div");
  abilitiesSection.className = "abilities-section";
  abilitiesSection.style.marginBottom = "1.5rem";

  const abilitiesTitle = document.createElement("h3");
  abilitiesTitle.textContent = "Abilities";
  abilitiesTitle.style.marginBottom = "0.5rem";

  const abilitiesList = document.createElement("div");
  abilitiesList.className = "abilities-list";
  abilitiesList.style.display = "flex";
  abilitiesList.style.flexDirection = "column";
  abilitiesList.style.gap = "0.5rem";

  pokemon.abilities.forEach(ability => {
    const abilityItem = document.createElement("div");
    abilityItem.className = "ability-item";
    abilityItem.style.display = "flex";
    abilityItem.style.alignItems = "center";
    abilityItem.style.gap = "0.5rem";

    const abilityName = document.createElement("span");
    abilityName.className = "ability-name";
    abilityName.textContent = formatPokemonName(ability.ability.name.replace('-', ' '));

    if (ability.is_hidden) {
      const hiddenBadge = document.createElement("span");
      hiddenBadge.className = "hidden-badge";
      hiddenBadge.textContent = "Hidden";
      hiddenBadge.style.fontSize = "0.7rem";
      hiddenBadge.style.padding = "0.1rem 0.3rem";
      hiddenBadge.style.backgroundColor = "rgba(255,255,255,0.2)";
      hiddenBadge.style.borderRadius = "0.25rem";
      abilityItem.appendChild(hiddenBadge);
    }

    abilityItem.appendChild(abilityName);
    abilitiesList.appendChild(abilityItem);
  });

  abilitiesSection.append(abilitiesTitle, abilitiesList);

  // Physical Characteristics Section
  const physicalSection = document.createElement("div");
  physicalSection.className = "physical-section";
  physicalSection.style.marginBottom = "1.5rem";

  const physicalTitle = document.createElement("h3");
  physicalTitle.textContent = "Physical Characteristics";
  physicalTitle.style.marginBottom = "0.5rem";

  const physicalList = document.createElement("div");
  physicalList.className = "physical-list";
  physicalList.style.display = "flex";
  physicalList.style.flexWrap = "wrap";
  physicalList.style.gap = "1rem";

  // Height
  const heightItem = document.createElement("div");
  heightItem.className = "physical-item";
  heightItem.style.display = "flex";
  heightItem.style.flexDirection = "column";
  heightItem.style.alignItems = "center";

  const heightValue = document.createElement("span");
  heightValue.className = "physical-value";
  heightValue.textContent = `${(pokemon.height / 10).toFixed(1)}m`;

  const heightLabel = document.createElement("span");
  heightLabel.className = "physical-label";
  heightLabel.textContent = "Height";

  heightItem.append(heightValue, heightLabel);

  // Weight
  const weightItem = document.createElement("div");
  weightItem.className = "physical-item";
  weightItem.style.display = "flex";
  weightItem.style.flexDirection = "column";
  weightItem.style.alignItems = "center";

  const weightValue = document.createElement("span");
  weightValue.className = "physical-value";
  weightValue.textContent = `${(pokemon.weight / 10).toFixed(1)}kg`;

  const weightLabel = document.createElement("span");
  weightLabel.className = "physical-label";
  weightLabel.textContent = "Weight";

  weightItem.append(weightValue, weightLabel);

  physicalList.append(heightItem, weightItem);
  physicalSection.append(physicalTitle, physicalList);

  // Append all sections to the card
  card.append(
    topSection,
    physicalSection,
    statsSection,
    abilitiesSection,
    evolutionSection,
    megaSection,
    gmaxSection
  );

  return card;
}

// Helper function to get color based on stat value
function getStatColor(value) {
  if (value < 50) return '#FF5959'; // Red for low stats
  if (value < 80) return '#FFA333'; // Orange for medium stats
  if (value < 120) return '#F4D23C'; // Yellow for good stats
  return '#72CB91'; // Green for excellent stats
}

// Update forms (evolutions, mega, gmax)
async function updateForms(pokemon, card) {
  try {
    const speciesData = await fetchPokemonSpecies(pokemon.name);
    if (!speciesData) {
      updateSectionWithError(card, 'evolution-chain', 'Failed to load species data');
      return;
    }

    const evoData = await fetchEvolutionChain(speciesData.evolution_chain.url);
    if (!evoData) {
      updateSectionWithError(card, 'evolution-chain', 'Failed to load evolution data');
      return;
    }

    const evolutions = getAllEvolutions(evoData.chain);

    // Update evolution chain
    updateEvolutionChain(card, evolutions, pokemon.name);

    // Update mega evolution
    updateMegaEvolution(card, pokemon);

    // Update gigantamax
    updateGigantamax(card, pokemon);
  } catch (error) {
    console.error("Error updating forms:", error);
    updateSectionWithError(card, 'evolution-chain', 'Error loading evolution data');
  }
}

// Helper function to update a section with an error message
function updateSectionWithError(card, sectionClass, errorMessage) {
  const section = card.querySelector(`.${sectionClass}`);
  if (section) {
    section.innerHTML = "";
    const errorElement = document.createElement("div");
    errorElement.className = "error-message";
    errorElement.textContent = errorMessage;
    section.appendChild(errorElement);
  }
}

// Update evolution chain
function updateEvolutionChain(card, evolutions, currentPokemonName) {
  const evolutionChain = card.querySelector(".evolution-chain");
  evolutionChain.innerHTML = "";

  if (evolutions.length <= 1) {
    const noEvoMessage = document.createElement("div");
    noEvoMessage.className = "no-evolution";
    noEvoMessage.textContent = `${formatPokemonName(currentPokemonName)} does not evolve.`;
    evolutionChain.appendChild(noEvoMessage);
  } else {
    const evoLineContainer = document.createElement("div");
    evoLineContainer.className = "evolution-line-container";
    evoLineContainer.style.display = "flex";
    evoLineContainer.style.alignItems = "center";
    evoLineContainer.style.justifyContent = "center";
    evoLineContainer.style.flexWrap = "wrap";
    evoLineContainer.style.gap = "0.75rem";

    evolutions.forEach((evo, index) => {
      const evoNode = document.createElement("div");
      evoNode.className = "evolution-node";
      evoNode.style.display = "flex";
      evoNode.style.flexDirection = "column";
      evoNode.style.alignItems = "center";
      evoNode.style.gap = "0.25rem";

      if (evo.name === currentPokemonName) {
        evoNode.style.backgroundColor = "rgba(255,255,255,0.15)";
        evoNode.style.padding = "0.5rem";
        evoNode.style.borderRadius = "0.5rem";
      }

      const evoImg = document.createElement("img");
      evoImg.src = `${LOCAL_SPRITE_BASE}${evo.id}.png`;
      evoImg.alt = evo.name;
      evoImg.style.width = "60px";
      evoImg.style.height = "60px";
      evoImg.onerror = () => evoImg.src = "default-pokemon.png";

      evoImg.style.cursor = "pointer";
      evoImg.addEventListener("click", () => {
        window.location.href = `?id=${evo.id}`;
      });

      const evoName = document.createElement("span");
      evoName.textContent = formatPokemonName(evo.name);
      evoName.style.fontSize = "0.9rem";

      evoNode.append(evoImg, evoName);
      evoLineContainer.appendChild(evoNode);

      if (index < evolutions.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "evolution-arrow";
        arrow.textContent = "→";
        arrow.style.fontSize = "1.2rem";
        evoLineContainer.appendChild(arrow);
      }
    });

    evolutionChain.appendChild(evoLineContainer);
  }
}

// Update mega evolution
function updateMegaEvolution(card, pokemon) {
  const megaChain = card.querySelector(".mega-chain");
  megaChain.innerHTML = "";

  const capitalizedName = formatPokemonName(pokemon.name);
  const nameLower = pokemon.name.toLowerCase();
  const dualMegaNames = ["charizard", "mewtwo"]; // Pokémon with dual mega evolutions
  const hasMegaEvolution = ["charizard", "blastoise", "venusaur", "mewtwo", "gengar", "kangaskhan", "gyarados", "aerodactyl", "ampharos", "scizor", "heracross", "houndoom", "tyranitar", "blaziken", "gardevoir", "mawile", "aggron", "medicham", "manectric", "banette", "absol", "garchomp", "lucario", "abomasnow", "beedrill", "pidgeot", "slowbro", "steelix", "sceptile", "swampert", "sableye", "sharpedo", "camerupt", "altaria", "glalie", "salamence", "metagross", "latias", "latios", "rayquaza", "lopunny", "gallade", "audino", "diancie"].includes(nameLower);

  if (!hasMegaEvolution) {
    const noMegaMsg = document.createElement("div");
    noMegaMsg.className = "no-evolution";
    noMegaMsg.textContent = `No Mega Evolution form available.`;
    megaChain.appendChild(noMegaMsg);
    return;
  }

  // Create container for mega evolution section.
  const megaContainer = document.createElement("div");
  megaContainer.className = "mega-container";
  megaContainer.style.display = "flex";
  megaContainer.style.alignItems = "center";
  megaContainer.style.justifyContent = "center";
  megaContainer.style.gap = "1rem";

  // Create base (non-mega) node for the Pokémon's regular sprite
  const normalNode = document.createElement("div");
  normalNode.className = "mega-node";
  normalNode.style.display = "flex";
  normalNode.style.flexDirection = "column";
  normalNode.style.alignItems = "center";
  normalNode.style.gap = "0.25rem";

  const normalImg = document.createElement("img");
  normalImg.src = `${LOCAL_SPRITE_BASE}${pokemon.id}.png`;
  normalImg.alt = pokemon.name;
  normalImg.style.width = "60px";
  normalImg.style.height = "60px";
  normalNode.appendChild(normalImg);

  const normalName = document.createElement("span");
  normalName.textContent = capitalizedName;
  normalName.style.fontSize = "0.9rem";
  normalNode.appendChild(normalName);

  // Helper function to create a mega node for a given variant
  function createMegaNode(variant) {
    const node = document.createElement("div");
    node.className = "mega-node";
    node.style.display = "flex";
    node.style.flexDirection = "column";
    node.style.alignItems = "center";
    node.style.gap = "0.25rem";

    const link = document.createElement("a");
    link.href = "https://www.serebii.net/xy/megaevolutions.shtml";
    link.target = "_blank";
    link.title = "View details on Serebii";

    let fileName = "";
    let label = "";
    if (variant) {
      // Expect file names like "Mega Charizard X.png" or "Mega Charizard Y.png"
      fileName = `Mega ${capitalizedName} ${variant}.png`;
      label = `Mega ${capitalizedName} ${variant}`;
    } else {
      fileName = `Mega ${capitalizedName}.png`;
      label = `Mega ${capitalizedName}`;
    }

    const img = document.createElement("img");
    img.src = `${LOCAL_MEGA_BASE}${fileName}`;
    img.alt = label;
    img.style.width = "60px";
    img.style.height = "60px";
    img.onerror = () => {
      img.src = "default-mega.png";
      console.warn(`Failed to load mega sprite for ${pokemon.name} ${variant || ""}`);
    };

    link.appendChild(img);
    node.appendChild(link);

    const span = document.createElement("span");
    span.textContent = label;
    span.style.fontSize = "0.9rem";
    node.appendChild(span);

    return node;
  }

  if (dualMegaNames.includes(nameLower)) {
    // For dual mega evolutions, layout: [Mega X] [arrow] [Base] [arrow] [Mega Y]
    const megaNodeX = createMegaNode("X");
    const megaNodeY = createMegaNode("Y");

    const arrow1 = document.createElement("span");
    arrow1.className = "mega-arrow";
    arrow1.textContent = "↔";
    arrow1.style.fontSize = "1.2rem";

    const arrow2 = document.createElement("span");
    arrow2.className = "mega-arrow";
    arrow2.textContent = "↔";
    arrow2.style.fontSize = "1.2rem";

    megaContainer.appendChild(megaNodeX);
    megaContainer.appendChild(arrow1);
    megaContainer.appendChild(normalNode);
    megaContainer.appendChild(arrow2);
    megaContainer.appendChild(megaNodeY);
  } else {
    // For single mega evolutions, layout remains: [Base] [arrow] [Mega]
    const megaNode = createMegaNode("");
    const arrow = document.createElement("span");
    arrow.className = "mega-arrow";
    arrow.textContent = "↔";
    arrow.style.fontSize = "1.2rem";
    megaContainer.append(normalNode, arrow, megaNode);
  }

  megaChain.appendChild(megaContainer);
}

// Update gigantamax
function updateGigantamax(card, pokemon) {
  const gmaxChain = card.querySelector(".gmax-chain");
  gmaxChain.innerHTML = "";

  const capitalizedName = formatPokemonName(pokemon.name);
  const hasGigantamax = ["charizard", "butterfree", "pikachu", "meowth", "machamp", "gengar", "kingler", "lapras", "eevee", "snorlax", "garbodor", "melmetal", "corviknight", "orbeetle", "drednaw", "coalossal", "flapple", "appletun", "sandaconda", "toxtricity", "centiskorch", "hatterene", "grimmsnarl", "alcremie", "copperajah", "duraludon", "venusaur", "blastoise"].includes(pokemon.name.toLowerCase());

  if (hasGigantamax) {
    const gmaxContainer = document.createElement("div");
    gmaxContainer.className = "gmax-container";
    gmaxContainer.style.display = "flex";
    gmaxContainer.style.alignItems = "center";
    gmaxContainer.style.justifyContent = "center";
    gmaxContainer.style.gap = "1rem";

    const normalNode = document.createElement("div");
    normalNode.className = "gmax-node";
    normalNode.style.display = "flex";
    normalNode.style.flexDirection = "column";
    normalNode.style.alignItems = "center";
    normalNode.style.gap = "0.25rem";

    const normalImg = document.createElement("img");
    normalImg.src = `${LOCAL_SPRITE_BASE}${pokemon.id}.png`;
    normalImg.alt = pokemon.name;
    normalImg.style.width = "60px";
    normalImg.style.height = "60px";
    normalNode.append(normalImg);

    const normalName = document.createElement("span");
    normalName.textContent = capitalizedName;
    normalName.style.fontSize = "0.9rem";
    normalNode.append(normalName);

    const arrow = document.createElement("span");
    arrow.className = "gmax-arrow";
    arrow.textContent = "↔";
    arrow.style.fontSize = "1.2rem";

    const gmaxNode = document.createElement("div");
    gmaxNode.className = "gmax-node";
    gmaxNode.style.display = "flex";
    gmaxNode.style.flexDirection = "column";
    gmaxNode.style.alignItems = "center";
    gmaxNode.style.gap = "0.25rem";

    const gmaxLink = document.createElement("a");
    gmaxLink.href = "https://www.serebii.net/swordshield/gigantamax.shtml";
    gmaxLink.target = "_blank";
    gmaxLink.title = "View details on Serebii";

    // Update the image source to use "Gigantamax Venusaur.png"
    const gmaxImg = document.createElement("img");
    gmaxImg.src = `${LOCAL_GMAX_BASE}Gigantamax ${capitalizedName}.png`;
    gmaxImg.alt = `Gigantamax ${pokemon.name}`;
    gmaxImg.style.width = "60px";
    gmaxImg.style.height = "60px";
    gmaxImg.onerror = () => {
      gmaxImg.src = "default-gmax.png";
      console.warn(`Failed to load gigantamax sprite for ${pokemon.name}`);
    };
    gmaxLink.appendChild(gmaxImg);
    gmaxNode.appendChild(gmaxLink);

    const gmaxName = document.createElement("span");
    gmaxName.textContent = `G-Max ${capitalizedName}`;
    gmaxName.style.fontSize = "0.9rem";
    gmaxNode.appendChild(gmaxName);

    gmaxContainer.append(normalNode, arrow, gmaxNode);
    gmaxChain.appendChild(gmaxContainer);
  } else {
    const gmaxChain = card.querySelector(".gmax-chain");
    gmaxChain.innerHTML = "";
    const noGmaxMsg = document.createElement("div");
    noGmaxMsg.className = "no-evolution";
    noGmaxMsg.textContent = `No Gigantamax form available.`;
    gmaxChain.appendChild(noGmaxMsg);
  }
}

// Function to display Pokémon details
async function displayPokemonDetails() {
  const pokemonId = getQueryParam('id');
  if (!pokemonId) {
    console.error("No Pokémon ID found in URL");
    return;
  }

  const pokemonInfoContainer = document.getElementById("pokemon-info");
  pokemonInfoContainer.innerHTML = ""; // Clear previous content

  try {
    const pokemon = await fetchPokemonDetailById(pokemonId);
    if (pokemon) {
      const detailCard = createDetailCard(pokemon);
      pokemonInfoContainer.appendChild(detailCard);
      // NEW FEATURE: Add flavor text description
      await addDescription(pokemon, detailCard);
      await updateForms(pokemon, detailCard);
    } else {
      pokemonInfoContainer.innerHTML = `
        <div class="pokemon-detail-card">
          <div class="detail-top-section">
            <p>Failed to load Pokémon with ID: ${pokemonId}</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error displaying Pokémon details:", error);
    pokemonInfoContainer.innerHTML = `
      <div class="pokemon-detail-card">
        <div class="detail-top-section">
          <p>Error loading Pokémon details</p>
        </div>
      </div>
    `;
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  displayPokemonDetails();

  // Make the header clickable to go back
  const header = document.getElementById("header-container");
  if (header) {
    header.addEventListener("click", () => {
      window.location.href = "SidePanel.html"; // Change to your actual Pokémon list page
    });
  }
});
