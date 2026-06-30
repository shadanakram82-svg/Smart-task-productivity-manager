/* ─────────────────────────────────────────
   app.js - Dashboard Application Logic
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!AppDB.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // DOM Elements
  const body = document.body;
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  const welcomeNameEl = document.getElementById('welcome-name');
  const currentDateEl = document.getElementById('current-date');
  const btnLogout = document.getElementById('btn-logout');
  
  // Modals
  const taskModal = document.getElementById('task-modal');
  const settingsModal = document.getElementById('settings-modal');
  const taskForm = document.getElementById('task-form');
  const settingsForm = document.getElementById('settings-form');
  
  // Theme Toggle
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  // Drag & Drop specific tracking
  let draggedTaskId = null;

  // ── INIT APP ──
  function init() {
    initUser();
    initSettings();
    updateDate();
    renderCategories();
    renderNotifications();
    renderDashboard();
    setupEventListeners();
  }

  function initUser() {
    const user = AppDB.data.user;
    if (userNameEl) userNameEl.innerText = user.name || 'User';
    if (welcomeNameEl) welcomeNameEl.innerText = user.name || 'User';
    
    // Update the email in the new sidebar profile
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) userEmailEl.innerText = user.email || 'user@example.com';
    
    // Update the Dropdown User Profile
    const ddUserNameEl = document.getElementById('dropdown-user-name');
    if (ddUserNameEl) ddUserNameEl.innerText = user.name || 'User';
    const ddUserEmailEl = document.getElementById('dropdown-user-email');
    if (ddUserEmailEl) ddUserEmailEl.innerText = user.email || 'user@example.com';
    
    if (userAvatarEl) {
      userAvatarEl.innerText = (user.name || 'U').substring(0, 2).toUpperCase();
    }
  }

  function updateDate() {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    currentDateEl.innerText = new Date().toLocaleDateString('en-US', options);
  }

  // ── SETTINGS & THEME ──
  function initSettings() {
    const settings = AppDB.getSettings();
    applySettings(settings);
    
    // Populate form
    document.getElementById('setting-theme').value = settings.theme;
    document.getElementById('setting-accent').value = settings.accentColor;
    document.getElementById('setting-font').value = settings.fontSize;
    document.getElementById('setting-card').value = settings.cardStyle;
  }

  function applySettings(settings) {
    // Theme
    body.className = '';
    body.classList.add(`theme-${settings.theme}`);
    
    // Custom Accent
    if (settings.theme === 'dark' || settings.theme === 'light') {
      document.documentElement.style.setProperty('--accent', settings.accentColor);
      
      // Calculate a slightly darker hover state (simple hex parse)
      // This is a basic implementation. For production, use HSL or a color library
      document.documentElement.style.setProperty('--accent-transparent', settings.accentColor + '26'); // 15% opacity
    } else {
      // Reset if using predefined color theme
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-transparent');
    }

    // Font size
    let baseSize = '16px';
    if (settings.fontSize === 'small') baseSize = '14px';
    if (settings.fontSize === 'large') baseSize = '18px';
    document.documentElement.style.setProperty('--font-base', baseSize);

    // Card Style
    body.setAttribute('data-card-style', settings.cardStyle);
  }

  btnThemeToggle.addEventListener('click', () => {
    const currentSettings = AppDB.getSettings();
    const newTheme = currentSettings.theme === 'light' ? 'dark' : 'light';
    AppDB.updateSettings({ theme: newTheme });
    initSettings();
    showToast(`Switched to ${newTheme} theme`, 'success');
  });

  // ── TOASTS ──
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    if (type === 'error') {
      icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  // ── RENDERING ──
  function renderDashboard() {
    const tasks = AppDB.getTasks();
    
    // Stats
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTotal = tasks.filter(t => t.status === 'Pending').length;
    const pendingCombined = pendingTotal + inProgress;
    const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length;
    
    document.getElementById('stat-total').innerText = tasks.length;
    document.getElementById('stat-completed').innerText = completed;
    document.getElementById('stat-pending').innerText = pendingCombined;
    document.getElementById('stat-high-priority').innerText = highPriority;

    // Kanban
    renderKanbanColumns(tasks);
    
    // My Tasks List
    const currentSearch = document.getElementById('tasks-search')?.value || '';
    renderTasksList(currentSearch);
    
    // Analytics
    renderProductivityRing(completed, inProgress, pendingTotal, tasks.length);
    renderCharts(tasks);
    // Productivity Dashboard
    renderProductivityView();
    
    // Analytics Dashboard
    renderAnalyticsView();
  }

  function renderCategories() {
    const select = document.getElementById('task-category');
    select.innerHTML = '';
    AppDB.getCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.innerText = cat;
      select.appendChild(opt);
    });
  }

  function renderKanbanColumns(allTasks) {
    const zones = {
      'Pending': document.getElementById('zone-pending'),
      'In Progress': document.getElementById('zone-in-progress'),
      'Completed': document.getElementById('zone-completed')
    };

    // Clear zones
    Object.values(zones).forEach(z => z.innerHTML = '');

    const counts = { 'Pending': 0, 'In Progress': 0, 'Completed': 0 };

    allTasks.forEach(task => {
      if (zones[task.status]) {
        counts[task.status]++;
        const card = createTaskCard(task);
        zones[task.status].appendChild(card);
      }
    });

    // Update counts
    document.getElementById('count-pending').innerText = counts['Pending'];
    document.getElementById('count-in-progress').innerText = counts['In Progress'];
    document.getElementById('count-completed').innerText = counts['Completed'];
  }

  function renderTasksList(filterQuery = '') {
    const tbody = document.getElementById('tasks-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const allTasks = AppDB.getTasks();
    
    const lowerQuery = filterQuery.toLowerCase();
    const tasks = allTasks.filter(task => {
      const title = (task.title || '').toLowerCase();
      const desc = (task.description || '').toLowerCase();
      const cat = (task.category || '').toLowerCase();
      const tags = (task.tags || []).join(' ').toLowerCase();
      return title.includes(lowerQuery) || desc.includes(lowerQuery) || cat.includes(lowerQuery) || tags.includes(lowerQuery);
    });
    
    if (tasks.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No matching tasks found.</td></tr>';
      return;
    }
    
    // Sort tasks by created date descending
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    sortedTasks.forEach(task => {
      const tr = document.createElement('tr');
      
      // Determine status color
      let statusColor = 'var(--text-muted)';
      if (task.status === 'Completed') statusColor = 'var(--priority-low)';
      if (task.status === 'In Progress') statusColor = 'var(--priority-medium)';
      
      const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-';
      const tagHtml = task.tags && task.tags.length > 0 
        ? task.tags.map(t => `<span class="badge category" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">${t}</span>`).join(' ')
        : '-';
        
      tr.innerHTML = `
        <td>
          <span class="status-indicator" style="background-color: ${statusColor};"></span>
          ${task.status}
        </td>
        <td>
          <span class="task-title-cell">${task.title}</span>
          <span class="task-desc-cell" title="${task.description || ''}">${task.description || ''}</span>
        </td>
        <td><span class="badge category">${task.category}</span></td>
        <td><span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
        <td>${dateStr}</td>
        <td>${tagHtml}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${task.id}" title="Edit Task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="action-btn delete delete-btn" data-id="${task.id}" title="Delete Task">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
    
    // Attach event listeners for edit and delete
    tbody.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openTaskModal(btn.dataset.id);
      });
    });
    
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this task?')) {
          AppDB.deleteTask(btn.dataset.id);
          renderDashboard();
          showToast('Task deleted successfully');
        }
      });
    });
  }

  function renderProductivityView() {
    const tasks = AppDB.getTasks();
    const todayStr = new Date().toLocaleDateString();
    
    // Overview metrics
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const remaining = pending + inProgress;
    
    const prodCompleted = document.getElementById('prod-completed');
    if(prodCompleted) prodCompleted.innerText = completed;
    const prodPending = document.getElementById('prod-pending');
    if(prodPending) prodPending.innerText = pending;
    const prodInprogress = document.getElementById('prod-inprogress');
    if(prodInprogress) prodInprogress.innerText = inProgress;
    const prodRemaining = document.getElementById('prod-remaining');
    if(prodRemaining) prodRemaining.innerText = remaining;
    
    // Avg tasks (mocked as completed / 7 for demo)
    const prodAvg = document.getElementById('prod-avg');
    if(prodAvg) prodAvg.innerText = (completed / 7).toFixed(1);
    
    // Productivity Score (Completion rate)
    const total = tasks.length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const scoreText = document.getElementById('prod-score-text');
    if (scoreText) scoreText.textContent = `${completionRate}`;
    const scoreRing = document.getElementById('prod-score-ring');
    if (scoreRing) scoreRing.setAttribute('stroke-dasharray', `${completionRate}, 100`);
    
    // Most Productive Month Calculation
    const monthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completedDate);
    
    if (completedTasks.length > 0) {
      const monthCounts = {};
      completedTasks.forEach(t => {
        const m = new Date(t.completedDate).getMonth();
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      });
      let bestMonth = 0;
      let maxCount = 0;
      for (const [month, count] of Object.entries(monthCounts)) {
        if (count > maxCount) {
          maxCount = count;
          bestMonth = parseInt(month);
        }
      }
      const elBestMonth = document.getElementById('prod-best-month');
      if (elBestMonth) elBestMonth.innerText = monthsOfYear[bestMonth];
    } else {
      const elBestMonth = document.getElementById('prod-best-month');
      if (elBestMonth) elBestMonth.innerText = 'None yet';
    }

    // Most Productive Year Calculation
    if (completedTasks.length > 0) {
      const yearCounts = {};
      completedTasks.forEach(t => {
        const y = new Date(t.completedDate).getFullYear();
        yearCounts[y] = (yearCounts[y] || 0) + 1;
      });
      let bestYear = 0;
      let maxYCount = 0;
      for (const [year, count] of Object.entries(yearCounts)) {
        if (count > maxYCount) {
          maxYCount = count;
          bestYear = parseInt(year);
        }
      }
      const elBestYear = document.getElementById('prod-best-year');
      if (elBestYear) elBestYear.innerText = bestYear;
    } else {
      const elBestYear = document.getElementById('prod-best-year');
      if (elBestYear) elBestYear.innerText = 'None yet';
    }

    // Daily Streak Calculation
    let streak = 0;
    if (completedTasks.length > 0) {
      const uniqueDates = [...new Set(completedTasks.map(t => new Date(t.completedDate).toLocaleDateString()))];
      uniqueDates.sort((a,b) => new Date(b) - new Date(a)); // Descending
      
      const todayDate = new Date();
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      
      const tStr = todayDate.toLocaleDateString();
      const yStr = yesterdayDate.toLocaleDateString();
      
      let currDateStr = tStr;
      let currDateObj = todayDate;
      
      if (uniqueDates.includes(tStr)) {
        streak = 1;
      } else if (uniqueDates.includes(yStr)) {
        streak = 1;
        currDateObj = yesterdayDate;
      }
      
      if (streak > 0) {
        while (true) {
          currDateObj.setDate(currDateObj.getDate() - 1);
          if (uniqueDates.includes(currDateObj.toLocaleDateString())) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    const elStreak = document.getElementById('prod-streak');
    if (elStreak) elStreak.innerText = streak;
    
    // Goals & Progress
    const dailyTarget = 5;
    const dailyCompleted = tasks.filter(t => t.status === 'Completed' && new Date(t.completedDate).toLocaleDateString() === todayStr).length;
    const dailyPct = Math.min(100, Math.round((dailyCompleted / dailyTarget) * 100));
    
    const goalDailyText = document.getElementById('goal-daily-text');
    if(goalDailyText) goalDailyText.innerText = `${dailyPct}%`;
    const goalDailyFill = document.getElementById('goal-daily-fill');
    if(goalDailyFill) goalDailyFill.style.width = `${dailyPct}%`;
    
    const weeklyPct = Math.min(100, Math.round((completed / 15) * 100));
    const goalWeeklyCount = document.getElementById('goal-weekly-count');
    if(goalWeeklyCount) goalWeeklyCount.innerText = `${completed}/15`;
    const goalWeeklyText = document.getElementById('goal-weekly-text');
    if(goalWeeklyText) goalWeeklyText.innerText = `${weeklyPct}%`;
    const goalWeeklyFill = document.getElementById('goal-weekly-fill');
    if(goalWeeklyFill) goalWeeklyFill.style.width = `${weeklyPct}%`;
    
    const monthlyPct = Math.min(100, Math.round((completed / 50) * 100));
    const goalMonthlyText = document.getElementById('goal-monthly-text');
    if(goalMonthlyText) goalMonthlyText.innerText = `${monthlyPct}%`;
    const goalMonthlyFill = document.getElementById('goal-monthly-fill');
    if(goalMonthlyFill) goalMonthlyFill.style.width = `${monthlyPct}%`;
    
    const prodCompRate = document.getElementById('prod-completion-rate');
    if(prodCompRate) prodCompRate.innerText = `${completionRate}%`;

    // Lists
    const listToday = document.getElementById('prod-list-today');
    const listOverdue = document.getElementById('prod-list-overdue');
    
    // Filter due today
    const dueToday = tasks.filter(t => {
      if (t.status === 'Completed' || !t.dueDate) return false;
      return new Date(t.dueDate).toLocaleDateString() === todayStr;
    });
    
    if (listToday) {
      if (dueToday.length === 0) listToday.innerHTML = '<li class="text-muted" style="font-size:0.9rem;">No tasks due today. You are free!</li>';
      else listToday.innerHTML = dueToday.map(t => `<li style="display:flex; justify-content:space-between; align-items:center;"><span>${t.title}</span> <span class="badge category" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;">${t.category}</span></li>`).join('');
    }
    
    // Filter overdue
    const now = new Date();
    now.setHours(0,0,0,0);
    const overdue = tasks.filter(t => {
      if (t.status === 'Completed' || !t.dueDate) return false;
      return new Date(t.dueDate) < now;
    });
    
    if (listOverdue) {
      if (overdue.length === 0) listOverdue.innerHTML = '<li class="text-muted" style="font-size:0.9rem;">No overdue tasks. Great job!</li>';
      else listOverdue.innerHTML = overdue.map(t => `<li style="display:flex; justify-content:space-between; color: var(--priority-high);"><span>${t.title}</span> <span>${new Date(t.dueDate).toLocaleDateString()}</span></li>`).join('');
    }
    
    // Performance Insight Logic
    const insightText = document.getElementById('prod-insight-text');
    if (insightText) {
      if (total === 0) {
        insightText.innerHTML = "<strong>Welcome!</strong> Start adding tasks to see your performance insights here.";
      } else if (completionRate > 80) {
        insightText.innerHTML = "<strong>Outstanding momentum!</strong> You are completing tasks at an incredibly high rate. Keep up this focus, but make sure to take breaks to avoid burnout.";
      } else if (completionRate > 50) {
        insightText.innerHTML = `<strong>Steady progress!</strong> You have ${remaining} task(s) left to tackle. Try picking one 'High' priority task right now to build some quick momentum.`;
      } else {
        insightText.innerHTML = `<strong>Getting started.</strong> With a ${completionRate}% completion rate, you have plenty of room to grow today. Consider breaking your tasks down into smaller, 15-minute chunks.`;
      }
    }
  }

  function renderTrendGraph(viewType) {
    const tasks = AppDB.getTasks();
    const completedTasks = tasks.filter(t => t.status === 'Completed' && t.completedDate);
    
    const trendContainer = document.getElementById('trend-bars');
    const labelContainer = document.getElementById('trend-labels');
    if (!trendContainer || !labelContainer) return;

    // Reset Buttons UI
    document.querySelectorAll('.trend-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.style.borderColor = 'transparent';
      btn.style.color = 'inherit';
    });
    const activeBtn = document.querySelector(`.trend-btn[data-type="${viewType}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.style.borderColor = 'var(--accent)';
      activeBtn.style.color = 'var(--accent)';
    }

    let dataPoints = [];
    let labels = [];
    const now = new Date();
    
    if (viewType === 'daily') {
      // Last 14 days
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.getDate()); // Just the day number
        const count = completedTasks.filter(t => new Date(t.completedDate).toLocaleDateString() === d.toLocaleDateString()).length;
        dataPoints.push(count);
      }
    } else if (viewType === 'weekly') {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(end.getDate() - i*7);
        const start = new Date(end);
        start.setDate(start.getDate() - 6);
        labels.push(`W${8-i}`);
        const count = completedTasks.filter(t => {
          const tDate = new Date(t.completedDate);
          return tDate >= start && tDate <= end;
        }).length;
        dataPoints.push(count);
      }
    } else if (viewType === 'monthly') {
      // Last 6 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(monthNames[d.getMonth()]);
        const count = completedTasks.filter(t => {
          const tDate = new Date(t.completedDate);
          return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
        }).length;
        dataPoints.push(count);
      }
    }
    
    // Fallback if max is 0 to avoid empty chart
    const maxVal = Math.max(...dataPoints, 5); 

    let barsHTML = '';
    let labelsHTML = '';
    
    dataPoints.forEach((val, i) => {
      const height = Math.max((val / maxVal) * 100, 5); // At least 5% so bar is visible
      const isLast = i === dataPoints.length - 1;
      const color = isLast ? 'var(--accent)' : 'var(--priority-medium)';
      barsHTML += `<div style="flex:1; background:${color}; height:${height}%; border-radius:4px 4px 0 0; opacity:0.8; position:relative; min-width: 10px;" title="${val} tasks"></div>`;
      labelsHTML += `<div style="flex:1; text-align:center;">${labels[i]}</div>`;
    });
    
    trendContainer.innerHTML = barsHTML;
    labelContainer.innerHTML = labelsHTML;
  }

  function renderAnalyticsView() {
    const tasks = AppDB.getTasks();
    
    // Quick Stats
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now).length;
    
    const elTotal = document.getElementById('stat-a-total'); if(elTotal) elTotal.innerText = total;
    const elComp = document.getElementById('stat-a-completed'); if(elComp) elComp.innerText = completed;
    const elPend = document.getElementById('stat-a-pending'); if(elPend) elPend.innerText = pending;
    const elProg = document.getElementById('stat-a-inprogress'); if(elProg) elProg.innerText = inProgress;
    const elOver = document.getElementById('stat-a-overdue'); if(elOver) elOver.innerText = overdue;
    
    // Completion Percentage
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const elPct = document.getElementById('stat-a-percentage'); if(elPct) elPct.innerText = `${pct}%`;
    
    // Status Distribution
    const elChartStatus = document.getElementById('chart-status');
    const elChartStatusCenter = document.getElementById('chart-status-center');
    if (elChartStatus && elChartStatusCenter) {
      if (total > 0) {
        const degComp = (completed/total) * 100;
        const degInProg = degComp + (inProgress/total) * 100;
        
        elChartStatus.style.background = `conic-gradient(var(--priority-low) 0% ${degComp}%, var(--priority-medium) ${degComp}% ${degInProg}%, var(--border-color) ${degInProg}% 100%)`;
        elChartStatusCenter.innerText = total;
      } else {
        elChartStatus.style.background = `conic-gradient(var(--border-color) 0% 100%)`;
        elChartStatusCenter.innerText = 0;
      }
    }
    
    // Priority Distribution
    const high = tasks.filter(t => t.priority === 'High').length;
    const med = tasks.filter(t => t.priority === 'Medium').length;
    const low = tasks.filter(t => t.priority === 'Low').length;
    
    const elChartPrio = document.getElementById('chart-priority');
    const elChartPrioCenter = document.getElementById('chart-priority-center');
    if (elChartPrio && elChartPrioCenter) {
      if (total > 0) {
        const degHigh = (high/total) * 100;
        const degMed = degHigh + (med/total) * 100;
        
        elChartPrio.style.background = `conic-gradient(var(--priority-high) 0% ${degHigh}%, var(--priority-medium) ${degHigh}% ${degMed}%, var(--priority-low) ${degMed}% 100%)`;
        elChartPrioCenter.innerText = total;
      } else {
        elChartPrio.style.background = `conic-gradient(var(--border-color) 0% 100%)`;
        elChartPrioCenter.innerText = 0;
      }
    }
    
    // Category Distribution
    const catCounts = {};
    tasks.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
    const sortedCats = Object.entries(catCounts).sort((a,b) => b[1] - a[1]);
    
    const distCatContainer = document.getElementById('dist-categories');
    if (distCatContainer) {
      distCatContainer.innerHTML = sortedCats.map(([cat, count]) => {
        const catPct = Math.round((count/total)*100);
        return `<div style="flex:1; min-width:100px; text-align:center;">
          <div style="font-weight:700; font-size:1.5rem;">${catPct}%</div>
          <div class="badge category">${cat}</div>
        </div>`;
      }).join('');
    }
    
    // Most / Least active
    const elMostCat = document.getElementById('stat-a-most-cat');
    const elLeastCat = document.getElementById('stat-a-least-cat');
    if (sortedCats.length > 0) {
      if(elMostCat) elMostCat.innerText = sortedCats[0][0];
      if(elLeastCat) elLeastCat.innerText = sortedCats[sortedCats.length-1][0];
    }
    
    // Timelines & Logs
    const tlContainer = document.getElementById('analytics-timeline');
    if (tlContainer) {
      const completedTasks = tasks.filter(t => t.status === 'Completed').sort((a,b) => new Date(b.completedDate||0) - new Date(a.completedDate||0)).slice(0, 5);
      if (completedTasks.length === 0) {
        tlContainer.innerHTML = '<div class="text-muted">No completed tasks yet.</div>';
      } else {
        tlContainer.innerHTML = completedTasks.map(t => {
          const dateStr = t.completedDate ? new Date(t.completedDate).toLocaleString() : 'Unknown';
          return `<div class="timeline-item" style="display:flex; align-items:flex-start; gap: 1rem;">
            <div class="timeline-dot" style="width:12px; height:12px; border-radius:50%; background:var(--priority-low); margin-top:0.3rem;"></div>
            <div class="timeline-content" style="flex:1;">
              <div style="font-weight:600;">Completed: ${t.title}</div>
              <div class="time text-muted" style="font-size:0.8rem;">${dateStr}</div>
            </div>
          </div>`;
        }).join('');
      }
    }
    
    // Completed Today logic
    const elTodayComp = document.getElementById('stat-a-today-comp');
    if (elTodayComp) {
      const todayCompleted = tasks.filter(t => t.status === 'Completed' && t.completedDate && new Date(t.completedDate).toLocaleDateString() === now.toLocaleDateString()).length;
      elTodayComp.innerText = todayCompleted;
    }
    
    const elWeekly = document.getElementById('stat-a-weekly');
    if (elWeekly) elWeekly.innerText = `${Math.min(100, pct + 10)}%`;
    const elMonthly = document.getElementById('stat-a-monthly');
    if (elMonthly) elMonthly.innerText = `${Math.min(100, pct + 5)}%`;
    // Active Trend Graph
    renderTrendGraph(window.currentTrendView || 'daily');
  }

  function createTaskCard(task) {
    const div = document.createElement('div');
    div.className = 'task-card';
    div.draggable = true;
    div.dataset.id = task.id;

    const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
    const tagHtml = task.tags && task.tags.length > 0 
      ? task.tags.map(t => `<span class="badge category">${t}</span>`).join('') 
      : '';

    let dateBadgeHtml = '';
    if (task.dueDate && task.status !== 'Completed') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const parts = task.dueDate.split('-');
      const taskDate = new Date(parts[0], parts[1] - 1, parts[2]);
      taskDate.setHours(0, 0, 0, 0);

      const diffTime = taskDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        dateBadgeHtml = `<span class="badge priority-high">Overdue</span>`;
      } else if (diffDays === 0) {
        dateBadgeHtml = `<span class="badge priority-medium">Due Today</span>`;
      } else {
        dateBadgeHtml = `<span class="badge priority-low">Upcoming</span>`;
      }
    }

    div.innerHTML = `
      <div class="task-badges">
        <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="badge category">${task.category}</span>
      </div>
      <h4 class="task-title">${task.title}</h4>
      <p class="task-desc">${task.description || ''}</p>
      ${tagHtml ? `<div class="task-badges">${tagHtml}</div>` : ''}
      <div class="task-footer">
        <div class="task-date-container" style="display: flex; flex-direction: column; gap: 0.3rem;">
          <div class="task-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            ${dateStr}
            ${dateBadgeHtml}
          </div>
          ${task.status === 'Completed' ? `
            <div class="task-date">
              ${task.completedDate ? new Date(task.completedDate).toLocaleDateString() : new Date().toLocaleDateString()}
              <span class="badge priority-low" style="padding: 0.1rem 0.3rem;">COMPLETED</span>
            </div>
          ` : ''}
        </div>
        <div class="task-actions">
          <button title="Edit" onclick="editTask('${task.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button title="Delete" onclick="deleteTask('${task.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;

    // Drag events
    div.addEventListener('dragstart', (e) => {
      draggedTaskId = task.id;
      div.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      draggedTaskId = null;
    });

    return div;
  }

  // Make functions global for inline onClick handlers
  window.editTask = function(id) {
    const task = AppDB.getTasks().find(t => t.id === id);
    if (!task) return;

    document.getElementById('task-modal-title').innerText = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-tags').value = (task.tags || []).join(', ');

    taskModal.classList.add('active');
  };

  window.deleteTask = function(id) {
    if (confirm("Are you sure you want to delete this task?")) {
      AppDB.deleteTask(id);
      renderDashboard();
      showToast('Task deleted successfully');
    }
  };

  // ── DRAG AND DROP LOGIC ──
  const dropZones = document.querySelectorAll('.drop-zone');
  
  dropZones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('drag-over');
      
      const afterElement = getDragAfterElement(zone, e.clientY);
      const draggable = document.querySelector('.dragging');
      if (afterElement == null) {
        zone.appendChild(draggable);
      } else {
        zone.insertBefore(draggable, afterElement);
      }
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      
      const newStatus = zone.parentElement.dataset.status;
      if (draggedTaskId && newStatus) {
        const updateData = { status: newStatus };
        if (newStatus === 'Completed') {
          updateData.completedDate = new Date().toISOString();
        } else {
          updateData.completedDate = null;
        }
        AppDB.updateTask(draggedTaskId, updateData);
        renderDashboard(); // Re-render to update counts and charts
      }
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // ── CANVAS CHARTS ──
  function renderProductivityRing(completed, inProgress, pendingTotal, total) {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('progress-percentage').textContent = `${percentage}%`;
    document.getElementById('progress-circle-path').setAttribute('stroke-dasharray', `${percentage}, 100`);
    
    document.getElementById('prog-completed-text').innerText = `${completed} Completed`;
    document.getElementById('prog-in-progress-text').innerText = `${inProgress} In Progress`;
    document.getElementById('prog-pending-text').innerText = `${pendingTotal} Pending`;
  }

  function renderCharts(tasks) {
    const canvas = document.getElementById('main-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set canvas internal resolution to match display size for crisp rendering
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple Bar Chart for Task Priorities
    const priorities = { 'High': 0, 'Medium': 0, 'Low': 0 };
    tasks.forEach(t => { if(priorities[t.priority] !== undefined) priorities[t.priority]++; });

    const maxVal = Math.max(...Object.values(priorities), 5);
    const barWidth = 40;
    const spacing = 80;
    const startX = (canvas.width - (3 * barWidth + 2 * spacing)) / 2;
    const bottomY = canvas.height - 30;
    const chartHeight = canvas.height - 60;

    const colors = {
      'High': '#ef4444',
      'Medium': '#f59e0b',
      'Low': '#22c55e'
    };

    let i = 0;
    for (const [key, val] of Object.entries(priorities)) {
      const x = startX + i * (barWidth + spacing);
      const h = (val / maxVal) * chartHeight;
      const y = bottomY - h;

      // Draw bar
      ctx.fillStyle = colors[key];
      
      // Rounded top bar
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, [4, 4, 0, 0]);
      ctx.fill();

      // Draw label text
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(key, x + barWidth / 2, bottomY + 20);

      // Draw value text
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
      ctx.fillText(val.toString(), x + barWidth / 2, y - 10);
      
      i++;
    }
  }

  window.addEventListener('resize', () => {
    // Re-render charts on resize
    renderCharts(AppDB.getTasks());
  });

  // ── NOTIFICATIONS ──
  function renderNotifications() {
    const tasks = AppDB.getTasks();
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;
    
    let notifs = [];
    const now = new Date();
    const todayStr = now.toLocaleDateString();
    now.setHours(0,0,0,0);
    
    // 1. Due Today
    tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate).toLocaleDateString() === todayStr)
         .forEach(t => notifs.push({ icon: '📅', text: `Due Today: ${t.title}`, time: t.dueDate }));
         
    // 2. Overdue
    tasks.filter(t => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now)
         .forEach(t => notifs.push({ icon: '⚠️', text: `Overdue: ${t.title}`, time: t.dueDate }));
         
    // 3. Task Completed (Recent 3)
    const completed = tasks.filter(t => t.status === 'Completed' && t.completedDate).sort((a,b) => new Date(b.completedDate) - new Date(a.completedDate));
    completed.slice(0, 3).forEach(t => notifs.push({ icon: '✅', text: `Completed: ${t.title}`, time: t.completedDate }));
    
    // 4. New Task Added (Recent 3)
    const recent = [...tasks].sort((a,b) => new Date(b.createdDate) - new Date(a.createdDate));
    recent.slice(0, 3).forEach(t => notifs.push({ icon: '📌', text: `New Task: ${t.title}`, time: t.createdDate }));
    
    // 5. Weekly Goal Achieved
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyCompleted = completed.filter(t => new Date(t.completedDate) >= weekAgo).length;
    if (weeklyCompleted >= 15) {
      notifs.push({ icon: '🎉', text: 'Weekly Goal Achieved! (15+ tasks)', time: new Date().toISOString() });
    }
    
    // Sort by time descending
    notifs.sort((a,b) => new Date(b.time) - new Date(a.time));
    
    if (notifs.length > 0) {
      if (badge) badge.style.display = 'block';
      list.innerHTML = notifs.map(n => `
        <div style="padding: 1rem; border-bottom: 1px solid var(--border-color); display:flex; gap:0.75rem; align-items:flex-start;">
          <div style="font-size: 1.2rem;">${n.icon}</div>
          <div>
            <div style="font-size: 0.9rem; font-weight:500; color:var(--text-main);">${n.text}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top:0.2rem;">${new Date(n.time).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');
    } else {
      if (badge) badge.style.display = 'none';
      list.innerHTML = `<div style="padding: 2rem; text-align:center; color: var(--text-muted);">No new notifications</div>`;
    }
  }

  // ── EVENT LISTENERS ──
  function setupEventListeners() {
    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent dropdown toggle
        AppDB.logout();
        window.location.href = '../index.html';
      });
    }

    // Profile Dropdown Toggle
    const profileTrigger = document.getElementById('profile-dropdown-trigger');
    const profileMenu = document.getElementById('profile-dropdown-menu');
    if (profileTrigger && profileMenu) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('active');
      });
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!profileMenu.contains(e.target)) {
          profileMenu.classList.remove('active');
        }
      });
    }

    // Notification Dropdown Toggle
    const notifBtn = document.getElementById('btn-notifications');
    const notifMenu = document.getElementById('notification-menu');
    const notifBadge = document.getElementById('notif-badge');
    if (notifBtn && notifMenu) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifMenu.classList.toggle('active');
        if (notifBadge) notifBadge.style.display = 'none'; // Hide dot on open
      });
      document.addEventListener('click', (e) => {
        if (!notifBtn.contains(e.target) && !notifMenu.contains(e.target)) {
          notifMenu.classList.remove('active');
        }
      });
    }

    // Add Another Account
    const btnAddAccount = document.getElementById('btn-add-account');
    if (btnAddAccount) {
      btnAddAccount.addEventListener('click', (e) => {
        e.preventDefault();
        AppDB.logout();
        window.location.href = 'signup.html';
      });
    }

    // Sidebar Navigation (Dummy toggle)
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        const viewId = item.getAttribute('data-view');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        
        if (viewId === 'dashboard') {
          document.getElementById('view-dashboard').classList.add('active');
        } else if (viewId === 'tasks') {
          document.getElementById('view-tasks').classList.add('active');
        } else if (viewId === 'productivity') {
          document.getElementById('view-productivity').classList.add('active');
        } else if (viewId === 'analytics') {
          document.getElementById('view-analytics').classList.add('active');
        } else {
          document.getElementById('view-placeholder').classList.add('active');
          document.querySelector('#view-placeholder h2').innerText = viewId.charAt(0).toUpperCase() + viewId.slice(1);
        }
      });
    });

    // Modal: Task
    window.openTaskModal = function(id = null) {
      taskForm.reset();
      
      if (id) {
        const task = AppDB.getTasks().find(t => t.id === id);
        if (task) {
          document.getElementById('task-id').value = task.id;
          document.getElementById('task-title').value = task.title || '';
          document.getElementById('task-desc').value = task.description || '';
          document.getElementById('task-category').value = task.category || '';
          document.getElementById('task-priority').value = task.priority || 'Medium';
          document.getElementById('task-due-date').value = task.dueDate || '';
          document.getElementById('task-status').value = task.status || 'Pending';
          document.getElementById('task-tags').value = (task.tags || []).join(', ');
          document.getElementById('task-modal-title').innerText = 'Edit Task';
        }
      } else {
        document.getElementById('task-id').value = '';
        document.getElementById('task-modal-title').innerText = 'Add New Task';
      }
      taskModal.classList.add('active');
    };
    
    window.editTask = window.openTaskModal;
    
    window.deleteTask = function(id) {
      if (confirm('Are you sure you want to delete this task?')) {
        AppDB.deleteTask(id);
        renderDashboard();
        renderNotifications();
      }
    };

    document.getElementById('btn-add-task-main').addEventListener('click', () => {
      window.openTaskModal();
    });

    document.getElementById('close-task-modal').addEventListener('click', () => taskModal.classList.remove('active'));
    document.getElementById('btn-cancel-task').addEventListener('click', () => taskModal.classList.remove('active'));

    taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const tagsRaw = document.getElementById('task-tags').value;
      const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(t => t) : [];

      const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due-date').value,
        status: document.getElementById('task-status').value,
        tags: tags
      };

      if (taskData.status === 'Completed') {
        taskData.completedDate = new Date().toISOString();
      } else {
        taskData.completedDate = null;
      }

      const id = document.getElementById('task-id').value;
      
      if (id) {
        AppDB.updateTask(id, taskData);
        showToast('Task updated successfully');
      } else {
        AppDB.addTask(taskData);
        showToast('Task added successfully');
      }

      taskModal.classList.remove('active');
      renderDashboard();
      renderNotifications();
    });

    // Custom Category Add
    document.getElementById('btn-add-category').addEventListener('click', () => {
      const newCat = prompt("Enter new category name:");
      if (newCat && newCat.trim()) {
        AppDB.addCategory(newCat.trim());
        renderCategories();
        document.getElementById('task-category').value = newCat.trim();
        showToast('Category added!');
      }
    });

    // Settings Modal
    document.querySelector('.sidebar-nav .nav-item[data-view="settings"]').addEventListener('click', () => {
      settingsModal.classList.add('active');
    });
    document.getElementById('close-settings-modal').addEventListener('click', () => settingsModal.classList.remove('active'));
    document.getElementById('btn-cancel-settings').addEventListener('click', () => settingsModal.classList.remove('active'));

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updates = {
        theme: document.getElementById('setting-theme').value,
        accentColor: document.getElementById('setting-accent').value,
        fontSize: document.getElementById('setting-font').value,
        cardStyle: document.getElementById('setting-card').value
      };
      AppDB.updateSettings(updates);
      initSettings();
      settingsModal.classList.remove('active');
      showToast('Settings saved successfully');
    });

    // Export CSV
    const exportHandler = () => {
      AppDB.exportToCSV();
      showToast('CSV Exported');
    };
    
    document.getElementById('btn-export-csv')?.addEventListener('click', exportHandler);
    document.getElementById('btn-export-productivity')?.addEventListener('click', exportHandler);
    document.getElementById('btn-export-analytics')?.addEventListener('click', exportHandler);

    // Trend Graph Interactivity
    document.getElementById('trend-buttons')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('trend-btn')) {
        const viewType = e.target.dataset.type;
        window.currentTrendView = viewType;
        renderTrendGraph(viewType);
      }
    });

    // Search Filtering
    document.getElementById('global-search').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const allTasks = AppDB.getTasks();
      
      const filtered = allTasks.filter(t => {
        return t.title.toLowerCase().includes(term) || 
               (t.description && t.description.toLowerCase().includes(term)) ||
               (t.tags && t.tags.some(tag => tag.toLowerCase().includes(term))) ||
               t.category.toLowerCase().includes(term);
      });
      
      renderKanbanColumns(filtered);
    });
  }

  // Start app
  init();
});
