import fs from 'fs';
const now = Date.now();
fs.mkdirSync('warehouse/data/curated',{recursive:true});
fs.writeFileSync('warehouse/data/curated/finance_arr.json', JSON.stringify({metric:'ARR',value:1200000,ts:now}));
fs.writeFileSync('warehouse/data/curated/support_sla.json', JSON.stringify({metric:'first_response_overdue',value:0,ts:now}));
fs.writeFileSync('warehouse/data/curated/growth_funnel.json', JSON.stringify([{stage:'signup',count:1000}]));
fs.writeFileSync('warehouse/data/curated/product_usage.json', JSON.stringify({active_users_7d:0}));
console.log('model: refreshed curated datasets (stub)');
