document.addEventListener('DOMContentLoaded', async () => {
  // Verifica se já está autenticado
  try {
    const res = await fetch('/api/auth/verify');
    if (res.status === 200) {
      window.location.href = '/admin/index.html';
      return;
    }
  } catch(e) {}

  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('login-error');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('email').value; // Usando o input type email ou text
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        if (data.success) {
          window.location.href = '/admin/index.html';
        } else {
          errorMsg.style.display = 'block';
          errorMsg.innerText = data.error || 'Credenciais inválidas';
        }
      } catch (err) {
        errorMsg.style.display = 'block';
        errorMsg.innerText = 'Erro de conexão com o servidor.';
      }
    });
  }
});
