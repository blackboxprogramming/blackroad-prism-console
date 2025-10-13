const fs = require('fs');

fs.mkdirSync('public/bi', { recursive: true });
['index.html', 'style.css', 'finance.html', 'support.html', 'growth.html', 'product.html', 'app.js'].forEach((file) => {
  const src = `apps/bi/${file}`;
  const dst = `public/bi/${file}`;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
  }
});

console.log('BI published to public/bi');
