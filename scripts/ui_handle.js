
import { Game } from './logic.js';
document.getElementById('startButton').addEventListener('click', function () {
    window.game = new Game();
    window.game.start();
    document.getElementById('popup').style.display = 'none';
});
document.getElementById('restartButton').addEventListener('click', function () {
    document.getElementById('container').innerHTML = '';
    window.game = new Game();
    window.game.start();
    document.getElementById('repopup').style.visibility = 'hidden';
});
// Swipe handling using Hammer.js
const hammer = new Hammer(document.body);
hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
hammer.on('swipeleft', () => {
    window.game.handleSwipe('left');
});

hammer.on('swiperight', () => {
    window.game.handleSwipe('right');
});
hammer.on('swipeup', () => {
    window.game.handleSwipe('jump');
});

