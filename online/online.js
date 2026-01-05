import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase setup
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

// Elements
const createBtn = document.getElementById("createGame");
const joinBtn = document.getElementById("joinGame");
const startBtn = document.getElementById("startGameBtn");
const modeSelect = document.getElementById("mode");
const codeInput = document.getElementById("gameCode");
const gameCodeDisplay = document.getElementById("gameCodeDisplay");

let roomCode;
let playerId = "p" + Math.floor(Math.random() * 10000);

// Create Room
createBtn.onclick = async (e) => {
  e.preventDefault();
  const mode = Number(modeSelect.value);

  while (true) {
    roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const snap = await getDoc(doc(db, "rooms", roomCode));
    if (!snap.exists()) break;
  }

  const symbols = { [playerId]: "O" };

  await setDoc(doc(db, "rooms", roomCode), {
    mode,
    players: [playerId],
    board: Array(mode === 4 ? 25 : 9).fill(""),
    turn: "O",
    status: "waiting",
    symbols,
  });

  gameCodeDisplay.innerText = `Room Code: ${roomCode}`;
  startBtn.style.display = "inline-block";
  startBtn.innerText = `Waiting for ${mode - 1} player(s)`;

  onSnapshot(doc(db, "rooms", roomCode), (snap) => {
    const data = snap.data();
    if (!data) return;
    if (data.players.length === mode) startBtn.innerText = "Start Game";
    else startBtn.innerText = `Waiting for ${mode - data.players.length} player(s)`;
  });
};

// Join Room
joinBtn.onclick = async (e) => {
  e.preventDefault();
  roomCode = codeInput.value.toUpperCase();
  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return alert("Room not found!");

  const data = snap.data();
  if (!data.players.includes(playerId)) {
    const newPlayers = [...data.players, playerId];
    const newSymbols = { ...data.symbols };
    const nextSymbol = ["O", "X", "△", "□"][data.players.length];
    newSymbols[playerId] = nextSymbol;

    await updateDoc(roomRef, {
      players: newPlayers,
      symbols: newSymbols,
    });
  }

  gameCodeDisplay.innerText = `Joined Room: ${roomCode}`;
  startBtn.style.display = "inline-block";
  startBtn.innerText = `Waiting for ${data.mode - data.players.length} player(s)`;
};

// Start Game
startBtn.onclick = async () => {
  if (!roomCode) return alert("Create or join a room first");

  const roomRef = doc(db, "rooms", roomCode);
  const snap = await getDoc(roomRef);
  const data = snap.data();

  if (data.status === "waiting") await updateDoc(roomRef, { status: "playing" });
  window.location.href = `board.html?room=${roomCode}&player=${playerId}`;
};
