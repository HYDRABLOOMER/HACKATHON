const API_BASE = '/api/community';

const el = {
  feed: document.getElementById('issuesFeed'),
  search: document.getElementById('searchInput'),
  sort: document.getElementById('sortSelect'),
  reportForm: document.getElementById('reportForm'),
  useLocationBtn: document.querySelector('#reportModal button[type="button"]'),
  imagesInput: document.getElementById('reportImages')
};

let currentQuery = '';
let _leafletLoaded = false;
const _maps = {};

async function fetchIssues() {
  try {
    const q = encodeURIComponent(currentQuery || '');
    const sort = el.sort?.value === 'popular' ? 'votes' : '';
    const res = await fetch(`${API_BASE}?limit=20${q ? `&q=${q}`: ''}${sort?`&sort=${sort}`:''}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch issues');
    const data = await res.json();
    renderIssues(data.issues || []);
  } catch (err) {
    console.error(err);
  }
}

async function fetchSidebar() {
  try {
    const [sRes, tRes] = await Promise.all([
      fetch('/api/community/stats'),
      fetch('/api/community/top-contributors')
    ]);
    if (sRes.ok) {
      const s = await sRes.json();
      document.getElementById('resolvedCount').textContent = s.resolved ?? 0;
      document.getElementById('inProgressCount').textContent = s.inProgress ?? 0;
      document.getElementById('activeMembersCount').textContent = s.active ?? 0;
    }
    if (tRes.ok) {
      const t = await tRes.json();
      const container = document.getElementById('topContributors');
      container.innerHTML = '';
      if (t.contributors && t.contributors.length) {
        t.contributors.forEach((c, i) => {
          const row = document.createElement('div');
          row.className = 'flex items-center space-x-3';
          row.innerHTML = `
            <div class="relative">
              <div class="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-sm font-bold">${i+1}</div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-text-primary truncate">${escapeHtml(c.user?.name || 'Anonymous')}</h4>
              <p class="text-xs text-text-secondary">${c.count} issues reported</p>
            </div>
            <div class="text-right"><div class="text-sm font-semibold text-primary">${c.points||''}</div></div>
          `;
          container.appendChild(row);
        });
      } else {
        container.innerHTML = '<div class="text-sm text-text-secondary">No contributors yet</div>';
      }
    }
  } catch (err) { console.error('sidebar', err); }
}

async function fetchCurrentUser(){
  try{
    const res = await fetch('/api/users/me', { credentials: 'include' });
    if (!res.ok) return;
    const user = await res.json();
    window.CURRENT_USER = user;
    const profileName = document.querySelector('a[href="user_profile.html"] span');
    if (profileName && user) profileName.textContent = user.name || profileName.textContent;
    fetchIssues();
  }catch(e){ console.error('user fetch', e); }
}

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime())/1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function renderIssues(issues) {
  el.feed.innerHTML = '';
  if (!issues.length) {
    el.feed.innerHTML = '<div class="card">No issues found.</div>';
    return;
  }

  issues.forEach(issue => {
    const article = document.createElement('article');
    article.className = 'card card-hover';
    article.innerHTML = `
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center space-x-3">
          <img src="https://img.rocket.new/generatedImages/rocket_gen_img_10458bf2c-1763293523905.png" alt="avatar" class="w-12 h-12 rounded-full object-cover border-2 border-primary">
          <div>
            <h3 class="font-heading font-semibold text-text-primary">${escapeHtml(issue.createdBy?.name || 'Anonymous')}</h3>
            <div class="flex items-center space-x-2 text-sm text-text-secondary">
              <img src="https://img.rocket.new/generatedImages/rocket_gen_img_1263f966d-1766595347304.png" alt="Location marker" class="w-4 h-4">
              <span>${escapeHtml(issue.location || 'Unknown')}</span>
              <span>•</span>
              <span>${timeAgo(issue.createdAt)}</span>
            </div>
          </div>
        </div>
        <button class="p-2 hover:bg-surface-50 rounded-lg transition-colors more-btn" data-id="${issue._id}">...</button>
      </div>
      <div class="mb-4">
        <div class="flex items-center space-x-2 mb-3">
          <span class="badge badge-primary">${escapeHtml(issue.status || 'open')}</span>
        </div>
        <h4 class="text-xl font-heading font-semibold text-text-primary mb-2">${escapeHtml(issue.title)}</h4>
        <p class="text-text-secondary mb-4">${escapeHtml(issue.description)}</p>
      </div>
      <div class="flex items-center justify-between pt-4 border-t border-border-surface">
        <div class="flex items-center space-x-6">
          <button class="vote-btn flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors" data-id="${issue._id}">
            <img src="https://img.rocket.new/generatedImages/rocket_gen_img_1292990ff-1767175409178.png" alt="Like icon" class="w-5 h-5">
            <span class="text-sm font-medium votes-count">${issue.votes||0}</span>
          </button>
          <button class="comment-toggle flex items-center space-x-2 text-text-secondary hover:text-primary transition-colors" data-id="${issue._id}">
            <img src="https://img.rocket.new/generatedImages/rocket_gen_img_106aa7e9e-1766941691068.png" alt="Comment icon" class="w-5 h-5">
            <span class="text-sm font-medium comment-count">${issue.comments?.length||0}</span>
          </button>
        </div>
        <div class="flex items-center space-x-2">
          ${ (typeof window !== 'undefined' && window.CURRENT_USER && window.CURRENT_USER.isAdmin && issue.status !== 'resolved') ? `<button class="btn btn-warning btn-sm resolve-btn" data-id="${issue._id}">Resolve</button>` : '' }
          <button class="btn btn-primary btn-sm h-10 px-4" data-id="${issue._id}">View</button>
        </div>
      </div>
      <div class="mt-3 comments-section hidden" data-id="${issue._id}">
        <div class="space-y-2 mb-3">
          ${(issue.comments||[]).map(c=>`<div class="text-sm"><strong>${escapeHtml((c.user && c.user.name) || 'User')}</strong>: ${escapeHtml(c.text)}</div>`).join('')}
        </div>
        <div class="flex gap-2">
          <input class="input flex-1 comment-input" placeholder="Write a comment...">
          <button class="btn btn-primary submit-comment" data-id="${issue._id}">Send</button>
        </div>
      </div>
    `;

    article.querySelectorAll('.vote-btn').forEach(btn=> btn.addEventListener('click', onVote));
    article.querySelectorAll('.comment-toggle').forEach(btn=> btn.addEventListener('click', onToggleComments));
    article.querySelectorAll('.submit-comment').forEach(btn=> btn.addEventListener('click', onSubmitComment));
    article.querySelectorAll('.resolve-btn').forEach(btn=> btn.addEventListener('click', onResolve));
    article.querySelectorAll('button[data-id].btn').forEach(b=> b.addEventListener('click', ()=> openDetail(issue._id)));

    el.feed.appendChild(article);
  });
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>\"']/g, s=> ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[s]);
}

async function onVote(e){
  const id = e.currentTarget.dataset.id;
  try{
    const res = await fetch(`${API_BASE}/${id}/vote`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      alert('Login required to vote');
      return;
    }
    const data = await res.json();
    e.currentTarget.querySelector('.votes-count').textContent = data.votes;
  }catch(err){ console.error(err); }
}

async function onResolve(e){
  const id = e.currentTarget.dataset.id;
  if (!confirm('Mark this issue as resolved? This action will record the resolution time.')) return;
  try{
    const res = await fetch(`${API_BASE}/${id}/resolve`, { method: 'POST', credentials: 'include' });
    if (!res.ok) {
      const body = await res.json().catch(()=>({}));
      alert(body.message || 'Failed to resolve issue (are you an admin?)');
      return;
    }
    const data = await res.json();
    fetchIssues();
    if (document.getElementById('detailModal') && !document.getElementById('detailModal').classList.contains('hidden')) {
      openDetail(id);
    }
    alert('Issue marked resolved at ' + (data.issue.resolvedAt ? new Date(data.issue.resolvedAt).toLocaleString() : 'now'));
  }catch(err){ console.error(err); alert('Error resolving issue'); }
}

function onToggleComments(e){
  const id = e.currentTarget.dataset.id;
  const sec = document.querySelector(`.comments-section[data-id="${id}"]`);
  if (sec) sec.classList.toggle('hidden');
}

async function onSubmitComment(e){
  const id = e.currentTarget.dataset.id;
  const sec = document.querySelector(`.comments-section[data-id="${id}"]`);
  const input = sec.querySelector('.comment-input');
  const text = input.value.trim();
  if(!text) return;
  try{
    const res = await fetch(`${API_BASE}/${id}/comments`, { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
    if(!res.ok) { alert('Login required to comment'); return; }
    const data = await res.json();
    const list = sec.querySelector('div.space-y-2');
    const div = document.createElement('div');
    div.className = 'text-sm';
    div.innerHTML = `<strong>${escapeHtml(data.comment.user?.name||'You')}</strong>: ${escapeHtml(data.comment.text)}`;
    list.appendChild(div);
    input.value = '';
  }catch(err){ console.error(err); }
}

if (el.reportForm) {
  el.reportForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDescription').value.trim();
    const location = document.getElementById('reportLocation').value.trim();
    const priority = document.getElementById('reportPriority')?.value;
    if (!title || !description) { alert('Title and description required'); return; }
    try{
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('location', location);
      if (priority) form.append('priority', priority);
      if (el._coords) {
        form.append('locationLat', el._coords.lat);
        form.append('locationLng', el._coords.lng);
      }
      const files = el.imagesInput?.files;
      if (files && files.length) {
        for (let i=0;i<files.length;i++) form.append('images', files[i]);
      }

      const res = await fetch(API_BASE, { method: 'POST', credentials: 'include', body: form });
      if (!res.ok) { alert('Failed to submit. Are you logged in?'); return; }
      const data = await res.json();
      document.getElementById('reportModal')?.classList.add('hidden');
      fetchIssues();
      if (data && data.issue && data.issue._id) {
        openDetail(data.issue._id);
      }
    }catch(err){ console.error(err); alert('Error submitting report'); }
  });

  if (el.useLocationBtn) {
    el.useLocationBtn.addEventListener('click', ()=>{
      if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
      el.useLocationBtn.textContent = 'Locating...';
      navigator.geolocation.getCurrentPosition((pos)=>{
        el._coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('reportLocation').value = `Approx: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        el.useLocationBtn.textContent = 'Use My Location';
      }, (err)=>{ alert('Unable to get location'); el.useLocationBtn.textContent = 'Use My Location'; });
    });
  }
}

