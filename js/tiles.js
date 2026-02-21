import { Registry } from './registry.js';

// Tile type registry. To add a new tile type:
//
//   import { tileTypes } from './tiles.js';
//   tileTypes.register('lava', {
//       char: '~',
//       cssClass: 'char-lava',
//       walkable: true,
//       hint: 'Lava - you take damage!',
//       onEnter(gameState) { gameState.player.hp--; },
//   });

export const tileTypes = new Registry();

tileTypes.register('floor', {
    char: '.',
    cssClass: 'char-floor',
    walkable: true,
    hint: '',
});

tileTypes.register('wall', {
    char: '#',
    cssClass: 'char-wall',
    walkable: false,
    hint: '',
});

tileTypes.register('door', {
    char: '+',
    cssClass: 'char-door',
    walkable: true,
    interactable: true,
    hint: 'Door - press ↓ to go through',
});

tileTypes.register('stairs', {
    char: '>',
    cssClass: 'char-stairs',
    walkable: true,
    interactable: true,
    hint: 'Stairs - press ↓ to descend',
});

// Look up tile display char from a dungeon tile object
export function getTileChar(tile) {
    const def = tileTypes.get(tile.type);
    return def ? def.char : '?';
}

// Look up tile CSS class
export function getTileCssClass(tile) {
    const def = tileTypes.get(tile.type);
    return def ? def.cssClass : '';
}

// Check if a tile type is walkable
export function isWalkable(tile) {
    const def = tileTypes.get(tile.type);
    return def ? def.walkable : false;
}
