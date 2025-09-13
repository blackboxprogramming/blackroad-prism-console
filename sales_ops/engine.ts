import fs from 'fs';
import yaml from 'yaml';

export type Step = { name:string; action:string; params?:Record<string,any> };
export type Play = { title:string; purpose:string; triggers:string[]; steps:Step[] };

export function loadPlaybook(p: string): Play {
  const txt = fs.readFileSync(p,'utf-8');
  return yaml.parse(txt) as Play;
}

export async function runPlaybook(play: Play, log: (s:string)=>void = console.log) {
  log(`# ${play.title}`);
  for (const s of play.steps) {
    log(`- ${s.name}: ${s.action}`);
    // TODO: route to real actions (create issue, post Slack, create deal, etc.)
  }
}
