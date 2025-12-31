document.addEventListener('DOMContentLoaded', function () {
  const startButtons = document.querySelectorAll('.start-task-btn');
  const modal = document.getElementById('submissionModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelEvidenceBtn = document.getElementById('cancelEvidenceBtn');
  const modalTaskTitle = document.getElementById('modalTaskTitle');
  const modalTaskPoints = document.getElementById('modalTaskPoints');
  const pointsEarnedEl = document.getElementById('pointsEarned');
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

  let currentTask = null;
  let currentPoints = 0;
  let capturedBlob = null;
  let stream = null;

  // Initialize eco points from localStorage
  function getEcoPoints() {
    const v = localStorage.getItem('ecoPoints');
    return v ? parseInt(v, 10) : 1840;
  }
  function setEcoPoints(n) {
    localStorage.setItem('ecoPoints', String(n));
    pointsEarnedEl.textContent = formatNumber(n);
  }
  function formatNumber(n){
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  setEcoPoints(getEcoPoints());

  // Open modal and set task info
  startButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const task = btn.getAttribute('data-task') || 'Task';
      const points = parseInt(btn.getAttribute('data-points') || '0', 10);
      currentTask = task;
      currentPoints = points;
      modalTaskTitle.textContent = `Submit Evidence — ${task}`;
      modalTaskPoints.textContent = `${points} pts`;
      submissionStatus.textContent = '';
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
      submitEvidenceBtn.disabled = false;
      modal.classList.remove('hidden');
    });
  });

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
    if (!capturedBlob) {
      submissionStatus.textContent = 'Please attach a photo/video or capture an image.';
      return;
    }
    submitEvidenceBtn.disabled = true;
    submissionStatus.textContent = 'Uploading evidence...';
    // Simulate upload time
    await new Promise(r => setTimeout(r, 1200));
    // Simulate verification success
    const prev = getEcoPoints();
    const next = prev + currentPoints;
    setEcoPoints(next);
    submissionStatus.textContent = `Task verified and completed — +${currentPoints} points!`;
    // show reward popup with verified badge and points
    try { showRewardPopup(currentPoints); } catch(e){ /* ignore */ }
    // Optionally mark task as submitted in UI (simple visual feedback)
    // Disable submit to avoid double awarding
    submitEvidenceBtn.disabled = true;
    // Close modal after short delay
    setTimeout(() => {
      closeModal();
    }, 1200);
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
