
let startingWord = "COLD";
const targetWord = "CATS";

let currentWord = startingWord;
let moves = 0;
let validWords = new Set();
let dailySchedule = {};

const guessInputs = Array.from(
  document.querySelectorAll(".guess-letter")
);

const wordLadder = document.getElementById("word-ladder");
const movesDisplay = document.getElementById("moves");
const message = document.getElementById("message");

const yesterdayButton = document.getElementById("yesterday-button");
const yesterdayResults = document.getElementById("yesterday-results");
const popupOverlay = document.getElementById("popup-overlay");
const closePopupButton = document.getElementById("close-popup");


guessInputs.forEach(input => {
  input.disabled = true;
});

async function loadDictionary() {
  const response = await fetch("words_alpha.txt");

  if (!response.ok) {
    throw new Error("Dictionary file could not be loaded.");
  }

  const text = await response.text();

  validWords = new Set(
    text
      .split(/\r?\n/)
      .map(word => word.trim().toUpperCase())
      .filter(word => /^[A-Z]{4}$/.test(word))
  );

  validWords.add(targetWord);
}

function getDateKey(date) {
  return (
    date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

async function loadDailyPuzzle() {
  const response = await fetch("daily-words.json");

  if (!response.ok) {
    throw new Error("Could not load daily-words.json.");
  }

  dailySchedule = await response.json();

  const todayKey = getDateKey(new Date());

  if (!dailySchedule[todayKey]) {
    throw new Error("No starting word scheduled for " + todayKey);
  }

  startingWord = String(dailySchedule[todayKey])
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{4}$/.test(startingWord)) {
    throw new Error("Today's starting word must have four letters.");
  }

  if (!validWords.has(startingWord)) {
    throw new Error(
      "Today's starting word " + startingWord +
      " is missing from words_alpha.txt."
    );
  }

  if (startingWord === targetWord) {
    throw new Error("Today's starting word cannot already be CATS.");
  }

  currentWord = startingWord;
  moves = 0;

  wordLadder.replaceChildren();
  addWordRow(startingWord);
  movesDisplay.textContent = moves;
}

async function startGame() {
  try {
    message.textContent = "loading today's puzzle...";

    await loadDictionary();
    await loadDailyPuzzle();

    guessInputs.forEach(input => {
      input.disabled = false;
    });

        message.textContent = "change one letter to reach the word CATS";
    guessInputs[0].focus();
  } catch (error) {
    message.textContent =
      "Couldn't load today's puzzle: " + error.message;
    console.error(error);
  }
}

function clearGuess() {
  guessInputs.forEach(input => {
    input.value = "";
  });

  const row = document.getElementById("guess-row");

  row.classList.remove("animate-guess");
  void row.offsetWidth;
  row.classList.add("animate-guess");

  guessInputs[0].focus();
}

function shakeGuess() {
  const row = document.getElementById("guess-row");

  row.classList.remove("shake");
  void row.offsetWidth;
  row.classList.add("shake");
}

function submitGuess() {
  if (guessInputs.some(input => input.value === "")) {
    message.textContent = "Fill in all four letters!";
    return;
  }

  const guess = guessInputs
    .map(input => input.value)
    .join("")
    .toUpperCase();

  if (!validWords.has(guess)) {
    shakeGuess();
    message.textContent = "That word isn't in the dictionary.";
    return;
  }

  let differences = 0;

  for (let i = 0; i < 4; i++) {
    if (guess[i] !== currentWord[i]) {
      differences++;
    }
  }

  if (differences !== 1) {
    shakeGuess();
    message.textContent = "change exactly one letter!";
    return;
  }

  currentWord = guess;
  moves++;

  addWordRow(currentWord);
  movesDisplay.textContent = moves;

  if (currentWord === targetWord) {
    message.textContent = `you reached CATS in ${moves} moves! `;

    guessInputs.forEach(input => {
      input.disabled = true;
    });

    return;
  }

  clearGuess();
  message.textContent = "nice move";
}

guessInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value
      .replace(/[^a-z]/gi, "")
      .toUpperCase()
      .slice(-1);

    if (input.value && index < guessInputs.length - 1) {
      guessInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }

    if (
      event.key === "Backspace" &&
      !input.value &&
      index > 0
    ) {
      guessInputs[index - 1].focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      guessInputs[index - 1].focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < guessInputs.length - 1
    ) {
      guessInputs[index + 1].focus();
    }
  });
});

