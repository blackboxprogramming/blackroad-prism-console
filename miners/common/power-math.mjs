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
