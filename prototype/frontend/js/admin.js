async function loadAdminDashboard(){
  try{
    const [lbRes, issuesRes] = await Promise.all([
      fetch('/api/users/leaderboard?limit=50', { credentials: 'include' }),
      fetch('/api/community?limit=100')
    ]);
    if (!lbRes.ok) {
      console.error('Failed to load leaderboard');
    } else {
      const lb = await lbRes.json();
      const tbody = document.querySelector('#adminLeaderboard tbody');
      tbody.innerHTML = '';
      (lb.leaderboard||[]).forEach((u,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(u.name||u.email||'User')}</td><td class="text-right">${u.ecoPoints||0}</td><td class="text-center">${u.streak||0}</td><td><button data-email="${escapeHtml(u.email||'')}" class="btn btn-sm btn-outline message-btn">Message</button></td>`;
        tbody.appendChild(tr);
      });
    }

    if (!issuesRes.ok) { console.error('Failed to load issues'); return; }
    const issuesData = await issuesRes.json();
    const issues = issuesData.issues || [];
    const container = document.getElementById('issuesContainer');
    container.innerHTML = '';
    issues.forEach(issue=>{
      const div = document.createElement('div');
      div.className = 'card p-4';
      const resolvedText = issue.status === 'resolved' ? `<div class="text-sm text-success-700">Resolved: ${issue.resolvedAt? new Date(issue.resolvedAt).toLocaleString() : '—'}</div>` : '';
      div.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold">${escapeHtml(issue.title)}</h3>
            <p class="text-sm text-text-secondary">${escapeHtml(issue.description)}</p>
            <p class="text-xs text-text-tertiary">Reported by ${escapeHtml(issue.createdBy?.name||'Anonymous')} • ${new Date(issue.createdAt).toLocaleString()}</p>
            ${resolvedText}
          </div>
          <div class="flex flex-col items-end space-y-2">
            ${issue.status !== 'resolved' ? `<button class="btn btn-warning resolve-btn" data-id="${issue._id}">Resolve</button>` : ''}
            <button class="btn btn-outline open-issue-btn" data-id="${issue._id}">Open</button>
          </div>
        </div>
      `;
      container.appendChild(div);
    });

    
    document.querySelectorAll('.open-issue-btn').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      openIssueModal(id);
    }));

    
    const modal = document.getElementById('adminIssueModal');
    if (modal) {
      modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', ()=> modal.classList.add('hidden')));
    }

    document.querySelectorAll('.resolve-btn').forEach(b=> b.addEventListener('click', async (e)=>{
      const id = e.currentTarget.dataset.id;
      if (!confirm('Resolve this issue?')) return;
      const res = await fetch(`/api/community/${id}/resolve`, { method: 'POST', credentials: 'include' });
      if (!res.ok) { alert('Failed to resolve'); return; }
      alert('Resolved');
      loadAdminDashboard();
    }));

  }catch(err){ console.error(err); }
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"]+/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

loadAdminDashboard();

async function openIssueModal(id){
  try{
    const res = await fetch(`/api/community/${id}`);
    if (!res.ok) { alert('Failed to load issue'); return; }
    const json = await res.json();
    const issue = json.issue;
    const modal = document.getElementById('adminIssueModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = issue.title || 'Issue';
    document.getElementById('modalMeta').textContent = `Reported by ${issue.createdBy?.name||'Anonymous'} • ${new Date(issue.createdAt).toLocaleString()}`;
    document.getElementById('modalDesc').textContent = issue.description || '';
    const imgs = document.getElementById('modalImages'); imgs.innerHTML = '';
    (issue.images||[]).forEach(src=>{ const im=document.createElement('img'); im.src=src; im.className='w-full rounded-lg mb-2'; imgs.appendChild(im); });
    const resolvedEl = document.getElementById('modalResolved');
    if (issue.status === 'resolved' && issue.resolvedAt) resolvedEl.textContent = `Resolved on ${new Date(issue.resolvedAt).toLocaleString()} by ${issue.resolvedBy?.name||'admin'}`;
    else resolvedEl.textContent = '';

    const rbtn = document.getElementById('modalResolveBtn');
    if (issue.status !== 'resolved') {
      rbtn.classList.remove('hidden');
      rbtn.onclick = async ()=>{
        if(!confirm('Resolve this issue?')) return;
        const rr = await fetch(`/api/community/${id}/resolve`, { method: 'POST', credentials: 'include' });
        if (!rr.ok) { alert('Failed to resolve'); return; }
        alert('Resolved');
        modal.classList.add('hidden');
        loadAdminDashboard();
      };
    } else {
      rbtn.classList.add('hidden');
      rbtn.onclick = null;
    }

    modal.classList.remove('hidden');
  }catch(err){ console.error(err); alert('Error loading issue'); }
}
