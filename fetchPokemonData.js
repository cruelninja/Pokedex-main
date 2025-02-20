export default async function fetchPokemonData(pokemonName) {
    const url = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
    console.log(`Fetching: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw new Error('Failed to fetch Pokémon data');
    }
}