if (el.search) {
  el.search.addEventListener('input', (e)=>{
    currentQuery = e.target.value;
    clearTimeout(window.__ci_search_timeout);
    window.__ci_search_timeout = setTimeout(fetchIssues, 500);
  });
}

if (el.sort) {
  el.sort.addEventListener('change', fetchIssues);
}

fetchIssues();
fetchCurrentUser();
setInterval(fetchIssues, 8000);
fetchSidebar();

async function openDetail(id){
  try{
    const res = await fetch(`${API_BASE}/${id}`);
    if(!res.ok) { alert('Failed to load issue'); return; }
    const { issue } = await res.json();
    document.getElementById('detailTitle').textContent = issue.title;
    document.getElementById('detailDesc').textContent = issue.description;
    const imgs = document.getElementById('detailImages');
    imgs.innerHTML = '';
    (issue.images||[]).forEach(src=>{ const im=document.createElement('img'); im.src=src; im.className='w-full rounded-lg mb-2'; imgs.appendChild(im); });
    document.getElementById('detailMeta').textContent = `Reported by ${issue.createdBy?.name||'Anonymous'} • ${timeAgo(issue.createdAt)}`;
    if (issue.status === 'resolved' && issue.resolvedAt) {
      const resolvedEl = document.getElementById('detailResolved');
      if (resolvedEl) resolvedEl.textContent = `Resolved on ${new Date(issue.resolvedAt).toLocaleString()} by ${issue.resolvedBy?.name||'admin'}`;
      else {
        const p = document.createElement('p'); p.id = 'detailResolved'; p.className = 'text-sm text-success-700'; p.textContent = `Resolved on ${new Date(issue.resolvedAt).toLocaleString()} by ${issue.resolvedBy?.name||'admin'}`; document.getElementById('detailDesc').insertAdjacentElement('afterend', p);
      }
    }
    document.getElementById('detailModal').classList.remove('hidden');

    const mapEl = document.getElementById('map');
    mapEl.innerHTML = '';
    if (issue.locationLat && issue.locationLng) {
      mapEl.style.display = 'block';
      await ensureLeaflet();
      if (_maps[id]) {
        try { _maps[id].remove(); } catch(e){}
        delete _maps[id];
      }
      const map = L.map(mapEl).setView([issue.locationLat, issue.locationLng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      L.marker([issue.locationLat, issue.locationLng]).addTo(map).bindPopup(issue.title).openPopup();
      _maps[id] = map;
    } else {
      mapEl.style.display = 'none';
    }
  }catch(err){ console.error(err); }
}

function ensureLeaflet(){
  return new Promise((resolve, reject)=>{
    if (window.L) return resolve();
    if (_leafletLoaded) return resolve();
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = ()=>{ _leafletLoaded = true; resolve(); };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}
