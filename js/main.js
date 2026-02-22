import { emit, on } from './events.js';
import { randInt } from './utils.js';
import { createPlayer, resetPlayer } from './player.js';
import { generateLevel } from './level.js';
import { playerAttack, processEnemyTurns, getCurrentHall } from './combat.js';
import { enemyAt, enemyTypes } from './enemies.js';
import { initRenderer, render, renderShop, showDeathMessage, showMessage } from './renderer.js';
import { initInput } from './input.js';
import { isShopOpen, openShop, closeShop, shopNavigate, shopBuy } from './shop.js';
import { useItem } from './items.js';

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

// --- Gold drops from enemies ---
on('enemyKilled', ({ enemy }) => {
    const def = enemyTypes.get(enemy.type);
    if (def && def.goldDrop) {
        const amount = randInt(def.goldDrop.min, def.goldDrop.max);
        gameState.player.gold += amount;
    }
});

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

    // Pick up gold if standing on a gold tile
    checkGoldPickup();

    if (gameState.player.hp <= 0) {
        emit('playerDied');
        showDeathMessage();
    }

    render(gameState);
}

function checkGoldPickup() {
    const tile = gameState.dungeon[gameState.player.pos];
    if (tile && tile.type === 'gold') {
        gameState.player.gold += tile.amount || 1;
        emit('goldPickup', { amount: tile.amount });
        // Replace gold tile with floor
        gameState.dungeon[gameState.player.pos] = { type: 'floor', hallId: tile.hallId };
    }
}

function movePlayer(direction) {
    // Shop mode: navigate shop items
    if (isShopOpen()) {
        shopNavigate(direction);
        renderShop(gameState);
        return;
    }

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
    // Shop mode: buy selected item or leave
    if (isShopOpen()) {
        const result = shopBuy(gameState);
        if (result === 'leave') {
            startLevel();
        } else if (result === 'cantAfford') {
            renderShop(gameState);
            showMessage('Not enough gold!');
        } else {
            renderShop(gameState);
        }
        return;
    }

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
        // Open shop before next level
        openShop(gameState);
        renderShop(gameState);
    }
}

function doAttack() {
    if (isShopOpen()) return;
    gameState.lastActionWasTurn = false;
    playerTurn(() => playerAttack(gameState));
}

function doUseItem() {
    if (isShopOpen()) return;
    gameState.lastActionWasTurn = false;
    const used = useItem(gameState);
    if (used) {
        playerTurn(() => {}); // using item costs a turn
    }
}

// --- Initialize ---

initRenderer();
initInput({
    moveLeft: () => movePlayer(-1),
    moveRight: () => movePlayer(1),
    interact,
    attack: doAttack,
    useItem: doUseItem,
});

window.addEventListener('resize', () => {
    if (isShopOpen()) {
        renderShop(gameState);
    } else {
        render(gameState);
    }
});

startLevel();
