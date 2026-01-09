// ==================== TES CLÉS SUPABASE ====================
const supabaseUrl = 'https://cqunlwrulgknpeuntqxk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxdW5sd3J1bGdrbnBldW50cXhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDMxMzAsImV4cCI6MjA4MzQ3OTEzMH0.u_vP2wZBibNL9-OQ8IZQHuRne9s9ZXWx-HYKr_RjVqc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// =====================================================================

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

// Chargement des données
async function loadData() {
  const { data: dbData, error } = await supabase.from('bd_data').select('data').eq('id', '1').single();
  if (error) console.error('Load error:', error);
  if (dbData && dbData.data) data = dbData.data;

  data.members = data.members || [];
  data.tasks = data.tasks || [];
  data.goals = data.goals || [];
  data.materials = data.materials || [];
  data.gallery = data.gallery || [];
  data.totalPages = data.totalPages || 50;
  data.drawn = data.drawn || 0;
  data.digitized = data.digitized || 0;

  if (document.getElementById('totalPages')) document.getElementById('totalPages').value = data.totalPages;
  if (document.getElementById('drawnPages')) document.getElementById('drawnPages').value = data.drawn;
  if (document.getElementById('digitizedPages')) document.getElementById('digitizedPages').value = data.digitized;

  renderMembers();
  renderTasks('all');
  renderGoals();
  renderMaterials();
  renderGallery();
  updateProgress();
}

// Realtime subscription
supabase.channel('bd_data_changes').on(
  'postgres_changes',
  { event: '*', schema: 'public', table: 'bd_data', filter: 'id=eq.1' },
  (payload) => {
    console.log('Realtime update:', payload);
    data = payload.new.data || data;
    loadData();
  }
).subscribe();

// Sauvegarde
async function saveData() {
  const { error } = await supabase.from('bd_data').upsert({ id: '1', data });
  if (error) console.error('Save error:', error);
}

// Manual save
function manualSave() {
  saveData();
  alert('Sauvegardé !');
}

// Update Progress
function updateProgress() {
  const total = parseInt(document.getElementById('totalPages')?.value || data.totalPages) || 50;
  const drawn = parseInt(document.getElementById('drawnPages')?.value || data.drawn) || 0;
  const digitized = parseInt(document.getElementById('digitizedPages')?.value || data.digitized) || 0;
  data.totalPages = total;
  data.drawn = drawn;
  data.digitized = digitized;
  const percent = total > 0 ? Math.round((digitized / total) * 100) : 0;
  const progressBar = document.getElementById('progressBar') || document.getElementById('progressBarPublic');
  const progressText = document.getElementById('progressText') || document.getElementById('progressTextPublic');
  if (progressBar) progressBar.style.width = percent + '%';
  if (progressBar) progressBar.textContent = percent + '%';
  if (progressText) progressText.textContent = `${drawn} pages dessinées | ${digitized} pages numérisées / ${total} prévues`;
  if (document.getElementById('totalPages')) saveData();
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
  const name = document.getElementById('memberName')?.value.trim();
  const phone = document.getElementById('memberPhone')?.value.trim();
  const role = document.getElementById('memberRole')?.value;
  if (name) {
    data.members = data.members || [];
    data.members.push({name, phone, role});
    saveData();
    renderMembers();
    document.getElementById('memberName').value = '';
    document.getElementById('memberPhone').value = '';
  }
}

function removeMember(i) {
  data.members = data.members || [];
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
  const desc = document.getElementById('taskDesc')?.value.trim();
  if (desc) {
    data.tasks = data.tasks || [];
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
  data.tasks = data.tasks || [];
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
  const text = document.getElementById('goalText')?.value.trim();
  if (text) {
    data.goals = data.goals || [];
    data.goals.push({text, checked: false});
    saveData();
    renderGoals();
    document.getElementById('goalText').value = '';
  }
}

function toggleGoal(i) {
  data.goals = data.goals || [];
  data.goals[i].checked = !data.goals[i].checked;
  saveData();
  renderGoals();
}

function removeGoal(i) {
  data.goals = data.goals || [];
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
  const text = document.getElementById('materialText')?.value.trim();
  if (text) {
    data.materials = data.materials || [];
    data.materials.push(text);
    saveData();
    renderMaterials();
    document.getElementById('materialText').value = '';
  }
}

function removeMaterial(i) {
  data.materials = data.materials || [];
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

async function uploadPages() {
  const files = document.getElementById('pageUpload')?.files;
  if (!files || files.length === 0) return;
  data.gallery = data.gallery || [];
  for (const file of files) {
    const { data: uploadData, error } = await supabase.storage.from('pages-bd').upload(`${Date.now()}_${file.name}`, file);
    if (error) {
      console.error('Upload error:', error);
      alert('Erreur upload image');
      continue;
    }
    const { data: urlData } = supabase.storage.from('pages-bd').getPublicUrl(uploadData.path);
    data.gallery.push(urlData.publicUrl);
  }
  saveData();
  renderGallery();
  document.getElementById('pageUpload').value = '';
}

function removePage(i) {
  data.gallery = data.gallery || [];
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
