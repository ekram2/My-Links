// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore, doc, collection, setDoc, getDocs, deleteDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdJTZeYeb09zAQgmbZj4n5-CbeiL8NrHM",
  authDomain: "link-manager-2bf48.firebaseapp.com",
  projectId: "link-manager-2bf48",
  storageBucket: "link-manager-2bf48.firebasestorage.app",
  messagingSenderId: "836962375470",
  appId: "1:836962375470:web:16a563fd9318c6f65b8cbf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let userItemsRef = null;

// 🔐 Auth State Listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    userItemsRef = collection(db, "users", currentUser.uid, "items");
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("authSection").style.display = "block";
    loadItems();
  } else {
    currentUser = null;
    document.getElementById("userEmail").textContent = "";
    document.getElementById("authSection").style.display = "none";
  }
});

// 🔘 Sign In
document.getElementById("signInBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(console.error);
});

// 🔘 Sign Out
document.getElementById("signOutBtn").addEventListener("click", () => {
  signOut(auth).catch(console.error);
});

// 📤 Save item (link or heading)
async function saveItem(item) {
  if (!currentUser) return;
  const ref = doc(userItemsRef, item.id);
  await setDoc(ref, {
    ...item,
    updatedAt: serverTimestamp()
  });
}

// 🗑️ Delete item
async function deleteItem(id) {
  if (!currentUser) return;
  await deleteDoc(doc(userItemsRef, id));
}

// 📥 Load items
async function loadItems() {
  if (!currentUser) return;
  const snapshot = await getDocs(userItemsRef);
  const items = snapshot.docs.map(doc => doc.data());
  renderItems(items); // ← Replace this with your render function
}

// 🔄 Realtime updates
onSnapshot(userItemsRef, (snapshot) => {
  const items = [];
  snapshot.forEach(doc => items.push(doc.data()));
  renderItems(items); // ← Replace this with your render function
});

// 📌 Example UI Logic (you must implement drag/save/export features)
function renderItems(items) {
  const container = document.getElementById("linksContainer");
  container.innerHTML = "";
  if (items.length === 0) {
    container.innerHTML = "<p>No links yet.</p>";
    return;
  }
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.textContent = `${item.type === "heading" ? "📂" : "🔗"} ${item.title}`;
    container.appendChild(div);
  });
}
