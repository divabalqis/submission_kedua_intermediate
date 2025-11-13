import { registerUser } from '../../data/api.js';
import { showPopup } from '../../utils/index.js';

const RegisterPage = {
  async render() {
    return `
      <section class="container register-page">
        <h1 class="page-title">Register</h1>
        <form id="registerForm" class="auth-form">
          <label for="name">Nama</label>
          <input type="text" id="name" placeholder="Masukkan nama lengkap" required />

          <label for="email">Email</label>
          <input type="email" id="email" placeholder="Masukkan email" required />

          <label for="password">Kata Sandi</label>
          <div class="password-wrapper">
            <input type="password" id="password" placeholder="Buat kata sandi" required />
            <button type="button" id="togglePassword" class="toggle-password">👀</button>
          </div>

          <button type="submit">Daftar</button>
        </form>
        <p class="auth-link">Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  },

  async afterRender() {
    const form = document.getElementById('registerForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    togglePassword.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      togglePassword.textContent = isHidden ? '🙈' : '👀';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value.trim();

      const result = await registerUser(name, email, password);
      if (result.error) {
        showPopup('Registrasi gagal! Coba lagi.', 'error');
      } else {
        showPopup('Registrasi berhasil! Silakan login.', 'success');
        window.location.hash = '#/login';
      }
    });
  },
};

export default RegisterPage;
