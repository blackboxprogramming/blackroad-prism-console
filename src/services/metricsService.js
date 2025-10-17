// FILE: /srv/blackroad-api/src/services/metricsService.js
'use strict';

const si = require('systeminformation');

async function sample() {
  const [cpu, mem, load, osInfo] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.currentLoad(),
    si.osInfo()
  ]);
  const disks = await si.fsSize();
  return {
    cpu: {
      avgLoad: cpu.avgload || null,
      currentLoad: cpu.currentload || null
    },
    mem: {
      total: mem.total,
      free: mem.free,
      used: mem.used,
      active: mem.active
    },
    load: {
      avg1: load.currentload_user || null
    },
    os: {
      platform: osInfo.platform,
      distro: osInfo.distro,
      release: osInfo.release,
      kernel: osInfo.kernel
    },
    disks: disks.map(d => ({
      fs: d.fs, size: d.size, used: d.used, use: d.use, mount: d.mount
    })),
    t: Date.now()
  };
}

module.exports = { sample };
