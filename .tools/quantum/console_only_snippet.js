// ==== CONSOLE-ONLY CHECKS START (Block N) ====
(function(){
  const log = console.log.bind(console, '[runtime]');
  const warn = console.warn.bind(console, '[runtime]');
  const error = console.error.bind(console, '[runtime]');
  try {
    if (!window.Chart) error('Chart.js missing'); else log('Chart.js OK');
    if (!window.math || !math.expm) error('math.js missing or no expm'); else {
      const H = math.matrix([[1,0.1,0],[0.1,0,-0.2],[0,-0.2,-0.9]]);
      const U  = math.expm(math.multiply(math.complex(0,-1), H));
      const Ud = math.ctranspose(U);
      const I  = math.identity(3);
      const D  = math.subtract(math.multiply(Ud,U), I);
      const frob = Math.sqrt(math.sum(math.dotMultiply(D, math.conj(D))));
      if (frob > 1e-6) warn(`Unitary borderline: ||U†U−I||≈${frob.toExponential(2)}`); else log('Unitary OK');
    }
    if (window.math) {
      const psi = math.divide(math.matrix([1,1,1]), Math.sqrt(3));
      const rho = math.multiply(math.reshape(psi,[3,1]), math.ctranspose(math.reshape(psi,[3,1])));
      const tr  = math.trace(rho); const pur = math.trace(math.multiply(rho,rho));
      if (Math.abs((tr.re ?? tr)-1) > 1e-8) error(`Tr(ρ)=${tr}`); else log('Tr(ρ)=1 OK');
      const p = (pur.re ?? pur);
      if (p<1/3-1e-6 || p>1+1e-6) error(`Purity out-of-bounds: ${p}`); else log(`Purity OK (${p.toFixed(4)})`);
    }
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => {
          if (e.name === 'first-contentful-paint') {
            const t = e.startTime.toFixed(0);
            if (e.startTime > 2500) warn(`FCP ${t}ms (slow)`); else log(`FCP ${t}ms`);
          }
        });
      }).observe({ type: 'paint', buffered: true });
    } catch {}
  } catch (e) {
    error('Self-check error', e);
  }
  window.onerror = function(msg, src, line, col){
    console.error('[runtime] Global error:', msg, src, line, col);
  };
})();
// ==== CONSOLE-ONLY CHECKS END (Block N) ====
