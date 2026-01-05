// ONLINE.JS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI Elements
const createBtn = document.getElementById("createRoomBtn");
const joinBtn = document.getElementById("joinRoomBtn");
const modeSelect = document.getElementById("mode");
const roomDisplay = document.getElementById("roomCodeDisplay");
const joinInput = document.getElementById("joinCode");

// --- Generate Random Room Code ---
function generateRoomCode() {
  return Math.random().toString(36).substring(2,7).toUpperCase();
}

// --- CREATE ROOM ---
createBtn.addEventListener("click", async () => {
  const mode = modeSelect.value;
  let code = generateRoomCode();

  // Ensure uniqueness
  while ((await getDoc(doc(db, "rooms", code))).exists()) {
    code = generateRoomCode();
  }

  // Create document
  await setDoc(doc(db, "rooms", code), {
    mode: mode,
    board: Array(mode === "4p" ? 25 : 9).fill(""),
    players: [],
    turn: "O",
    status: "waiting",
    createdAt: serverTimestamp()
  });

  roomDisplay.innerText = "Share this code: " + code;
});

// --- JOIN ROOM ---
joinBtn.addEventListener("click", async () => {
  const code = joinInput.value.toUpperCase();
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    alert("Room not found");
    return;
  }

  // Add player (for now just dummy)
  await updateDoc(roomRef, {
    players: arrayUnion("player2"),
    status: "playing"
  });

  // Redirect to game board (create board.html later)
  window.location.href = `board.html?room=${code}`;
});
