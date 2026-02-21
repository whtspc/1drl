import { emit } from './events.js';
import { enemyAt, enemiesInHall, processEnemyTurn } from './enemies.js';

// Player attacks the tile they're facing
export function playerAttack(gameState) {
    const { player, enemies } = gameState;
    const attackPos = player.pos + player.facing;
    const target = enemyAt(enemies, attackPos);
    if (target) {
        target.hp--;
        emit('playerAttacked', { pos: attackPos, target });
        if (target.hp <= 0) {
            gameState.enemies = gameState.enemies.filter(e => e !== target);
            emit('enemyKilled', { enemy: target });
        }
    }
}

// Process all enemy turns in the player's current hall
export function processEnemyTurns(gameState) {
    const hall = getCurrentHall(gameState);
    if (!hall) return;

    const hallEnemies = enemiesInHall(gameState.enemies, hall.id);
    for (const enemy of hallEnemies) {
        processEnemyTurn(enemy, gameState);
    }
}

// Find which hall the player is in
export function getCurrentHall(gameState) {
    const tile = gameState.dungeon[gameState.player.pos];
    if (tile && tile.hallId !== undefined) {
        return gameState.halls[tile.hallId];
    }
    return null;
}
