// Game configuration - tweak these to adjust gameplay balance
export const CONFIG = {
    player: {
        maxHp: 3,
        startingHp: 3,
        startingGold: 0,
        startingDamage: 1,
    },
    level: {
        minHalls: 8,
        maxHalls: 12,
        minHallWidth: 2,
        maxHallWidth: 15,
        extraDoorChance: { min: 0, max: 1 },
        goldTiles: { min: 2, max: 5 },
        goldPerTile: { min: 1, max: 3 },
    },
};
