/**
 * MediMate AI - Daily Health Tracker Controller
 * Handles logging and history for water intake, sleep, and physical activity.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupTracker();
});

function setupTracker() {
  const user = window.mediMateDB.getCurrentUser();
  if (!user) return;

  const logForm = document.getElementById('health-log-form');
  const dateInput = document.getElementById('log-date');
  const waterInput = document.getElementById('water-intake');
  const sleepInput = document.getElementById('sleep-hours');
  const bedtimeInput = document.getElementById('bedtime');
  const wakeupInput = document.getElementById('wakeup-time');
  const stepsInput = document.getElementById('steps-count');
  const exerciseMinsInput = document.getElementById('exercise-minutes');
  const exerciseTypeInput = document.getElementById('exercise-type');
  const quickAddBtns = document.querySelectorAll('.quick-add-water');
  const resetWaterBtn = document.getElementById('reset-water-btn');
  const historyContainer = document.getElementById('tracker-history-table-body');
  const logIdInput = document.getElementById('edit-log-id');

  // Default date to today
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.max = todayStr; // Prevent logging into future
  }

  // Quick add water buttons
  quickAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.getAttribute('data-amount') || '0', 10);
      const current = parseInt(waterInput.value || '0', 10);
      waterInput.value = Math.max(0, current + amount);
      updateWaterVisual(waterInput.value);
    });
  });

  if (resetWaterBtn) {
    resetWaterBtn.addEventListener('click', () => {
      waterInput.value = 0;
      updateWaterVisual(0);
    });
  }

  if (waterInput) {
    waterInput.addEventListener('input', () => {
      updateWaterVisual(waterInput.value);
    });
  }

  function updateWaterVisual(val) {
    const meter = document.getElementById('tracker-water-progress');
    const text = document.getElementById('tracker-water-text');
    const num = parseInt(val || '0', 10);
    if (meter) {
      meter.style.width = `${Math.min(100, Math.round((num / 2500) * 100))}%`;
    }
    if (text) {
      text.textContent = `${num.toLocaleString()} / 2,500 mL (approx. baseline)`;
    }
  }

  // Load existing log for selected date if present
  if (dateInput) {
    dateInput.addEventListener('change', async () => {
      await loadLogForDate(dateInput.value);
    });
  }

  // Form submit (Add / Update)
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const date = dateInput.value;
      const waterIntakeMl = parseInt(waterInput.value || '0', 10);
      const sleepHours = parseFloat(sleepInput.value || '0');
      const bedtime = bedtimeInput ? bedtimeInput.value : '';
      const wakeupTime = wakeupInput ? wakeupInput.value : '';
      const steps = parseInt(stepsInput.value || '0', 10);
      const exerciseMinutes = parseInt(exerciseMinsInput.value || '0', 10);
      const exerciseType = exerciseTypeInput ? exerciseTypeInput.value : 'General';
      const existingId = logIdInput ? logIdInput.value : '';

      // Validation
      if (!date) {
        window.MediMateConfig.showToast('Please select a valid date', 'warning');
        return;
      }
      if (sleepHours < 0 || sleepHours > 24) {
        window.MediMateConfig.showToast('Sleep hours must be between 0 and 24', 'warning');
        return;
      }
      if (waterIntakeMl < 0 || steps < 0 || exerciseMinutes < 0) {
        window.MediMateConfig.showToast('Numeric values cannot be negative', 'warning');
        return;
      }

      const logPayload = {
        date,
        waterIntakeMl,
        sleepHours,
        bedtime,
        wakeupTime,
        steps,
        exerciseMinutes,
        exerciseType
      };

      if (existingId) {
        logPayload.id = existingId;
      }

      try {
        await window.mediMateDB.saveHealthLog(user.uid, logPayload);
        window.MediMateConfig.showToast(existingId ? 'Record updated successfully!' : 'Record saved successfully!', 'success');
        
        // Reset edit id
        if (logIdInput) logIdInput.value = '';
        const submitBtn = document.getElementById('log-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Save Daily Record';

        await loadHistory();
      } catch (err) {
        console.error('Save error:', err);
        window.MediMateConfig.showToast('Failed to save record: ' + err.message, 'error');
      }
    });
  }

  async function loadLogForDate(dateStr) {
    try {
      const logs = await window.mediMateDB.getHealthLogs(user.uid);
      const match = logs.find(l => l.date === dateStr);
      if (match) {
        waterInput.value = match.waterIntakeMl || 0;
        sleepInput.value = match.sleepHours || 0;
        if (bedtimeInput) bedtimeInput.value = match.bedtime || '';
        if (wakeupInput) wakeupInput.value = match.wakeupTime || '';
        if (stepsInput) stepsInput.value = match.steps || 0;
        if (exerciseMinsInput) exerciseMinsInput.value = match.exerciseMinutes || 0;
        if (exerciseTypeInput) exerciseTypeInput.value = match.exerciseType || 'Walking';
        if (logIdInput) logIdInput.value = match.id;
        
        const submitBtn = document.getElementById('log-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Update Existing Record';
        updateWaterVisual(match.waterIntakeMl);
      } else {
        // Reset to zeros for fresh date
        waterInput.value = 0;
        sleepInput.value = 0;
        if (bedtimeInput) bedtimeInput.value = '';
        if (wakeupInput) wakeupInput.value = '';
        if (stepsInput) stepsInput.value = 0;
        if (exerciseMinsInput) exerciseMinsInput.value = 0;
        if (logIdInput) logIdInput.value = '';
        const submitBtn = document.getElementById('log-submit-btn');
        if (submitBtn) submitBtn.textContent = 'Save Daily Record';
        updateWaterVisual(0);
      }
    } catch (err) {
      console.error('Error fetching log for date:', err);
    }
  }

  async function loadHistory() {
    if (!historyContainer) return;

    try {
      const logs = await window.mediMateDB.getHealthLogs(user.uid);

      if (!logs || logs.length === 0) {
        historyContainer.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
              No health records logged yet. Fill out the form above to record your day!
            </td>
          </tr>
        `;
        return;
      }

      historyContainer.innerHTML = logs.map(log => `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${escapeHtml(log.date)}</td>
          <td><span class="badge badge-info">${(log.waterIntakeMl || 0).toLocaleString()} mL</span></td>
          <td><span class="badge" style="background:#EDE9FE; color:#7C3AED;">${log.sleepHours || 0} hrs</span></td>
          <td>${(log.steps || 0).toLocaleString()}</td>
          <td>
            ${log.exerciseMinutes ? `${log.exerciseMinutes} mins (${escapeHtml(log.exerciseType || 'Exercise')})` : '<span style="color:var(--text-muted)">None</span>'}
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-sm edit-record-btn" data-id="${log.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm delete-record-btn" data-id="${log.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      // Attach edit events
      document.querySelectorAll('.edit-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = logs.find(l => l.id === id);
          if (item) {
            dateInput.value = item.date;
            waterInput.value = item.waterIntakeMl || 0;
            sleepInput.value = item.sleepHours || 0;
            if (bedtimeInput) bedtimeInput.value = item.bedtime || '';
            if (wakeupInput) wakeupInput.value = item.wakeupTime || '';
            if (stepsInput) stepsInput.value = item.steps || 0;
            if (exerciseMinsInput) exerciseMinsInput.value = item.exerciseMinutes || 0;
            if (exerciseTypeInput) exerciseTypeInput.value = item.exerciseType || 'Walking';
            if (logIdInput) logIdInput.value = item.id;

            const submitBtn = document.getElementById('log-submit-btn');
            if (submitBtn) submitBtn.textContent = 'Update Existing Record';
            updateWaterVisual(item.waterIntakeMl);

            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.MediMateConfig.showToast(`Editing log for ${item.date}`, 'info');
          }
        });
      });

      // Attach delete events
      document.querySelectorAll('.delete-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = logs.find(l => l.id === id);
          const dateLabel = item ? item.date : 'this entry';

          window.MediMateConfig.showConfirmDialog(
            'Delete Health Record',
            `Are you sure you want to permanently delete the wellness record for ${dateLabel}?`,
            async () => {
              try {
                await window.mediMateDB.deleteHealthLog(user.uid, id);
                window.MediMateConfig.showToast('Record deleted successfully', 'success');
                if (logIdInput && logIdInput.value === id) {
                  logIdInput.value = '';
                  const submitBtn = document.getElementById('log-submit-btn');
                  if (submitBtn) submitBtn.textContent = 'Save Daily Record';
                }
                await loadHistory();
              } catch (err) {
                console.error('Delete error:', err);
                window.MediMateConfig.showToast('Failed to delete record: ' + err.message, 'error');
              }
            }
          );
        });
      });

    } catch (err) {
      console.error('Error loading history:', err);
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

  // Initial loads
  loadLogForDate(todayStr);
  loadHistory();
}
