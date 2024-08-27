const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Generate thresholds
const thresholds = [];

for (let x = 10; x < 15; x++) {
    for (let y = 2; y < 15; y++) {
        if (x > y) {
            thresholds.push(x + (y / 100));
        }
    }
}

thresholds.push(...[20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140]);

function generateRandomPlayer(numPlayers) {
    const rangeDict = {
        2: [0, 0.6],
        3: [0, 0.7],
        4: [0.1, 0.8],
        5: [0.2, 0.9],
        6: [0.3, 0.95],
        7: [0.4, 1],
        8: [0.5, 1],
        9: [0.5, 1],
        10: [0.5, 1]
    };

    const [baseM1, baseM2] = rangeDict[numPlayers] || [0, 1];

    let m1 = Math.round(baseM1 * thresholds.length * (1 + (Math.random() * 0.2 - 0.1)));
    let m2 = Math.round(baseM2 * thresholds.length * (1 + (Math.random() * 0.2 - 0.1)));

    m1 = Math.max(0, m1);
    m2 = Math.min(thresholds.length, m2);

    if (m2 <= m1) {
        m2 = m1 + 1;
    }

    const threshold = thresholds[Math.floor(Math.random() * (m2 - m1)) + m1];
    console.log(`AI Threshold: ${threshold}`);
    return threshold;
}

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }

    toString() {
        return this.value + this.suit;
    }

    numericValue() {
        if (this.value === 'A') return 14;
        if (this.value === 'K') return 13;
        if (this.value === 'Q') return 12;
        if (this.value === 'J') return 11;
        return parseInt(this.value);
    }
}

