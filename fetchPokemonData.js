// Fallback mapping for Pokémon that have alternate endpoint names
const internalFallbackMapping = {
  'basculin': 'basculin-red-striped',
  'darmanitan': 'darmanitan-standard',
  'pumpkaboo': 'pumpkaboo-average',
  'morpeko': 'morpeko-full-belly'
};

export default async function fetchPokemonData(pokemonName) {
  const formattedName = pokemonName.trim().toLowerCase();
  let url = `https://pokeapi.co/api/v2/pokemon/${formattedName}/`;
  console.log(`Fetching: ${url}`);

  try {
    let response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        console.error(`404 Not Found for "${formattedName}". The Pokémon may not exist or the name is incorrect.`);

        if (internalFallbackMapping.hasOwnProperty(formattedName)) {
          const altName = internalFallbackMapping[formattedName];
          url = `https://pokeapi.co/api/v2/pokemon/${altName}/`;
          console.log(`Attempting fallback fetch for "${formattedName}" using alternate name "${altName}": ${url}`);
          response = await fetch(url);

          if (response.ok) {
            return await response.json();
          } else {
            console.error(`Fallback fetch failed for "${altName}".`);
            return null;
          }
        } else {
          return null; // No fallback and 404, return null
        }
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    }

    const data = await response.json();
    if (!data) {
        console.error("Error: Could not parse response data.");
        return null;
    }

    return data;
  } catch (error) {
    console.error(`Network Error: ${error.message}`);
    return null;
  }
}

export function renderTypeLabels(types) {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return ''; // Return empty string if types is invalid or empty
  }
  return types.map(type => {
    if (!type || !type.type || !type.type.name) {
      console.error("Invalid type object encountered:", type);
      return '<span class="type-label unknown">unknown</span>'; // Handle invalid type objects
    }
    const typeName = type.type.name; // Access type.name within the type object
    return `<span class="type-label ${typeName}">${typeName}</span>`;
  }).join(' ');
}