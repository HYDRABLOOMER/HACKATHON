document.addEventListener('DOMContentLoaded', function () {
  const api = window.ecoQuestAPI;
  const tasksList = document.getElementById('tasksList');
  const modal = document.getElementById('submissionModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelEvidenceBtn = document.getElementById('cancelEvidenceBtn');
  const modalTaskTitle = document.getElementById('modalTaskTitle');
  const modalTaskPoints = document.getElementById('modalTaskPoints');
  const pointsEarnedEl = document.getElementById('pointsEarned');
  const completedTasksEl = document.getElementById('completedTasks');
  const pendingReviewEl = document.getElementById('pendingReview');
  const chooseFileBtn = document.getElementById('chooseFileBtn');
  const evidenceFile = document.getElementById('evidenceFile');
  const filePreview = document.getElementById('filePreview');
  const startCameraBtn = document.getElementById('startCameraBtn');
  const stopCameraBtn = document.getElementById('stopCameraBtn');
  const captureBtn = document.getElementById('captureBtn');
  const cameraVideo = document.getElementById('cameraVideo');
  const cameraCanvas = document.getElementById('cameraCanvas');
  const submitEvidenceBtn = document.getElementById('submitEvidenceBtn');
  const submissionStatus = document.getElementById('submissionStatus');
  const evidenceDescription = document.getElementById('evidenceDescription');
  const evidenceLocation = document.getElementById('evidenceLocation');
  const rewardPopup = document.getElementById('rewardPopup');
  const rewardPointsEl = document.getElementById('rewardPoints');
  const closeRewardBtn = document.getElementById('closeRewardBtn');
  const taskStreakEl = document.getElementById('taskStreak');
  const categoryTabs = document.getElementById('categoryTabs');
  const categoryProgressList = document.getElementById('categoryProgressList');
  const activeTasksList = document.getElementById('activeTasksList');
  const activeTasksCount = document.getElementById('activeTasksCount');

  let currentTask = null;
  let currentTaskId = null;
  let currentSubmissionId = null;
  let currentPoints = 0;
  let capturedBlob = null;
  let stream = null;
  let currentCategory = '';

  function formatNumber(n){
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function setPointsEarned(n) {
    if (!pointsEarnedEl) return;
    pointsEarnedEl.textContent = formatNumber(n);
  }

  async function refreshDashboard() {
    if (!api) return;

    try {
      const data = await api.request('/me/dashboard');

      if (typeof data.totalPoints === 'number') setPointsEarned(data.totalPoints);
      if (completedTasksEl && typeof data.tasksCompleted === 'number') {
        completedTasksEl.textContent = String(data.tasksCompleted);
      }
      if (pendingReviewEl && typeof data.pendingReview === 'number') {
        pendingReviewEl.textContent = String(data.pendingReview);
      }

      if (taskStreakEl && typeof data.streakDays === 'number') {
        taskStreakEl.textContent = `${data.streakDays} Days`;
      }

      renderCategoryProgressDynamic(data.categoryProgress);
    } catch (error) {
      console.error(error);
      // If unauthorized, api.request will throw; send user to login.
      window.location.href = '/';
    }
  }

  async function refreshActiveTasks() {
    if (!api) return;
    try {
      const data = await api.getUserSubmissions({ status: 'pending,pending_verification,manual_review' });
      renderActiveTasks(data && data.submissions ? data.submissions : []);
    } catch (error) {
      console.error(error);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function humanizeCategory(cat) {
    const s = String(cat || '').trim();
    if (!s) return 'Other';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function statusLabel(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'pending' || s === 'pending_verification') return { text: 'Pending', badgeClass: 'badge badge-warning text-xs', cardClass: 'p-4 bg-warning-50 rounded-xl border-l-4 border-warning' };
    if (s === 'manual_review') return { text: 'Review', badgeClass: 'badge bg-surface-50 text-text-secondary text-xs', cardClass: 'p-4 bg-surface-50 rounded-xl border-l-4 border-border-surface' };
    if (s === 'rejected') return { text: 'Rejected', badgeClass: 'badge bg-error-100 text-error-700 text-xs', cardClass: 'p-4 bg-error-50 rounded-xl border-l-4 border-error' };
    if (s === 'verified') return { text: 'Verified', badgeClass: 'badge badge-success text-xs', cardClass: 'p-4 bg-success-50 rounded-xl border-l-4 border-success' };
    return { text: 'In Progress', badgeClass: 'badge bg-primary-100 text-primary-700 text-xs', cardClass: 'p-4 bg-primary-50 rounded-xl border-l-4 border-primary' };
  }

  function formatRelativeDays(dateString) {
    const d = dateString ? new Date(dateString) : null;
    if (!d || Number.isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  function renderCategoryProgressDynamic(categoryProgress) {
    if (!categoryProgressList) return;
    if (!Array.isArray(categoryProgress) || categoryProgress.length === 0) {
      categoryProgressList.innerHTML = '<div class="text-sm text-text-secondary">No categories yet.</div>';
      return;
    }

    const sorted = [...categoryProgress].sort((a, b) => {
      const ca = String(a.category || '');
      const cb = String(b.category || '');
      return ca.localeCompare(cb);
    });

    const html = sorted
      .map((row) => {
        const catKey = String(row.category || '').toLowerCase();
        const label = humanizeCategory(row.category);
        const completed = typeof row.completed === 'number' ? row.completed : 0;
        const total = typeof row.total === 'number' ? row.total : 0;
        const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((completed / total) * 100))) : 0;
        const safeCat = escapeHtml(label);

        return `
          <div data-category-row="${escapeHtml(catKey)}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-text-primary">${safeCat}</span>
              </div>
              <span class="text-sm font-medium text-text-secondary">${completed}/${total}</span>
            </div>
            <div class="w-full bg-surface-200 rounded-full h-2">
              <div class="bg-primary h-2 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      })
      .join('');

    categoryProgressList.innerHTML = html;
  }

  function renderActiveTasks(submissions) {
    if (!activeTasksList) return;
    const items = Array.isArray(submissions) ? submissions : [];
    if (activeTasksCount) activeTasksCount.textContent = String(items.length);

    if (items.length === 0) {
      activeTasksList.innerHTML = '<div class="text-sm text-text-secondary">No active tasks.</div>';
      return;
    }

    activeTasksList.innerHTML = items
      .map((s) => {
        const title = escapeHtml(s.taskTitle || 'Task');
        const meta = statusLabel(s.status);
        const rel = formatRelativeDays(s.updatedAt || s.createdAt);
        const subText =
          String(s.status || '').toLowerCase() === 'manual_review'
            ? 'Sent for manual review'
            : String(s.status || '').toLowerCase() === 'pending_verification'
              ? 'Awaiting verification'
              : String(s.status || '').toLowerCase() === 'pending'
                ? 'In progress'
                : '';

        return `
          <div class="${meta.cardClass}">
            <div class="flex items-start justify-between mb-2">
              <h4 class="font-medium text-text-primary text-sm">${title}</h4>
              <span class="${meta.badgeClass}">${escapeHtml(meta.text)}</span>
            </div>
            <p class="text-xs text-text-secondary mb-3">${escapeHtml(subText)}</p>
            <div class="flex items-center justify-between text-xs">
              <span class="text-text-tertiary">${escapeHtml(rel)}</span>
              <button class="text-primary hover:text-primary-600 font-medium" data-submission-id="${escapeHtml(s.id)}">View</button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function renderTasks(tasks) {
    if (!tasksList) return;
    tasksList.innerHTML = '';

    if (!Array.isArray(tasks) || tasks.length === 0) {
      tasksList.innerHTML = '<div class="card">No tasks available.</div>';
      return;
    }

    const html = tasks
      .map((t) => {
        const title = escapeHtml(t.title);
        const description = escapeHtml(t.description || '');
        const category = escapeHtml(t.category || 'task');
        const points = typeof t.points === 'number' ? t.points : 0;

        return `
          <div class="card card-hover border-l-4 border-l-success">
            <div class="flex flex-col sm:flex-row gap-6">
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center space-x-2 mb-2">
                      <span class="badge badge-success">${category}</span>
                    </div>
                    <h3 class="text-xl font-heading font-semibold text-text-primary mb-2">${title}</h3>
                    <p class="text-sm text-text-secondary mb-3">${description}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-4 mb-4 text-sm text-text-secondary">
                  <div class="flex items-center space-x-1">
                    <span class="font-medium text-accent">${points} Points</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-3">
                  <button class="btn btn-primary start-task-btn flex items-center space-x-2" data-task-id="${t.id}" data-points="${points}" data-task="${title}">
                    <span>Start Task</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    tasksList.innerHTML = html;
  }

  async function loadTasks() {
    if (!api) return;
    try {
      const tasks = await api.getTasks({ category: currentCategory || undefined });
      renderTasks(tasks);
    } catch (error) {
      console.error(error);
      if (tasksList) tasksList.innerHTML = '<div class="card">Failed to load tasks.</div>';
    }
  }

  if (!api || !api.isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  refreshDashboard();
  loadTasks();
  refreshActiveTasks();

  if (categoryTabs) {
    categoryTabs.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-category]');
      if (!btn) return;

      const category = btn.getAttribute('data-category') || '';
      currentCategory = category;

      categoryTabs.querySelectorAll('button[data-category]').forEach((b) => {
        if (b === btn) {
          b.classList.remove('bg-surface-50', 'text-text-secondary');
          b.classList.add('bg-primary', 'text-white');
        } else {
          b.classList.remove('bg-primary', 'text-white');
          b.classList.add('bg-surface-50', 'text-text-secondary');
        }
      });

      await loadTasks();
    });
  }

  async function openTaskModalFromButton(btn) {
    const task = btn.getAttribute('data-task') || 'Task';
    const points = parseInt(btn.getAttribute('data-points') || '0', 10);
    const taskId = btn.getAttribute('data-task-id');

    currentTask = task;
    currentPoints = Number.isFinite(points) ? points : 0;
    currentTaskId = taskId;
    currentSubmissionId = null;

    modalTaskTitle.textContent = `Submit Evidence — ${task}`;
    modalTaskPoints.textContent = `${currentPoints} pts`;
    submissionStatus.textContent = 'Starting task...';
    filePreview.textContent = '';
    capturedBlob = null;
    evidenceFile.value = '';
    evidenceDescription.value = '';
    evidenceLocation.value = '';
    cameraVideo.classList.add('hidden');
    cameraCanvas.classList.add('hidden');
    captureBtn.classList.add('hidden');
    stopCameraBtn.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
    submitEvidenceBtn.disabled = true;
    modal.classList.remove('hidden');

    try {
      const result = await api.startTask(currentTaskId);
      currentSubmissionId = result.submissionId;
      submissionStatus.textContent = '';
      submitEvidenceBtn.disabled = false;
    } catch (error) {
      console.error(error);
      submissionStatus.textContent = 'Unable to start task. Please try again.';
      submitEvidenceBtn.disabled = true;
    }
  }

  if (tasksList) {
    tasksList.addEventListener('click', (e) => {
      const btn = e.target.closest('.start-task-btn');
      if (!btn) return;
      openTaskModalFromButton(btn);
    });
  }

  closeModalBtn.addEventListener('click', closeModal);
  cancelEvidenceBtn.addEventListener('click', closeModal);
  function closeModal(){
    modal.classList.add('hidden');
    stopCamera();
  }

  // File chooser
  chooseFileBtn.addEventListener('click', () => evidenceFile.click());
  evidenceFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      submissionStatus.textContent = 'File too large. Max 10MB.';
      evidenceFile.value = '';
      return;
    }
    capturedBlob = file;
    showFilePreview(file);
  });

  function showFilePreview(file){
    filePreview.innerHTML = '';
    if (file.type.startsWith('image/')){
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = 'w-full rounded-xl';
      img.onload = () => URL.revokeObjectURL(img.src);
      filePreview.appendChild(img);
    } else if (file.type.startsWith('video/')){
      const v = document.createElement('video');
      v.controls = true;
      v.src = URL.createObjectURL(file);
      v.className = 'w-full rounded-xl';
      filePreview.appendChild(v);
    } else {
      filePreview.textContent = file.name;
    }
  }

  // Camera handling (image capture)
  startCameraBtn.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraVideo.srcObject = stream;
      cameraVideo.classList.remove('hidden');
      cameraCanvas.classList.add('hidden');
      captureBtn.classList.remove('hidden');
      stopCameraBtn.classList.remove('hidden');
      startCameraBtn.classList.add('hidden');
      submissionStatus.textContent = '';
    } catch (err) {
      submissionStatus.textContent = 'Camera access denied or not available.';
    }
  });

  stopCameraBtn.addEventListener('click', () => {
    stopCamera();
  });

  function stopCamera(){
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    cameraVideo.classList.add('hidden');
    captureBtn.classList.add('hidden');
    stopCameraBtn.classList.add('hidden');
    startCameraBtn.classList.remove('hidden');
  }

  captureBtn.addEventListener('click', () => {
    if (!stream) return;
    const video = cameraVideo;
    const canvas = cameraCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.classList.remove('hidden');
    cameraVideo.classList.add('hidden');
    // Convert to blob
    canvas.toBlob((blob) => {
      capturedBlob = blob;
      // show preview image
      filePreview.innerHTML = '';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.className = 'w-full rounded-xl';
      img.onload = () => URL.revokeObjectURL(img.src);
      filePreview.appendChild(img);
      stopCamera();
    }, 'image/jpeg', 0.9);
  });

  // GPS button
  const useGpsBtn = document.getElementById('useGpsBtn');
  useGpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      submissionStatus.textContent = 'Geolocation not available.';
      return;
    }
    submissionStatus.textContent = 'Getting location...';
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      evidenceLocation.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      submissionStatus.textContent = '';
    }, err => {
      submissionStatus.textContent = 'Unable to get location.';
    });
  });

  // Submit simulation: validate and award points
  submitEvidenceBtn.addEventListener('click', async () => {
    submissionStatus.textContent = '';
    if (!currentSubmissionId) {
      submissionStatus.textContent = 'Task not started. Please try again.';
      return;
    }
    submitEvidenceBtn.disabled = true;
    submissionStatus.textContent = 'Submitting evidence...';

    const locationText = (evidenceLocation.value || '').trim();
    let latitude;
    let longitude;
    if (locationText.includes(',')) {
      const parts = locationText.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        latitude = parts[0];
        longitude = parts[1];
      }
    }

    try {
      const result = await api.submitEvidenceWithImages(currentSubmissionId, {
        description: (evidenceDescription.value || '').trim(),
        latitude,
        longitude,
        locationText,
        files: capturedBlob ? [capturedBlob] : []
      });

      if (result.status === 'pending_verification') {
        submissionStatus.textContent = 'Evidence submitted. Pending verification.';
      } else if (result.status === 'manual_review') {
        submissionStatus.textContent = 'Submitted. Sent for manual review.';
      } else if (result.status === 'rejected') {
        submissionStatus.textContent = 'Submission rejected. Please try another task.';
      } else if (result.status === 'verified') {
        if (typeof result.totalPoints === 'number') setPointsEarned(result.totalPoints);
        submissionStatus.textContent = `Task verified and completed — +${result.pointsAwarded || currentPoints} points!`;
        try { showRewardPopup(result.pointsAwarded || currentPoints); } catch(e){ /* ignore */ }
      } else {
        submissionStatus.textContent = 'Submitted.';
      }

      refreshDashboard();
      await loadTasks();

      setTimeout(() => {
        closeModal();
      }, 1200);
    } catch (error) {
      console.error(error);
      submissionStatus.textContent = 'Submission failed. Please try again.';
      submitEvidenceBtn.disabled = false;
    }
  });

  // Reward popup controls
  function showRewardPopup(points){
    if (!rewardPopup) return;
    rewardPointsEl.textContent = `+${points} points`;
    rewardPopup.classList.remove('hidden');
    // small delay for transition
    setTimeout(()=> rewardPopup.classList.add('show'), 40);
    // auto-hide
    window.setTimeout(() => hideRewardPopup(), 4200);
  }
  function hideRewardPopup(){
    if (!rewardPopup) return;
    rewardPopup.classList.remove('show');
    // remove from DOM flow after transition
    setTimeout(()=> rewardPopup.classList.add('hidden'), 360);
  }
  if (closeRewardBtn) closeRewardBtn.addEventListener('click', hideRewardPopup);

});
