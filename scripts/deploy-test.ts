import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(bal), "HSK");

  const Contract = await ethers.getContractFactory("ProofPayAttestation");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  console.log("✅ ProofPayAttestation deployed:", addr);

  // Test write
  const tx = await contract.createProof(
    deployer.address,
    1000000n, // 1 USDC base
    700000n,  // 0.70 USDC final (30% off)
    '[{"rule":"gas<10","matched":true,"adjustment":-3000}]',
    '{"type":"Point","coordinates":[114.1694,22.3193]}',
    ethers.id("astral-proof-test"),
    ethers.id("hsp-req-test")
  );
  const receipt = await tx.wait();
  console.log("✅ Attestation created, tx:", receipt?.hash);
  console.log("   Gas used:", receipt?.gasUsed?.toString());

  // Test read
  const count = await contract.proofCount();
  console.log("   Proof count:", count.toString());
}

main().catch(console.error);
