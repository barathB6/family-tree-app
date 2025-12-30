import { initCamera, getSelectedPhoto, clearSelectedPhoto } from './camera-base64.js';

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsVD5CKcBo-NnIcK6JyMnv_2Ag450Qse8",
  authDomain: "family-tree-app-123.firebaseapp.com",
  projectId: "family-tree-app-123",
  storageBucket: "family-tree-app-123.firebasestorage.app",
  messagingSenderId: "448026364942",
  appId: "1:448026364942:web:6da1f603ee218a5dff005f",
  measurementId: "G-Q2RN0JM345"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DOM elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginSection = document.getElementById("loginSection");
const userSection = document.getElementById("userSection");
const appSection = document.getElementById("appSection");
const userPhoto = document.getElementById("userPhoto");
const userName = document.getElementById("userName");
const addMemberForm = document.getElementById("addMemberForm");
const treeCanvas = document.getElementById("treeCanvas");
const loadingMessage = document.getElementById("loadingMessage");
const emptyState = document.getElementById("emptyState");

let currentUser = null;
let members = [];

// Sign in with Google
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      console.error("Login error:", err);
      alert("Login failed: " + err.message);
    }
  }
});

// Sign out
logoutBtn.addEventListener("click", () => signOut(auth));

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  // Initialize camera
  initCamera();
  if (user) {
    currentUser = user;
    loginSection.classList.add("hidden");
    userSection.classList.remove("hidden");
    appSection.classList.remove("hidden");
    userPhoto.src = user.photoURL;
    userName.textContent = user.displayName;
    await loadFamilyTree();
  } else {
    currentUser = null;
    loginSection.classList.remove("hidden");
    userSection.classList.add("hidden");
    appSection.classList.add("hidden");
    clearCanvas();
  }
});

// Add family member
addMemberForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("memberName").value.trim();
  const relation = document.getElementById("memberRelation").value;
  const birthYear = document.getElementById("memberBirthYear").value;
  const notes = document.getElementById("memberNotes").value.trim();
  const photoBase64 = getSelectedPhoto();

  if (!name || !relation) {
    alert("Please fill in required fields");
    return;
  }

  try {
    const canvasWidth = treeCanvas.offsetWidth - 150;
    const canvasHeight = treeCanvas.offsetHeight - 150;
    
    const existingCount = members.length;
    const cols = Math.ceil(Math.sqrt(existingCount + 1));
    const row = Math.floor(existingCount / cols);
    const col = existingCount % cols;
    
    const x = 100 + (col * (canvasWidth / cols));
    const y = 100 + (row * (canvasHeight / Math.ceil((existingCount + 1) / cols)));

    await addDoc(collection(db, "familyMembers"), {
      userId: currentUser.uid,
      name: name,
      relation: relation,
      birthYear: birthYear || null,
      notes: notes || "",
      photoURL: photoBase64 || null, // Store base64 directly
      posX: x,
      posY: y,
      createdAt: new Date().toISOString()
    });

    addMemberForm.reset();
    clearSelectedPhoto();
    await loadFamilyTree();
  } catch (err) {
    console.error("Error adding member:", err);
    alert("Failed to add member: " + err.message);
  }
});

// Load family tree
async function loadFamilyTree() {
  loadingMessage.style.display = "block";
  emptyState.classList.add("hidden");
  clearCanvas();

  try {
    const q = query(
      collection(db, "familyMembers"),
      where("userId", "==", currentUser.uid)
    );
    
    const snapshot = await getDocs(q);
    loadingMessage.style.display = "none";

    if (snapshot.empty) {
      emptyState.classList.remove("hidden");
      return;
    }

    members = [];
    snapshot.forEach((docSnap) => {
      members.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderBubbles();

  } catch (err) {
    console.error("Error loading family tree:", err);
    loadingMessage.textContent = "Error loading: " + err.message;
  }
}

function clearCanvas() {
  const bubbles = treeCanvas.querySelectorAll('.bubble');
  bubbles.forEach(b => b.remove());
}

function renderBubbles() {
  clearCanvas();
  
  members.forEach(member => {
    createBubble(member);
  });
}

function createBubble(member) {
  const bubble = document.createElement("div");
  bubble.className = `bubble relation-${member.relation.toLowerCase().replace('/', '-')}`;
  bubble.dataset.id = member.id;
  bubble.style.left = `${member.posX || 100}px`;
  bubble.style.top = `${member.posY || 100}px`;
  
  bubble.innerHTML = `
    <button class="bubble-delete" data-id="${member.id}">×</button>
    ${member.photoURL ? `<img src="${member.photoURL}" class="bubble-photo" alt="${member.name}" />` : ''}
    <div class="bubble-content">
      <div class="bubble-name">${member.name}</div>
      <div class="bubble-relation">${member.relation}</div>
      ${member.birthYear ? `<div class="bubble-year">Born ${member.birthYear}</div>` : ''}
    </div>
  `;


  // Delete functionality
  bubble.querySelector('.bubble-delete').addEventListener('click', async (e) => {
    e.stopPropagation();
    if (confirm(`Delete ${member.name}?`)) {
      try {
        await deleteDoc(doc(db, "familyMembers", member.id));
        await loadFamilyTree();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  });

  // Drag functionality
  makeDraggable(bubble, member.id);
  
  treeCanvas.appendChild(bubble);
}

function makeDraggable(bubble, memberId) {
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  let currentX, currentY;

  const onMouseDown = (e) => {
    if (e.target.classList.contains('bubble-delete')) return;
    
    isDragging = true;
    bubble.classList.add('dragging');
    bubble.style.zIndex = '1000';
    
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(bubble.style.left) || 0;
    initialTop = parseInt(bubble.style.top) || 0;

    e.preventDefault();
    e.stopPropagation();
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    currentX = initialLeft + dx;
    currentY = initialTop + dy;

    // Keep bubble inside canvas
    const maxX = treeCanvas.offsetWidth - bubble.offsetWidth;
    const maxY = treeCanvas.offsetHeight - bubble.offsetHeight;
    
    currentX = Math.max(0, Math.min(currentX, maxX));
    currentY = Math.max(0, Math.min(currentY, maxY));

    bubble.style.left = `${currentX}px`;
    bubble.style.top = `${currentY}px`;
  };

  const onMouseUp = async () => {
    if (!isDragging) return;
    
    isDragging = false;
    bubble.classList.remove('dragging');
    bubble.style.zIndex = '1';

    // Save new position to Firestore
    try {
      await updateDoc(doc(db, "familyMembers", memberId), {
        posX: currentX,
        posY: currentY
      });
      console.log('Position saved:', currentX, currentY);
    } catch (err) {
      console.error("Error saving position:", err);
    }
  };

  bubble.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}