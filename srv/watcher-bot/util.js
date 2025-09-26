const { performance } = require('perf_hooks');
const http = require('http');
const https = require('https');
const tls = require('tls');
const os = require('os');
const fs = require('fs');
const net = require('net');

function get(url){
  return new Promise((resolve)=>{
    const start = performance.now();
    const lib = url.startsWith('https')?https:http;
    const req = lib.get(url, res=>{
      res.on('data', ()=>{});
      res.on('end', ()=>{
        resolve({status:res.statusCode, ttfb:performance.now()-start});
      });
    });
    req.on('error', ()=>resolve({status:0, ttfb:performance.now()-start}));
  });
}

function checkSSL(domain){
  return new Promise((resolve)=>{
    const socket = tls.connect(443, domain, {servername:domain}, ()=>{
      const cert = socket.getPeerCertificate();
      const exp = new Date(cert.valid_to);
      const days = Math.ceil((exp - Date.now())/86400000);
      socket.end();
      resolve(days);
    });
    socket.on('error', ()=>resolve(null));
  });
}

function diskUsage(path){
  const { execSync } = require('child_process');
  try {
    const out = execSync(`df -P ${path}`).toString().trim().split('\n').pop().split(/\s+/);
    return parseInt(out[4]);
  } catch { return null; }
}

function cpuLoad(){
  const loads = os.loadavg();
  return loads[0];
}

function memoryUsage(){
  const free = os.freemem();
  const total = os.totalmem();
  return Math.round((1 - free/total)*100);
}

function portOpen(port){
  return new Promise(resolve=>{
    const sock = net.createConnection(port,'127.0.0.1');
    sock.on('connect', ()=>{sock.destroy(); resolve(true);});
    sock.on('error', ()=>resolve(false));
    setTimeout(()=>{sock.destroy(); resolve(false);},1000);
  });
}

function tailErrors(file){
  try {
    const lines = fs.readFileSync(file,'utf8').trim().split('\n').slice(-50);
    const errors = lines.filter(l=>/\s[45]\d\d\s/.test(l));
    return errors.length;
  } catch { return 0; }
}

module.exports = { get, checkSSL, diskUsage, cpuLoad, memoryUsage, portOpen, tailErrors };
