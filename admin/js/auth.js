import { DB } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
  // Se já estiver logado, redireciona pro painel
  if (DB.getSession()) {
    window.location.href = '/admin/index.html';
  }

  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const session = DB.login(email, password);
      
      if (session) {
        window.location.href = '/admin/index.html';
      } else {
        errorMsg.style.display = 'block';
      }
    });
  }
});
