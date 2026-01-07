// ==================== CONFIG FIREBASE ====================
const firebaseConfig = {
  apiKey: "AIzaSyB2J3s1C9-voJPivcxpnc-TG7wUO1nqIwQ",
  authDomain: "bdmanagerclub.firebaseapp.com",
  databaseURL: "https://bdmanagerclub-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bdmanagerclub",
  storageBucket: "bdmanagerclub.firebasestorage.app",
  messagingSenderId: "339951909412",
  appId: "1:339951909412:web:b20dd77558e41e70ffb6b1",
  measurementId: "G-CRTRY0880K"
};
// ===========================================================

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dataRef = db.ref('bdManagerData');

let data = {
  members: [],
  tasks: [],
  goals: [],
  materials: [],
  gallery: [],
  totalPages: 50,
  drawn: 0,
  digitized: 0
};

// Chargement realtime
dataRef.on('value', (snapshot) => {
  data = snapshot.val() || { members: [], tasks: [], goals: [], materials: [], gallery: [], totalPages: 50, drawn: 0, digitized: 0 };
  
  // Fix: Initialise si undefined
  data.members = data.members || [];
  data.tasks = data.tasks || [];
  data.goals = data.goals || [];
  data.materials = data.materials || [];
  data.gallery = data.gallery || [];
  data.totalPages = data.totalPages || 50;
  data.drawn = data.drawn || 0;
  data.digitized = data.digitized || 0;

  const totalPagesEl = document.getElementById('totalPages');
  const drawnPagesEl = document.getElementById('drawnPages');
  const digitizedPagesEl = document.getElementById('digitizedPages');

  if (totalPagesEl) totalPagesEl.value = data.totalPages;
  if (drawnPagesEl) drawnPagesEl.value = data.drawn;
  if (digitizedPagesEl) digitizedPagesEl.value = data.digitized;

  renderMembers();
  renderTasks('all');
  renderGoals();
  renderMaterials();
  renderGallery();
  updateProgress();
});

// Sauvegarde
function saveData() {
  dataRef.set(data);
}

// Update Progress
function updateProgress() {
  const totalEl = document.getElementById('totalPages');
  const drawnEl = document.getElementById('drawnPages');
  const digitizedEl = document.getElementById('digitizedPages');

  const total = parseInt(totalEl ? totalEl.value : data.totalPages) || 50;
  const drawn = parseInt(drawnEl ? drawnEl.value : data.drawn) || 0;
  const digitized = parseInt(digitizedEl ? digitizedEl.value : data.digitized) || 0;

  data.totalPages = total;
  data.drawn = drawn;
  data.digitized = digitized;

  const percent = total > 0 ? Math.round((digitized / total) * 100) : 0;

  const progressBar = document.getElementById('progressBar') || document.getElementById('progressBarPublic');
  const progressText = document.getElementById('progressText') || document.getElementById('progressTextPublic');

  if (progressBar) {
    progressBar.style.width = percent + '%';
    progressBar.textContent = percent + '%';
  }
  if (progressText) {
    progressText.textContent = `${drawn} pages dessinées | ${digitized} pages numérisées / ${total} prévues`;
  }

  if (totalEl) saveData(); // Sauvegarde seulement sur app.html
}

