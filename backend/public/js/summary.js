/**
 * MediMate AI - AI Wellness Summary Controller
 * Compiles user Firestore records, requests Gemini analysis, and renders structured reports.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupSummaryModule();
});

function setupSummaryModule() {
  const user = window.mediMateDB.getCurrentUser();
  if (!user) return;

  const generateBtn = document.getElementById('generate-summary-btn');
  const periodSelect = document.getElementById('summary-period-select');
  const includeJournalCheckbox = document.getElementById('include-journal-checkbox');
  const summaryReportContainer = document.getElementById('summary-report-container');
  const summaryHistoryList = document.getElementById('summary-history-list');

  // Load past summaries
  loadSummaryHistory();

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const period = periodSelect ? periodSelect.value : 'daily';
      const includeJournals = includeJournalCheckbox ? includeJournalCheckbox.checked : false;

      generateBtn.disabled = true;
      generateBtn.innerHTML = `
        <span class="typing-dot" style="display:inline-block; width:6px; height:6px;"></span>
        Analyzing Records...
      `;

      if (summaryReportContainer) {
        summaryReportContainer.innerHTML = `
          <div style="padding: 40px; text-align: center;">
            <div class="skeleton" style="height: 24px; width: 60%; margin: 0 auto 16px;"></div>
            <div class="skeleton" style="height: 16px; width: 85%; margin: 0 auto 12px;"></div>
            <div class="skeleton" style="height: 16px; width: 75%; margin: 0 auto 24px;"></div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Aggregating cloud health records and compiling insights...</p>
          </div>
        `;
      }

      try {
        // Step 1: Retrieve user records from Firestore
        const allLogs = await window.mediMateDB.getHealthLogs(user.uid);
        let allJournals = [];
        if (includeJournals) {
          allJournals = await window.mediMateDB.getJournalEntries(user.uid);
        }

        // Filter based on period
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let targetLogs = [];
        let targetJournals = [];

        if (period === 'daily') {
          targetLogs = allLogs.filter(l => l.date === todayStr);
          targetJournals = allJournals.filter(j => j.date === todayStr);
        } else {
          // Last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          const cutoff = sevenDaysAgo.toISOString().split('T')[0];

          targetLogs = allLogs.filter(l => l.date >= cutoff);
          targetJournals = allJournals.filter(j => j.date >= cutoff);
        }

        // Step 2: Call Express Backend /api/summary
        const response = await fetch(`${window.MediMateConfig.BACKEND_URL}/api/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            period,
            healthLogs: targetLogs,
            journalEntries: targetJournals
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Step 3: Render Report
        renderSummaryReport(data.summaryText, data.isFallback, data.disclaimer, targetLogs.length);

        // Step 4: Persist Report to Firestore
        await window.mediMateDB.saveSummary(user.uid, {
          period,
          summaryText: data.summaryText,
          isFallback: data.isFallback,
          logsCount: targetLogs.length,
          startDate: period === 'daily' ? todayStr : 'Past 7 Days'
        });

        window.MediMateConfig.showToast('Wellness summary generated and saved!', 'success');
        await loadSummaryHistory();

      } catch (err) {
        console.error('Summary error:', err);
        window.MediMateConfig.showToast('Could not generate summary: ' + err.message, 'error');
        if (summaryReportContainer) {
          summaryReportContainer.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon" style="color: var(--status-error);">⚠️</div>
              <h3>Summary Generation Failed</h3>
              <p>${escapeHtml(err.message || 'Please check backend server connection')}</p>
            </div>
          `;
        }
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          Generate Wellness Summary
        `;
      }
    });
  }

  function renderSummaryReport(text, isFallback, disclaimer, logsCount) {
    if (!summaryReportContainer) return;

    const fallbackAlert = isFallback
      ? `<div style="background: #FEF3C7; border: 1px solid #FDE68A; color: #92400E; padding: 10px 14px; border-radius: 8px; font-size: 0.825rem; margin-bottom: 16px;">
          <strong>Notice:</strong> Generated using local statistical engine. For full generative AI narratives, add your free Google AI Studio API key in <code>backend/.env</code>.
        </div>`
      : '';

    const formattedContent = formatSummaryMarkdown(text);

    summaryReportContainer.innerHTML = `
      <div class="card" style="border-top: 4px solid var(--primary-teal);">
        <div class="card-header">
          <div>
            <span class="badge badge-teal">Report Complete</span>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">Analyzed ${logsCount} record(s)</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">Print / Export</button>
        </div>
        ${fallbackAlert}
        <div style="line-height: 1.7; color: var(--text-main); font-size: 0.95rem;">
          ${formattedContent}
        </div>
        <div class="medical-disclaimer-banner" style="margin-top: 24px; margin-bottom: 0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>${escapeHtml(disclaimer || 'MediMate AI provides general health and wellness information only. It is not a medical professional.')}</span>
        </div>
      </div>
    `;
  }

  async function loadSummaryHistory() {
    if (!summaryHistoryList) return;

    try {
      const summaries = await window.mediMateDB.getSummaries(user.uid);

      if (!summaries || summaries.length === 0) {
        summaryHistoryList.innerHTML = `
          <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.875rem;">
            No past summaries saved. Generate your first summary above!
          </div>
        `;
        return;
      }

      summaryHistoryList.innerHTML = summaries.slice(0, 5).map(s => {
        const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '';
        return `
          <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge ${s.period === 'weekly' ? 'badge-info' : 'badge-teal'}">${s.period}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 8px;">${dateStr}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm view-past-summary-btn" data-id="${s.id}">View</button>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.view-past-summary-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const item = summaries.find(s => s.id === id);
          if (item) {
            renderSummaryReport(item.summaryText, item.isFallback, '', item.logsCount || 0);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }
        });
      });

    } catch (err) {
      console.error('History fetch error:', err);
    }
  }

  function formatSummaryMarkdown(md) {
    if (!md) return '';
    let text = md.replace(/\r\n/g, '\n');
    let html = escapeHtml(text);
    html = html.replace(/^#### (.*?)$/gm, '<h4 style="margin-top:14px; margin-bottom:4px; font-size:1.05rem; font-weight:700;">$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top:18px; margin-bottom:6px; color:var(--dark-teal); font-size:1.2rem; font-weight:700;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top:20px; margin-bottom:8px; color:var(--primary-teal); font-size:1.35rem; font-weight:800;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h2 style="margin-top:20px; margin-bottom:8px; color:var(--primary-teal); font-size:1.35rem; font-weight:800;">$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^-\s+(.*?)$/gm, '• $1');
    html = html.replace(/^\*\s+(.*?)$/gm, '• $1');
    html = html.replace(/\n\n+/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');
    return html;
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
