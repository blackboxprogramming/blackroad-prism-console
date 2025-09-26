(function () {
  function initAssetCreator(el) {
    if (!el) return;
    const style = document.createElement('style');
    style.textContent = `
      .ac-form { display:flex; gap:8px; margin:20px 0; }
      .ac-form input { flex:1; padding:8px; border-radius:4px; border:1px solid #23232c; background:#0f0f15; color:#e8e8f0; }
      .ac-form button { padding:8px 12px; border:none; border-radius:4px; background:#34d399; color:#0b0b10; cursor:pointer; }
      .ac-gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
      .ac-item { background:#23232c; border-radius:8px; height:120px; display:flex; align-items:center; justify-content:center; color:#a3a3ad; font-size:12px; text-align:center; padding:8px; }
    `;
    document.head.appendChild(style);

    const form = document.createElement('form');
    form.className = 'ac-form';
    form.innerHTML = `
      <input type="text" placeholder="Describe an asset" aria-label="asset prompt" />
      <button type="submit">Create</button>
    `;
    const gallery = document.createElement('div');
    gallery.className = 'ac-gallery';
    el.appendChild(form);
    el.appendChild(gallery);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input');
      const prompt = input.value.trim();
      if (!prompt) return;
      const item = document.createElement('div');
      item.className = 'ac-item';
      item.textContent = prompt;
      gallery.appendChild(item);
      input.value = '';
    });
  }
  window.initAssetCreator = initAssetCreator;
})();
