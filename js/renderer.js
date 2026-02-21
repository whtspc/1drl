import { enemyAt, enemiesInHall } from './enemies.js';
import { getTileChar, getTileCssClass, tileTypes } from './tiles.js';
import { getCurrentHall } from './combat.js';

// DOM element references (set once via init)
let els = {};

export function initRenderer() {
    els = {
        dungeon: document.getElementById('dungeon'),
        position: document.getElementById('position'),
        tileHint: document.getElementById('tile-hint'),
        telegraph: document.getElementById('telegraph-row'),
        hp: document.getElementById('hp-display'),
        btnLeft: document.getElementById('btn-left'),
        btnRight: document.getElementById('btn-right'),
        btnEnter: document.getElementById('btn-enter'),
        btnAttack: document.getElementById('btn-attack'),
    };
}

export function render(gameState) {
    const { player, dungeon, enemies, halls, currentLevel, lastActionWasTurn } = gameState;
    const hall = getCurrentHall(gameState);
    if (!hall) return;

    const hallEnemies = enemiesInHall(enemies, hall.id);

    renderTelegraph(player, hall, enemies);
    renderDungeon(player, hall, dungeon, enemies);
    renderHp(player);
    renderInfo(currentLevel, hall);
    renderHint(player, dungeon, lastActionWasTurn);
    renderButtons(player, hall, dungeon, hallEnemies);
}

function renderTelegraph(player, hall, enemies) {
    let html = ' '; // wall spacer
    for (let i = 0; i < hall.width; i++) {
        const pos = hall.startIndex + i;
        if (pos === player.pos) {
            const facingChar = player.facing === 1 ? '→' : '←';
            html += `<span class="char-player">${facingChar}</span>`;
        } else {
            const enemy = enemyAt(enemies, pos);
            if (enemy) {
                if (enemy.state === 'move') {
                    const dir = player.pos > enemy.pos ? '→' : player.pos < enemy.pos ? '←' : '·';
                    html += `<span class="telegraph-move">${dir}</span>`;
                } else if (enemy.state === 'attack') {
                    html += '<span class="telegraph-attack">!</span>';
                }
            } else {
                html += ' ';
            }
        }
    }
    html += ' '; // wall spacer
    els.telegraph.innerHTML = html;
}

function renderDungeon(player, hall, dungeon, enemies) {
    let html = '<span class="char-wall">#</span>';
    for (let i = 0; i < hall.width; i++) {
        const pos = hall.startIndex + i;
        if (pos === player.pos) {
            html += '<span class="char-player">@</span>';
        } else {
            const enemy = enemyAt(enemies, pos);
            if (enemy) {
                html += `<span class="${enemy.cssClass || 'char-enemy'}">${enemy.char}</span>`;
            } else {
                const tile = dungeon[pos];
                html += `<span class="${getTileCssClass(tile)}">${getTileChar(tile)}</span>`;
            }
        }
    }
    html += '<span class="char-wall">#</span>';
    els.dungeon.innerHTML = html;
}

function renderHp(player) {
    const displayHp = Math.max(0, player.hp);
    els.hp.innerHTML =
        '♥'.repeat(displayHp) +
        '<span style="color:#444">' + '♥'.repeat(player.maxHp - displayHp) + '</span>';
}

function renderInfo(level, hall) {
    els.position.textContent = `Level ${level} - Room ${hall.id + 1}`;
}

function renderHint(player, dungeon, lastActionWasTurn) {
    if (player.hp <= 0) {
        // Keep death message
        return;
    }
    if (lastActionWasTurn) {
        const dirName = player.facing === 1 ? 'right' : 'left';
        els.tileHint.textContent = `Turned to face ${dirName}`;
        return;
    }
    const currentTile = dungeon[player.pos];
    const tileDef = tileTypes.get(currentTile.type);
    els.tileHint.textContent = (tileDef && tileDef.hint) || '';
}

function renderButtons(player, hall, dungeon, hallEnemies) {
    const dead = player.hp <= 0;

    const canActLeft = !dead && (player.facing !== -1 || player.pos > hall.startIndex);
    const canActRight = !dead && (player.facing !== 1 || player.pos < hall.endIndex);

    els.btnLeft.disabled = !canActLeft;
    els.btnRight.disabled = !canActRight;

    const curTile = dungeon[player.pos];
    const tileDef = tileTypes.get(curTile.type);
    const canEnter = !dead && tileDef && tileDef.interactable;
    const showEnter = canEnter || dead;
    els.btnEnter.classList.toggle('hidden', !showEnter);
    els.btnEnter.disabled = !showEnter;

    const canAttack = !dead && hallEnemies.length > 0;
    els.btnAttack.classList.toggle('hidden', !canAttack);
    els.btnAttack.disabled = !canAttack;
}

export function showDeathMessage() {
    els.tileHint.textContent = 'You died! Press Enter to restart.';
}

export function showMessage(msg) {
    els.tileHint.textContent = msg;
}
