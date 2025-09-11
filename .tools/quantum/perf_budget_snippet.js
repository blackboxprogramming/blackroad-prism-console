// ==== PERF BUDGET START (Block M) ====
(function(){
  const B = { fp_ms: 2000, fcp_ms: 2500, longtask_ms: 100, total_long_ms: 600 };
  let longTaskTotal = 0;

  function markBadgeWarn(msg){
    const badge = document.getElementById('runtimeSelfCheck');
    if (!badge) return;
    badge.classList.remove('ok');
    if (!badge.classList.contains('error')) badge.classList.add('warn');
    const body = document.getElementById('runtimeSelfCheckBody');
    if (body) body.insertAdjacentHTML('beforeend', `<div>⚠️ ${msg}</div>`);
  }

  try {
    new PerformanceObserver((list) => {
      list.getEntries().forEach((e) => {
        if (e.name === 'first-paint' && e.startTime > B.fp_ms) {
          console.warn(`[perf] FP ${e.startTime.toFixed(0)}ms > ${B.fp_ms}ms`);
          markBadgeWarn(`FP ${e.startTime.toFixed(0)}ms > ${B.fp_ms}ms`);
        }
        if (e.name === 'first-contentful-paint' && e.startTime > B.fcp_ms) {
          console.warn(`[perf] FCP ${e.startTime.toFixed(0)}ms > ${B.fcp_ms}ms`);
          markBadgeWarn(`FCP ${e.startTime.toFixed(0)}ms > ${B.fcp_ms}ms`);
        }
      });
    }).observe({ type: 'paint', buffered: true });
  } catch {}

  if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((t) => {
          const d = t.duration;
          if (d >= B.longtask_ms) {
            longTaskTotal += d;
            console.warn(`[perf] Long task ${d.toFixed(0)}ms (total ${longTaskTotal.toFixed(0)}ms)`);
            if (longTaskTotal > B.total_long_ms) {
              markBadgeWarn(`Long tasks total ${longTaskTotal.toFixed(0)}ms > ${B.total_long_ms}ms`);
            }
          }
        });
      }).observe({entryTypes:['longtask']});
    } catch {}
  }
})();
// ==== PERF BUDGET END (Block M) ====
