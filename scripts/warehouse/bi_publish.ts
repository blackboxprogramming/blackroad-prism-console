import fs from 'fs';
fs.mkdirSync('public/bi',{recursive:true});
['index.html','style.css','finance.html','support.html','growth.html','product.html','app.js'].forEach(f=>{
  const src=`apps/bi/${f}`; const dst=`public/bi/${f}`;
  if (fs.existsSync(src)) fs.copyFileSync(src,dst);
});
console.log('BI published to public/bi');
