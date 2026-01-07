const firebaseConfig = {
  apiKey: "AIzaSyB2J3s1C9-voJPivcxpnc-TG7wUO1nqIwQ",
  authDomain: "bdmanagerclub.firebaseapp.com",
  projectId: "bdmanagerclub",
  storageBucket: "bdmanagerclub.firebasestorage.app",
  messagingSenderId: "339951909412",
  appId: "1:339951909412:web:b20dd77558e41e70ffb6b1",
  measurementId: "G-CRTRY0880K"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const dataRef = db.ref('bdManagerData'); // Un seul noeud pour toutes les données

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

// Chargement des données en realtime depuis Firebase
dataRef.on('value', (snapshot) => {
  if (snapshot.exists()) {
    data = snapshot.val();
  } else {
    // Si pas de données, on initialise
    dataRef.set(data);
  }
  // Render tout après chargement
  if (document.getElementById('totalPages')) document.getElementById('totalPages').value = data.totalPages;
  if (document.getElementById('drawnPages')) document.getElementById('drawnPages').value = data.drawn;
  if (document.getElementById('digitizedPages')) document.getElementById('digitizedPages').value = data.digitized;
  renderMembers();
  renderTasks('all');
  renderGoals();
  renderMaterials();
  renderGallery();
  updateProgress();
});

// Fonction pour sauvegarder sur Firebase
function saveData() {
  dataRef.set(data);
}

// Progrès BD
function updateProgress() {
  const total = parseInt(document.getElementById('totalPages')?.value) || 50;
  const drawn = parseInt(document.getElementById('drawnPages')?.value) || 0;
  const digitized = parseInt(document.getElementById('digitizedPages')?.value) || 0;
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
  saveData();
}

// Membres
function renderMembers() {
  const list = document.getElementById('membersList');
  if (!list) return;
  list.innerHTML = '';
  data.members.forEach((m, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div>
        <strong>${m.name}</strong> - ${m.role}<br>
        <small>📞 ${m.phone || 'Aucun téléphone'}</small>
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeMember(${i})">Suppr</button>
    `;
    list.appendChild(li);
  });
  updateTaskSelect();
}

function addMember() {
  const name = document.getElementById('memberName')?.value.trim();
  const phone = document.getElementById('memberPhone')?.value.trim();
  const role = document.getElementById('memberRole')?.value;
  if (name && document.getElementById('memberName')) {
    data.members.push({name, phone, role});
    saveData();
    renderMembers();
    document.getElementById('memberName').value = '';
    document.getElementById('memberPhone').value = '';
  }
}

function removeMember(i) {
  data.members.splice(i, 1);
  saveData();
  renderMembers();
  renderTasks('all');
}

function updateTaskSelect() {
  const select = document.getElementById('taskMember');
  if (!select) return;
  select.innerHTML = '<option value="">Sans responsable</option>';
  data.members.forEach(m => {
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
  data.tasks.filter(t => filter === 'all' || t.status === filter).forEach((t, i) => {
    const li = document.createElement('li');
    li.className = `list-group-item ${t.status === 'Done' ? 'bg-success bg-opacity-25' : ''}`;
    li.innerHTML = `
      <strong>${t.desc}</strong> - ${t.member || 'Aucun'}<br>
      <small>Deadline: ${t.deadline || 'Aucune'} | Statut: ${t.status}</small>
      <button class="btn btn-danger btn-sm float-end" onclick="removeTask(${i})">Suppr</button>
    `;
    list.appendChild(li);
  });
}

function addTask() {
  const desc = document.getElementById('taskDesc')?.value.trim();
  if (desc && document.getElementById('taskDesc')) {
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
  data.goals.forEach((g, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <span>${g.checked ? '<s>' : ''}${g.text}${g.checked ? '</s>' : ''}</span>
      <div>
        <input type="checkbox" ${g.checked ? 'checked' : ''} onchange="toggleGoal(${i})">
        <button class="btn btn-danger btn-sm" onclick="removeGoal(${i})">Suppr</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function addGoal() {
  const text = document.getElementById('goalText')?.value.trim();
  if (text && document.getElementById('goalText')) {
    data.goals.push({text, checked: false});
    saveData();
    renderGoals();
    document.getElementById('goalText').value = '';
  }
}

function toggleGoal(i) {
  data.goals[i].checked = !data.goals[i].checked;
  saveData();
  renderGoals();
}

function removeGoal(i) {
  data.goals.splice(i, 1);
  saveData();
  renderGoals();
}

// Matériel
function renderMaterials() {
  const list = document.getElementById('materialsList');
  if (!list) return;
  list.innerHTML = '';
  data.materials.forEach((m, i) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between';
    li.innerHTML = `${m} <button class="btn btn-danger btn-sm" onclick="removeMaterial(${i})">Suppr</button>`;
    list.appendChild(li);
  });
}

function addMaterial() {
  const text = document.getElementById('materialText')?.value.trim();
  if (text && document.getElementById('materialText')) {
    data.materials.push(text);
    saveData();
    renderMaterials();
    document.getElementById('materialText').value = '';
  }
}

function removeMaterial(i) {
  data.materials.splice(i, 1);
  saveData();
  renderMaterials();
}

// Galerie
function renderGallery() {
  const gallery = document.getElementById('gallery') || document.getElementById('galleryPublic');
  if (!gallery) return;
  gallery.innerHTML = '';
  data.gallery.forEach((src, i) => {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-sm-6';
    col.innerHTML = `
      <div class="gallery-item">
        <img src="${src}" class="img-fluid" alt="Page ${i+1}">
        <div class="gallery-caption">Page ${i+1}</div>
      </div>
      <button class="btn btn-danger btn-sm w-100 mt-2" onclick="removePage(${i})">Supprimer</button>
    `;
    gallery.appendChild(col);
  });
}

function uploadPages() {
  const files = document.getElementById('pageUpload')?.files;
  if (!files || files.length === 0) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      data.gallery.push(e.target.result);
      saveData();
      renderGallery();
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('pageUpload').value = '';
}

function removePage(i) {
  data.gallery.splice(i, 1);
  saveData();
  renderGallery();
}

// Init listeners (seulement sur app.html où il y a les inputs)
if (document.getElementById('totalPages')) {
  ['totalPages', 'drawnPages', 'digitizedPages'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateProgress);
  });
}