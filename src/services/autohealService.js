const fs = require('fs');
const readline = require('readline');

const LOG_PATH = process.env.AUTOHEAL_LOG || '/var/log/blackroad-autoheal.log';

function parseLine(line){
  try { return JSON.parse(line); } catch { return null; }
}

function getEvents(){
  if (!fs.existsSync(LOG_PATH)) return [];
  const data = fs.readFileSync(LOG_PATH, 'utf8').trim();
  if (!data) return [];
  return data.split('\n').map(parseLine).filter(Boolean).reverse();
}

function appendEscalation(note){
  const event = {
    timestamp: new Date().toISOString(),
    service: 'manual',
    action: 'escalation',
    result: 'pending',
    message: note || ''
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(event) + '\n');
  return event;
}

function streamEvents(io){
  if (!fs.existsSync(LOG_PATH)) return;
  let fileSize = fs.statSync(LOG_PATH).size;
  fs.watch(LOG_PATH, (eventType) => {
    if (eventType !== 'change') return;
    const stats = fs.statSync(LOG_PATH);
    if (stats.size < fileSize) { fileSize = stats.size; return; }
    const stream = fs.createReadStream(LOG_PATH, { start: fileSize });
    const rl = readline.createInterface({ input: stream });
    rl.on('line', (line) => {
      const ev = parseLine(line);
      if (ev) io.emit('autoheal:event', ev);
    });
    rl.on('close', () => { fileSize = stats.size; });
  });
}

module.exports = { getEvents, appendEscalation, streamEvents };
