/**
 * MediMate AI - Personal Health Journal Controller
 * Enables private reflective logging of wellness notes, mood, energy, and symptoms.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupJournal();
});

function setupJournal() {
  const user = window.mediMateDB.getCurrentUser();
  if (!user) return;

  const journalForm = document.getElementById('journal-form');
  const dateInput = document.getElementById('journal-date');
  const notesInput = document.getElementById('journal-notes');
  const symptomsInput = document.getElementById('journal-symptoms');
  const moodSelect = document.getElementById('journal-mood');
  const energySelect = document.getElementById('journal-energy');
  const entryIdInput = document.getElementById('journal-entry-id');
  const searchInput = document.getElementById('journal-search');
  const entriesList = document.getElementById('journal-entries-list');
  const submitBtn = document.getElementById('journal-submit-btn');
  const cancelEditBtn = document.getElementById('journal-cancel-edit-btn');

  let allEntries = [];

  // Default date to today
  const todayStr = new Date().toISOString().split('T')[0];
  if (dateInput) {
    dateInput.value = todayStr;
  }

  // Load entries
  loadJournalEntries();

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      const filtered = allEntries.filter(e => {
        const notesMatch = (e.notes || '').toLowerCase().includes(query);
        const symptomsMatch = (e.symptoms || '').toLowerCase().includes(query);
        const moodMatch = (e.mood || '').toLowerCase().includes(query);
        return notesMatch || symptomsMatch || moodMatch;
      });
      renderEntries(filtered);
    });
  }

  // Cancel edit
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      resetForm();
    });
  }

  // Form submission
  if (journalForm) {
    journalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const date = dateInput.value;
      const notes = notesInput.value.trim();
      const symptoms = symptomsInput ? symptomsInput.value.trim() : '';
      const mood = moodSelect ? moodSelect.value : 'Calm';
      const energyLevel = energySelect ? parseInt(energySelect.value, 10) : 3;
      const existingId = entryIdInput ? entryIdInput.value : '';

      if (!date || !notes) {
        window.MediMateConfig.showToast('Please provide both date and journal notes', 'warning');
        return;
      }

      const payload = {
        date,
        notes,
        symptoms,
        mood,
        energyLevel
      };

      if (existingId) {
        payload.id = existingId;
      }

      try {
        await window.mediMateDB.saveJournalEntry(user.uid, payload);
        window.MediMateConfig.showToast(existingId ? 'Journal entry updated' : 'Journal entry saved', 'success');
        resetForm();
        await loadJournalEntries();
      } catch (err) {
        console.error('Journal save error:', err);
        window.MediMateConfig.showToast('Failed to save journal: ' + err.message, 'error');
      }
    });
  }

  function resetForm() {
    if (journalForm) journalForm.reset();
    if (dateInput) dateInput.value = todayStr;
    if (entryIdInput) entryIdInput.value = '';
    if (submitBtn) submitBtn.textContent = 'Save Reflection';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
  }

  async function loadJournalEntries() {
    try {
      allEntries = await window.mediMateDB.getJournalEntries(user.uid);
      renderEntries(allEntries);
    } catch (err) {
      console.error('Failed to load journals:', err);
    }
  }

  function renderEntries(entries) {
    if (!entriesList) return;

    if (!entries || entries.length === 0) {
      entriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <h3>No Journal Reflections Found</h3>
          <p>Your journal is private to you. Write your first reflection, track moods, or note daily experiences above.</p>
        </div>
      `;
      return;
    }

    entriesList.innerHTML = entries.map(entry => {
      const moodBadge = entry.mood ? `<span class="badge badge-teal">${escapeHtml(entry.mood)}</span>` : '';
      const energyBadge = entry.energyLevel ? `<span class="badge badge-info">⚡ Energy ${entry.energyLevel}/5</span>` : '';
      const symptomsTag = entry.symptoms ? `<div style="margin-top: 8px; font-size: 0.825rem; color: #9A3412; background: #FFEDD5; padding: 4px 10px; border-radius: 6px; width: fit-content;"><strong>Notes/Symptoms:</strong> ${escapeHtml(entry.symptoms)}</div>` : '';

      return `
        <div class="card" style="margin-bottom: 16px;">
          <div class="card-header" style="margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-main);">${escapeHtml(entry.date)}</span>
              ${moodBadge}
              ${energyBadge}
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn btn-secondary btn-sm edit-journal-btn" data-id="${entry.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm delete-journal-btn" data-id="${entry.id}">Delete</button>
            </div>
          </div>
          <p style="color: var(--text-main); white-space: pre-line; line-height: 1.6; margin: 0;">${escapeHtml(entry.notes)}</p>
          ${symptomsTag}
        </div>
      `;
    }).join('');

    // Attach edit handlers
    document.querySelectorAll('.edit-journal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = allEntries.find(e => e.id === id);
        if (item) {
          dateInput.value = item.date;
          notesInput.value = item.notes;
          if (symptomsInput) symptomsInput.value = item.symptoms || '';
          if (moodSelect) moodSelect.value = item.mood || 'Calm';
          if (energySelect) energySelect.value = item.energyLevel || 3;
          if (entryIdInput) entryIdInput.value = item.id;

          if (submitBtn) submitBtn.textContent = 'Update Reflection';
          if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';

          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.MediMateConfig.showToast(`Editing journal entry for ${item.date}`, 'info');
        }
      });
    });

    // Attach delete handlers
    document.querySelectorAll('.delete-journal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = allEntries.find(e => e.id === id);
        const dateLabel = item ? item.date : 'this entry';

        window.MediMateConfig.showConfirmDialog(
          'Delete Journal Entry',
          `Are you sure you want to permanently delete this private journal entry from ${dateLabel}?`,
          async () => {
            try {
              await window.mediMateDB.deleteJournalEntry(user.uid, id);
              window.MediMateConfig.showToast('Journal entry deleted', 'success');
              if (entryIdInput && entryIdInput.value === id) {
                resetForm();
              }
              await loadJournalEntries();
            } catch (err) {
              console.error('Delete error:', err);
              window.MediMateConfig.showToast('Failed to delete entry: ' + err.message, 'error');
            }
          }
        );
      });
    });
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
