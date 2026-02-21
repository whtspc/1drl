// Generic registry for extensible game types.
// Used to register tile types, enemy types, item types, etc.
//
// Usage:
//   const enemies = new Registry();
//   enemies.register('slime', { hp: 1, char: 's', ... });
//   const slime = enemies.create('slime');

export class Registry {
    constructor() {
        this._types = {};
    }

    // Register a new type definition
    register(name, definition) {
        this._types[name] = definition;
    }

    // Get a type definition by name
    get(name) {
        return this._types[name];
    }

    // Create a new instance from a registered type
    create(name, overrides = {}) {
        const def = this._types[name];
        if (!def) throw new Error(`Unknown type: ${name}`);
        return { ...def, ...overrides };
    }

    // List all registered type names
    names() {
        return Object.keys(this._types);
    }

    // Check if a type is registered
    has(name) {
        return name in this._types;
    }
}
