#!/usr/bin/env node
// duty-cycle an external ASIC by toggling its API/power or pool "quota".
// Replace the stubs with the ASIC's real API endpoint commands.

const onMin = Number(process.env.ASIC_ON_MIN || 10);
const offMin = Number(process.env.ASIC_OFF_MIN || 50);

async function asicStart(){ console.log('[asic] start (stub)'); /* call ASIC API */ }
async function asicStop(){  console.log('[asic] stop  (stub)'); /* call ASIC API */ }

(async ()=>{
  while(true){
    await asicStart();
    await new Promise(r=>setTimeout(r,onMin*60*1000));
    await asicStop();
    await new Promise(r=>setTimeout(r,offMin*60*1000));
// Duty-cycle an external ASIC (Scrypt/SHA) by toggling API/pool settings.
// Replace stubs with real ASIC API calls.
const onMin  = Number(process.env.ASIC_ON_MIN  || 10);
const offMin = Number(process.env.ASIC_OFF_MIN || 50);
async function asicStart(){ console.log('[asic] start (stub)'); /* call ASIC */ }
async function asicStop(){  console.log('[asic] stop  (stub)'); /* call ASIC */ }
(async ()=>{
  while(true){
    await asicStart(); await new Promise(r=>setTimeout(r,onMin*60*1000));
    await asicStop();  await new Promise(r=>setTimeout(r,offMin*60*1000));
  }
})();
