async function loadLeaderboard(){
  try{
    const res = await fetch('/api/users/leaderboard?limit=100', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load leaderboard');
    const data = await res.json();
    const list = data.leaderboard || [];

    // Table tbody
    const tbody = document.querySelector('table.table tbody');
    if (tbody) {
      tbody.innerHTML = '';
      list.forEach((u, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="font-bold text-text-primary">${i+1}</td>
          <td>
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-white font-bold">${i+1}</div>
              <div>
                <h4 class="font-medium text-text-primary">${escapeHtml(u.name || (u.email || 'User'))}</h4>
                <p class="text-xs text-text-secondary">${escapeHtml((u.email||'').split('@')[0])}</p>
              </div>
            </div>
          </td>
          <td class="text-right font-semibold text-text-primary">${u.ecoPoints||0}</td>
          <td class="text-center">
            <div class="flex items-center justify-center space-x-1">
              <img src="https://img.rocket.new/generatedImages/rocket_gen_img_1629195c5-1766515855391.png" alt="Fire streak icon" class="w-4 h-4">
              <span class="text-sm font-medium text-accent">${u.streak||0}</span>
            </div>
          </td>
          <td class="text-center"><div class="text-sm text-text-tertiary">-</div></td>
          <td class="text-right"><button class="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-50 rounded-lg transition-colors">Follow</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Your stats panel
    if (data.me && data.me.user) {
      const me = data.me.user;
      const rankEl = document.querySelector('.card .text-3xl.font-heading');
      if (rankEl) rankEl.textContent = `#${data.me.rank}`;
      const pts = document.querySelector('.card .progress-fill');
      const pointsEl = document.querySelectorAll('.card .text-3xl.font-heading')[0];
      // update small stat elements (search by right sidebar labels)
      document.querySelectorAll('.card').forEach(card=>{
        // naive update: find text that contains '#47' or '2,847' and update if present
      });
    }
  }catch(err){ console.error(err); }
}

function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"]+/g, s=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s]||s); }

loadLeaderboard();
