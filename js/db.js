/* ─────────────────────────────────────────
   db.js - LocalStorage Database Wrapper
───────────────────────────────────────── */

const DB_KEY = 'smart_task_manager_data';

const DEFAULT_CATEGORIES = [
  'Work', 'Personal', 'Study', 'Shopping', 'Health', 'Coding', 'Meetings'
];

const DEFAULT_SETTINGS = {
  theme: 'dark', // light, dark, blue, purple, green
  accentColor: '#22c55e',
  fontSize: 'medium', // small, medium, large
  cardStyle: 'glass', // glass, solid
  animationSpeed: 'normal' // slow, normal, fast
};

const DEFAULT_DATA = {
  user: {
    isLoggedIn: false,
    name: '',
    email: ''
  },
  settings: DEFAULT_SETTINGS,
  categories: DEFAULT_CATEGORIES,
  tasks: []
};

/* 
  Task Model Structure:
  {
    id: string,
    title: string,
    description: string,
    category: string,
    priority: 'Low' | 'Medium' | 'High',
    dueDate: string (ISO),
    status: 'Pending' | 'In Progress' | 'Completed',
    tags: string[],
    createdDate: string (ISO),
    isArchived: boolean,
    isPinned: boolean,
    isFavorite: boolean
  }
*/

class Database {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load data from LocalStorage', e);
    }
    // Return default schema if empty or corrupted
    const defaultData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData(defaultData);
    return defaultData;
  }

  saveData(data = this.data) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data to LocalStorage', e);
    }
  }

  // --- Auth ---
  login(email) {
    this.data.user.isLoggedIn = true;
    this.data.user.email = email;
    this.data.user.name = email.split('@')[0];
    this.saveData();
  }

  logout() {
    this.data.user.isLoggedIn = false;
    this.data.user.email = '';
    this.data.user.name = '';
    this.saveData();
  }

  isLoggedIn() {
    return this.data.user.isLoggedIn;
  }

  // --- Tasks ---
  getTasks() {
    return this.data.tasks;
  }

  addTask(task) {
    task.id = Date.now().toString();
    task.createdDate = new Date().toISOString();
    task.isArchived = false;
    task.isPinned = false;
    task.isFavorite = false;
    
    this.data.tasks.push(task);
    this.saveData();
    return task;
  }

  updateTask(id, updates) {
    const index = this.data.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.data.tasks[index] = { ...this.data.tasks[index], ...updates };
      this.saveData();
      return this.data.tasks[index];
    }
    return null;
  }

  deleteTask(id) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.saveData();
  }

  // --- Settings & Categories ---
  getSettings() {
    return this.data.settings;
  }

  updateSettings(updates) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
  }

  getCategories() {
    return this.data.categories;
  }

  addCategory(categoryName) {
    if (!this.data.categories.includes(categoryName)) {
      this.data.categories.push(categoryName);
      this.saveData();
    }
  }

  // --- Export ---
  exportToCSV() {
    const tasks = this.data.tasks;
    if (tasks.length === 0) {
      alert("No tasks to export!");
      return;
    }
    
    const headers = ['Title', 'Category', 'Priority', 'Status', 'Due Date', 'Created Date'];
    
    // Create CSV string
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const task of tasks) {
      const row = [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${task.category}"`,
        `"${task.priority}"`,
        `"${task.status}"`,
        `"${task.dueDate || ''}"`,
        `"${new Date(task.createdDate).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    }
    
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Global Singleton
const AppDB = new Database();
