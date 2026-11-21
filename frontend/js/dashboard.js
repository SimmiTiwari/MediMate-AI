/**
 * MediMate AI - Main Dashboard Controller
 * Aggregates health metrics, renders Chart.js analytics, and manages dashboard widgets.
 */

document.addEventListener('DOMContentLoaded', () => {
  setupGreeting();
  loadDashboardData();
});

function setupGreeting() {
  const greetingEl = document.getElementById('dashboard-greeting');
  const dateEl = document.getElementById('dashboard-date');

  const now = new Date();
  const hour = now.getHours();

  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';

  if (greetingEl) {
    greetingEl.textContent = greeting;
  }

  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString(undefined, options);
  }
}

async function loadDashboardData() {
  const user = window.mediMateDB.getCurrentUser();
  if (!user) return;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch user logs, journals, and reminders
    const [logs, journals, reminders] = await Promise.all([
      window.mediMateDB.getHealthLogs(user.uid),
      window.mediMateDB.getJournalEntries(user.uid),
      window.mediMateDB.getReminders(user.uid)
    ]);

    // Find today's log
    const todayLog = logs.find(l => l.date === todayStr);

    renderMetricCards(todayLog);
    renderCharts(logs);
    renderRecentJournals(journals);
    renderUpcomingReminders(reminders);
  } catch (err) {
    console.error('Error loading dashboard data:', err);
    window.MediMateConfig.showToast('Could not load some dashboard metrics', 'warning');
  }
}

function renderMetricCards(todayLog) {
  const waterVal = document.getElementById('metric-water-val');
  const sleepVal = document.getElementById('metric-sleep-val');
  const stepsVal = document.getElementById('metric-steps-val');
  const exerciseVal = document.getElementById('metric-exercise-val');

  const waterBar = document.getElementById('metric-water-bar');
  const sleepBar = document.getElementById('metric-sleep-bar');
  const stepsBar = document.getElementById('metric-steps-bar');

  if (todayLog) {
    const water = Number(todayLog.waterIntakeMl) || 0;
    const sleep = Number(todayLog.sleepHours) || 0;
    const steps = Number(todayLog.steps) || 0;
    const exercise = Number(todayLog.exerciseMinutes) || 0;

    if (waterVal) waterVal.textContent = `${water.toLocaleString()} mL`;
    if (sleepVal) sleepVal.textContent = `${sleep} hrs`;
    if (stepsVal) stepsVal.textContent = `${steps.toLocaleString()}`;
    if (exerciseVal) exerciseVal.textContent = `${exercise} mins`;

    // Progress bar calculations (based on standard reference guides)
    if (waterBar) waterBar.style.width = `${Math.min(100, Math.round((water / 2500) * 100))}%`;
    if (sleepBar) sleepBar.style.width = `${Math.min(100, Math.round((sleep / 8) * 100))}%`;
    if (stepsBar) stepsBar.style.width = `${Math.min(100, Math.round((steps / 10000) * 100))}%`;
  } else {
    if (waterVal) waterVal.textContent = '0 mL';
    if (sleepVal) sleepVal.textContent = '0 hrs';
    if (stepsVal) stepsVal.textContent = '0';
    if (exerciseVal) exerciseVal.textContent = '0 mins';

    if (waterBar) waterBar.style.width = '0%';
    if (sleepBar) sleepBar.style.width = '0%';
    if (stepsBar) stepsBar.style.width = '0%';
  }
}

function renderCharts(logs) {
  // Sort logs chronologically ascending for charts
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentDays = sortedLogs.slice(-7);

  const labels = recentDays.map(l => {
    const d = new Date(l.date + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  });

  const stepsData = recentDays.map(l => Number(l.steps) || 0);
  const exerciseData = recentDays.map(l => Number(l.exerciseMinutes) || 0);
  const sleepData = recentDays.map(l => Number(l.sleepHours) || 0);
  const waterData = recentDays.map(l => Number(l.waterIntakeMl) || 0);

  // 1. Activity Chart (Steps & Exercise)
  const activityCanvas = document.getElementById('activityChart');
  if (activityCanvas && typeof Chart !== 'undefined') {
    if (window.activityChartInstance) window.activityChartInstance.destroy();

    window.activityChartInstance = new Chart(activityCanvas, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Steps',
            data: stepsData.length ? stepsData : [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#0F766E',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Exercise (mins)',
            data: exerciseData.length ? exerciseData : [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: '#14B8A6',
            borderRadius: 6,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: '#F1F5F9' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }

  // 2. Sleep & Hydration Trend Chart
  const sleepCanvas = document.getElementById('sleepChart');
  if (sleepCanvas && typeof Chart !== 'undefined') {
    if (window.sleepChartInstance) window.sleepChartInstance.destroy();

    window.sleepChartInstance = new Chart(sleepCanvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Sleep (hours)',
            data: sleepData.length ? sleepData : [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Water (mL)',
            data: waterData.length ? waterData : [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#0284C7',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            suggestedMin: 0,
            suggestedMax: 10,
            grid: { color: '#F1F5F9' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            suggestedMin: 0,
            suggestedMax: 3500,
            grid: { drawOnChartArea: false }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });
  }
}

function renderRecentJournals(journals) {
  const container = document.getElementById('recent-journals-list');
  if (!container) return;

  if (!journals || journals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 12px;">
        <p style="margin: 0; color: var(--text-muted);">No journal entries yet.</p>
        <a href="journal.html" class="btn btn-outline-teal btn-sm" style="margin-top: 10px;">Write first note</a>
      </div>
    `;
    return;
  }

  const recent = journals.slice(0, 3);
  container.innerHTML = recent.map(j => `
    <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${j.date}</span>
        <p style="font-size: 0.875rem; color: var(--text-main); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;">
          ${escapeHtml(j.notes || 'No description')}
        </p>
      </div>
      ${j.mood ? `<span class="badge badge-teal">${escapeHtml(j.mood)}</span>` : ''}
    </div>
  `).join('');
}

function renderUpcomingReminders(reminders) {
  const container = document.getElementById('upcoming-reminders-list');
  if (!container) return;

  const activeReminders = reminders.filter(r => r.enabled);

  if (activeReminders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 12px;">
        <p style="margin: 0; color: var(--text-muted);">No active reminders set.</p>
        <a href="reminders.html" class="btn btn-outline-teal btn-sm" style="margin-top: 10px;">Create reminder</a>
      </div>
    `;
    return;
  }

  container.innerHTML = activeReminders.slice(0, 4).map(r => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-color);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--primary-teal);"></div>
        <div>
          <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-main);">${escapeHtml(r.title)}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${r.type}</span>
        </div>
      </div>
      <span class="badge badge-info">${escapeHtml(r.time)}</span>
    </div>
  `).join('');
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
