// TODO: implement agent
process.on('message', (msg) => {
  if (msg === 'ping' && process.send) {
    process.send('pong');
  }
});
