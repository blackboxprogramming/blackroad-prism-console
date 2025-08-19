function open(res){
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.flushHeaders?.();
  const send = (obj)=>{ res.write(`data: ${JSON.stringify(obj)}\n\n`); };
  const close = ()=> res.end();
  return { send, close };
}
module.exports = { open };
