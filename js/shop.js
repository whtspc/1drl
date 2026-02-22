import { Registry } from './registry.js';
import { emit } from './events.js';

// Shop item registry. To add a new shop offering:
//
//   import { shopOfferings } from './shop.js';
//   shopOfferings.register('shield', {
//       name: 'Shield',
//       char: 'O',
//       cssClass: 'char-door',
//       description: 'Block 1 damage per hit',
//       cost: 12,
//       apply(player) { player.armor = (player.armor || 0) + 1; },
//   });

export const shopOfferings = new Registry();

shopOfferings.register('maxHpUp', {
    name: '+1 Max HP',
    char: '\u2665',
    cssClass: 'char-enemy',
    description: 'Increase maximum HP by 1',
    cost: 10,
    apply(player) {
        player.maxHp += 1;
        player.hp += 1;
    },
});

shopOfferings.register('damageUp', {
    name: '+1 Damage',
    char: '\u2694',
    cssClass: 'char-player',
    description: 'Increase attack damage by 1',
    cost: 15,
    apply(player) {
        player.damage += 1;
    },
});

shopOfferings.register('healthPotion', {
    name: 'Potion',
    char: 'p',
    cssClass: 'char-gold',
    description: 'Restore 2 HP (consumable)',
    cost: 5,
    apply(player) {
        player.items.push('healthPotion');
    },
});

shopOfferings.register('throwingDagger', {
    name: 'Dagger',
    char: 'd',
    cssClass: 'char-gold',
    description: 'Ranged attack (consumable)',
    cost: 8,
    apply(player) {
        player.items.push('throwingDagger');
    },
});

// --- Shop state ---

let shopOpen = false;
let selectedIndex = 0;
let itemList = [];

export function openShop(gameState) {
    shopOpen = true;
    selectedIndex = 0;
    itemList = buildItemList();
    emit('shopOpened');
}

export function closeShop() {
    shopOpen = false;
    emit('shopClosed');
}

export function isShopOpen() {
    return shopOpen;
}

export function getShopState() {
    return { selectedIndex, items: itemList };
}

export function shopNavigate(dir) {
    if (!shopOpen) return;
    // itemList.length entries + 1 "Leave" option
    selectedIndex = Math.max(0, Math.min(selectedIndex + dir, itemList.length));
}

export function shopBuy(gameState) {
    if (!shopOpen) return 'noop';

    // "Leave" is the last position
    if (selectedIndex >= itemList.length) {
        closeShop();
        return 'leave';
    }

    const item = itemList[selectedIndex];
    if (gameState.player.gold >= item.cost) {
        gameState.player.gold -= item.cost;
        item.apply(gameState.player);
        emit('shopPurchase', { item: item.id });
        return 'bought';
    }
    return 'cantAfford';
}

function buildItemList() {
    return shopOfferings.names().map(name => ({
        id: name,
        ...shopOfferings.get(name),
    }));
}
