import { enemyAt, enemiesInHall, enemyTypes } from './enemies.js';
import { getTileChar, getTileCssClass, tileTypes } from './tiles.js';
import { getCurrentHall } from './combat.js';
import { getShopState } from './shop.js';
import { itemTypes } from './items.js';

// DOM element references (set once via init)
let els = {};

export function initRenderer() {
    els = {
        dungeon: document.getElementById('dungeon'),
        position: document.getElementById('position'),
        tileHint: document.getElementById('tile-hint'),
        telegraph: document.getElementById('telegraph-row'),
        hp: document.getElementById('hp-display'),
        gold: document.getElementById('gold-display'),
        items: document.getElementById('items-display'),
        btnLeft: document.getElementById('btn-left'),
        btnRight: document.getElementById('btn-right'),
        btnEnter: document.getElementById('btn-enter'),
        btnAttack: document.getElementById('btn-attack'),
        btnItem: document.getElementById('btn-item'),
    };
}

// --- Game rendering ---

export function render(gameState) {
    const { player, dungeon, enemies, halls, currentLevel, lastActionWasTurn } = gameState;
    const hall = getCurrentHall(gameState);
    if (!hall) return;

    const hallEnemies = enemiesInHall(enemies, hall.id);

    renderTelegraph(player, hall, enemies);
    renderDungeon(player, hall, dungeon, enemies);
    renderHp(player);
    renderGold(player);
    renderItems(player);
    renderInfo(currentLevel, hall);
    renderHint(player, dungeon, lastActionWasTurn);
    renderButtons(player, hall, dungeon, hallEnemies);
}

function renderTelegraph(player, hall, enemies) {
    let html = ' '; // wall spacer
    for (let i = 0; i < hall.width; i++) {
        const pos = hall.startIndex + i;
        if (pos === player.pos) {
            const facingChar = player.facing === 1 ? '\u2192' : '\u2190';
            html += `<span class="char-player">${facingChar}</span>`;
        } else {
            const enemy = enemyAt(enemies, pos);
            if (enemy) {
                const def = enemyTypes.get(enemy.type);
                if (def && def.telegraph) {
                    const t = def.telegraph(enemy, player.pos);
                    html += `<span class="${t.cssClass}">${t.char}</span>`;
                } else {
                    html += ' ';
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
        '\u2665'.repeat(displayHp) +
        '<span style="color:#444">' + '\u2665'.repeat(player.maxHp - displayHp) + '</span>';
}

function renderGold(player) {
    els.gold.textContent = `$ ${player.gold}`;
}

function renderItems(player) {
    if (player.items.length === 0) {
        els.items.innerHTML = '';
        return;
    }
    let html = '';
    for (const itemName of player.items) {
        const def = itemTypes.get(itemName);
        if (def) {
            html += `<span class="item-icon" title="${def.name}">${def.char}</span>`;
        }
    }
    els.items.innerHTML = html;
}

function renderInfo(level, hall) {
    els.position.textContent = `Level ${level} - Room ${hall.id + 1}`;
}

function renderHint(player, dungeon, lastActionWasTurn) {
    if (player.hp <= 0) return;
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

    const hasItems = !dead && player.items.length > 0;
    els.btnItem.classList.toggle('hidden', !hasItems);
    els.btnItem.disabled = !hasItems;
}

// --- Shop rendering ---

export function renderShop(gameState) {
    const { selectedIndex, items } = getShopState();
    const { player } = gameState;

    // Telegraph: arrow pointing at selected item
    let telegraphHtml = ' ';
    for (let i = 0; i <= items.length; i++) {
        telegraphHtml += i === selectedIndex
            ? '<span class="char-player">\u2193</span>'
            : ' ';
    }
    telegraphHtml += ' ';
    els.telegraph.innerHTML = telegraphHtml;

    // Dungeon row: items as characters, @ on selected
    let html = '<span class="char-wall">#</span>';
    for (let i = 0; i < items.length; i++) {
        if (i === selectedIndex) {
            html += '<span class="char-player">@</span>';
        } else {
            const affordable = player.gold >= items[i].cost;
            const cls = affordable ? items[i].cssClass : 'char-floor';
            html += `<span class="${cls}">${items[i].char}</span>`;
        }
    }
    // "Leave" option
    if (selectedIndex === items.length) {
        html += '<span class="char-player">@</span>';
    } else {
        html += '<span class="char-stairs">&gt;</span>';
    }
    html += '<span class="char-wall">#</span>';
    els.dungeon.innerHTML = html;

    // Info
    els.position.textContent = 'Shop';
    renderGold(player);
    renderHp(player);
    renderItems(player);

    // Hint: show selected item description + cost
    if (selectedIndex < items.length) {
        const item = items[selectedIndex];
        const affordable = player.gold >= item.cost;
        const tag = affordable ? '' : ' (not enough gold)';
        els.tileHint.textContent = `${item.name} - ${item.description} [${item.cost}g]${tag}`;
    } else {
        els.tileHint.textContent = 'Leave shop';
    }

    // Buttons: left/right to browse, enter to buy/leave
    els.btnLeft.disabled = selectedIndex <= 0;
    els.btnRight.disabled = selectedIndex >= items.length;
    els.btnEnter.classList.remove('hidden');
    els.btnEnter.disabled = false;
    els.btnAttack.classList.add('hidden');
    els.btnAttack.disabled = true;
    els.btnItem.classList.add('hidden');
    els.btnItem.disabled = true;
}

export function showDeathMessage() {
    els.tileHint.textContent = 'You died! Press Enter to restart.';
}

export function showMessage(msg) {
    els.tileHint.textContent = msg;
}
