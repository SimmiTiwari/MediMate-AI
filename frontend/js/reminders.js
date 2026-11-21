/**
 * MediMate AI - Wellness Reminders Controller
 * Handles reminders creation, toggles, Web Notifications API, and in-app alerts.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupReminders();
});

function setupReminders() {
  const user = window.mediMateDB.getCurrentUser();
  if (!user) return;

  const reminderForm = document.getElementById('reminder-form');
  const titleInput = document.getElementById('reminder-title');
  const typeSelect = document.getElementById('reminder-type');
  const timeInput = document.getElementById('reminder-time');
  const reminderIdInput = document.getElementById('reminder-id');
  const submitBtn = document.getElementById('reminder-submit-btn');
  const remindersList = document.getElementById('reminders-list');
  const notifyPermBtn = document.getElementById('enable-browser-notify-btn');

  let allReminders = [];

  // Web Notifications Permission
  if (notifyPermBtn && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      notifyPermBtn.innerHTML = '✅ Browser Notifications Active';
      notifyPermBtn.classList.add('btn-secondary');
      notifyPermBtn.disabled = true;
    } else {
      notifyPermBtn.addEventListener('click', async () => {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          window.MediMateConfig.showToast('Browser notifications enabled!', 'success');
          notifyPermBtn.innerHTML = '✅ Browser Notifications Active';
          notifyPermBtn.disabled = true;
        } else {
          window.MediMateConfig.showToast('Notification permission was not granted', 'warning');
        }
      });
    }
  }

  // Pre-fill reminder title based on type
  if (typeSelect && titleInput) {
    typeSelect.addEventListener('change', () => {
      const type = typeSelect.value;
      if (type === 'Drink water') titleInput.value = 'Drink a glass of water';
      else if (type === 'Sleep routine') titleInput.value = 'Begin wind-down sleep routine';
      else if (type === 'Walking') titleInput.value = 'Take a 10-minute stretch walk';
      else if (type === 'Exercise') titleInput.value = 'Daily active workout';
      else if (type === 'Custom') titleInput.value = '';
    });
  }

  // Load reminders
  loadReminders();

  // Form Submit
  if (reminderForm) {
    reminderForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const title = titleInput.value.trim();
      const type = typeSelect.value;
      const time = timeInput.value;
      const existingId = reminderIdInput ? reminderIdInput.value : '';

      if (!title || !time) {
        window.MediMateConfig.showToast('Please provide both reminder title and time', 'warning');
        return;
      }

      const payload = {
        title,
        type,
        time,
        enabled: true
      };

      if (existingId) {
        payload.id = existingId;
      }

      try {
        await window.mediMateDB.saveReminder(user.uid, payload);
        window.MediMateConfig.showToast(existingId ? 'Reminder updated' : 'Reminder created', 'success');
        resetForm();
        await loadReminders();
      } catch (err) {
        console.error('Reminder save error:', err);
        window.MediMateConfig.showToast('Failed to save reminder: ' + err.message, 'error');
      }
    });
  }

  function resetForm() {
    if (reminderForm) reminderForm.reset();
    if (reminderIdInput) reminderIdInput.value = '';
    if (submitBtn) submitBtn.textContent = 'Add Reminder';
  }

  async function loadReminders() {
    try {
      allReminders = await window.mediMateDB.getReminders(user.uid);
      renderReminders(allReminders);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    }
  }

  function renderReminders(reminders) {
    if (!remindersList) return;

    if (!reminders || reminders.length === 0) {
      remindersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <h3>No Reminders Set</h3>
          <p>Create hydration prompts, workout alerts, or sleep reminders using the form above.</p>
        </div>
      `;
      return;
    }

    remindersList.innerHTML = reminders.map(r => `
      <div class="card" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <label class="switch">
            <input type="checkbox" class="reminder-toggle" data-id="${r.id}" ${r.enabled ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <div>
            <h4 style="margin: 0; font-size: 1rem; color: var(--text-main);">${escapeHtml(r.title)}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.type)} &bull; ${escapeHtml(r.time)}</span>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn btn-secondary btn-sm edit-reminder-btn" data-id="${r.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm delete-reminder-btn" data-id="${r.id}">Delete</button>
        </div>
      </div>
    `).join('');

    // Attach toggle handlers
    document.querySelectorAll('.reminder-toggle').forEach(chk => {
      chk.addEventListener('change', async () => {
        const id = chk.getAttribute('data-id');
        const item = allReminders.find(r => r.id === id);
        if (item) {
          try {
            await window.mediMateDB.saveReminder(user.uid, {
              ...item,
              enabled: chk.checked
            });
            window.MediMateConfig.showToast(`Reminder ${chk.checked ? 'enabled' : 'disabled'}`, 'info');
          } catch (err) {
            chk.checked = !chk.checked;
            window.MediMateConfig.showToast('Could not update reminder', 'error');
          }
        }
      });
    });

    // Attach edit handlers
    document.querySelectorAll('.edit-reminder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = allReminders.find(r => r.id === id);
        if (item) {
          titleInput.value = item.title;
          typeSelect.value = item.type;
          timeInput.value = item.time;
          if (reminderIdInput) reminderIdInput.value = item.id;
          if (submitBtn) submitBtn.textContent = 'Update Reminder';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    // Attach delete handlers
    document.querySelectorAll('.delete-reminder-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = allReminders.find(r => r.id === id);
        const titleLabel = item ? item.title : 'this reminder';

        window.MediMateConfig.showConfirmDialog(
          'Delete Reminder',
          `Are you sure you want to delete "${titleLabel}"?`,
          async () => {
            try {
              await window.mediMateDB.deleteReminder(user.uid, id);
              window.MediMateConfig.showToast('Reminder deleted', 'success');
              if (reminderIdInput && reminderIdInput.value === id) resetForm();
              await loadReminders();
            } catch (err) {
              console.error('Delete error:', err);
              window.MediMateConfig.showToast('Failed to delete reminder', 'error');
            }
          }
        );
      });
    });
  }

  // Active in-page reminder ticker (runs every minute while page is open)
  setInterval(() => {
    checkActiveReminders();
  }, 60000);

  function checkActiveReminders() {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMins}`;

    allReminders.forEach(r => {
      if (r.enabled && r.time === currentTimeStr) {
        triggerReminderAlert(r);
      }
    });
  }

  function triggerReminderAlert(reminder) {
    // 1. In-page toast
    window.MediMateConfig.showToast(`🔔 Reminder: ${reminder.title}`, 'warning');

    // 2. Web Notification API if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`MediMate AI: ${reminder.title}`, {
          body: `Time for your ${reminder.type} wellness habit!`,
          icon: '/favicon.ico'
        });
      } catch (e) {
        console.warn('Native notification failed:', e);
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }
}
