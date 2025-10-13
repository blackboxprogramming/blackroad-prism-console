import { enqueue } from '../../agents/command_bus.js';
const text = process.argv.slice(2).join(' ') || 'reindex search';
const t = enqueue(text, 'cli');
console.log(JSON.stringify(t, null, 2));
