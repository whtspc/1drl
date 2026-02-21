import { emit } from './events.js';
import { createPlayer, resetPlayer } from './player.js';
import { generateLevel } from './level.js';
import { playerAttack, processEnemyTurns, getCurrentHall } from './combat.js';
import { enemyAt } from './enemies.js';
import { initRenderer, render, showDeathMessage, showMessage } from './renderer.js';
import { initInput } from './input.js';

// Central game state - passed to all systems that need it
const gameState = {
    player: createPlayer(),
    dungeon: [],
    halls: [],
    doorConnections: {},
    enemies: [],
    dungeonLength: 0,
    currentLevel: 1,
    lastActionWasTurn: false,
};

// --- Core game actions ---

function startLevel() {
    const level = generateLevel(gameState.currentLevel);
    gameState.dungeon = level.dungeon;
    gameState.halls = level.halls;
    gameState.doorConnections = level.doorConnections;
    gameState.enemies = level.enemies;
    gameState.dungeonLength = level.dungeonLength;
    gameState.player.pos = level.startPos;
    render(gameState);
}

function playerTurn(action) {
    if (gameState.player.hp <= 0) return;

    emit('turnStart');
    action();
    processEnemyTurns(gameState);
    emit('turnEnd');

    if (gameState.player.hp <= 0) {
        emit('playerDied');
        showDeathMessage();
    }

    render(gameState);
}

function movePlayer(direction) {
    playerTurn(() => {
        const { player, dungeon, dungeonLength } = gameState;
        if (player.facing !== direction) {
            player.facing = direction;
            gameState.lastActionWasTurn = true;
            return;
        }
        gameState.lastActionWasTurn = false;
        const newPos = player.pos + direction;
        if (newPos < 0 || newPos >= dungeonLength) return;
        if (dungeon[newPos].type === 'wall') return;
        if (enemyAt(gameState.enemies, newPos)) return;
        const oldPos = player.pos;
        player.pos = newPos;
        emit('playerMoved', { from: oldPos, to: newPos });
    });
}

function interact() {
    gameState.lastActionWasTurn = false;
    const { player, dungeon, doorConnections } = gameState;

    if (player.hp <= 0) {
        // Restart on death
        resetPlayer(player);
        gameState.currentLevel = 1;
        startLevel();
        return;
    }

    const currentTile = dungeon[player.pos];

    if (currentTile.type === 'door') {
        const targetPos = doorConnections[player.pos];
        if (targetPos !== undefined) {
            if (enemyAt(gameState.enemies, targetPos)) {
                showMessage('Something blocks the other side!');
                return;
            }
            playerTurn(() => {
                const oldPos = player.pos;
                player.pos = targetPos;
                emit('doorUsed', { from: oldPos, to: targetPos });
            });
        }
    } else if (currentTile.type === 'stairs') {
        const oldLevel = gameState.currentLevel;
        gameState.currentLevel++;
        emit('levelChanged', { from: oldLevel, to: gameState.currentLevel });
        startLevel();
    }
}

function doAttack() {
    gameState.lastActionWasTurn = false;
    playerTurn(() => playerAttack(gameState));
}

// --- Initialize ---

initRenderer();
initInput({
    moveLeft: () => movePlayer(-1),
    moveRight: () => movePlayer(1),
    interact,
    attack: doAttack,
});

window.addEventListener('resize', () => render(gameState));

startLevel();
