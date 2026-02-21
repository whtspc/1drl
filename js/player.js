import { CONFIG } from './config.js';

// Create a fresh player state
export function createPlayer() {
    return {
        pos: 0,
        hp: CONFIG.player.startingHp,
        maxHp: CONFIG.player.maxHp,
        facing: 1,   // 1 = right, -1 = left
    };
}

// Reset player to starting state (on death restart)
export function resetPlayer(player) {
    player.hp = CONFIG.player.startingHp;
    player.maxHp = CONFIG.player.maxHp;
    player.facing = 1;
}
