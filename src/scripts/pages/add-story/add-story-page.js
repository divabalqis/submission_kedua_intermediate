import L from 'leaflet'; 
import { addNewStory } from '../../data/api.js';
import { showPopup } from '../../utils/index.js';
import { queueStoryForSync, registerSync } from '../../utils/idb.js';

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AddStoryPage = {
  async render() {
    return `
      <section class="container">
        <h1 class="page-title">Tambah Story</h1>
        <form id="addStoryForm" class="auth-form">
          <label for="description">Deskripsi</label>
          <textarea id="description" rows="3" placeholder="Tulis ceritamu..." required></textarea>

          <label for="photo">Foto</label>
          <input type="file" id="photo" accept="image/*" required />
          <img id="photoPreview" alt="Preview Foto" style="display:none; margin-top:10px; border-radius:8px; max-width:100%;" />

          <label for="map">Pilih Lokasi Story</label>
          <div id="map" style="height: 300px; margin: 10px 0; border-radius: 8px;"></div>

          <input type="hidden" id="lat" />
          <input type="hidden" id="lon" />

          <button type="submit">Kirim Story</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    const map = L.map('map', { zoomControl: true }).setView([-2.5, 118], 5);
    setTimeout(() => map.invalidateSize(), 300);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    let marker = null;
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById('lat').value = lat;
      document.getElementById('lon').value = lng;

      if (marker) map.removeLayer(marker);
      marker = L.marker([lat, lng]).addTo(map).bindPopup('Lokasi Story').openPopup();
    });

    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        photoPreview.src = URL.createObjectURL(file);
        photoPreview.style.display = 'block';
      } else photoPreview.style.display = 'none';
    });

    const form = document.getElementById('addStoryForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      const description = document.getElementById('description').value.trim();
      const photo = document.getElementById('photo').files[0];
      const lat = document.getElementById('lat').value;
      const lon = document.getElementById('lon').value;

      if (!description || !photo) return showPopup('Lengkapi deskripsi dan foto.', 'error');
      if (!lat || !lon) return showPopup('Silakan pilih lokasi di peta terlebih dahulu.', 'error');

      try {
        if (navigator.onLine) {
          await addNewStory(token, description, photo, lat, lon);
          showPopup('Story berhasil dikirim!', 'success');
        } else {
          throw new Error('Offline mode');
        }
      } catch (err) {
        showPopup('Offline: Story disimpan untuk dikirim saat online.', 'info');
        await queueStoryForSync({ description, photo, lat, lon, filename: photo.name });
        await registerSync();
      }

      form.reset();
      if (marker) map.removeLayer(marker);
      photoPreview.style.display = 'none';
      window.location.hash = '#/';
    });
  },
};

export default AddStoryPage;
