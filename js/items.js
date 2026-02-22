import { Registry } from './registry.js';
import { emit } from './events.js';
import { enemyAt } from './enemies.js';

// Item type registry. To add a new item:
//
//   import { itemTypes } from './items.js';
//   itemTypes.register('bomb', {
//       name: 'Bomb',
//       char: '*',
//       description: 'Damages all enemies in the room',
//       shopCost: 12,
//       use(gameState) {
//           // return true if consumed, false if usage failed
//       },
//   });

export const itemTypes = new Registry();

itemTypes.register('healthPotion', {
    name: 'Potion',
    char: 'p',
    description: 'Restore 2 HP',
    shopCost: 5,
    use(gameState) {
        const { player } = gameState;
        if (player.hp >= player.maxHp) return false;
        player.hp = Math.min(player.hp + 2, player.maxHp);
        emit('itemUsed', { item: 'healthPotion' });
        return true;
    },
});

itemTypes.register('throwingDagger', {
    name: 'Dagger',
    char: 'd',
    description: 'Hit enemy up to 3 tiles away',
    shopCost: 8,
    use(gameState) {
        const { player } = gameState;
        for (let i = 1; i <= 3; i++) {
            const pos = player.pos + player.facing * i;
            const target = enemyAt(gameState.enemies, pos);
            if (target) {
                target.hp -= 2;
                if (target.hp <= 0) {
                    gameState.enemies = gameState.enemies.filter(e => e !== target);
                    emit('enemyKilled', { enemy: target });
                }
                emit('itemUsed', { item: 'throwingDagger' });
                return true;
            }
        }
        return false;
    },
});

// Use the first item in the player's inventory
export function useItem(gameState) {
    const { player } = gameState;
    if (player.items.length === 0) return false;

    const itemName = player.items[0];
    const def = itemTypes.get(itemName);
    if (!def) return false;

    const success = def.use(gameState);
    if (success) {
        player.items.splice(0, 1); // consume the item
    }
    return success;
}
