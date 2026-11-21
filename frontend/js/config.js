/**
 * MediMate AI - Application Configuration
 * Manages Firebase configuration and Backend API base URL.
 */

// Dynamically determine Backend API Base URL
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '5001' ? '' : 'http://localhost:5001')
  : '';

// Default Firebase Configuration
// Users can provide their own Firebase Spark plan configuration via UI settings modal or this file
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDemoDummyKeyForLocalPreview12345",
  authDomain: "medimate-ai-demo.firebaseapp.com",
  projectId: "medimate-ai-demo",
  storageBucket: "medimate-ai-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

// Retrieve configuration from localStorage if the user configured it in the UI
function getFirebaseConfig() {
  const saved = localStorage.getItem('medimate_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved Firebase config, using default.');
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

function saveFirebaseConfig(config) {
  localStorage.setItem('medimate_firebase_config', JSON.stringify(config));
}

// Global Toast Notification Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';
  if (type === 'warning') icon = '🔔';

  toast.innerHTML = `<span>${icon}</span><span style="flex: 1;">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global Confirmation Modal Helper
function showConfirmDialog(title, message, onConfirm) {
  let modalOverlay = document.getElementById('confirm-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'confirm-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="confirm-modal-title" style="margin: 0;">Confirm Action</h3>
          <button type="button" class="btn-icon" id="confirm-modal-close" style="border:none; cursor:pointer;">&times;</button>
        </div>
        <p id="confirm-modal-msg" style="margin: 16px 0; color: var(--text-secondary);"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="confirm-modal-cancel">Cancel</button>
          <button type="button" class="btn btn-danger" id="confirm-modal-proceed">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-msg').textContent = message;

  const closeBtn = document.getElementById('confirm-modal-close');
  const cancelBtn = document.getElementById('confirm-modal-cancel');
  const proceedBtn = document.getElementById('confirm-modal-proceed');

  const cleanup = () => {
    modalOverlay.classList.remove('active');
    proceedBtn.onclick = null;
    cancelBtn.onclick = null;
    closeBtn.onclick = null;
  };

  proceedBtn.onclick = () => {
    cleanup();
    if (typeof onConfirm === 'function') onConfirm();
  };

  cancelBtn.onclick = cleanup;
  closeBtn.onclick = cleanup;

  modalOverlay.classList.add('active');
}

window.MediMateConfig = {
  BACKEND_URL,
  getFirebaseConfig,
  saveFirebaseConfig,
  showToast,
  showConfirmDialog
};
