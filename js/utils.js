// Random integer in range [min, max]
export function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// Shuffle array in place (Fisher-Yates)
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
