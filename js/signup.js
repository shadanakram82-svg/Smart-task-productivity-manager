/* ─────────────────────────────────────────
   login.js - Login Validation & Logic
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const nameError = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const toggleBtn = document.getElementById('btn-toggle-pass');

  // If already logged in, redirect straight to dashboard
  if (AppDB && AppDB.isLoggedIn()) {
    window.location.href = 'dashboard.html';
  }

  // Toggle Password Visibility
  toggleBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'text') {
      toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
      toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-eye"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
  });

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const clearErrors = () => {
    if (nameInput) nameInput.classList.remove('error');
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    if (nameError) nameError.innerText = '';
    emailError.innerText = '';
    passwordError.innerText = '';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    if (nameInput && !name) {
      nameError.innerText = 'Name is required';
      nameInput.classList.add('error');
      isValid = false;
    }

    if (!email) {
      emailError.innerText = 'Email is required';
      emailInput.classList.add('error');
      isValid = false;
    } else if (!validateEmail(email)) {
      emailError.innerText = 'Please enter a valid email address';
      emailInput.classList.add('error');
      isValid = false;
    }

    if (!password) {
      passwordError.innerText = 'Password is required';
      passwordInput.classList.add('error');
      isValid = false;
    } else if (password.length < 6) {
      passwordError.innerText = 'Password must be at least 6 characters';
      passwordInput.classList.add('error');
      isValid = false;
    }

    if (isValid) {
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.innerText = 'Logging in...';
      btn.disabled = true;

      setTimeout(() => {
        // AppDB is assumed to be loaded via db.js before this script
        if (typeof AppDB !== 'undefined') {
          AppDB.login(email);
        }
        window.location.href = 'dashboard.html';
      }, 800);
    }
  });
});
