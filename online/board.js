// ---------------- IMPORTS ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, doc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ---------------- FIREBASE ----------------
const firebaseConfig = {
  apiKey: "AIzaSyBKXQ0j5aVHf7sQ-ClXG8Z0kqiMGzr1fBU",
  authDomain: "line-ecf41.firebaseapp.com",
  projectId: "line-ecf41",
  storageBucket: "line-ecf41.firebasestorage.app",
  messagingSenderId: "375420889418",
  appId: "1:375420889418:web:d1d503ae94b616e60af9b3",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------------- DOM READY ----------------
document.addEventListener("DOMContentLoaded", () => {

  // ---------------- URL PARAMS ----------------
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room");
  const playerId = params.get("player");

  // ---------------- UI ELEMENTS ----------------
  const boardDiv = document.getElementById("board");
  const statusText = document.getElementById("status");
  const resetBtn = document.getElementById("resetBtn");
  const exitBtn = document.getElementById("exitBtn");

  const clickSound = document.getElementById("clickSound");
  const victorySound = document.getElementById("victorySound");
  const gameOverSound = document.getElementById("gameOverSound");

  // ---------------- GAME VARIABLES ----------------
  const SYMBOLS = ["O","X","△","□"];
  let board = [];
  let mySymbol = "";
  let mode = 2;
  const roomRef = doc(db, "rooms", roomCode);

  // ---------------- LISTEN TO ROOM ----------------
  onSnapshot(roomRef, (snap) => {
    const data = snap.data();
    if (!data) return;

    board = data.board;
    mode = data.mode;
    mySymbol = data.symbols[playerId];

    renderBoard(data);
  });

  // ---------------- RENDER BOARD ----------------
  function renderBoard(data) {
    boardDiv.innerHTML = "";
    const size = data.mode === 4 ? 5 : 3;
    boardDiv.style.gridTemplateColumns = `repeat(${size}, 80px)`;
    boardDiv.style.gridTemplateRows = `repeat(${size}, 80px)`;

    board.forEach((val, i) => {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.innerText = val;

      if (data.status !== "finished" && val === "" && data.turn === mySymbol) {
        cell.style.cursor = "pointer";
        cell.onclick = () => makeMove(i, data);
      } else {
        cell.style.cursor = "not-allowed";
        cell.onclick = null;
      }

      if (data.winningCells && data.winningCells.includes(i)) {
        cell.classList.add("winning-cell");
      }

      boardDiv.appendChild(cell);
    });

    if (data.status === "finished") {
      if (data.winner === "draw") {
        statusText.innerText = "It's a Draw!";
        gameOverSound.currentTime = 0; gameOverSound.play();
      } else if (data.winner === mySymbol) {
        statusText.innerText = "You Won!";
        victorySound.currentTime = 0; victorySound.play();
      } else {
        statusText.innerText = `Winner: ${data.winner} (You Lost)`;
        gameOverSound.currentTime = 0; gameOverSound.play();
      }
    } else {
      statusText.innerText = data.turn === mySymbol ? "Your Turn" : "Opponent's Turn";
    }
  }

  // ---------------- MAKE MOVE ----------------
  async function makeMove(i, data) {
    if (board[i] !== "" || data.turn !== mySymbol || data.status === "finished") return;

    clickSound.currentTime = 0; clickSound.play();
    board[i] = mySymbol;

    const winnerData = checkWinner(board, mode);

    let nextTurn = "";
    let status = "playing";
    let winner = winnerData ? winnerData.winner : "";

    if (winner) {
      status = "finished";
      nextTurn = data.turn;
    } else if (board.every(c => c !== "")) {
      status = "finished";
      winner = "draw";
    } else {
      const currentTurnIndex = data.players.indexOf(
        Object.keys(data.symbols).find(k => data.symbols[k] === data.turn)
      );
      const nextIndex = (currentTurnIndex + 1) % data.players.length;
      nextTurn = data.symbols[data.players[nextIndex]];
    }

    await updateDoc(roomRef, {
      board,
      turn: nextTurn,
      status,
      winner,
      winningCells: winnerData ? winnerData.cells : []
    });
  }

  // ---------------- CHECK WINNER ----------------
  function checkWinner(b, mode) {
    const size = mode === 4 ? 5 : 3;
    const lines = [];

    for (let r = 0; r < size; r++) lines.push([...Array(size)].map((_, c) => r * size + c));
    for (let c = 0; c < size; c++) lines.push([...Array(size)].map((_, r) => r * size + c));
    lines.push([...Array(size)].map((_, i) => i * size + i));
    lines.push([...Array(size)].map((_, i) => i * size + (size - 1 - i)));

    for (const line of lines) {
      const vals = line.map(i => b[i]);
      if (vals.every(v => v !== "" && v === vals[0])) return { winner: vals[0], cells: line };
    }
    return null;
  }

  // ---------------- RESET ----------------
  resetBtn.onclick = async () => {
    const snap = await getDoc(roomRef);
    const data = snap.data();
    const emptyBoard = Array(data.mode === 4 ? 25 : 9).fill("");
    await updateDoc(roomRef, {
      board: emptyBoard,
      turn: "O",
      status: "playing",
      winner: "",
      winningCells: []
    });
  };

  // ---------------- EXIT ----------------
  exitBtn.onclick = () => {
    window.location.href = "../online/online.html";
  };

});
