/**
 * MediMate AI - Authentication Controller & Route Guard
 * Handles user sessions, route security, and user profile badges.
 */

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;
  const isPublicPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath.endsWith('login.html');

  // Verify authentication state
  window.mediMateDB.onAuthStateChanged((user) => {
    if (!user && !isPublicPage) {
      // Redirect unauthenticated users to login
      window.location.href = 'login.html';
      return;
    }

    if (user && currentPath.endsWith('login.html')) {
      // Redirect already logged in users to dashboard
      window.location.href = 'dashboard.html';
      return;
    }

    if (user) {
      updateUserUI(user);
    }
  });

  // Setup mobile navigation drawer if present
  setupMobileDrawer();

  // Setup Cloud Settings helper modal
  setupConfigModal();
});

function updateUserUI(user) {
  const userNameElements = document.querySelectorAll('.current-user-name');
  const userEmailElements = document.querySelectorAll('.current-user-email');
  const userAvatarElements = document.querySelectorAll('.current-user-avatar');

  const displayName = user.displayName || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  userNameElements.forEach(el => el.textContent = displayName);
  userEmailElements.forEach(el => el.textContent = user.email);
  userAvatarElements.forEach(el => el.textContent = initial);

  // Setup logout buttons
  const logoutBtns = document.querySelectorAll('.btn-logout');
  logoutBtns.forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      try {
        await window.mediMateDB.logout();
        window.MediMateConfig.showToast('Logged out successfully', 'info');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      } catch (err) {
        console.error('Logout error:', err);
      }
    };
  });
}

function setupMobileDrawer() {
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (mobileBtn && sidebar) {
    mobileBtn.onclick = () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    };
  }

  if (overlay) {
    overlay.onclick = () => {
      if (sidebar) sidebar.classList.remove('open');
      overlay.classList.remove('active');
    };
  }
}

function setupConfigModal() {
  const configBtn = document.getElementById('open-cloud-config-btn');
  if (!configBtn) return;

  configBtn.onclick = () => {
    const current = window.MediMateConfig.getFirebaseConfig();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 550px;">
        <div class="modal-header">
          <h3>Cloud Firebase Configuration</h3>
          <button type="button" class="btn-icon" id="close-cfg-btn">&times;</button>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 12px;">
          MediMate operates automatically with zero configuration in local DB mode. To connect your free Firebase Spark project, paste your web app credentials below:
        </p>
        <div class="form-group">
          <label class="form-label">Firebase apiKey</label>
          <input type="text" id="cfg-apiKey" class="form-input" value="${current.apiKey || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">authDomain</label>
          <input type="text" id="cfg-authDomain" class="form-input" value="${current.authDomain || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">projectId</label>
          <input type="text" id="cfg-projectId" class="form-input" value="${current.projectId || ''}">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="cancel-cfg-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="save-cfg-btn">Save Cloud Config</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#close-cfg-btn').onclick = close;
    modal.querySelector('#cancel-cfg-btn').onclick = close;

    modal.querySelector('#save-cfg-btn').onclick = () => {
      const apiKey = modal.querySelector('#cfg-apiKey').value.trim();
      const authDomain = modal.querySelector('#cfg-authDomain').value.trim();
      const projectId = modal.querySelector('#cfg-projectId').value.trim();

      if (apiKey && projectId) {
        window.MediMateConfig.saveFirebaseConfig({
          ...current,
          apiKey,
          authDomain,
          projectId
        });
        window.MediMateConfig.showToast('Cloud configuration saved! Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        window.MediMateConfig.showToast('Please enter at least apiKey and projectId', 'warning');
      }
    };
  };
}
