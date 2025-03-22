class YatzyGame {
  constructor() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.currentDice = [];
    this.scoreCategories = {
      ones: 'Ettor',
      twos: 'Tvåor',
      threes: 'Treor',
      fours: 'Fyror',
      fives: 'Femmor',
      sixes: 'Sexor',
      onePair: 'Ett par',
      twoPairs: 'Två par',
      threeOfAKind: 'Triss',
      fourOfAKind: 'Fyrtal',
      smallStraight: 'Liten stege',
      largeStraight: 'Stor stege',
      fullHouse: 'Kåk',
      chance: 'Chans',
      yatzy: 'Yatzy',
    };
  }

  init() {
    this.setupEventListeners();
    this.updateUI();
  }

  setupEventListeners() {
    document.getElementById('addPlayer').addEventListener('click', () => this.addPlayer());
    document.getElementById('calculateScore').addEventListener('click', () => this.calculatePossibleScores());
  }

  addPlayer() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();

    if (name) {
      this.players.push({
        id: Date.now(), // Unikt ID för varje spelare
        name: name,
        scores: {},
        savedDice: [],
      });
      nameInput.value = '';
      this.updateUI();
    }
  }

  removePlayer(playerId) {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
      this.players.splice(playerIndex, 1);
      if (this.currentPlayerIndex >= this.players.length) {
        this.currentPlayerIndex = Math.max(0, this.players.length - 1);
      }
      this.updateUI();
    }
  }

  editPlayerName(playerId) {
    const playerItem = document.querySelector(`.player-item[data-id="${playerId}"]`);
    if (playerItem) {
      playerItem.classList.add('editing');
      const input = playerItem.querySelector('input');
      const nameSpan = playerItem.querySelector('.player-name');
      input.value = nameSpan.textContent;
      input.style.display = 'block';
      input.focus();
    }
  }

  savePlayerName(playerId, newName) {
    const player = this.players.find((p) => p.id === playerId);
    if (player && newName.trim()) {
      player.name = newName.trim();
      this.updateUI();
    }
  }

  makePlayerActive(playerId) {
    const playerIndex = this.players.findIndex((p) => p.id === playerId);
    if (playerIndex !== -1) {
      this.currentPlayerIndex = playerIndex;
      this.updateUI();
    }
  }

  updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    this.players.forEach((player) => {
      const playerItem = document.createElement('div');
      playerItem.className = `player-item${player === this.players[this.currentPlayerIndex] ? ' active' : ''}`;
      playerItem.dataset.id = player.id;

      playerItem.innerHTML = `
        <span class="player-name">${player.name}</span>
        <input type="text" value="${player.name}" 
          onblur="game.savePlayerName(${player.id}, this.value)" 
          onkeypress="if(event.key === 'Enter') this.blur()">
        <div class="player-buttons">
          <button class="button-small" onclick="game.makePlayerActive(${player.id})">Gör aktiv</button>
          <button class="button-small" onclick="game.editPlayerName(${player.id})">Byt namn</button>
          <button class="button-small button-delete" onclick="game.removePlayer(${player.id})">Ta bort</button>
        </div>
      `;

      playerList.appendChild(playerItem);
    });
  }

  calculatePossibleScores() {
    const diceInputs = document.querySelectorAll('.dice');
    this.currentDice = Array.from(diceInputs)
      .map((input) => parseInt(input.value))
      .filter((value) => !isNaN(value) && value >= 1 && value <= 6);

    if (this.currentDice.length === 5) {
      const currentPlayer = this.players[this.currentPlayerIndex];
      const possibleScores = {};

      // Beräkna poäng för varje tillgänglig kategori
      for (const [category, name] of Object.entries(this.scoreCategories)) {
        if (!currentPlayer.scores[category]) {
          possibleScores[category] = this.calculateScore(category, this.currentDice);
        }
      }

      this.showPossibleScores(possibleScores);
    }
  }

  calculateScore(category, dice) {
    const sortedDice = [...dice].sort((a, b) => a - b);
    const counts = this.getCounts(dice);

    switch (category) {
      case 'ones':
        return this.sumOfNumber(dice, 1);
      case 'twos':
        return this.sumOfNumber(dice, 2);
      case 'threes':
        return this.sumOfNumber(dice, 3);
      case 'fours':
        return this.sumOfNumber(dice, 4);
      case 'fives':
        return this.sumOfNumber(dice, 5);
      case 'sixes':
        return this.sumOfNumber(dice, 6);
      case 'onePair':
        return this.calculatePair(counts);
      case 'twoPairs':
        return this.calculateTwoPairs(counts);
      case 'threeOfAKind':
        return this.calculateNOfAKind(counts, 3);
      case 'fourOfAKind':
        return this.calculateNOfAKind(counts, 4);
      case 'smallStraight':
        return this.isSmallStraight(sortedDice) ? 15 : 0;
      case 'largeStraight':
        return this.isLargeStraight(sortedDice) ? 20 : 0;
      case 'fullHouse':
        return this.calculateFullHouse(counts);
      case 'chance':
        return dice.reduce((sum, val) => sum + val, 0);
      case 'yatzy':
        return this.isYatzy(counts) ? 50 : 0;
    }
  }

  getCounts(dice) {
    return dice.reduce((counts, value) => {
      counts[value] = (counts[value] || 0) + 1;
      return counts;
    }, {});
  }

  sumOfNumber(dice, number) {
    return dice.filter((d) => d === number).reduce((sum, val) => sum + val, 0);
  }

  calculatePair(counts) {
    const pairs = Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([value, _]) => parseInt(value));
    return pairs.length > 0 ? Math.max(...pairs) * 2 : 0;
  }

  calculateTwoPairs(counts) {
    const pairs = Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([value, _]) => parseInt(value))
      .sort((a, b) => b - a);
    return pairs.length >= 2 ? pairs[0] * 2 + pairs[1] * 2 : 0;
  }

  calculateNOfAKind(counts, n) {
    const value = Object.entries(counts).find(([_, count]) => count >= n)?.[0];
    return value ? parseInt(value) * n : 0;
  }

  isSmallStraight(sortedDice) {
    return JSON.stringify(sortedDice) === JSON.stringify([1, 2, 3, 4, 5]);
  }

  isLargeStraight(sortedDice) {
    return JSON.stringify(sortedDice) === JSON.stringify([2, 3, 4, 5, 6]);
  }

  calculateFullHouse(counts) {
    const hasThree = Object.values(counts).includes(3);
    const hasTwo = Object.values(counts).includes(2);
    if (hasThree && hasTwo) {
      return this.currentDice.reduce((sum, val) => sum + val, 0);
    }
    return 0;
  }

  isYatzy(counts) {
    return Object.values(counts).includes(5);
  }

  showPossibleScores(possibleScores) {
    const container = document.getElementById('possibleScores');
    container.innerHTML = '';

    for (const [category, score] of Object.entries(possibleScores)) {
      const button = document.createElement('button');
      button.textContent = `${this.scoreCategories[category]}: ${score} poäng`;
      button.addEventListener('click', () => this.selectScore(category, score));
      container.appendChild(button);
    }
  }

  selectScore(category, score) {
    const currentPlayer = this.players[this.currentPlayerIndex];
    currentPlayer.scores[category] = score;
    currentPlayer.savedDice = [];
    this.nextPlayer();
    this.updateUI();

    // Rensa tärningsinmatningen
    document.querySelectorAll('.dice').forEach((input) => (input.value = ''));
    document.getElementById('possibleScores').innerHTML = '';
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // Återställ sparade tärningar om det finns några
    const nextPlayer = this.players[this.currentPlayerIndex];
    if (nextPlayer.savedDice.length === 5) {
      document.querySelectorAll('.dice').forEach((input, index) => {
        input.value = nextPlayer.savedDice[index];
      });
      this.calculatePossibleScores();
    }
  }

  updateScoreboard() {
    const table = document.getElementById('scoreTable');
    const thead = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');

    // Uppdatera rubrikraden
    thead.innerHTML = '<th>Kategori</th>';
    this.players.forEach((player) => {
      const th = document.createElement('th');
      th.textContent = player.name;
      if (this.players[this.currentPlayerIndex] === player) {
        th.classList.add('current-player');
      }
      thead.appendChild(th);
    });

    // Uppdatera poängrader
    tbody.innerHTML = '';
    Object.entries(this.scoreCategories).forEach(([category, name]) => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${name}</td>`;

      this.players.forEach((player) => {
        const td = document.createElement('td');
        td.textContent = player.scores[category] || '-';
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    // Lägg till summeringsrad
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = '<td><strong>Totalt</strong></td>';
    this.players.forEach((player) => {
      const total = Object.values(player.scores).reduce((sum, score) => sum + score, 0);
      totalRow.innerHTML += `<td><strong>${total}</strong></td>`;
    });
    tbody.appendChild(totalRow);
  }

  updateUI() {
    this.updatePlayerList();
    const currentPlayerElement = document.getElementById('currentPlayer');
    if (this.players.length > 0) {
      currentPlayerElement.textContent = this.players[this.currentPlayerIndex].name;
    } else {
      currentPlayerElement.textContent = 'Inga spelare än';
    }
    this.updateScoreboard();
  }
}

// Gör game-instansen global så att onclick-handlers kan komma åt den
let game;

document.addEventListener('DOMContentLoaded', () => {
  game = new YatzyGame();
  game.init();
});
