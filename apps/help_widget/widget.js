(function(){
  function $(sel){ return document.querySelector(sel); }
  function el(tag, attrs={}, text=''){ const e=document.createElement(tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); if(text) e.textContent=text; return e; }

  const btn = el('div', { id:'br-help-btn' }, '?');
  btn.onclick = () => {
    const box = document.getElementById('br-help-box') || (function(){
      const b = el('div',{id:'br-help-box'}); const t = el('div',{id:'br-help-title'},'Need help?');
      const m = el('textarea',{id:'br-help-msg',placeholder:'Type your question…'});
      const s = el('button',{id:'br-help-send'},'Send');
      s.onclick = async () => {
        const msg = m.value.trim(); if (!msg) return;
        await fetch('/api/support/chat/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:localStorage.getItem('brsid')||'anon',message:msg})});
        m.value=''; alert('Sent!');
      };
      b.appendChild(t); b.appendChild(m); b.appendChild(s); document.body.appendChild(b); return b;
    })();
    box.style.display = (box.style.display==='block'?'none':'block');
  };
  document.body.appendChild(btn);
})();
