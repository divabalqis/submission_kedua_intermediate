import { getAllFavorites, deleteFavorite } from '../../utils/idb.js';
import { showPopup } from '../../utils/index.js';

const FavoritePage = {
  async render() {
    return `
      <section class="container favorite-page">
        <h1 class="page-title">Story Favorit</h1>
        <div id="favorite-list" class="story-list"></div>
      </section>
    `;
  },

  async afterRender() {
    const container = document.getElementById('favorite-list');
    const favorites = await getAllFavorites();

    if (favorites.length === 0) {
      container.innerHTML = `<p class="empty">Belum ada story favorit.</p>`;
      return;
    }

    container.innerHTML = favorites
      .map(
        (story) => `
        <div class="story-card">
          <img src="${story.photoUrl}" alt="${story.name}" />
          <div class="story-info">
            <h3>${story.name}</h3>
            <p>${story.description}</p>
            <button class="delete-fav">
              🗑️ Hapus
            </button>
          </div>
        </div>
      `
      )
      .join('');

    container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-fav')) {
        const storyCard = e.target.closest('.story-card');
        const id = favorites.find(s => s.name === storyCard.querySelector('h3').textContent)?.id;
        if (id) {
          await deleteFavorite(id);
          storyCard.remove();
          showPopup('Story dihapus dari favorit.', 'info');
        }
      }
    });
  },
};

export default FavoritePage;
