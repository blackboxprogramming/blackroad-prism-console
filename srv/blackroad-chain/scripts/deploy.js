const hre = require("hardhat");
async function main() {
  const C = await hre.ethers.getContractFactory("ClaimRegistry");
  const c = await C.deploy();
  await c.waitForDeployment();
  console.log("ClaimRegistry:", await c.getAddress());
}
main().catch((e)=>{ console.error(e); process.exit(1); });
