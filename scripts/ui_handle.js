
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
const hammerPan = new Hammer(document.body);
hammerPan.get('pan').set({ direction: Hammer.DIRECTION_ALL });
hammerPan.on('panleft', () => {
    window.game.handleSwipe('left');
});

hammerPan.on('panright', () => {
    window.game.handleSwipe('right');
});

const hammerSwipe = new Hammer(document.body);
hammerSwipe.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
hammerSwipe.on('swipeup', () => {
    window.game.handleSwipe('jump');
});

