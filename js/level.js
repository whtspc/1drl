import { CONFIG } from './config.js';
import { randInt } from './utils.js';
import { emit } from './events.js';
import { spawnEnemy, pickEnemyType } from './enemies.js';

// Generate a random level, returning { dungeon, halls, doorConnections, enemies }
export function generateLevel(currentLevel) {
    const cfg = CONFIG.level;
    const numHalls = randInt(cfg.minHalls, cfg.maxHalls);
    const halls = [];
    const dungeon = [];
    const doorConnections = {};

    // Plan door connections (just hall pairs, no positions yet)
    const plannedConnections = [];
    const doorsPerHall = new Array(numHalls).fill(0);

    // Minimum spanning tree for guaranteed connectivity
    const connected = new Set([0]);
    const unconnected = new Set();
    for (let i = 1; i < numHalls; i++) unconnected.add(i);

    while (unconnected.size > 0) {
        const connectedArr = Array.from(connected);
        const unconnectedArr = Array.from(unconnected);
        const fromHall = connectedArr[randInt(0, connectedArr.length - 1)];
        const toHall = unconnectedArr[randInt(0, unconnectedArr.length - 1)];

        plannedConnections.push([fromHall, toHall]);
        doorsPerHall[fromHall]++;
        doorsPerHall[toHall]++;

        connected.add(toHall);
        unconnected.delete(toHall);
    }

    // Extra random door connections
    const extraConnections = randInt(cfg.extraDoorChance.min, cfg.extraDoorChance.max);
    for (let i = 0; i < extraConnections; i++) {
        const fromHall = randInt(0, numHalls - 1);
        let toHall = randInt(0, numHalls - 1);
        if (toHall === fromHall) toHall = (toHall + 1) % numHalls;
        plannedConnections.push([fromHall, toHall]);
        doorsPerHall[fromHall]++;
        doorsPerHall[toHall]++;
    }

    // Create halls sized to fit their doors
    let currentIndex = 0;
    for (let i = 0; i < numHalls; i++) {
        const minWidth = doorsPerHall[i] + 2;
        const width = Math.max(randInt(cfg.minHallWidth, cfg.maxHallWidth), minWidth);
        halls.push({
            id: i,
            startIndex: currentIndex,
            width: width,
            endIndex: currentIndex + width - 1,
            doors: [],
        });
        currentIndex += width + 1;
    }

    // Build dungeon array with floors and walls
    for (let h = 0; h < halls.length; h++) {
        const hall = halls[h];
        for (let i = 0; i < hall.width; i++) {
            dungeon.push({ type: 'floor', hallId: h });
        }
        if (h < halls.length - 1) {
            dungeon.push({ type: 'wall' });
        }
    }

    // Place all planned door connections
    for (const [fromHallId, toHallId] of plannedConnections) {
        createDoorConnection(dungeon, halls, doorConnections, fromHallId, toHallId);
    }

    // Place stairs in a random hall (not the first one)
    const stairsHallId = randInt(1, numHalls - 1);
    const stairsHall = halls[stairsHallId];
    let stairsOffset = randInt(0, stairsHall.width - 1);
    let stairsPos = stairsHall.startIndex + stairsOffset;
    let attempts = 0;
    while (dungeon[stairsPos].type === 'door' && attempts < stairsHall.width) {
        stairsOffset = (stairsOffset + 1) % stairsHall.width;
        stairsPos = stairsHall.startIndex + stairsOffset;
        attempts++;
    }
    dungeon[stairsPos] = { type: 'stairs', hallId: stairsHallId };

    // Spawn enemies in non-starting halls
    const enemies = [];
    for (let i = 1; i < halls.length; i++) {
        if (i === stairsHallId && Math.random() < 0.5) continue;
        const numEnemies = randInt(0, 1);
        for (let s = 0; s < numEnemies; s++) {
            const hall = halls[i];
            const candidates = [];
            for (let t = 0; t < hall.width; t++) {
                const pos = hall.startIndex + t;
                if (dungeon[pos].type === 'floor') candidates.push(pos);
            }
            if (candidates.length > 0) {
                const pos = candidates[randInt(0, candidates.length - 1)];
                const typeName = pickEnemyType(currentLevel);
                enemies.push(spawnEnemy(typeName, pos, i));
            }
        }
    }

    const startPos = halls[0].startIndex;

    emit('levelGenerated', { level: currentLevel });

    return { dungeon, halls, doorConnections, enemies, startPos, dungeonLength: dungeon.length };
}

// --- Internal helpers ---

function createDoorConnection(dungeon, halls, doorConnections, fromHallId, toHallId) {
    const fromHall = halls[fromHallId];
    const toHall = halls[toHallId];

    const fromPos = findDoorPosition(dungeon, fromHall);
    const toPos = findDoorPosition(dungeon, toHall);

    if (fromPos === -1 || toPos === -1) return;

    dungeon[fromPos] = { type: 'door', hallId: fromHallId, targetPos: toPos };
    dungeon[toPos] = { type: 'door', hallId: toHallId, targetPos: fromPos };

    doorConnections[fromPos] = toPos;
    doorConnections[toPos] = fromPos;

    fromHall.doors.push(fromPos);
    toHall.doors.push(toPos);
}

function findDoorPosition(dungeon, hall) {
    const floorPositions = [];
    for (let i = 0; i < hall.width; i++) {
        const pos = hall.startIndex + i;
        if (dungeon[pos] && dungeon[pos].type === 'floor') {
            floorPositions.push(pos);
        }
    }
    if (floorPositions.length === 0) return -1;
    return floorPositions[randInt(0, floorPositions.length - 1)];
}
