const fetch = global.fetch;
const db = require('./db');

const slackUrl = process.env.SLACK_WEBHOOK_URL;
const airtableKey = process.env.AIRTABLE_API_KEY;
const airtableBase = process.env.AIRTABLE_BASE_ID;
const airtableTable = process.env.AIRTABLE_TABLE_INCIDENTS;
const linearKey = process.env.LINEAR_API_KEY;
const linearTeam = process.env.LINEAR_TEAM_ID;

async function postSlack(text){
  if(!slackUrl) return;
  await fetch(slackUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
  dbLog('slack',text);
}

async function postAirtable(fields){
  if(!airtableKey || !airtableBase) return;
  await fetch(`https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent(airtableTable)}`,{
    method:'POST',
    headers:{'Authorization':`Bearer ${airtableKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({fields})
  });
  dbLog('airtable',fields.Summary);
}

async function postLinear(title,description){
  if(!linearKey || !linearTeam) return;
  await fetch('https://api.linear.app/graphql',{
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':linearKey},
    body:JSON.stringify({query:`mutation($i:IssueCreateInput!){issueCreate(input:$i){success}}`,variables:{i:{teamId:linearTeam,title,description}}})
  });
  dbLog('linear',title);
}

function dbLog(channel,message){
  db.logCheck({component:'alert',ok:true,message:`${channel}:${message}`});
}

async function notify(component,severity,summary){
  const text = `:rotating_light: Incident ${severity} – ${component}\n${summary}`;
  await postSlack(text);
  await postAirtable({When:new Date().toISOString(),Component:component,Severity:severity,Summary:summary,Status:'open',Link:''});
  await postLinear(`[Incident] ${component} – ${summary}`, summary);
}

async function resolve(component,summary){
  const text = `Incident resolved – ${component}\n${summary}`;
  await postSlack(text);
}

module.exports = { notify, resolve };