class Deck {
    constructor() {   
        this.cards = [];
        for (let suit of suits) {
            for (let value of values) {
                this.cards.push(new Card(suit, value));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
}

class Player {
    constructor(name, isAI = false, game) {
        this.name = name;
        this.isAI = isAI;
        this.hand = [];
        this.folded = false;
        this.threshold = isAI ? generateRandomPlayer(game.players.length) : 0;
        this.chips = 100; // Starting chips
    }

    receiveCard(card) {
        this.hand.push(card);
    }

    fold() {
        this.folded = true;
    }

    calculateHandValue() {
        if (this.hand.length !== 2) return 0;
        
        const [card1, card2] = this.hand.map(card => card.numericValue());
        
        if (card1 === card2) {
            return card1 * 10;
        } else {
            const [higher, lower] = [Math.max(card1, card2), Math.min(card1, card2)];
            return higher + (lower / 100);
        }
    }

    bet(amount) {
        console.log(`${this.name} is betting ${amount} chips. Current chips: ${this.chips}`);
        this.chips -= amount;
        console.log(`${this.name} bet ${amount} chips. Remaining chips: ${this.chips}`);
        return amount;
    }
}

class Game {
    constructor(numberOfOpponents) {
        this.players = [new Player('You')];
        for (let i = 1; i <= numberOfOpponents; i++) {
            this.players.push(new Player(`AI ${i}`, true, this));
        }
        this.deck = new Deck();
        this.pot = 0;
        this.roundNumber = 0;
        console.log("Game constructor called");
        this.winSound = new Audio('sounds/fanfare.mp3');
        this.loseSound = new Audio('sounds/failfare.mp3');
        this.roundHistory = [];
        this.startNewRound();
    }

    startNewRound() {
        console.log(`Starting new round. Current round number: ${this.roundNumber}`);
        this.deck = new Deck();
        this.roundNumber++;
        console.log(`Incremented round number: ${this.roundNumber}`);
        console.log(`Current pot: ${this.pot}`);
        
        for (let player of this.players) {
            player.hand = [];
            player.folded = false;
            player.revealed = false;
            player.isAI = player !== this.players[0]; // Reset AI status
            console.log(`Player ${player.name}: isAI = ${player.isAI}, chips = ${player.chips}`);
            
            if (this.roundNumber === 1 || this.pot === 0) {
                console.log(`${player.name} is betting 1 chip`);
                const betAmount = player.bet(1);
                this.pot += betAmount;
                console.log(`${player.name} bet ${betAmount}. New pot: ${this.pot}`);
            } else {
                console.log(`${player.name} is not betting (not first round and pot is not 0)`);
            }
        }
        this.dealInitialCards();
        this.renderGame();
        this.checkTotalChips();
    }

    dealInitialCards() {
        for (let i = 0; i < 2; i++) {
            for (let player of this.players) {
                player.receiveCard(this.deck.deal());
            }
        }
    }

    renderGame() {
        const gameAreaElement = document.getElementById('game-area');
        gameAreaElement.innerHTML = '';
        
        const humanPlayer = this.players[0];
        const aiPlayers = this.players.slice(1);

        // Render human player's cards
        const humanPlayerElement = document.createElement('div');
        humanPlayerElement.className = 'human-player';
        humanPlayerElement.innerHTML = `<h3>${humanPlayer.name}</h3>`;

        const humanCardsContainer = document.createElement('div');
        humanCardsContainer.className = 'human-cards-container';

        for (let card of humanPlayer.hand) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card human-card';
            if (humanPlayer.folded) {
                cardElement.classList.add('hidden');
                cardElement.textContent = '?';
            } else {
                cardElement.textContent = card.toString();
            }
            humanCardsContainer.appendChild(cardElement);
        }

        humanPlayerElement.appendChild(humanCardsContainer);

        const humanChipInfo = document.createElement('div');
        humanChipInfo.className = 'chip-info';
        humanChipInfo.textContent = `${humanPlayer.chips} chips`;
        humanPlayerElement.appendChild(humanChipInfo);


        gameAreaElement.appendChild(humanPlayerElement);

        // Render AI players' cards
        const aiPlayersContainer = document.createElement('div');
        aiPlayersContainer.className = 'ai-players-container';

        for (let player of aiPlayers) {
            const playerElement = document.createElement('div');
            playerElement.className = 'player';
            playerElement.innerHTML = `<h3>${player.name}</h3>`;

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container';

            for (let card of player.hand) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                if (!player.revealed) {
                    cardElement.classList.add('hidden');
                    cardElement.textContent = '?';
                } else {
                    cardElement.textContent = card.toString();
                }
                cardsContainer.appendChild(cardElement);
            }

            playerElement.appendChild(cardsContainer);

            const chipInfo = document.createElement('div');
            chipInfo.className = 'chip-info';
            chipInfo.textContent = `${player.chips} chips`;
            playerElement.appendChild(chipInfo);


            aiPlayersContainer.appendChild(playerElement);
        }

        gameAreaElement.appendChild(aiPlayersContainer);

        const potElement = document.createElement('div');
        potElement.id = 'pot';
        potElement.innerHTML = `<h3>Pot: ${this.pot} chips</h3>`;
        gameAreaElement.appendChild(potElement);
    }

    aiDecision() {
        for (let player of this.players) {
            if (player.isAI && !player.folded) {
                const handValue = player.calculateHandValue();
                if (handValue < player.threshold) {
                    player.fold();
                } else {
                    player.revealed = true;
                }
            }
        }
        this.renderGame();
        this.resolveRound();
    }

    resolveRound() {
        const playersInGame = this.players.filter(player => !player.folded);
        
        if (playersInGame.length === 0) {
            // All players folded, start a new round without distributing the pot
            this.showResults([], 0);
            return;
        }

        const winners = this.getWinners(playersInGame);

        const potBeforeDistribution = this.pot; // Store the pot value before distribution
        this.revealCards();
        this.distributePot(winners);
        this.collectLosersContributions(winners, playersInGame, potBeforeDistribution);
        this.showResults(winners, potBeforeDistribution);
        this.checkTotalChips();
    }

    distributePot(winners) {
        if (winners.length === 1) {
            winners[0].chips += this.pot;
        } else {
            const splitPot = Math.floor(this.pot / winners.length);
            for (let winner of winners) {
                winner.chips += splitPot;
            }
        }
        this.pot = 0;
    }

    collectLosersContributions(winners, playersInGame, potToMatch) {
        for (let player of playersInGame) {
            if (!winners.includes(player)) {
                this.pot += player.bet(potToMatch);
            }
        }
    }

    revealCards() {
        for (let player of this.players) {
            if (!player.folded) {
                player.revealed = true;
            }
        }
        this.renderGame();
    }

    showResults(winners, potBeforeDistribution) {
        const resultsElement = document.getElementById('results');
        
        // Create a new round result element
        const roundResult = document.createElement('div');
        roundResult.className = 'round-result';
        
        const playersContainer = document.createElement('div');
        playersContainer.className = 'players-container';
        
        const humanPlayer = this.players[0];
        
        for (let player of this.players) {
            const playerElement = document.createElement('div');
            playerElement.className = 'player';
            
            let chipChange = 0;
            if (winners.includes(player)) {
                chipChange = winners.length === 1 ? potBeforeDistribution : Math.floor(potBeforeDistribution / winners.length);
            } else if (!player.folded) {
                chipChange = -potBeforeDistribution;
            }
            
            playerElement.innerHTML = `<h3>${player.name}</h3>`;

            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container';

            for (let card of player.hand) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                if (player.folded) {
                    cardElement.classList.add('hidden');
                    cardElement.textContent = '?';
                } else {
                    cardElement.textContent = card.toString();
                }
                cardsContainer.appendChild(cardElement);
            }

            playerElement.appendChild(cardsContainer);

            const chipInfo = document.createElement('div');
            chipInfo.className = 'chip-info';
            chipInfo.textContent = `${player.chips} chips`;
            if (chipChange !== 0) {
                const chipChangeString = chipChange > 0 ? `+${chipChange}` : chipChange;
                chipInfo.textContent += ` (${chipChangeString})`;
            }
            playerElement.appendChild(chipInfo);


            playersContainer.appendChild(playerElement);
        }

        roundResult.appendChild(playersContainer);

        if (winners.length === 0) {
            roundResult.innerHTML += `<h3>All players folded. Pot carries over to next round.</h3>`;
        } else if (winners.length === 1) {
            if (winners[0] === humanPlayer) {
                this.winSound.play();
            } else if (!humanPlayer.folded) {
                this.loseSound.play();
            }
        } else {
            roundResult.innerHTML += `<h3>Tie! Winners: ${winners.map(w => w.name).join(', ')}</h3>`;
            if (winners.includes(humanPlayer)) {
                this.winSound.play();
            } else if (!humanPlayer.folded) {
                this.loseSound.play();
            }
        }


        // Add the new round result to the beginning of the history
        this.roundHistory.unshift(roundResult);

        // Clear the results element and add all round results
        resultsElement.innerHTML = '<h1>Game History</h1>';
        for (let result of this.roundHistory) {
            resultsElement.appendChild(result);
        }

        // Check if the game should continue
        if (this.shouldContinueGame()) {
            setTimeout(() => this.startNewRound(), 1500); // Start a new round after 3 seconds
        } else {
            setTimeout(() => this.restartGame(), 1500); // Restart the game after 3 seconds
        }
    }

