#!/usr/bin/env node
// node miners/common/power-math.mjs --watts=2 --kwh=0.15 --hrs=6 --solar=30
const args = Object.fromEntries(process.argv.slice(2).map(x=>x.split('=').map(s=>s.replace(/^--/,''))));
const watts = +args.watts || 2;
const kwh   = +args.kwh   || 0.15;
const hrs   = +args.hrs   || 24;
const solarWhDay = +args.solar || 0;
const kwhDay = (watts/1000)*hrs;
const costDay = kwhDay*kwh, costMonth = costDay*30;
const gridWhDay = Math.max((watts*hrs)-solarWhDay,0);
const gridKwhMonth = (gridWhDay/1000)*30, gridCostMonth = gridKwhMonth*kwh;
console.log({watts,hrs,kwhDay,costDay,costMonth,solarWhDay,gridWhDay,gridKwhMonth,gridCostMonth});
// Usage:
// node power-math.mjs --watts=2 --kwh=0.15 --hrs=24 --solar=30 --sun=4 --eta=0.75
// watts: miner average watts when ON
// hrs: hours/day actually ON (duty-cycle)
// solar: Wh/day your panel produces (or panelWatts*sunHours*eta)

const a = Object.fromEntries(process.argv.slice(2).map(x => x.split('=').map(s=>s.replace(/^--/,''))));
const watts = +a.watts || 2;
const kwh = +a.kwh || 0.15;
const hrs = +a.hrs || 24;
const solarWhDay = +a.solar || 0;   // e.g. 10W * 4h * 0.75 = 30 Wh/day
const kwhDay = (watts/1000) * hrs;
const costDay = kwhDay * kwh;
const costMonth = costDay * 30;
const gridWhDay = Math.max((watts*hrs) - solarWhDay, 0);
const gridKwhMonth = (gridWhDay/1000) * 30;
const gridCostMonth = gridKwhMonth * kwh;

console.log({
  watts, hrs, kwhDay, costDay, costMonth,
  solarWhDay,
  gridWhDay, gridKwhMonth, gridCostMonth,
  note: "Lower watts via CPUQuota/duty-cycling; increase solarWhDay to offset."
});
