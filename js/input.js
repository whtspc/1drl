// Input handler - maps raw inputs to game actions.
// To add new key bindings, add entries to the keymap.

export function initInput(actions) {
    const { moveLeft, moveRight, interact, attack, useItem } = actions;

    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnEnter = document.getElementById('btn-enter');
    const btnAttack = document.getElementById('btn-attack');
    const btnItem = document.getElementById('btn-item');

    // Button controls
    btnLeft.addEventListener('click', moveLeft);
    btnRight.addEventListener('click', moveRight);
    btnEnter.addEventListener('click', interact);
    btnAttack.addEventListener('click', attack);
    btnItem.addEventListener('click', useItem);

    // Touch controls (prevent double-firing)
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft(); });
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight(); });
    btnEnter.addEventListener('touchstart', (e) => { e.preventDefault(); interact(); });
    btnAttack.addEventListener('touchstart', (e) => { e.preventDefault(); attack(); });
    btnItem.addEventListener('touchstart', (e) => { e.preventDefault(); useItem(); });

    // Keyboard controls
    const keymap = {
        'ArrowLeft': moveLeft,
        'a': moveLeft,
        'ArrowRight': moveRight,
        'd': moveRight,
        'ArrowDown': interact,
        's': interact,
        'Enter': interact,
        ' ': attack,
        'w': attack,
        'ArrowUp': attack,
        'q': useItem,
        'e': useItem,
    };

    document.addEventListener('keydown', (e) => {
        const action = keymap[e.key];
        if (action) action();
    });
}