    getWinners(players) {
        const maxHandValue = Math.max(...players.map(p => p.calculateHandValue()));
        return players.filter(p => p.calculateHandValue() === maxHandValue);
    }

    shouldContinueGame() {
        const playersInGame = this.players.filter(player => !player.folded);

        // If all players folded, continue to next round
        if (playersInGame.length === 0) {
            return true;
        }

        // Game ends if there's only one player left or if all remaining players have the same hand value
        if (playersInGame.length === 1 || this.getWinners(playersInGame).length === playersInGame.length) {
            return false;
        }

        return true;
    }

    restartGame() {
        console.log("Restarting game");
        this.players.forEach(player => {
            player.folded = false;
            if (player.isAI) {
                player.threshold = generateRandomPlayer(this.players.length);
            }
            console.log(`Reset ${player.name}: chips = ${player.chips}, folded = ${player.folded}, threshold = ${player.threshold}`);
        });
        this.pot = 0;
        this.roundNumber = 0;
        console.log(`Reset pot: ${this.pot}, roundNumber: ${this.roundNumber}`);
        this.startNewRound();
    }

    checkTotalChips() {
        const totalChips = this.players.reduce((sum, player) => sum + player.chips, 0) + this.pot;
        console.log(`Total chips in game: ${totalChips}`);
        if (totalChips !== this.players.length * 100) {
            console.error(`Chip mismatch! Expected ${this.players.length * 100}, but found ${totalChips}`);
        }
    }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
    const opponentSelection = document.getElementById('opponent-selection');
    const gameContainer = document.getElementById('game-container');
    const startGameButton = document.getElementById('start-game');
    const opponentCount = document.getElementById('opponent-count');

    startGameButton.addEventListener('click', () => {
        const numberOfOpponents = parseInt(opponentCount.value, 10);
        opponentSelection.style.display = 'none';
        gameContainer.style.display = 'block';
        startGame(numberOfOpponents);
    });

    function startGame(opponents) {
        console.log(`Starting game with ${opponents} AI opponents`);
        game = new Game(opponents);
        game.renderGame();
    }
});

document.getElementById('stay-button').addEventListener('click', () => {
    game.aiDecision();
});

document.getElementById('fold-button').addEventListener('click', () => {
    game.players[0].fold();
    game.renderGame(); // Re-render the game to hide the human player's cards
    game.aiDecision();
});
