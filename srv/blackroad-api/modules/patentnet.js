// PatentNet API: hash, archive, mint, verify, daily merkle anchor
// Requires: ethers@6, crypto, fs. ENV: ETH_RPC_URL, MINT_PK, CLAIMREG_ADDR
const fs = require("fs"); const path = require("path"); const crypto = require("crypto");
let ethers;
try { ({ ethers } = require("ethers")); } catch (e) { console.warn("[patentnet] WARNING: ethers not installed"); }

module.exports = function attachPatentNet({ app }) {
  const ARCH = "/srv/patent-archive"; fs.mkdirSync(ARCH, {recursive:true});
  const provider = ethers ? new ethers.JsonRpcProvider(process.env.ETH_RPC_URL) : null;
  const wallet = ethers ? new ethers.Wallet(process.env.MINT_PK, provider) : null;
  const claimAddr = process.env.CLAIMREG_ADDR || (fs.existsSync("/srv/blackroad-api/.claimregistry.addr") ?
    fs.readFileSync("/srv/blackroad-api/.claimregistry.addr","utf8").trim() : "");
  if (!claimAddr) console.warn("[patentnet] WARNING: no CLAIMREG_ADDR set");
  const abi = [
    "function registerClaim(address to, bytes32 contentHash, string uri, string claimType) external returns (uint256)",
    "function commitDailyRoot(uint256 yyyymmdd, bytes32 root) external",
    "event ClaimRegistered(uint256 indexed tokenId, address indexed owner, bytes32 contentHash, string uri, string claimType, uint64 timestamp)"
  ];
  const contract = claimAddr && ethers ? new ethers.Contract(claimAddr, abi, wallet) : null;

  const OK = (res, x)=>res.type("application/json").send(JSON.stringify({ok:true, data:x, error:null}));
  const FAIL=(res, msg,code=400)=>res.status(code).type("application/json").send(JSON.stringify({ok:false,data:null,error:String(msg)}));

  function sha256(b){ return "0x"+crypto.createHash("sha256").update(b).digest("hex"); }
  function todayInt(){ const d=new Date(); return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate(); }

  // POST /api/patent/claim  {title, abstract, claimsText, tags?, attachments? [ {name, b64} ], claimType?}
  app.post("/api/patent/claim", async (req,res)=>{
    try{
      const b = req.body || {};
      if (!b.title || !b.claimsText) return FAIL(res, "title and claimsText required", 422);
      const env = {
        title: b.title, abstract: b.abstract||"", claimsText: b.claimsText,
        tags: b.tags||[], ts: new Date().toISOString(), author: b.author||"blackroad",
        attachments: Array.isArray(b.attachments)? b.attachments.map(a=>({name:a.name,size:(a.b64||"").length})):[ ]
      };
      const norm = Buffer.from(JSON.stringify(env, Object.keys(env).sort()), "utf8");
      const hash = sha256(norm);
      const day = todayInt();
      const base = `${day}-${hash.slice(2,10)}-${env.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,48)}`;
      const dir = path.join(ARCH, String(day)); fs.mkdirSync(dir, {recursive:true});
      const jsonPath = path.join(dir, `${base}.json`);
      fs.writeFileSync(jsonPath, norm);
      // store attachments
      if (Array.isArray(b.attachments)) {
        for (const a of b.attachments) {
          if (!a?.name || !a?.b64) continue;
          const p = path.join(dir, `${base}-${a.name.replace(/[^a-zA-Z0-9_.-]+/g,"_")}`);
          fs.writeFileSync(p, Buffer.from(a.b64, "base64"));
        }
      }
      const uri = `https://blackroad.io/patent-archive/${day}/${path.basename(jsonPath)}`;
      let txHash=null, tokenId=null;
      if (contract){
        const tx = await contract.registerClaim(wallet.address, hash, uri, String(b.claimType||"defensive-publication"));
        const rc = await tx.wait();
        txHash = tx.hash;
        const ev = rc.logs.map(l=>{ try{ return contract.interface.parseLog(l); }catch{return null;} })
                         .filter(Boolean).find(e=>e.name==="ClaimRegistered");
        tokenId = ev?.args?.tokenId?.toString?.() || null;
      }
      OK(res, {hash, archive: jsonPath, uri, chain: claimAddr||null, txHash, tokenId, day});
      // Celebrate on the LED ring
      fetch("http://127.0.0.1:4000/api/devices/pi-01/command",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({type:"led.celebrate", ttl_s:12})
      }).catch(()=>{});
    }catch(e){ FAIL(res, e.message||e, 500); }
  });

  // GET /api/patent/list?day=YYYYMMDD
  app.get("/api/patent/list", (req,res)=>{
    const day = req.query.day || ""; const root = day? path.join(ARCH, String(day)): ARCH;
    function scan(d){ return fs.existsSync(d)? fs.readdirSync(d).filter(f=>f.endsWith(".json")).map(f=>path.join(d,f)):[]; }
    const files = fs.statSync(root, {throwIfNoEntry:false})?.isDirectory()? scan(root) : fs.readdirSync(ARCH).flatMap(dd=>scan(path.join(ARCH,dd)));
    OK(res, files.map(p=>({path:p, mtime:fs.statSync(p).mtimeMs})));
  });

  // POST /api/patent/anchor/daily  (merklize all JSON files for today and commit root)
  app.post("/api/patent/anchor/daily", async (req,res)=>{
    try{
      if (!contract) return FAIL(res, "no contract configured", 500);
      const day = todayInt(); const dir = path.join(ARCH, String(day));
      const files = fs.existsSync(dir)? fs.readdirSync(dir).filter(f=>f.endsWith(".json")):
 [];
      if (!files.length) return OK(res, {day, root:null, count:0});
      const leaves = files.map(f=>crypto.createHash("sha256").update(fs.readFileSync(path.join(dir,f))).digest());
      // simple merkle (pairwise sha256)
      function merkle(arr){
        if (arr.length===1) return arr[0];
        const next=[]; for (let i=0;i<arr.length;i+=2){
          const a = arr[i], b = arr[i+1] || arr[i]; // duplicate last if odd
          next.push(crypto.createHash("sha256").update(Buffer.concat([a,b])).digest());
        } return merkle(next);
      }
      const root = "0x"+merkle(leaves).toString("hex");
      const tx = await contract.commitDailyRoot(day, root);
      await tx.wait();
      OK(res, {day, root, count: leaves.length, txHash: tx.hash});
    }catch(e){ FAIL(res, e.message||e, 500); }
  });

  // (stub) GET /api/patent/compare?query=...  -> returns empty until connectors are configured
  app.get("/api/patent/compare", async (req,res)=>{ OK(res, {query: req.query.query||"", results: []}); });

  console.log("[patentnet] endpoints ready: /api/patent/*  archive:", ARCH);
};
