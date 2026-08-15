(function () {
  "use strict";

  const STRINGS = {
    en: {
      docTitle: "Taboo",
      title: "Taboo",
      subtitle: "Pass-and-play. Set up your teams to start.",
      addTeam: "+ Add team",
      turnLabel: "Turn length (sec)",
      skipLabel: "Skips per turn",
      winLabel: "Score to win",
      categoriesLabel: "Categories",
      startGame: "Start Game",
      upNext: "Up next",
      turnStartHint: "Pass the phone to this team's clue-giver.<br>Don't let the other team see the taboo words!",
      startTurn: "Start Turn",
      buzz: "Buzz!",
      skip: "Skip",
      correct: "Correct",
      turnOver: "Turn over",
      statCorrect: "Correct",
      statSkip: "Skipped",
      statBuzz: "Taboo",
      pointsThisTurn: (n) => `${n >= 0 ? "+" : ""}${n} points this turn`,
      continue: "Continue",
      winner: "Winner",
      wins: (name) => `${name} wins!`,
      newGame: "New Game",
      teamPrefix: "Team",
      removeTeam: "Remove team",
    },
    it: {
      docTitle: "Tabù",
      title: "Tabù",
      subtitle: "Passa il telefono. Configura le squadre per iniziare.",
      addTeam: "+ Aggiungi squadra",
      turnLabel: "Durata turno (sec)",
      skipLabel: "Salti per turno",
      winLabel: "Punti per vincere",
      categoriesLabel: "Categorie",
      startGame: "Inizia Partita",
      upNext: "Prossimo turno",
      turnStartHint: "Passa il telefono a chi darà gli indizi per questa squadra.<br>Non far vedere le parole vietate all'altra squadra!",
      startTurn: "Inizia Turno",
      buzz: "Errore!",
      skip: "Salta",
      correct: "Corretto",
      turnOver: "Turno finito",
      statCorrect: "Corrette",
      statSkip: "Saltate",
      statBuzz: "Errori",
      pointsThisTurn: (n) => `${n >= 0 ? "+" : ""}${n} punti in questo turno`,
      continue: "Continua",
      winner: "Vincitore",
      wins: (name) => `${name} vince!`,
      newGame: "Nuova Partita",
      teamPrefix: "Squadra",
      removeTeam: "Rimuovi squadra",
    },
  };

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

  // ---- Language ----
  const langEnBtn = document.getElementById("lang-en-btn");
  const langItBtn = document.getElementById("lang-it-btn");

  function teamDefaultName(lang, n) {
    return `${STRINGS[lang].teamPrefix} ${n}`;
  }

  function applyLanguage(lang) {
    state.lang = lang;
    const s = STRINGS[lang];

    document.title = s.docTitle;
    document.getElementById("setup-title").textContent = s.title;
    document.getElementById("setup-subtitle").textContent = s.subtitle;
    addTeamBtn.textContent = s.addTeam;
    document.getElementById("label-turn").textContent = s.turnLabel;
    document.getElementById("label-skip").textContent = s.skipLabel;
    document.getElementById("label-win").textContent = s.winLabel;
    document.getElementById("start-game-btn").textContent = s.startGame;

    document.getElementById("turn-start-eyebrow").textContent = s.upNext;
    document.getElementById("turn-start-hint").innerHTML = s.turnStartHint;
    document.getElementById("start-turn-btn").textContent = s.startTurn;

    document.getElementById("buzz-btn").textContent = s.buzz;
    document.getElementById("skip-label-text").textContent = s.skip;
    document.getElementById("correct-label-text").textContent = s.correct;

    document.getElementById("summary-eyebrow").textContent = s.turnOver;
    document.getElementById("stat-label-correct").textContent = s.statCorrect;
    document.getElementById("stat-label-skip").textContent = s.statSkip;
    document.getElementById("stat-label-buzz").textContent = s.statBuzz;
    document.getElementById("continue-btn").textContent = s.continue;

    document.getElementById("winner-eyebrow").textContent = s.winner;
    document.getElementById("new-game-btn").textContent = s.newGame;
    document.getElementById("label-categories").textContent = s.categoriesLabel;

    langEnBtn.classList.toggle("active", lang === "en");
    langItBtn.classList.toggle("active", lang === "it");

    // Refresh team row placeholders, and values for rows still on their default name.
    teamsListEl.querySelectorAll(".team-input-row").forEach((row, i) => {
      const input = row.querySelector("input");
      const n = i + 1;
      input.placeholder = teamDefaultName(lang, n);
      if (input.dataset.autofilled === "true") {
        input.value = teamDefaultName(lang, n);
      }
    });

    renderCategoryChips();
  }

  // ---- Categories ----
  const categoryChipsEl = document.getElementById("category-chips");

  function renderCategoryChips() {
    const labels = CATEGORY_LABELS[state.lang];
    categoryChipsEl.innerHTML = "";
    CATEGORIES.forEach((key) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "category-chip";
      chip.textContent = labels[key];
      chip.classList.toggle("active", state.selectedCategories.has(key));
      chip.addEventListener("click", () => {
        if (state.selectedCategories.has(key)) {
          if (state.selectedCategories.size <= 1) return; // keep at least one category selected
          state.selectedCategories.delete(key);
        } else {
          state.selectedCategories.add(key);
        }
        chip.classList.toggle("active", state.selectedCategories.has(key));
      });
      categoryChipsEl.appendChild(chip);
    });
  }

  // ---- Setup screen: dynamic team rows ----
  const teamsListEl = document.getElementById("teams-list");
  const addTeamBtn = document.getElementById("add-team-btn");
  const MAX_TEAMS = 6;
  const MIN_TEAMS = 2;

  function addTeamRow(defaultIndex) {
    const rows = teamsListEl.querySelectorAll(".team-input-row");
    if (rows.length >= MAX_TEAMS) return;
    const n = rows.length + 1;
    const row = document.createElement("div");
    row.className = "team-input-row";
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 24;
    input.placeholder = teamDefaultName(state.lang, n);
    if (defaultIndex) {
      input.value = teamDefaultName(state.lang, defaultIndex);
      input.dataset.autofilled = "true";
    } else {
      input.dataset.autofilled = "false";
    }
    input.addEventListener("input", () => {
      input.dataset.autofilled = "false";
    });
    row.appendChild(input);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-team-btn";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", STRINGS[state.lang].removeTeam);
    removeBtn.addEventListener("click", () => {
      if (teamsListEl.querySelectorAll(".team-input-row").length <= MIN_TEAMS) return;
      row.remove();
    });
    row.appendChild(removeBtn);

    teamsListEl.appendChild(row);
  }

  // ---- Game state ----
  const state = {
    lang: "en",
    teams: [], // { name, score }
    currentTeamIndex: 0,
    turnLength: 60,
    skipLimit: 3,
    targetScore: 30,
    selectedCategories: new Set(CATEGORIES),
    deck: [],
    used: [],
    turn: null, // { timeLeft, correct, skip, buzz, skipUsed, card, timerId }
  };

  addTeamRow(1);
  addTeamRow(2);
  addTeamBtn.addEventListener("click", () => addTeamRow());
  langEnBtn.addEventListener("click", () => applyLanguage("en"));
  langItBtn.addEventListener("click", () => applyLanguage("it"));
  applyLanguage("en");

  function drawCard() {
    if (state.deck.length === 0) {
      state.deck = shuffle(state.used.length ? state.used : WORDS[state.lang]);
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
      name: input.value.trim() || teamDefaultName(state.lang, i + 1),
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
    state.deck = shuffle(WORDS[state.lang].filter((c) => state.selectedCategories.has(c.category)));
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
  const cardCategoryEl = document.getElementById("card-category");
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
    cardCategoryEl.textContent = CATEGORY_LABELS[state.lang][card.category];
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
    document.getElementById("summary-points").textContent = STRINGS[state.lang].pointsThisTurn(points);
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
    document.getElementById("winner-name").textContent = STRINGS[state.lang].wins(winner.name);
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
