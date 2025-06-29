document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase === 'undefined' || typeof firebase.auth !== 'function') {
    alert('Firebase SDK is not loaded properly!');
    return;
  }
  const auth = firebase.auth();

  const authContainer = document.getElementById('auth-container');
  const appMain = document.getElementById('app-main');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegister = document.getElementById('show-register');
  const showLogin = document.getElementById('show-login');
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Form switching
  if (showRegister) showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
  });
  if (showLogin) showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginError.textContent = '';
    registerError.textContent = '';
  });

  // Login
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('login submit');
    loginError.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      loginError.textContent = err.message;
      console.error('Login error:', err);
    }
  });

  // Register
  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('register submit');
    registerError.textContent = '';
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (err) {
      registerError.textContent = err.message;
      console.error('Register error:', err);
    }
  });

  // Auth state observer
  if (auth) auth.onAuthStateChanged((user) => {
    document.body.classList.remove('auth-loading');
    console.log('Auth state changed:', user);
    if (user) {
      window.currentUserId = user.uid;
      window.dispatchEvent(new Event('donezy-authenticated'));
      // Show app, hide auth overlay
      if (authContainer) {
        authContainer.classList.add('hidden');
        authContainer.style.display = 'none';
      }
      if (appMain) {
        appMain.classList.remove('hidden');
        appMain.style.display = '';
      }
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      // Show dashboard for user role
      if (typeof showDashboardForUser === 'function') {
        showDashboardForUser(user.uid);
      }
    } else {
      window.currentUserId = null;
      // Show auth overlay, hide app
      if (appMain) {
        appMain.classList.add('hidden');
        appMain.style.display = 'none';
      }
      if (authContainer) {
        authContainer.classList.remove('hidden');
        authContainer.style.display = '';
      }
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');
      if (registerForm) registerForm.classList.add('hidden');
    }
  });

  // Logout
  window.donezyLogout = function() {
    auth.signOut();
  };
}); 