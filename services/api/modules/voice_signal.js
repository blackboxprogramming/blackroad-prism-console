// Minimal signaling for one-room voice using Socket.IO.
module.exports = function attachVoice({ io }){
  if(!io) throw new Error("voice_signal: need io");
  const nsp = io.of('/voice');
  nsp.on('connection', (sock)=>{
    let room=null;
    sock.on('join', (r)=>{ room=r||'blackroad'; sock.join(room); sock.to(room).emit('peer:join', {id:sock.id}); });
    sock.on('signal', ({to, data})=>{ nsp.to(to).emit('signal', {from: sock.id, data}); });
    sock.on('disconnect', ()=>{ if(room) sock.to(room).emit('peer:leave', {id:sock.id}); });
  });
  console.log('[voice] signaling namespace attached');
};
