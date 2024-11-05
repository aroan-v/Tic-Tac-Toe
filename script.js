const groupOfBoxes = document.querySelectorAll(".grid-child");
const gameWrapper = document.querySelector(".game-wrapper");
const gameContainer = document.querySelector(".game-container");
const textAnnouncer = document.querySelector(".text-announcement");
const textContainer = document.querySelector(".text-container");
const roundCounter = document.querySelector(".round-counter");
const dialogElement = document.querySelector("#pop-up-menu");
const gameButtons = dialogElement.querySelectorAll("button");
const p1 = Array.from(document.querySelectorAll(".p1"));
const p2 = Array.from(document.querySelectorAll(".p2"));
const playerOneContainer = document.querySelector(".player-one");
const playerTwoContainer = document.querySelector(".player-two");
const playerContainers = document.querySelectorAll(".player-container");
const modal = document.getElementById("pop-up-menu");
const closeButton = document.getElementById("closeModal");
const openButton = document.getElementById("openModal");
const gameModeButtons = Array.from(gameButtons).filter(
  (button) =>
    button.classList.contains("pvp") || button.classList.contains("pvc")
);
const gameSymbolButtons = Array.from(gameButtons).filter(
  (button) =>
    button.classList.contains("symbol-X") ||
    button.classList.contains("symbol-O")
);
const botContainerButtons = Array.from(gameButtons).filter((button) =>
  button.classList.contains("bot-container")
);
const startButton = dialogElement.querySelector(".start-button");
const playerName = document.getElementById("player-details");

// const game1 = gameInitializer("josh", undefined, 100);

const gameManager = {
  games: {},
  gameCount: 0,

  // Method to create a new game instance
  createGame: function (name = "You", name2, diff, mode, playerTurn) {
    this.games[this.gameCount] = gameInitializer(
      name,
      name2,
      diff,
      mode,
      playerTurn
    );
    this.gameCount++;
  },

  passMove: function (move) {
    this.games[this.gameCount - 1].gameModerator(move);
  },
};

