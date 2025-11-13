import * as UrlParser from '../routes/url-parser.js';
import routes from '../routes/routes.js';
import 'leaflet/dist/leaflet.css';

class App {
  constructor({ content }) {
    this._content = content;
  }

  async renderPage() {
    const url = UrlParser.getActiveRoute();
    const page = routes[url] || routes['/'];

    if (!page) {
      this._content.innerHTML = `<h2>404 - Halaman "${url}" tidak ditemukan</h2>`;
      return;
    }

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        const html = await page.render();
        this._content.innerHTML = html;
        if (page.afterRender) await page.afterRender();
      });
    } else {
      const html = await page.render();
      this._content.innerHTML = html;
      if (page.afterRender) await page.afterRender();
    }
  }
}

export default App;
