import { expect } from "chai";
import { ethers } from "hardhat";

const CAP = ethers.parseEther("1000000000");
const INITIAL_SUPPLY = ethers.parseEther("100000000");

describe("RoadCoin", () => {
  it("deploys with initial supply to owner", async () => {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RoadCoin");
    const contract = await factory.deploy(deployer.address, INITIAL_SUPPLY, CAP);

    expect(await contract.name()).to.equal("RoadCoin");
    expect(await contract.symbol()).to.equal("ROAD");
    expect(await contract.cap()).to.equal(CAP);
    expect(await contract.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY);
  });

  it("allows owner to mint within cap", async () => {
    const [deployer, recipient] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RoadCoin");
    const contract = await factory.deploy(deployer.address, INITIAL_SUPPLY, CAP);

    const amount = ethers.parseEther("1");
    await expect(contract.mint(recipient.address, amount))
      .to.emit(contract, "Transfer")
      .withArgs(ethers.ZeroAddress, recipient.address, amount);

    expect(await contract.balanceOf(recipient.address)).to.equal(amount);
  });

  it("reverts when minting above the cap", async () => {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RoadCoin");
    const contract = await factory.deploy(deployer.address, INITIAL_SUPPLY, CAP);

    const amount = CAP - INITIAL_SUPPLY + 1n;
    await expect(contract.mint(deployer.address, amount)).to.be.revertedWithCustomError(
      contract,
      "CapExceeded"
    );
  });

  it("reverts when deploying with zero owner", async () => {
    const factory = await ethers.getContractFactory("RoadCoin");
    await expect(
      factory.deploy(ethers.ZeroAddress, INITIAL_SUPPLY, CAP)
    ).to.be.revertedWithCustomError(factory, "OwnableInvalidOwner");
  });

  it("reverts when initial supply is greater than cap", async () => {
    const [deployer] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("RoadCoin");
    await expect(
      factory.deploy(deployer.address, CAP + 1n, CAP)
    ).to.be.revertedWithCustomError(factory, "CapExceeded");
  });
});