function gameInitializer(name, name2, diff, mode, playerTurn) {
  let movesDone = 0;
  let roundsDone = 0;
  let invalidMoveDetected = false;
  let difficulty;
  let preferredTurn = +playerTurn;

  let { boardGame, availableMoves, availableCornerMoves } = boardDesign();
  let { analyzeMoves } = moveChecker();
  let {
    fullComboCheatSheet,
    rowAndColumnComboCheatSheet,
    diagonalComboCheatSheet,
  } = comboCheatSheet();
  let combosWithCornerMoves = rowAndColumnComboCheatSheet;
  const gameMoves = [];
  const playerOne = {};
  const playerTwo = {};
  const gameLog = [];
  const roundBreakdown = [];

  const gameScore = {
    [name]: 0,
    [name2]: 0,
  };

  let computerPreRecordedMoves = []; // For debugging purposes

  newGame();

  function addPlayerProperties() {
    // reset Object's properties
    Object.keys(playerOne).forEach((key) => {
      delete playerOne[key];
    });
    Object.keys(playerTwo).forEach((key) => {
      delete playerTwo[key];
    });

    if (mode === "pvc") {
      if ((preferredTurn + roundsDone) % 2 === 0) {
        playerOne.name = name;
        playerOne.isPlayerAComputer = false;
        playerOne.type = "Player";
        playerOne.avatar = "images/default_avatar.png";
        playerTwo.name = name2;
        playerTwo.isPlayerAComputer = true;
        playerTwo.movesLogic = [];
        handleGridButtons(availableMoves);

        const { type, avatar } = botTypeAndAvatar(playerTwo.name);
        playerTwo.type = type;
        playerTwo.avatar = avatar;
      } else {
        playerTwo.name = name;
        playerTwo.isPlayerAComputer = false;
        playerTwo.type = "Player";
        playerTwo.avatar = "images/default_avatar.png";
        playerOne.name = name2;
        playerOne.isPlayerAComputer = true;
        playerOne.movesLogic = [];

        const { type, avatar } = botTypeAndAvatar(playerOne.name);
        playerOne.type = type;
        playerOne.avatar = avatar;
      }
    }

    playerOne.winningMoves = [];
    playerOne.playerMoves = [];
    playerOne.remainingCombos = Object.assign([], fullComboCheatSheet);
    playerOne.turnSymbol = "X";
    playerOne.playerId = 1;
    avatarBorderFeedback(playerOne.playerId);
    playerOne.lastMove = function () {
      return playerOne.playerMoves.slice(-1)[0];
    };

    // TODO Study Object.assign*()
    playerTwo.winningMoves = [];
    playerTwo.playerMoves = [];
    playerTwo.remainingCombos = Object.assign([], fullComboCheatSheet);
    playerTwo.turnSymbol = "O";
    playerTwo.playerId = 2;
    playerTwo.lastMove = function () {
      return playerTwo.playerMoves.slice(-1)[0];
    };

    if (roundsDone > 1) {
      swapPlayers();
    } else {
      assignPlayerElements();

      playerContainers.forEach((element) => {
        element.classList.remove("hidden");
        element.classList.add("visible");
      });
    }

    function assignPlayerElements() {
      p1.find((element) => element.classList.contains("name")).textContent =
        playerOne.name;

      p1.find((element) => element.classList.contains("type")).textContent =
        playerOne.type;

      p1.find((element) => element.classList.contains("avatar")).src =
        playerOne.avatar;

      p2.find((element) => element.classList.contains("name")).textContent =
        playerTwo.name;

      p2.find((element) => element.classList.contains("type")).textContent =
        playerTwo.type;

      p2.find((element) => element.classList.contains("avatar")).src =
        playerTwo.avatar;
    }

    function botTypeAndAvatar(name) {
      if (name === "Chloe") {
        return { type: "Easy Bot", avatar: "images/chloe_avatar.png" };
      } else if (name === "Sam") {
        return { type: "Medium Bot", avatar: "images/sam_avatar.png" };
      } else if (name === "Sophia") {
        return { type: "Hard Bot", avatar: "images/sophia_avatar.png" };
      } else if (name === "Marcus") {
        return { type: "Extreme Bot", avatar: "images/marcus_avatar.png" };
      }
    }

    function swapPlayers() {
      // Add the 'swap' class to both players

      p1.find((element) =>
        element.classList.contains("player-container")
      ).classList.add("swap");
      p2.find((element) =>
        element.classList.contains("player-container")
      ).classList.add("swap");
      setTimeout(assignPlayerElements, 250);

      // Remove the 'swap' class after the animation ends to reset for the next round
      setTimeout(() => {
        p1.find((element) =>
          element.classList.contains("player-container")
        ).classList.remove("swap");
        p2.find((element) =>
          element.classList.contains("player-container")
        ).classList.remove("swap");
      }, 1000); // Match duration to the animation length in CSS
    }
  }

  function gameModerator(num = undefined) {
    let currentPlayer;
    let currentMove = num;
    let opponentName;
    const currentTurn = movesDone % 2;
    let computerNextTurn = false;
    // Determine whose turn it is based on the move history.
    if (currentTurn === 0) {
      currentPlayer = playerOne;
      opponentName = playerTwo.name;
    } else if (currentTurn !== 0) {
      currentPlayer = playerTwo;
      opponentName = playerOne.name;
    }
    avatarBorderFeedback(currentPlayer.playerId);

    // If the current player is a computer, generate its moves
    if (currentPlayer.isPlayerAComputer) {
      currentMove = computerNextMove();
      currentPlayer.movesLogic.push({
        move: currentMove,
      });
    } else {
      computerNextTurn = true;
    }

    recordEventLog(`${currentPlayer.name}'s move: ${currentMove}`);
    processPlayerMoves(currentMove, currentPlayer);

    if (invalidMoveDetected) {
      recordEventLog("Invalid move detected!");
      console.log("Player 1", playerOne);
      console.log("Player 2", playerTwo);
      alert("Invalid Move Detected. Please click slowly, start a new game");
      return;
    }
    recordEventLog(`Remaining moves: ${availableMoves}`);
    displayBoard();

    if (currentPlayer.winGame) {
      gameScore[currentPlayer.name]++;
      updateScoreVisuals();
      gameOver(currentPlayer.name);
      return;
    }
    movesDone++;

    if (movesDone < 9) {
      avatarBorderFeedback("switch");

      if (computerNextTurn) {
        handleGridButtons();
        setTimeout(() => {
          gameModerator();
        }, Math.floor(Math.random() * (1000 - 500) + 500));
      } else {
        handleGridButtons(availableMoves);
      }
    } else if (movesDone === 9) {
      avatarBorderFeedback();
      return gameOver();
    }
  }

  function modifyBoard(ans, sym) {
    if (ans === 1) {
      boardGame[0][0] = sym;
    } else if (ans === 2) {
      boardGame[0][1] = sym;
    } else if (ans === 3) {
      boardGame[0][2] = sym;
    } else if (ans === 4) {
      boardGame[1][0] = sym;
    } else if (ans === 5) {
      boardGame[1][1] = sym;
    } else if (ans === 6) {
      boardGame[1][2] = sym;
    } else if (ans === 7) {
      boardGame[2][0] = sym;
    } else if (ans === 8) {
      boardGame[2][1] = sym;
    } else if (ans === 9) {
      boardGame[2][2] = sym;
    }

    const boxToAppend = ans - 1;
    const turnSymbol = sym === "X" ? createXSymbol() : createYSymbol();

    groupOfBoxes[boxToAppend].appendChild(turnSymbol);
    groupOfBoxes[boxToAppend].disabled = true;
  }

  function recordEventLog(msg, player) {
    if (player) {
      player.movesLogic.push(msg);
    }

    // Create an error object to capture the stack trace
    const error = new Error();
    const stack = error.stack ? error.stack.split("\n") : [];

    // Ensure the stack trace has the necessary depth
    let lineNumber = "Unknown";
    if (stack.length > 2 && stack[2].trim()) {
      const lineInfo = stack[2].trim();
      const match = lineInfo.match(/:(\d+):\d+/);
      if (match) {
        lineNumber = match[1]; // Extract line number if available
      }
    }

    // Format the log message with the line number or fallback value
    const formattedMessage = `[${lineNumber}] - ${msg}`;
    roundBreakdown.push(formattedMessage);
    console.log(roundBreakdown[roundBreakdown.length - 1]);
  }

  function computerNextMove() {
    // For debugging purposes. Uses pre-recorded moves.
    if (computerPreRecordedMoves.length !== 0) {
      return computerPreRecordedMoves.shift();
    }

    const randomFactor = Math.floor(Math.random() * 101);
    const humanPlayer = playerOne.isPlayerAComputer ? playerTwo : playerOne;
    const computerPlayer = playerOne.isPlayerAComputer ? playerOne : playerTwo;
    const isCenterMoveStillAvailable = availableMoves.includes(5);
    difficulty = difficulty + 5;
    recordEventLog(
      `Increased ${computerPlayer.name}'s difficulty to ${difficulty}`
    );

    let isForkStrategyViable = false;

    if (
      computerPlayer === playerOne &&
      ((movesDone < 5 && movesDone !== 2 && isCenterMoveStillAvailable) ||
        (movesDone === 2 &&
          computerPlayer.playerMoves.some((move) => {
            return [1, 3, 7, 9].includes(move);
          })))
    ) {
      isForkStrategyViable = true;
    }

    computerPlayer.winningMoves = computerPlayer.winningMoves.filter(
      (move) => !gameMoves.includes(move)
    );

    // The computer's next move is based on the result of the randomly generated number.
    // If the random number is lower than the difficulty, computer makes a smart move.

    if (randomFactor < difficulty) {
      return generateBestMove();
    } else if (movesDone === 0 && difficulty > 60) {
      const bestOpener = [1, 3, 5, 7, 9];
      recordEventLog(
        `${computerPlayer.name} randomly picked a corner or center move`,
        computerPlayer
      );
      return bestOpener[Math.floor(Math.random() * bestOpener.length)];
    } else if (availableMoves.length !== 0) {
      recordEventLog(
        `${computerPlayer.name} randomly picked a valid move`,
        computerPlayer
      );
      return pickRandomMove();
    } else {
      return gameOver();
    }

    function generateBestMove() {
      if (computerPlayer.winningMoves.length !== 0) {
        recordEventLog(
          `${computerPlayer.name} smart picked a game-winning move`,
          computerPlayer
        );
        return computerPlayer.winningMoves.shift();
      } else if (humanPlayer.winningMoves.length !== 0) {
        recordEventLog(
          `${computerPlayer.name} smart picked a move to block opponent`,
          computerPlayer
        );
        return humanPlayer.winningMoves.shift();
      } else if (randomFactor <= difficulty && isForkStrategyViable) {
        recordEventLog(
          `${computerPlayer.name} smart picked a move for the fork strategy`,
          computerPlayer
        );
        return forkedComboStrategy();
      } else if (
        randomFactor <= difficulty * 0.8 &&
        isCenterMoveStillAvailable
      ) {
        recordEventLog(
          `${computerPlayer.name} smart picked the center move`,
          computerPlayer
        );
        return 5;
      } else if (
        computerPlayer.remainingCombos.length !== 0 &&
        computerPlayer.playerMoves.length !== 0
      ) {
        recordEventLog(
          `${computerPlayer.name}'s remaining combos:${computerPlayer.remainingCombos}`,
          computerPlayer
        );
        recordEventLog(
          `${computerPlayer.name} smart picked a continuation move for combo`,
          computerPlayer
        );
        return buildCombosMove();
      } else if (movesDone <= 1) {
        const bestOpener = [1, 3, 5, 7, 9].filter((move) =>
          availableMoves.includes(move)
        );
        recordEventLog(
          `${computerPlayer.name} smart picked a good move, center or corners`,
          computerPlayer
        );
        return bestOpener[Math.floor(Math.random() * bestOpener.length)];
      } else if (availableMoves.length !== 0) {
        recordEventLog(
          `${computerPlayer.name} smart picked a random`,
          computerPlayer
        );
        return pickRandomMove();
      }
    }

    function pickRandomMove() {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    function buildCombosMove() {
      // let flattenedCombos = computerPlayer.remainingCombos
      //   .flat()
      //   .filter((move) => !computerPlayer.playerMoves.includes(move));

      let flattenedCombos = computerPlayer.remainingCombos
        .filter((combo) =>
          combo.some((move) => computerPlayer.playerMoves.includes(move))
        )
        .flat()
        .filter((move) => !computerPlayer.playerMoves.includes(move));

      let valueCounter = {};
      let maxCount = 0;
      let mostFrequentElement = null;

      flattenedCombos.forEach((move) => {
        if (valueCounter[move]) {
          valueCounter[move] += 1;
        } else {
          valueCounter[move] = 1;
        }
      });

      for (let move in valueCounter) {
        if (valueCounter[move] > maxCount) {
          maxCount = valueCounter[move]; // Update max count
          mostFrequentElement = +move; // Update the most frequent element
        }
      }

      if (maxCount >= 2) {
        return mostFrequentElement;
      } else {
        return flattenedCombos[
          Math.floor(Math.random() * flattenedCombos.length)
        ];
      }
    }

    function forkedComboStrategy() {
      // Only possible if the computer is first player move

      if (movesDone === 0) {
        return availableCornerMoves[
          Math.floor(Math.random() * availableCornerMoves.length)
        ];
      } else if (movesDone === 2) {
        /* The next move should be a corner that combines with the first corner move 
       without creating a winning combo with the opponent's first move. */
        if (isCenterMoveStillAvailable) {
          const filteredCombosWithCornerMoves = combosWithCornerMoves.filter(
            (combo) => {
              if (combo.includes(humanPlayer.lastMove())) {
                return false;
              } else if (combo.includes(computerPlayer.lastMove())) {
                return true;
              }
            }
          );

          if (filteredCombosWithCornerMoves.length === 2) {
            return combosWithCornerMoves
              .find((combo) => combo.includes(humanPlayer.lastMove()))
              .find((move) =>
                filteredCombosWithCornerMoves.flat().includes(move)
              );
          } else {
            return filteredCombosWithCornerMoves
              .flat()
              .find((move) => availableCornerMoves.includes(move));
          }
        } else {
          recordEventLog(
            `${computerPlayer.name} did an alternate unique fork`,
            computerPlayer
          );

          console.log("diagonalComboCheatSheet", diagonalComboCheatSheet);
          return diagonalComboCheatSheet
            .find((combo) => {
              console.log("currently iterating over combo:, combo");
              const filteredCombo = combo.filter(
                (move) => !availableMoves.includes(move)
              );

              if (filteredCombo.length === 2) {
                return combo;
              }
            })
            .find((move) => availableMoves.includes(move));
        }
      } else if (movesDone === 4) {
        const filteredCombos = combosWithCornerMoves.filter((combo) =>
          combo.every((move) => !humanPlayer.playerMoves.includes(move))
        );

        if (filteredCombos.length === 2) {
          return filteredCombos[0].find((move) =>
            filteredCombos[1].includes(move)
          );
        } else {
          return availableCornerMoves.pop();
        }
      }
    }
  }

  function displayBoard() {
    // console.log(
    //   `[ ${boardGame[0][0]} ] [ ${boardGame[0][1]} ] [ ${boardGame[0][2]} ]`
    // );
    // console.log(
    //   `[ ${boardGame[1][0]} ] [ ${boardGame[1][1]} ] [ ${boardGame[1][2]} ]`
    // );
    // console.log(
    //   `[ ${boardGame[2][0]} ] [ ${boardGame[2][1]} ] [ ${boardGame[2][2]} ]`
    // );
  }

  function processPlayerMoves(move, player) {
    updateAvailableMoves(move);

    if (invalidMoveDetected) {
      return;
    } else {
      modifyBoard(move, player.turnSymbol);
      updateOpponentData(move, player.playerId);
      player.playerMoves.push(move);

      const analyzeMovesResult = analyzeMoves(
        player.playerMoves,
        player.remainingCombos,
        playerOne,
        playerTwo
      );

      if (analyzeMovesResult.includes("WIN")) {
        player.winGame = true;
        recordEventLog(`Winning combos highlighted: ${analyzeMovesResult[1]}`);
        handleGridButtons([], analyzeMovesResult[1]);
      } else if (analyzeMovesResult.length !== 0) {
        player.winningMoves.push(...analyzeMovesResult);
      }
    }

    function updateAvailableMoves(move) {
      if (availableMoves.includes(move)) {
        availableMoves.splice(availableMoves.indexOf(move), 1);
      } else {
        invalidMoveDetected = true;
      }
      gameMoves.push(move);

      if (availableCornerMoves.includes(move)) {
        availableCornerMoves.splice(availableCornerMoves.indexOf(move), 1);
      }
    }
  }

  function updateOpponentData(move, playerId) {
    let comboListToModify =
      playerId === 1 ? playerTwo.remainingCombos : playerOne.remainingCombos;

    for (let i = comboListToModify.length - 1; i >= 0; i--) {
      if (comboListToModify[i].includes(move)) {
        comboListToModify.splice(i, 1);
      }
    }

    let opponentWinningMoves =
      playerId === 1 ? playerTwo.winningMoves : playerOne.winningMoves;

    if (opponentWinningMoves.includes(move)) {
      opponentWinningMoves.splice(opponentWinningMoves.indexOf(move), 1);
    }
  }

  function gameOver(name = undefined) {
    handleGridButtons();

    console.clear();

    if (name) {
      recordEventLog(`${name} won!!. Game Over!!`);
      textAnnouncerFeedback("WIN", name);
    } else {
      textAnnouncerFeedback("DRAW");
      recordEventLog(`No moves left. Game Over!!`);
    }

    console.log("----------- Match Details ------------");

    const playerOneDetails =
      "Round " +
      roundsDone +
      " - " +
      playerOne.name +
      " (" +
      playerOne.turnSymbol +
      ")";
    const playerTwoDetails =
      "Round " +
      roundsDone +
      " - " +
      playerTwo.name +
      " (" +
      playerTwo.turnSymbol +
      ")";

    console.log(gameScore);

    gameLog.push(
      playerOneDetails,
      Object.assign({}, playerOne),
      playerTwoDetails,
      Object.assign({}, playerTwo),
      `Round ${roundsDone} Breakdown`,
      [...roundBreakdown]
    );

    console.log(gameLog);

    console.log("----------- End ------------");

    textAnnouncerFeedback("ROUND", roundsDone);
    setTimeout(newGame, 4000);
    return;
  }

  function newGame() {
    groupOfBoxes.forEach((box) => {
      box.replaceChildren();
    });

    handleGridButtons();
    roundsDone++;

    console.log("roundsDone", roundsDone);

    ({ boardGame, availableMoves, availableCornerMoves } = boardDesign());
    ({ analyzeMoves } = moveChecker());

    textAnnouncerFeedback("NEW", roundsDone);

    gameMoves.length = 0;
    movesDone = 0;
    roundBreakdown.length = 0;
    invalidMoveDetected = false;
    difficulty = +diff;
    recordEventLog(`initialized difficulty: ${difficulty}`);
    addPlayerProperties();
    displayBoard();
    updateScoreVisuals();

    if (playerOne.isPlayerAComputer) {
      setTimeout(() => {
        gameModerator();
      }, 1500);
    }
  }

  function updateScoreVisuals() {
    // const objPlaceholder = Object.values(gameScore);
    // const players = objPlaceholder.length === 0 ? [0, 0] : objPlaceholder;

    p1.find((element) => element.classList.contains("score")).textContent =
      "Score: " + gameScore[playerOne.name];

    p2.find((element) => element.classList.contains("score")).textContent =
      "Score: " + gameScore[playerTwo.name];
  }

  return {
    gameModerator,
    gameLog,
  };
}

function boardDesign() {
  const boardGame = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  const availableMoves = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const availableCornerMoves = [1, 3, 7, 9];
  return { boardGame, availableMoves, availableCornerMoves };
}

function moveChecker() {
  function analyzeMoves(playerMoves, combos, p1, p2) {
    const result = [];

    // console.clear();

    for (let i = 0; i < combos.length; i++) {
      const comboCounter = combos[i].filter((move) => {
        return playerMoves.includes(move);
      });

      if (comboCounter.length === 3) {
        result.length = 0;
        result.push("WIN", combos[i]);
        return result;
        break;

        // TODO this is problematic as it could be an early termination to the loop
        // Additional info: The next item in the loop could potentially have a win, but since it already fired the condition below, it's not gonna reach to that point
      } else if (comboCounter.length === 2) {
        result.push(combos[i].find((move) => !playerMoves.includes(move)));
      }
    }

    return result;
  }

  function checkWinners(moveSet, comboList) {
    const verdict = comboList.some((combo) =>
      combo.every((move) => moveSet.includes(move))
    );

    return verdict;
  }

  return {
    analyzeMoves,
  };
}

function comboCheatSheet() {
  return {
    fullComboCheatSheet: [
      [1, 2, 3], // Row 1
      [4, 5, 6], // Row 2
      [7, 8, 9], // Row 3
      [7, 4, 1], // Column 1
      [2, 5, 8], // Column 2
      [3, 6, 9], // Column 3
      [1, 5, 9], // Diagonal 1
      [3, 5, 7], // Diagonal 2
    ],
    rowAndColumnComboCheatSheet: [
      [1, 2, 3], // Row 1
      [7, 8, 9], // Row 3
      [1, 4, 7], // Column 1
      [3, 6, 9],
    ],

    diagonalComboCheatSheet: [
      [1, 5, 9],
      [3, 5, 7],
    ],
  };
}

function handleClick(event) {
  const element = this;
  const dataAttribute = parseInt(element.getAttribute("data-box"));
  element.disabled = true;

  // game1.gameModerator(dataAttribute);
  gameManager.passMove(dataAttribute);
}

function textAnnouncerFeedback(mode, value) {
  switch (mode) {
    case "TURN":
      roundCounter.textContent = `${value}'s turn!`;
      break;

    case "NEW":
      textAnnouncer.textContent = `Tic Tac Toe`;
      roundCounter.textContent = `Round ${value}`;
      break;

    case "WIN":
      textAnnouncer.classList.add("flash");
      setTimeout(() => {
        textAnnouncer.classList.remove("flash");
      }, 600);
      textAnnouncer.textContent = `${value} won this round!`;
      break;

    case "DRAW":
      textAnnouncer.textContent = `Draw! No move's left!`;
      roundCounter.textContent = "";
      break;

    case "DEL":
      roundCounter.textContent = "";
      break;
    case "ROUND":
      textContainer.classList.add("load");
      startCountdown(value);
      break;
    case undefined:
      break;
  }

  function startCountdown(round, count = 4) {
    if (count > 0) {
      roundCounter.textContent = `Starting Next Round in ${count}...`;
      setTimeout(() => startCountdown(round, count - 1), 1000);
    } else {
      textContainer.classList.remove("load");
    }
  }
}
function avatarBorderFeedback(playerId) {
  if (playerId === 1) {
    p1.find((element) => element.classList.contains("avatar")).classList.add(
      "highlight"
    );
    p2.find((element) => element.classList.contains("avatar")).classList.remove(
      "highlight"
    );
  } else if (playerId === 2) {
    p2.find((element) => element.classList.contains("avatar")).classList.add(
      "highlight"
    );
    p1.find((element) => element.classList.contains("avatar")).classList.remove(
      "highlight"
    );
  } else if (playerId === "switch") {
    p2.find((element) => element.classList.contains("avatar")).classList.toggle(
      "highlight"
    );
    p1.find((element) => element.classList.contains("avatar")).classList.toggle(
      "highlight"
    );
  } else {
    p1.find((element) => element.classList.contains("avatar")).classList.remove(
      "highlight"
    );
    p2.find((element) => element.classList.contains("avatar")).classList.remove(
      "highlight"
    );
  }
}

function createXSymbol() {
  // Create the SVG element using the SVG namespace
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // Set attributes for the SVG
  svg.setAttribute("width", "84");
  svg.setAttribute("height", "84");
  svg.setAttribute("viewBox", "0 0 84 84");
  svg.classList.add("injected-svg"); // Add a class to the SVG for styling

  // Create the first path element for the SVG
  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute(
    "d",
    "M66.9897 81.0036C70.6971 84.7109 76.7079 84.7109 80.4153 81.0036C84.1227 77.2962 84.1227 71.2853 80.4153 67.578L16.3018 3.4645C12.5945 -0.242882 6.58362 -0.242888 2.87624 3.46449C-0.831141 7.17187 -0.831142 13.1827 2.87624 16.8901L66.9897 81.0036Z"
  );
  path1.setAttribute("fill", "#DBDBDB"); // Set fill color

  // Create the second path element for the SVG
  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute(
    "d",
    "M16.302 81.0036C12.5947 84.7109 6.5838 84.7109 2.87643 81.0036C-0.830953 77.2962 -0.830954 71.2853 2.87643 67.578L66.9899 3.4645C70.6973 -0.242882 76.7081 -0.242888 80.4155 3.46449C84.1229 7.17187 84.1229 13.1827 80.4155 16.8901L16.302 81.0036Z"
  );
  path2.setAttribute("fill", "#DBDBDB"); // Set fill color

  // Append both path elements to the SVG
  svg.appendChild(path1);
  svg.appendChild(path2);

  return svg; // Return the complete SVG element
}

function createYSymbol() {
  // Create the SVG element using the SVG namespace
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  // Set attributes for the SVG
  svg.setAttribute("width", "93");
  svg.setAttribute("height", "93");
  svg.setAttribute("viewBox", "0 0 93 93");
  svg.classList.add("injected-svg"); // Add a class to the SVG for styling

  // Create the circle element for the SVG
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", "46.1416"); // X center of the circle
  circle.setAttribute("cy", "46.7533"); // Y center of the circle
  circle.setAttribute("r", "37.8936"); // Radius of the circle
  circle.setAttribute("stroke", "#FF7629"); // Stroke color
  circle.setAttribute("stroke-width", "16"); // Stroke width
  circle.setAttribute("fill", "none"); // Set fill to none

  // Append the circle element to the SVG
  svg.appendChild(circle);

  return svg; // Return the complete SVG element
}

function recordPlayerSettings() {
  const name1 = playerName.value ? playerName.value : "You";
  let name2;
  let mode;
  let difficulty = 0;
  let playerTurn;

  gameModeButtons.forEach((button) => {
    if (button.classList.contains("selected")) {
      mode = button.getAttribute("data-value");
    } else {
      return false;
    }
  });

  gameSymbolButtons.forEach((button) => {
    if (button.classList.contains("selected")) {
      playerTurn = +button.getAttribute("data-value");
    }
  });

  botContainerButtons.forEach((button) => {
    if (button.classList.contains("selected")) {
      difficulty = +button.getAttribute("data-value");
      name2 = button.getAttribute("data-name");
    }
  });

  return [name1, name2, difficulty, mode, playerTurn];
}

groupOfBoxes.forEach((box) => {
  box.addEventListener("click", handleClick); // Trigger handleClick on click
});

gameButtons.forEach((button) => {
  button.addEventListener("click", function () {
    if (button.classList.contains("close-modal")) {
      gameButtons.forEach((button) => button.classList.remove("selected"));
    } else {
      // startButtonHandler();
    }

    if (button.classList.contains("pvp") || button.classList.contains("pvc")) {
      toggleButtonFeedback(button, gameModeButtons);
    } else if (
      button.classList.contains("symbol-X") ||
      button.classList.contains("symbol-O")
    ) {
      toggleButtonFeedback(button, gameSymbolButtons);
    } else if (button.classList.contains("bot-container")) {
      toggleButtonFeedback(button, botContainerButtons);
    }

    // button.classList.add("selected");
  });
});

function toggleButtonFeedback(element, group) {
  group.forEach((ele) => {
    if (ele !== element) ele.classList.remove("selected");
  });

  element.classList.toggle("selected");
  startButtonHandler();

  function startButtonHandler() {
    if (
      gameModeButtons.find((button) => button.classList.contains("selected")) &&
      gameSymbolButtons.find((button) =>
        button.classList.contains("selected")
      ) &&
      botContainerButtons.find((button) =>
        button.classList.contains("selected")
      )
    ) {
      startButton.disabled = false;
    } else {
      startButton.disabled = true;
    }
  }
}

function handleGridButtons(moveSet = [], winningCombos) {
  groupOfBoxes.forEach((box) => {
    box.disabled = true;
    box.classList.remove("win");
  });

  if (moveSet.length) {
    moveSet.forEach((move) => {
      groupOfBoxes[move - 1].disabled = false;
    });
  } else if (winningCombos) {
    groupOfBoxes.forEach((box, index) => {
      setTimeout(() => {
        if (winningCombos.includes(+box.getAttribute("data-box"))) {
          box.classList.add("win");
        }
      }, 100 * index);
    });
  }
}

// Show the modal when a button is clicked
openButton.addEventListener("click", function () {
  gameContainer.classList.add("invisible");

  playerContainers.forEach((element) => {
    element.classList.remove("visible");
    element.classList.add("hidden");
  });

  modal.classList.remove("invisible");
  startButton.disabled = true;
  modal.showModal();
});

startButton.addEventListener("click", function () {
  const gameParameters = recordPlayerSettings();
  gameContainer.classList.remove("invisible");
  modal.classList.add("invisible");
  modal.close();
  gameButtons.forEach((button) => button.classList.remove("selected"));
  gameManager.createGame(...gameParameters);
});

// Close the modal when the close button is clicked
closeButton.addEventListener("click", function () {
  if (gameManager.gameCount) {
    playerContainers.forEach((element) => {
      element.classList.remove("hidden");
      element.classList.add("visible");
    });
  }
  gameContainer.classList.remove("invisible");
  modal.classList.add("invisible");
  modal.close();
  gameButtons.forEach((button) => button.classList.remove("selected"));
});

gameContainer.classList.add("invisible");
