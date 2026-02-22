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
//       behavior(enemy, gameState) { ... },
//       telegraph(enemy, playerPos) { return { char: '!', cssClass: 'telegraph-attack' }; },
//       goldDrop: { min: 1, max: 3 },
//       spawnWeight: 3,
//       minLevel: 2,
//   });

export const enemyTypes = new Registry();

// --- Built-in behaviors ---

// Slime AI: alternates move → attack. Predictable and telegraphed.
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

function slimeTelegraph(enemy, playerPos) {
    if (enemy.state === 'move') {
        const dir = playerPos > enemy.pos ? '\u2192' : playerPos < enemy.pos ? '\u2190' : '\u00b7';
        return { char: dir, cssClass: 'telegraph-move' };
    }
    return { char: '!', cssClass: 'telegraph-attack' };
}

// Bat AI: fast — moves AND attacks every turn. Low HP but relentless.
function batBehavior(enemy, gameState) {
    const { player, dungeon, halls } = gameState;
    const hall = halls[enemy.hallId];

    // Always move toward player
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
    // Then attack if adjacent
    const attackDir = player.pos > enemy.pos ? 1 : -1;
    if (enemy.pos + attackDir === player.pos) {
        player.hp -= enemy.damage;
        emit('playerDamaged', { amount: enemy.damage, source: enemy });
    }
}

function batTelegraph(enemy, playerPos) {
    const dist = Math.abs(playerPos - enemy.pos);
    if (dist <= 2) {
        return { char: '!', cssClass: 'telegraph-attack' };
    }
    const dir = playerPos > enemy.pos ? '\u2192' : playerPos < enemy.pos ? '\u2190' : '\u00b7';
    return { char: dir, cssClass: 'telegraph-move' };
}

// Skeleton AI: same alternating pattern as slime, but tougher.
// Reuses slime behavior since the pattern is identical — stats do the work.
function skeletonTelegraph(enemy, playerPos) {
    if (enemy.state === 'move') {
        const dir = playerPos > enemy.pos ? '\u2192' : playerPos < enemy.pos ? '\u2190' : '\u00b7';
        return { char: dir, cssClass: 'telegraph-move' };
    }
    return { char: '!', cssClass: 'telegraph-attack' };
}

// Wizard AI: keeps distance, attacks at range 2. Fragile but dangerous.
function wizardBehavior(enemy, gameState) {
    const { player, dungeon, halls } = gameState;
    const hall = halls[enemy.hallId];
    const dist = Math.abs(player.pos - enemy.pos);

    if (enemy.state === 'attack') {
        // Attack if player within range 2
        if (dist <= 2) {
            player.hp -= enemy.damage;
            emit('playerDamaged', { amount: enemy.damage, source: enemy });
        }
        enemy.state = 'move';
    } else if (enemy.state === 'move') {
        if (dist <= 1) {
            // Too close — retreat
            const dir = player.pos > enemy.pos ? -1 : 1;
            const newPos = enemy.pos + dir;
            if (newPos >= hall.startIndex && newPos <= hall.endIndex &&
                dungeon[newPos].type !== 'wall' &&
                !enemyAt(gameState.enemies, newPos)) {
                enemy.pos = newPos;
            }
        } else if (dist > 2) {
            // Too far — approach
            const dir = player.pos > enemy.pos ? 1 : -1;
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

function wizardTelegraph(enemy, playerPos) {
    const dist = Math.abs(playerPos - enemy.pos);
    if (enemy.state === 'attack') {
        if (dist <= 2) return { char: '!', cssClass: 'telegraph-attack' };
        return { char: '\u00b7', cssClass: 'telegraph-move' };
    }
    // Move state
    if (dist <= 1) {
        const dir = playerPos > enemy.pos ? '\u2190' : '\u2192'; // retreating
        return { char: dir, cssClass: 'telegraph-move' };
    }
    if (dist > 2) {
        const dir = playerPos > enemy.pos ? '\u2192' : '\u2190'; // approaching
        return { char: dir, cssClass: 'telegraph-move' };
    }
    return { char: '\u00b7', cssClass: 'telegraph-move' };
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
    telegraph: slimeTelegraph,
    goldDrop: { min: 1, max: 2 },
    spawnWeight: 10,
    minLevel: 1,
});

enemyTypes.register('bat', {
    char: 'b',
    name: 'bat',
    cssClass: 'char-bat',
    hp: 1,
    damage: 1,
    initialState: 'move',
    behavior: batBehavior,
    telegraph: batTelegraph,
    goldDrop: { min: 1, max: 3 },
    spawnWeight: 6,
    minLevel: 1,
});

enemyTypes.register('skeleton', {
    char: 'S',
    name: 'skeleton',
    cssClass: 'char-skeleton',
    hp: 2,
    damage: 2,
    initialState: 'move',
    behavior: slimeBehavior,  // same pattern, stats make it harder
    telegraph: skeletonTelegraph,
    goldDrop: { min: 2, max: 4 },
    spawnWeight: 4,
    minLevel: 2,
});

enemyTypes.register('wizard', {
    char: 'W',
    name: 'wizard',
    cssClass: 'char-wizard',
    hp: 2,
    damage: 1,
    initialState: 'move',
    behavior: wizardBehavior,
    telegraph: wizardTelegraph,
    goldDrop: { min: 3, max: 5 },
    spawnWeight: 3,
    minLevel: 3,
});

// --- Enemy utilities ---

export function enemyAt(enemies, pos) {
    return enemies.find(e => e.pos === pos);
}

export function enemiesInHall(enemies, hallId) {
    return enemies.filter(e => e.hallId === hallId);
}

export function spawnEnemy(typeName, pos, hallId) {
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
    };
    emit('enemySpawned', { enemy });
    return enemy;
}

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

export function processEnemyTurn(enemy, gameState) {
    const def = enemyTypes.get(enemy.type);
    if (def && def.behavior) {
        def.behavior(enemy, gameState);
    }
}
