(function () {
  "use strict";

  const screens = {
    setup: document.getElementById("screen-setup"),
    turnStart: document.getElementById("screen-turn-start"),
    play: document.getElementById("screen-play"),
    turnSummary: document.getElementById("screen-turn-summary"),
    gameOver: document.getElementById("screen-game-over"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add("hidden"));
    screens[name].classList.remove("hidden");
  }

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Setup screen: dynamic team rows ----
  const teamsListEl = document.getElementById("teams-list");
  const addTeamBtn = document.getElementById("add-team-btn");
  const MAX_TEAMS = 6;
  const MIN_TEAMS = 2;

  function addTeamRow(defaultName) {
    const rows = teamsListEl.querySelectorAll(".team-input-row");
    if (rows.length >= MAX_TEAMS) return;
    const row = document.createElement("div");
    row.className = "team-input-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Team " + (rows.length + 1);
    input.value = defaultName || "";
    input.maxLength = 24;
    row.appendChild(input);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-team-btn";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      if (teamsListEl.querySelectorAll(".team-input-row").length <= MIN_TEAMS) return;
      row.remove();
    });
    row.appendChild(removeBtn);

    teamsListEl.appendChild(row);
  }

  addTeamRow("Team 1");
  addTeamRow("Team 2");
  addTeamBtn.addEventListener("click", () => addTeamRow());

  // ---- Game state ----
  const state = {
    teams: [], // { name, score }
    currentTeamIndex: 0,
    turnLength: 60,
    skipLimit: 3,
    targetScore: 30,
    deck: [],
    used: [],
    turn: null, // { timeLeft, correct, skip, buzz, skipUsed, card, timerId }
  };

  function drawCard() {
    if (state.deck.length === 0) {
      state.deck = shuffle(state.used.length ? state.used : WORDS);
      state.used = [];
    }
    const card = state.deck.pop();
    state.used.push(card);
    return card;
  }

  function renderScoreboard(el) {
    el.textContent = state.teams.map((t) => `${t.name}: ${t.score}`).join("   •   ");
  }

  document.getElementById("start-game-btn").addEventListener("click", () => {
    const nameInputs = teamsListEl.querySelectorAll(".team-input-row input");
    const teams = Array.from(nameInputs).map((input, i) => ({
      name: input.value.trim() || `Team ${i + 1}`,
      score: 0,
    }));

    const turnLength = clampInt(document.getElementById("turn-length").value, 10, 180, 60);
    const skipLimit = clampInt(document.getElementById("skip-limit").value, 0, 10, 3);
    const targetScore = clampInt(document.getElementById("target-score").value, 5, 100, 30);

    state.teams = teams;
    state.currentTeamIndex = 0;
    state.turnLength = turnLength;
    state.skipLimit = skipLimit;
    state.targetScore = targetScore;
    state.deck = shuffle(WORDS);
    state.used = [];

    goToTurnStart();
  });

  function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  // ---- Turn start ----
  function goToTurnStart() {
    const team = state.teams[state.currentTeamIndex];
    document.getElementById("turn-start-team").textContent = team.name;
    renderScoreboard(document.getElementById("turn-start-scores"));
    showScreen("turnStart");
  }

  document.getElementById("start-turn-btn").addEventListener("click", startTurn);

  // ---- Play ----
  const timerEl = document.getElementById("timer");
  const cardWordEl = document.getElementById("card-word");
  const tabooListEl = document.getElementById("taboo-list");
  const skipRemainingEl = document.getElementById("skip-remaining");
  const skipBtn = document.getElementById("skip-btn");

  function startTurn() {
    const team = state.teams[state.currentTeamIndex];
    document.getElementById("play-team-name").textContent = team.name;

    state.turn = {
      timeLeft: state.turnLength,
      correct: 0,
      skip: 0,
      buzz: 0,
      skipUsed: 0,
      card: null,
      timerId: null,
    };

    updateSkipButton();
    nextCard();
    updateTimerDisplay();

    state.turn.timerId = setInterval(() => {
      state.turn.timeLeft -= 1;
      updateTimerDisplay();
      if (state.turn.timeLeft <= 0) {
        endTurn();
      }
    }, 1000);

    showScreen("play");
  }

  function updateTimerDisplay() {
    timerEl.textContent = state.turn.timeLeft;
    timerEl.classList.toggle("low", state.turn.timeLeft <= 10);
  }

  function nextCard() {
    const card = drawCard();
    state.turn.card = card;
    cardWordEl.textContent = card.word;
    tabooListEl.innerHTML = "";
    card.taboo.forEach((word) => {
      const li = document.createElement("li");
      li.textContent = word;
      tabooListEl.appendChild(li);
    });
  }

  function updateSkipButton() {
    const remaining = state.skipLimit - state.turn.skipUsed;
    skipRemainingEl.textContent = remaining;
    skipBtn.disabled = remaining <= 0;
  }

  document.getElementById("correct-btn").addEventListener("click", () => {
    if (!state.turn) return;
    state.turn.correct += 1;
    nextCard();
  });

  skipBtn.addEventListener("click", () => {
    if (!state.turn || state.turn.skipUsed >= state.skipLimit) return;
    state.turn.skip += 1;
    state.turn.skipUsed += 1;
    updateSkipButton();
    nextCard();
  });

  document.getElementById("buzz-btn").addEventListener("click", () => {
    if (!state.turn) return;
    state.turn.buzz += 1;
    nextCard();
  });

  function endTurn() {
    clearInterval(state.turn.timerId);

    const team = state.teams[state.currentTeamIndex];
    const points = state.turn.correct - state.turn.buzz;
    team.score += points;

    document.getElementById("summary-team").textContent = team.name;
    document.getElementById("summary-correct").textContent = state.turn.correct;
    document.getElementById("summary-skip").textContent = state.turn.skip;
    document.getElementById("summary-buzz").textContent = state.turn.buzz;
    document.getElementById("summary-points").textContent =
      (points >= 0 ? "+" : "") + points + " points this turn";
    renderScoreboard(document.getElementById("summary-scores"));

    showScreen("turnSummary");
  }

  document.getElementById("continue-btn").addEventListener("click", () => {
    const winner = state.teams.find((t) => t.score >= state.targetScore);
    if (winner) {
      goToGameOver(winner);
      return;
    }
    state.currentTeamIndex = (state.currentTeamIndex + 1) % state.teams.length;
    goToTurnStart();
  });

  function goToGameOver(winner) {
    document.getElementById("winner-name").textContent = `${winner.name} wins!`;
    const sorted = state.teams.slice().sort((a, b) => b.score - a.score);
    document.getElementById("final-scores").textContent = sorted
      .map((t) => `${t.name}: ${t.score}`)
      .join("   •   ");
    showScreen("gameOver");
  }

  document.getElementById("new-game-btn").addEventListener("click", () => {
    showScreen("setup");
  });
})();
