import { getAllStories } from '../../data/api.js';
import L from 'leaflet';
import { saveFavorite, getAllFavorites, deleteFavorite, isFavorite } from '../../utils/idb.js';
import { showPopup } from '../../utils/index.js';

// Konfigurasi icon default Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HomePage = {
  async render() {
    return `
      <section class="container home-page">
        <h1 class="page-title">Beranda</h1>
        <div id="map" aria-label="Peta lokasi story"></div>
        <div id="story-list" class="story-list"></div>
      </section>
    `;
  },

  async afterRender() {
    const token = localStorage.getItem('token');
    const mapContainer = document.getElementById('map');
    const listContainer = document.getElementById('story-list');
    if (!mapContainer) return;

    // Inisialisasi peta
    const map = L.map('map', { zoomControl: true }).setView([-2.5, 118], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 300);

    if (!token) {
      listContainer.innerHTML = '<p class="empty">Silakan login untuk melihat story.</p>';
      return;
    }

    let stories = [];
    try {
      const res = await getAllStories(token);
      stories = res.listStory || [];
    } catch (err) {
      console.error('Gagal memuat story:', err);
      listContainer.innerHTML = '<p class="empty">Terjadi kesalahan saat memuat story.</p>';
      return;
    }

    if (!stories.length) {
      listContainer.innerHTML = '<p class="empty">Belum ada story yang tersedia.</p>';
      return;
    }

    const markers = [];
    listContainer.innerHTML = '';

    for (const story of stories) {
      // Tambah marker di peta
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`<b>${story.name}</b><br>${story.description || ''}`);
        markers.push({ lat: story.lat, lon: story.lon, marker });
      }

      const card = document.createElement('div');
      card.className = 'story-card';

      const favoriteStatus = await isFavorite(story.id);

      card.innerHTML = `
        <img src="${story.photoUrl}" alt="${story.description || 'Story pengguna'}" />
        <div class="story-info">
          <h3>${story.name}</h3>
          <p>${story.description || ''}</p>
          <small>${new Date(story.createdAt).toLocaleString('id-ID')}</small>
          <button class="favorite-btn ${favoriteStatus ? 'active' : ''}" data-id="${story.id}">
            ${favoriteStatus ? '💛 Favorit' : '⭐ Simpan'}
          </button>
        </div>
      `;

      // Klik card → fokus ke marker
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-btn')) return;
        if (story.lat && story.lon) {
          map.flyTo([story.lat, story.lon], 13, { duration: 0.8 });
          const found = markers.find(m => m.lat === story.lat && m.lon === story.lon);
          if (found) found.marker.openPopup();
        }
      });

      // Klik tombol favorit
      card.querySelector('.favorite-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = e.target;

        if (await isFavorite(story.id)) {
          await deleteFavorite(story.id);
          btn.classList.remove('active');
          btn.innerHTML = '⭐ Simpan';
          showPopup('Story dihapus dari favorit.', 'info');
        } else {
          await saveFavorite(story);
          btn.classList.add('active');
          btn.innerHTML = '💛 Favorit';
          showPopup('Story disimpan ke favorit!', 'success');
        }
      });

      listContainer.appendChild(card);
    }

    const first = stories.find(s => s.lat && s.lon);
    if (first) map.setView([first.lat, first.lon], 10);

    // 🔔 Cek update story baru tiap 30 detik
    let lastStoriesCount = stories.length;
    setInterval(async () => {
      try {
        const res = await getAllStories(token);
        if (res.listStory.length > lastStoriesCount) {
          showPopup('✨ Ada story baru! Segarkan halaman untuk melihat.', 'info');
          lastStoriesCount = res.listStory.length;
        }
      } catch {
        console.log('Tidak bisa memeriksa pembaruan story.');
      }
    }, 30000);
  },
};

export default HomePage;
