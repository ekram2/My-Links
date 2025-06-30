// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAN2qRU0gKNNRbsQ1LX688WRHiWP-vQ2hk",
  authDomain: "link-manager-71f12.firebaseapp.com",
  projectId: "link-manager-71f12",
  storageBucket: "link-manager-71f12.firebasestorage.app",
  messagingSenderId: "950228225273",
  appId: "1:950228225273:web:33fc9a192460810d032628"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();

let currentUser = null;
let userRef = null;

const linksContainer = document.getElementById("linksContainer");

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("signInBtn").classList.add("hidden");
    document.getElementById("signOutBtn").classList.remove("hidden");
    userRef = collection(db, "users", user.uid, "items");
    listenToItems();
  } else {
    currentUser = null;
    document.getElementById("userEmail").textContent = "";
    document.getElementById("signInBtn").classList.remove("hidden");
    document.getElementById("signOutBtn").classList.add("hidden");
    linksContainer.innerHTML = "";

    const last = localStorage.getItem("lastItem");
    if (last) {
      try {
        renderItems([JSON.parse(last)]);
      } catch (err) {
        console.log("❌ Error loading local item:", err);
      }
    }
  }
});

document.getElementById("signInBtn").onclick = () => signInWithPopup(auth, provider);
document.getElementById("signOutBtn").onclick = () => signOut(auth);

document.getElementById("addItemForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("itemTitle").value.trim();
  const url = document.getElementById("itemUrl").value.trim();
  const type = document.getElementById("itemType").value;
  if (!title) return;

  const id = Date.now().toString();
  const color = type === "heading" ? getRandomColor() : "";

  const data = {
    id,
    title,
    url: url ? (url.startsWith("http") ? url : "https://" + url) : "",
    type,
    order: id,
    createdAt: serverTimestamp(),
    color,
  };

  localStorage.setItem("lastItem", JSON.stringify(data));
  if (currentUser) await setDoc(doc(userRef, id), data);
  document.getElementById("addItemForm").reset();
});

function getRandomColor() {
  const colors = [
    "#6EE7B7", "#FCD34D", "#FCA5A5", "#93C5FD",
    "#E879F9", "#FDE68A", "#A5B4FC", "#F9A8D4",
    "#BFDBFE", "#86EFAC", "#FECDD3"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function listenToItems() {
  if (!userRef) return;
  onSnapshot(userRef,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push(doc.data()));
      items.sort((a, b) => parseInt(a.order) - parseInt(b.order));
      renderItems(items);
    },
    (error) => {
      console.error("❌ Firestore error:", error.message);
      alert("Firestore sync failed. Check rules or connection.");
    }
  );
}

function renderItems(items) {
  linksContainer.innerHTML = "";
  items.forEach((item) => {
    const el = document.createElement("div");
    el.className = "item-card flex justify-between items-center";
    el.setAttribute("draggable", "true");
    el.setAttribute("data-id", item.id);

    if (item.type === "heading") {
      el.style.backgroundColor = item.color || "#1f2937";
      el.innerHTML = `<strong>${item.title}</strong><span class="delete-btn" data-id="${item.id}">✕</span>`;
    } else {
      el.innerHTML = `<div><a href="${item.url}" target="_blank" class="link-url">${item.title}</a></div><span class="delete-btn" data-id="${item.id}">✕</span>`;
    }

    linksContainer.appendChild(el);
  });

  document.querySelectorAll(".delete-btn").forEach((btn) =>
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (currentUser) await deleteDoc(doc(userRef, id));
    })
  );

  enableDrag();
}

function enableDrag() {
  let dragged;
  document.querySelectorAll(".item-card").forEach((el) => {
    el.addEventListener("dragstart", () => (dragged = el));
    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      el.classList.add("drag-over");
    });
    el.addEventListener("dragleave", () => el.classList.remove("drag-over"));
    el.addEventListener("drop", async () => {
      el.classList.remove("drag-over");
      if (dragged === el) return;

      const siblings = [...linksContainer.children];
      const draggedIndex = siblings.indexOf(dragged);
      const droppedIndex = siblings.indexOf(el);

      if (draggedIndex < droppedIndex) {
        linksContainer.insertBefore(dragged, el.nextSibling);
      } else {
        linksContainer.insertBefore(dragged, el);
      }

      const reordered = [...linksContainer.children].map((el, index) => ({
        id: el.dataset.id,
        order: index,
      }));

      for (const { id, order } of reordered) {
        if (currentUser) {
          await setDoc(doc(userRef, id), { order }, { merge: true });
        }
      }
    });
  });
}

document.getElementById("exportJson").onclick = async () => {
  const snapshot = await getDocs(userRef);
  const items = snapshot.docs.map((doc) => doc.data());
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "links.json";
  a.click();
};

document.getElementById("exportTxt").onclick = async () => {
  const snapshot = await getDocs(userRef);
  const lines = snapshot.docs.map((doc) => {
    const d = doc.data();
    return d.type === "link" ? `${d.title}: ${d.url}` : `📂 ${d.title}`;
  });
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "links.txt";
  a.click();
};

document.getElementById("importJson").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      for (const item of data) {
        if (currentUser) {
          await setDoc(doc(userRef, item.id), item);
        }
      }
    } catch (err) {
      alert("Invalid JSON file");
    }
  };
  reader.readAsText(file);
});

document.getElementById("themeToggle").addEventListener("click", () => {
  const html = document.documentElement;
  const current = html.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("theme");
  if (saved) {
    document.documentElement.setAttribute("data-theme", saved);
  }
});
