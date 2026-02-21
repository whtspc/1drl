// Simple event bus for decoupled communication between modules.
// To extend the game, listen for events and react to them without
// modifying existing code.
//
// Built-in events:
//   'turnStart'       - fired before a player action resolves
//   'turnEnd'         - fired after enemies have acted
//   'playerMoved'     - { from, to }
//   'playerAttacked'  - { pos, target }
//   'playerDamaged'   - { amount, source }
//   'playerDied'      - {}
//   'enemyKilled'     - { enemy }
//   'enemySpawned'    - { enemy }
//   'levelGenerated'  - { level }
//   'levelChanged'    - { from, to }
//   'doorUsed'        - { from, to }

const listeners = {};

export function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    // Return an unsubscribe function
    return () => {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    };
}

export function emit(event, data = {}) {
    if (!listeners[event]) return;
    for (const cb of listeners[event]) {
        cb(data);
    }
}

export function off(event, callback) {
    if (!listeners[event]) return;
    if (callback) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    } else {
        delete listeners[event];
    }
}
