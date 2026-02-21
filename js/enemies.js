import { Registry } from './registry.js';
import { emit } from './events.js';

// Enemy type registry. To add a new enemy type:
//
//   import { enemyTypes } from './enemies.js';
//   enemyTypes.register('goblin', {
//       char: 'g',
//       name: 'goblin',
//       cssClass: 'char-enemy',
//       hp: 2,
//       damage: 1,
//       initialState: 'move',
//       behavior: goblinBehavior,   // function(enemy, gameState)
//       spawnWeight: 3,             // relative spawn frequency
//       minLevel: 2,                // don't appear before level 2
//   });

export const enemyTypes = new Registry();

// --- Built-in behaviors ---

// Slime AI: alternates between moving toward player and attacking.
// Predictable, telegraphed pattern that the player can learn.
function slimeBehavior(enemy, gameState) {
    const { player, dungeon, halls } = gameState;
    const hall = halls[enemy.hallId];

    if (enemy.state === 'attack') {
        const dir = player.pos > enemy.pos ? 1 : -1;
        const attackPos = enemy.pos + dir;
        if (attackPos === player.pos) {
            player.hp -= enemy.damage;
            emit('playerDamaged', { amount: enemy.damage, source: enemy });
        }
        enemy.state = 'move';
    } else if (enemy.state === 'move') {
        const dir = player.pos > enemy.pos ? 1 : player.pos < enemy.pos ? -1 : 0;
        if (dir !== 0) {
            const newPos = enemy.pos + dir;
            if (newPos >= hall.startIndex && newPos <= hall.endIndex &&
                dungeon[newPos].type !== 'wall' &&
                !enemyAt(gameState.enemies, newPos) &&
                newPos !== player.pos) {
                enemy.pos = newPos;
            }
        }
        enemy.state = 'attack';
    }
}

// --- Built-in enemy types ---

enemyTypes.register('slime', {
    char: 's',
    name: 'slime',
    cssClass: 'char-enemy',
    hp: 1,
    damage: 1,
    initialState: 'move',
    behavior: slimeBehavior,
    spawnWeight: 10,
    minLevel: 1,
});

// --- Enemy utilities ---

// Find enemy at a given position
export function enemyAt(enemies, pos) {
    return enemies.find(e => e.pos === pos);
}

// Get enemies in a specific hall
export function enemiesInHall(enemies, hallId) {
    return enemies.filter(e => e.hallId === hallId);
}

// Spawn a new enemy instance from a registered type
export function spawnEnemy(typeName, pos, hallId, overrides = {}) {
    const def = enemyTypes.get(typeName);
    if (!def) throw new Error(`Unknown enemy type: ${typeName}`);
    const enemy = {
        type: typeName,
        pos,
        hallId,
        hp: def.hp,
        damage: def.damage,
        state: def.initialState,
        char: def.char,
        name: def.name,
        cssClass: def.cssClass,
        ...overrides,
    };
    emit('enemySpawned', { enemy });
    return enemy;
}

// Pick a random enemy type appropriate for the current level
export function pickEnemyType(level) {
    const candidates = enemyTypes.names().filter(name => {
        const def = enemyTypes.get(name);
        return level >= (def.minLevel || 1);
    });
    if (candidates.length === 0) return 'slime';

    // Weighted random selection
    const weights = candidates.map(name => enemyTypes.get(name).spawnWeight || 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    for (let i = 0; i < candidates.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
}

// Process one enemy's turn using its registered behavior
export function processEnemyTurn(enemy, gameState) {
    const def = enemyTypes.get(enemy.type);
    if (def && def.behavior) {
        def.behavior(enemy, gameState);
    }
}