function addWordRow(word, container = wordLadder) {
  const row = document.createElement("p");

  for (let i = 0; i < word.length; i++) {
    const box = document.createElement("span");
    box.classList.add("letter-box");
    box.textContent = word[i];

    if (word[i] === targetWord[i]) {
      box.classList.add("correct");
    }

    row.appendChild(box);
  }

  container.appendChild(row);
}

function updateDayNumber() {
  const dayNumberElement = document.getElementById("day-number");

  if (!dayNumberElement) return;

  const startDate = new Date(2026, 9, 10);
  const today = new Date();

  const startDay = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const todayDay = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const difference = todayDay - startDay;
  const dayNumber = Math.floor(
    difference / (1000 * 60 * 60 * 24)
  ) + 1;

  dayNumberElement.textContent = "#" + dayNumber;
}

function findShortestLadder(start, target) {
  if (!validWords.has(start)) {
    return null;
  }

  const queue = [[start]];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const path = queue.shift();
    const word = path[path.length - 1];

    if (word === target) {
      return path;
    }

    for (let i = 0; i < word.length; i++) {
      for (let code = 65; code <= 90; code++) {
        const letter = String.fromCharCode(code);

        if (letter === word[i]) continue;

        const nextWord =
          word.slice(0, i) + letter + word.slice(i + 1);

        if (validWords.has(nextWord) && !visited.has(nextWord)) {
          visited.add(nextWord);
          queue.push([...path, nextWord]);
        }
      }
    }
  }

  return null;
}


function showYesterdayResults() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayKey = getDateKey(yesterday);
  const yesterdayWord = dailySchedule[yesterdayKey];

  const ladderDisplay = document.getElementById("yesterday-ladder");
  const startDisplay = document.getElementById("yesterday-start");
  const resultMovesDisplay = document.getElementById("yesterday-moves");

  ladderDisplay.replaceChildren();
  startDisplay.textContent = "";
  resultMovesDisplay.textContent = "";

  if (!yesterdayWord) {
    startDisplay.textContent =
      "No puzzle was scheduled for " + yesterdayKey + ".";
  } else {
    const start = String(yesterdayWord).trim().toUpperCase();
    startDisplay.textContent = "Starting word: " + start;

    const path = findShortestLadder(start, targetWord);

    if (!path) {
      resultMovesDisplay.textContent =
        "No valid ladder to CATS was found in your current dictionary.";
    } else {
      path.forEach(word => addWordRow(word, ladderDisplay));

      const solutionMoves = path.length - 1;
      let difficulty = "Hard";

      if (solutionMoves <= 5) {
        difficulty = "Easy";
      } else if (solutionMoves <= 7) {
        difficulty = "Medium";
      }

      

resultMovesDisplay.textContent =
  `shortest solution: ${solutionMoves} moves.\ndifficulty: ${difficulty.toLowerCase()}.`;


    }
  }

  popupOverlay.hidden = false;
  yesterdayResults.hidden = false;
  closePopupButton.focus();
}

function closeYesterdayPopup() {
  // Hide the popup AND its dark background.
  yesterdayResults.hidden = true;
  popupOverlay.hidden = true;
  yesterdayButton.focus();
}

yesterdayButton.addEventListener("click", showYesterdayResults);
closePopupButton.addEventListener("click", closeYesterdayPopup);
popupOverlay.addEventListener("click", closeYesterdayPopup);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !yesterdayResults.hidden) {
    closeYesterdayPopup();
  }
});

updateDayNumber();
startGame();
