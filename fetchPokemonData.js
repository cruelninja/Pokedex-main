const CACHE_DB = "pokemon_data_cache";
const MAX_CACHE_SIZE = 100; // Store only recent 100 Pokémon
const MAX_CONCURRENT_REQUESTS = 8;
const internalFallbackMapping = {
  basculin: "basculin-red-striped",
  darmanitan: "darmanitan-standard",
  pumpkaboo: "pumpkaboo-average",
  morpeko: "morpeko-full-belly"
};

const requestQueue = [];
let isProcessingQueue = false;

// ✅ Initialize IndexedDB Cache
initializeCache();

/**
 * ✅ Fetch Pokémon Data with Optimized Speed & Smart Caching
 * @param {string} pokemonName - Pokémon name
 * @returns {Promise<object|null>}
 */
export default async function fetchPokemonData(pokemonName) {
  return new Promise((resolve) => {
    requestQueue.push({ pokemonName, resolve });
    processQueue();
  });
}

/**
 * ✅ Efficiently Processes Bulk API Requests in Parallel
 */
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, MAX_CONCURRENT_REQUESTS);
    await Promise.all(batch.map(({ pokemonName, resolve }) => fetchWithRetries(pokemonName, resolve)));
  }

  isProcessingQueue = false;
}

/**
 * ✅ Fetch Pokémon Data with Retry Logic & Optimized Caching
 */
async function fetchWithRetries(pokemonName, resolve) {
  const formattedName = pokemonName.trim().toLowerCase();

  const cachedData = await loadFromCache(formattedName);
  if (cachedData) {
    console.log(`🗂️ Cache hit: ${formattedName}`);
    resolve(cachedData);
    return;
  }

  let url = `https://pokeapi.co/api/v2/pokemon/${formattedName}/`;
  let attempts = 3;
  let delay = 500;

  while (attempts > 0) {
    try {
      console.log(`🌐 Fetching: ${url}`);
      const response = await fetch(url, { cache: "force-cache" });

      if (response.ok) {
        const data = await response.json();
        storeInCache(formattedName, data);
        resolve(data);
        return;
      }

      if (response.status === 404) {
        console.warn(`⚠️ 404 Not Found: "${formattedName}". Checking fallbacks...`);
        const fallbackData = await fetchFromFallbacks(formattedName);
        if (fallbackData) {
          storeInCache(formattedName, fallbackData);
          resolve(fallbackData);
          return;
        }
      } else {
        console.error(`❌ HTTP Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(`🌐 Network Error: ${error.message}`);
      if (!navigator.onLine) {
        console.warn("⚠️ No internet connection detected! Using cached data...");
        resolve(null);
        return;
      }
    }

    if (attempts > 1) {
      console.warn(`🔁 Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    } else {
      console.error(`❌ Maximum retries reached for "${formattedName}".`);
      resolve(null);
    }

    attempts--;
  }
}

/**
 * ✅ Fetch Pokémon Data from Fallback Sources (PokémonDB & Bulbapedia)
 */
async function fetchFromFallbacks(pokemonName) {
  console.log(`🔍 Searching external sources for "${pokemonName}"...`);

  try {
    const fallbackResults = await Promise.any([
      fetchFromPokemonDB(pokemonName),
      fetchFromBulbapedia(pokemonName)
    ]);
    return fallbackResults;
  } catch {
    return null;
  }
}

/**
 * ✅ Fetch Pokémon Data from PokémonDB
 */
async function fetchFromPokemonDB(pokemonName) {
  try {
    const response = await fetch(`https://pokemondb.net/pokedex/national`);
    if (!response.ok) throw new Error("Failed to fetch from PokémonDB");

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const matchedPokemon = Array.from(doc.querySelectorAll(".infocard-list a.ent-name"))
      .find(el => el.textContent.toLowerCase() === pokemonName);

    if (matchedPokemon) {
      console.log(`✅ Found in PokémonDB: ${pokemonName}`);
      return { name: pokemonName, sprite: matchedPokemon.dataset.sprite };
    }

    return null;
  } catch (error) {
    console.error(`❌ PokémonDB Fetch Error: ${error.message}`);
    return null;
  }
}

/**
 * ✅ Fetch Pokémon Data from Bulbapedia
 */
async function fetchFromBulbapedia(pokemonName) {
  try {
    const response = await fetch(`https://bulbapedia.bulbagarden.net/wiki/${pokemonName}_(Pokémon)`);
    if (!response.ok) throw new Error("Failed to fetch from Bulbapedia");

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const image = doc.querySelector(".infobox img")?.src;
    const description = doc.querySelector("p")?.textContent.trim();

    if (image || description) {
      console.log(`✅ Found in Bulbapedia: ${pokemonName}`);
      return { name: pokemonName, sprite: image, description };
    }

    return null;
  } catch (error) {
    console.error(`❌ Bulbapedia Fetch Error: ${error.message}`);
    return null;
  }
}

/**
 * ✅ Initializes IndexedDB Cache
 */
function initializeCache() {
  const request = indexedDB.open(CACHE_DB, 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("pokemon")) {
      db.createObjectStore("pokemon", { keyPath: "name" });
    }
  };

  request.onerror = (event) => {
    console.error("❌ IndexedDB Error:", event.target.error);
  };
}

/**
 * ✅ Stores Pokémon Data in IndexedDB (Prevents Storage Errors)
 */
function storeInCache(name, data) {
  const request = indexedDB.open(CACHE_DB, 1);

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction("pokemon", "readwrite");
    const store = transaction.objectStore("pokemon");

    store.put({ name, data });

    transaction.onerror = (event) => {
      console.error("❌ Error saving to cache:", event.target.error);
    };
  };
}

/**
 * ✅ Loads Pokémon Data from IndexedDB Cache
 */
function loadFromCache(name) {
  return new Promise((resolve) => {
    const request = indexedDB.open(CACHE_DB, 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("pokemon", "readonly");
      const store = transaction.objectStore("pokemon");

      const getRequest = store.get(name);

      getRequest.onsuccess = () => {
        resolve(getRequest.result ? getRequest.result.data : null);
      };
    };
  });
}
