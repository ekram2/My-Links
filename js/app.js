// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAN2qRU0gKNNRbsQ1LX688WRHiWP-vQ2hk",
  authDomain: "link-manager-71f12.firebaseapp.com",
  projectId: "link-manager-71f12",
  storageBucket: "link-manager-71f12.appspot.com",
  messagingSenderId: "950228225273",
  appId: "1:950228225273:web:33fc9a192460810d032628"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let linkData = [];

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const container = document.getElementById('linkContainer');
const themeToggle = document.getElementById('toggleTheme');
const importInput = document.getElementById('importFile');

// 👤 Auth Handling
loginBtn.addEventListener("click", () => signInWithPopup(auth, provider));
logoutBtn.addEventListener("click", () => signOut(auth));

// Theme toggle
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle('light-theme');
  localStorage.setItem("theme", document.body.classList.contains('light-theme') ? "light" : "dark");
});

// On Auth Change
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    await loadUserData();
  } else {
    currentUser = null;
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    loadFromLocal();
  }
});

// Add Folder
window.addHeading = () => {
  const input = document.getElementById("headingInput");
  const name = input.value.trim();
  if (!name) return;
  const section = { id: Date.now(), title: name, links: [], collapsed: false };
  linkData.push(section);
  input.value = "";
  saveData();
  render();
};

// Add Link
window.addLink = () => {
  const title = document.getElementById("linkTitle").value.trim();
  let url = document.getElementById("linkUrl").value.trim();
  if (!url.startsWith("http")) url = "https://" + url;
  if (!title || !url) return;

  if (!linkData.length) return alert("Please add a folder first!");

  const latest = linkData[linkData.length - 1];
  latest.links.push({ title, url, clicks: 0 });
  document.getElementById("linkTitle").value = "";
  document.getElementById("linkUrl").value = "";
  saveData();
  render();
};

// Save
async function saveData() {
  if (currentUser) {
    await setDoc(doc(db, "users", currentUser.uid), { data: linkData });
  } else {
    localStorage.setItem("links", JSON.stringify(linkData));
  }
}

// Load
async function loadUserData() {
  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    linkData = snap.data().data;
    render();
  }
}

// Local Fallback
function loadFromLocal() {
  const raw = localStorage.getItem("links");
  if (raw) {
    linkData = JSON.parse(raw);
    render();
  }
}

// Render
function render() {
  container.innerHTML = "";
  linkData.forEach((section, secIndex) => {
    const box = document.createElement("div");
    box.className = "section";
    const heading = document.createElement("h3");
    heading.innerHTML = `${section.title} <button onclick="removeHeading(${secIndex})">❌</button>`;
    box.appendChild(heading);
    section.links.forEach((link, i) => {
      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = `${link.title} (${link.clicks} clicks)`;
      a.target = "_blank";
      a.addEventListener("click", () => {
        link.clicks++;
        saveData();
      });
      const delBtn = document.createElement("button");
      delBtn.textContent = "❌";
      delBtn.onclick = () => {
        section.links.splice(i, 1);
        saveData();
        render();
      };
      a.appendChild(delBtn);
      box.appendChild(a);
    });
    container.appendChild(box);
  });
}

// Remove Folder
window.removeHeading = (i) => {
  linkData.splice(i, 1);
  saveData();
  render();
};

// Export
window.exportData = (type) => {
  const data = type === "json"
    ? JSON.stringify(linkData, null, 2)
    : linkData.map(sec => `# ${sec.title}\n${sec.links.map(l => `- ${l.title}: ${l.url}`).join("\n")}`).join("\n\n");
  const blob = new Blob([data], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `links.${type}`;
  a.click();
};

// Import
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (Array.isArray(data)) {
        linkData = data;
        saveData();
        render();
      } else {
        alert("Invalid JSON format");
      }
    } catch (err) {
      alert("Failed to parse file");
    }
  };
  reader.readAsText(file);
});
