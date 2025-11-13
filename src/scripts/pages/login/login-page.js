import { loginUser } from '../../data/api.js';
import { showPopup } from '../../utils/index.js';

const LoginPage = {
  async render() {
    return `
      <section class="auth-form">
        <h1 class="page-title">Login</h1>
        <form id="loginForm">
          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Masukkan email" required />

          <label for="password">Kata Sandi</label>
          <div class="password-wrapper">
            <input type="password" id="password" placeholder="Masukkan kata sandi" required />
            <button type="button" id="togglePassword" class="toggle-password">👀</button>
          </div>

          <button type="submit" id="loginButton">Login</button>

          <p class="auth-link">
            Belum punya akun? <a href="#/register">Daftar di sini</a>
          </p>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');

    togglePassword.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      togglePassword.textContent = isHidden ? '👀' : '🙈';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value.trim();

      if (!navigator.onLine) {
        showPopup('⚠️ Kamu sedang offline. Login tidak dapat dilakukan.', 'error');
        return;
      }

      loginButton.disabled = true;
      const originalText = loginButton.textContent;
      loginButton.textContent = '⏳ Memproses...';

      try {
        const result = await loginUser(email, password);
        localStorage.setItem('token', result.loginResult.token);
        localStorage.setItem('name', result.loginResult.name);

        showPopup('✅ Login berhasil!', 'success');
        window.location.hash = '#/';
      } catch (err) {
        console.error(err);
        if (err.message.includes('Failed to fetch')) {
          showPopup('Koneksi gagal. Periksa internetmu.', 'error');
        } else {
          showPopup('Email atau kata sandi salah!', 'error');
        }
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = originalText;
      }
    });
  },
};

export default LoginPage;
