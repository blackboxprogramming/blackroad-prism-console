import fs from 'fs';
const FILE='iam/secrets.json'; const ROT='data/iam/secrets_rotations.jsonl';
if(!fs.existsSync(FILE)) process.exit(0);
const o=JSON.parse(fs.readFileSync(FILE,'utf-8'));
const ym=new Date().toISOString().slice(0,7).replace('-','');
let rotated=0;
for(const [k,v] of Object.entries<any>(o.secrets||{})){
  rotated++; v.value=`rot_${Math.random().toString(36).slice(2,10)}`; v.updatedAt=Date.now();
  fs.mkdirSync('data/iam',{recursive:true}); fs.appendFileSync(ROT, JSON.stringify({ ts:Date.now(), key:k })+'\n');
}
fs.writeFileSync(FILE, JSON.stringify(o,null,2));
fs.mkdirSync('iam/reports',{recursive:true}); fs.writeFileSync(`iam/reports/SECRETS_${ym}.md`, `# Secrets Rotation ${ym}\n\n- Rotated: ${rotated}\n`);
console.log('secrets rotated');