// Membres
function renderMembers() {
  const list = document.getElementById('membersList');
  if (!list) return;
  list.innerHTML = '';
  (data.members || []).forEach((m, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div>
        <strong>${m.name}</strong> - ${m.role}<br>
        <small>📞 ${m.phone || 'Aucun téléphone'}</small>
      </div>
      ${document.getElementById('memberName') ? `<button class="btn btn-danger btn-sm" onclick="removeMember(${i})">Suppr</button>` : ''}
    `;
    list.appendChild(li);
  });
  updateTaskSelect();
}

function addMember() {
  if (!document.getElementById('memberName')) return;
  const name = document.getElementById('memberName').value.trim();
  const phone = document.getElementById('memberPhone').value.trim();
  const role = document.getElementById('memberRole').value;
  if (name) {
    if (!data.members) data.members = [];
    data.members.push({name, phone, role});
    saveData();
    renderMembers();
    document.getElementById('memberName').value = '';
    document.getElementById('memberPhone').value = '';
  }
}

function removeMember(i) {
  if (!data.members) return;
  data.members.splice(i, 1);
  saveData();
  renderMembers();
  renderTasks('all');
}

// Update Task Select
function updateTaskSelect() {
  const select = document.getElementById('taskMember');
  if (!select) return;
  select.innerHTML = '<option value="">Sans responsable</option>';
  (data.members || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.textContent = m.name;
    select.appendChild(opt);
  });
}

// Tâches
function renderTasks(filter = 'all') {
  const list = document.getElementById('tasksList');
  if (!list) return;
  list.innerHTML = '';
  (data.tasks || []).filter(t => filter === 'all' || t.status === filter).forEach((t, i) => {
    const li = document.createElement('li');
    li.className = `list-group-item ${t.status === 'Done' ? 'bg-success bg-opacity-25' : ''}`;
    li.innerHTML = `
      <strong>${t.desc}</strong> - ${t.member || 'Aucun'}<br>
      <small>Deadline: ${t.deadline || 'Aucune'} | Statut: ${t.status}</small>
      ${document.getElementById('taskDesc') ? `<button class="btn btn-danger btn-sm float-end" onclick="removeTask(${i})">Suppr</button>` : ''}
    `;
    list.appendChild(li);
  });
}

function addTask() {
  if (!document.getElementById('taskDesc')) return;
  const desc = document.getElementById('taskDesc').value.trim();
  if (desc) {
    if (!data.tasks) data.tasks = [];
    data.tasks.push({
      desc,
      member: document.getElementById('taskMember').value,
      deadline: document.getElementById('taskDeadline').value,
      status: document.getElementById('taskStatus').value
    });
    saveData();
    renderTasks('all');
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskDeadline').value = '';
  }
}

function removeTask(i) {
  if (!data.tasks) return;
  data.tasks.splice(i, 1);
  saveData();
  renderTasks('all');
}

function filterTasks(f) {
  renderTasks(f);
}

// Objectifs
function renderGoals() {
  const list = document.getElementById('goalsList');
  if (!list) return;
  list.innerHTML = '';
  (data.goals || []).forEach((g, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span>${g.checked ? '<s>' : ''}${g.text}${g.checked ? '</s>' : ''}</span>
      ${document.getElementById('goalText') ? `
      <div>
        <input type="checkbox" ${g.checked ? 'checked' : ''} onchange="toggleGoal(${i})">
        <button class="btn btn-danger btn-sm" onclick="removeGoal(${i})">Suppr</button>
      </div>` : ''}
    `;
    list.appendChild(li);
  });
}

function addGoal() {
  if (!document.getElementById('goalText')) return;
  const text = document.getElementById('goalText').value.trim();
  if (text) {
    if (!data.goals) data.goals = [];
    data.goals.push({text, checked: false});
    saveData();
    renderGoals();
    document.getElementById('goalText').value = '';
  }
}

function toggleGoal(i) {
  if (!data.goals) return;
  data.goals[i].checked = !data.goals[i].checked;
  saveData();
  renderGoals();
}

function removeGoal(i) {
  if (!data.goals) return;
  data.goals.splice(i, 1);
  saveData();
  renderGoals();
}

// Matériel
function renderMaterials() {
  const list = document.getElementById('materialsList');
  if (!list) return;
  list.innerHTML = '';
  (data.materials || []).forEach((m, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.innerHTML = `${m} ${document.getElementById('materialText') ? `<button class="btn btn-danger btn-sm" onclick="removeMaterial(${i})">Suppr</button>` : ''}`;
    list.appendChild(li);
  });
}

function addMaterial() {
  if (!document.getElementById('materialText')) return;
  const text = document.getElementById('materialText').value.trim();
  if (text) {
    if (!data.materials) data.materials = [];
    data.materials.push(text);
    saveData();
    renderMaterials();
    document.getElementById('materialText').value = '';
  }
}

function removeMaterial(i) {
  if (!data.materials) return;
  data.materials.splice(i, 1);
  saveData();
  renderMaterials();
}

// Galerie
function renderGallery() {
  const gallery = document.getElementById('gallery') || document.getElementById('galleryPublic');
  if (!gallery) return;
  gallery.innerHTML = '';
  (data.gallery || []).forEach((src, i) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-sm-6';
    col.innerHTML = `
      <div class="gallery-item">
        <img src="${src}" class="img-fluid" alt="Page ${i+1}">
        <div class="gallery-caption">Page ${i+1}</div>
      </div>
      ${document.getElementById('pageUpload') ? `<button class="btn btn-danger btn-sm w-100 mt-2" onclick="removePage(${i})">Supprimer</button>` : ''}
    `;
    gallery.appendChild(col);
  });
}

function uploadPages() {
  const files = document.getElementById('pageUpload')?.files;
  if (!files || files.length === 0) return;
  if (!data.gallery) data.gallery = [];
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      data.gallery.push(e.target.result);
      saveData();
      renderGallery();
    };
    reader.onerror = function() {
      console.error('Erreur lecture fichier');
      alert('Erreur lors de l\'upload de l\'image. Réessayez ou vérifiez le fichier.');
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('pageUpload').value = '';
}

function removePage(i) {
  if (!data.gallery) return;
  data.gallery.splice(i, 1);
  saveData();
  renderGallery();
}

// Init listeners pour app.html
if (document.getElementById('totalPages')) {
  ['totalPages', 'drawnPages', 'digitizedPages'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateProgress);
  });
}
