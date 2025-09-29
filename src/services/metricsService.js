'use strict';

const si = require('systeminformation');

async function sample() {
  const [load, mem, osInfo, disks, networkStats] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.osInfo(),
    si.fsSize(),
    si
      .networkStats()
      .then((stats) => (Array.isArray(stats) ? stats : stats ? [stats] : []))
      .catch(() => [])
  ]);

  const network = networkStats.map((stat) => ({
    iface: stat.iface,
    operstate: stat.operstate,
    rx_sec: stat.rx_sec,
    tx_sec: stat.tx_sec,
    ms: stat.ms
  }));

  return {
    cpu: {
      avgLoad: load.avgload || null,
      currentLoad: load.currentload || null
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
    disks: disks.map((d) => ({
      fs: d.fs,
      size: d.size,
      used: d.used,
      use: d.use,
      mount: d.mount
    })),
    network,
    t: Date.now()
  };
}

module.exports = { sample };
