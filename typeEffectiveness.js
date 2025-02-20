import typeChart from './typeChart.js';

export function getTypeEffectiveness(types) {
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
