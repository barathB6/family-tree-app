// Camera functionality - Base64 version (no Firebase Storage needed)
let selectedPhotoBase64 = null;

export function initCamera() {
  const openCameraBtn = document.getElementById('openCameraBtn');
  const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
  const memberPhotoFile = document.getElementById('memberPhotoFile');
  const photoPreview = document.getElementById('photoPreview');

  // Open camera - improved version
  openCameraBtn.addEventListener('click', async () => {
    // Check if device supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera not supported on this device. Use "Upload from Gallery" instead.');
      return;
    }

    try {
      // Request camera permission and open camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      // Create video element for camera preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // Create modal for camera
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: black;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;

      video.style.cssText = `
        width: 100%;
        max-width: 640px;
        height: auto;
      `;

      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Capture Photo';
      captureBtn.style.cssText = `
        margin-top: 20px;
        padding: 15px 30px;
        font-size: 18px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
      `;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕ Cancel';
      cancelBtn.style.cssText = `
        margin-top: 10px;
        padding: 10px 20px;
        font-size: 16px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
      `;

      modal.appendChild(video);
      modal.appendChild(captureBtn);
      modal.appendChild(cancelBtn);
      document.body.appendChild(modal);

      // Capture photo
      captureBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Convert to base64
        canvas.toBlob((blob) => {
          if (blob.size > 1024 * 1024) {
            alert('Photo is too large. Try again with better lighting or closer subject.');
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            selectedPhotoBase64 = e.target.result;
            
            // Show preview
            photoPreview.innerHTML = `
              <img src="${selectedPhotoBase64}" alt="Preview" />
              <button type="button" class="remove-photo" onclick="window.removePhoto()">×</button>
            `;
            photoPreview.classList.remove('hidden');
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', 0.8);

        // Stop camera and close modal
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });

      // Cancel
      cancelBtn.addEventListener('click', () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });

    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        alert('No camera found on this device. Use "Upload from Gallery" instead.');
      } else {
        alert('Failed to open camera: ' + err.message);
      }
    }
  });

  // Upload from gallery - fallback option
  uploadPhotoBtn.addEventListener('click', () => {
    memberPhotoFile.click();
  });

  memberPhotoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePhotoSelection(file);
    }
  });

  function handlePhotoSelection(file) {
    // Check file size
    if (file.size > 1024 * 1024) {
      alert('Photo is too large. Please choose a photo under 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedPhotoBase64 = e.target.result;
      
      // Show preview
      photoPreview.innerHTML = `
        <img src="${selectedPhotoBase64}" alt="Preview" />
        <button type="button" class="remove-photo" onclick="window.removePhoto()">×</button>
      `;
      photoPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Global function to remove photo
  window.removePhoto = () => {
    selectedPhotoBase64 = null;
    photoPreview.innerHTML = '';
    photoPreview.classList.add('hidden');
    memberPhotoFile.value = '';
  };
}

export function getSelectedPhoto() {
  return selectedPhotoBase64;
}

export function clearSelectedPhoto() {
  selectedPhotoBase64 = null;
  const photoPreview = document.getElementById('photoPreview');
  if (photoPreview) {
    photoPreview.innerHTML = '';
    photoPreview.classList.add('hidden');
  }
  const fileInput = document.getElementById('memberPhotoFile');
  if (fileInput) {
    fileInput.value = '';
  }
}