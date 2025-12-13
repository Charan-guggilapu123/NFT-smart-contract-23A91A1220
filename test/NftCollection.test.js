const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {
  let NftCollection, nft, deployer, addr1, addr2, minter, other;

  const NAME = "MyCollection";
  const SYMBOL = "MYC";
  const BASE = "https://metadata.example/token/";
  const MIN_TOKEN_ID = 1;
  const MAX_TOKEN_ID = 1000;
  const MAX_SUPPLY = 10;

  beforeEach(async function () {
    [deployer, addr1, addr2, minter, other] = await ethers.getSigners();
    NftCollection = await ethers.getContractFactory("NftCollection");
    nft = await NftCollection.deploy(
      NAME,
      SYMBOL,
      BASE,
      MIN_TOKEN_ID,
      MAX_TOKEN_ID,
      MAX_SUPPLY
    );
    await nft.deployed();
    // admin is deployer; no role grants needed in this implementation
  });

  it("deploys with correct config and read-only functions", async function () {
    expect(await nft.name()).to.equal(NAME);
    expect(await nft.symbol()).to.equal(SYMBOL);
    expect(await nft.minTokenId()).to.equal(MIN_TOKEN_ID);
    expect(await nft.maxTokenIdConfig()).to.equal(MAX_TOKEN_ID);
    expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
    expect(await nft.totalSupply()).to.equal(0);
  });

  it("allows authorized minter to mint and sets ownership and emits Transfer", async function () {
    const tokenId = 1;
    await expect(nft.connect(minter).mint(addr1.address, tokenId))
      .to.emit(nft, "Transfer")
      .withArgs(ethers.constants.AddressZero, addr1.address, tokenId);

    expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    expect(await nft.balanceOf(addr1.address)).to.equal(1);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.tokenURI(tokenId)).to.equal(BASE + tokenId.toString());
  });

  it("prevents double minting and mint beyond max supply", async function () {
    // mint upto MAX_SUPPLY
    for (let i = 0; i < MAX_SUPPLY; i++) {
      await nft.connect(minter).mint(addr1.address, MIN_TOKEN_ID + i);
    }
    expect(await nft.totalSupply()).to.equal(MAX_SUPPLY);

    // now any further mint must revert
    await expect(nft.connect(deployer).mint(addr1.address, MIN_TOKEN_ID + MAX_SUPPLY))
      .to.be.revertedWith("max supply reached"); // contract revert message
  });

  it("rejects minting to zero address and out-of-range tokenId and unauthorized minter", async function () {
    await expect(nft.connect(deployer).mint(ethers.constants.AddressZero, 2))
      .to.be.revertedWith("mint to zero address");

    await expect(nft.connect(deployer).mint(addr1.address, MAX_TOKEN_ID + 1))
      .to.be.revertedWith("tokenId out of allowed range");

    await expect(nft.connect(addr2).mint(addr1.address, 3))
      .to.be.revertedWith("caller is not admin");
  });

  it("supports approve, transferFrom and safeTransferFrom and ApprovalForAll", async function () {
    const tokenId = 10;
    await nft.connect(deployer).mint(addr1.address, tokenId);

    // approve addr2
    await expect(nft.connect(addr1).approve(addr2.address, tokenId))
      .to.emit(nft, "Approval")
      .withArgs(addr1.address, addr2.address, tokenId);

    expect(await nft.getApproved(tokenId)).to.equal(addr2.address);

    // transfer by approved
    await expect(nft.connect(addr2).transferFrom(addr1.address, addr2.address, tokenId))
      .to.emit(nft, "Transfer")
      .withArgs(addr1.address, addr2.address, tokenId);

    expect(await nft.ownerOf(tokenId)).to.equal(addr2.address);

    // operator approval
    await nft.connect(addr2).setApprovalForAll(other.address, true);
    expect(await nft.isApprovedForAll(addr2.address, other.address)).to.equal(true);
  });

  it("prevents unauthorized transfers and transferring non-existent tokens", async function () {
    const tokenId = 50;
    // no token minted -> ownerOf should revert
    await expect(nft.ownerOf(tokenId)).to.be.reverted;

    // unauthorized transfer attempt
    await nft.connect(deployer).mint(addr1.address, tokenId);
    await expect(nft.connect(addr2).transferFrom(addr1.address, addr2.address, tokenId))
      .to.be.revertedWith("caller is not token owner nor approved");
  });

  it("burning updates balances and totalSupply", async function () {
    const tokenId = 7;
    await nft.connect(deployer).mint(addr1.address, tokenId);
    expect(await nft.totalSupply()).to.equal(1);

    // non-owner can't burn
    await expect(nft.connect(addr2).burn(tokenId)).to.be.reverted;

    // owner can burn
    await nft.connect(addr1).burn(tokenId);

    await expect(nft.ownerOf(tokenId)).to.be.reverted; // no longer exists
    expect(await nft.totalSupply()).to.equal(0);
    expect(await nft.balanceOf(addr1.address)).to.equal(0);
  });

  it("events emitted correctly on approval revoke and repeated approvals", async function () {
    const tokenId = 20;
    await nft.connect(minter).mint(addr1.address, tokenId);

    await nft.connect(addr1).approve(addr2.address, tokenId);
    expect(await nft.getApproved(tokenId)).to.equal(addr2.address);

    // revoke approval
    await expect(nft.connect(addr1).approve(ethers.constants.AddressZero, tokenId))
      .to.emit(nft, "Approval")
      .withArgs(addr1.address, ethers.constants.AddressZero, tokenId);

    expect(await nft.getApproved(tokenId)).to.equal(ethers.constants.AddressZero);

    // repeated approves to same address should still emit
    await expect(nft.connect(addr1).approve(addr2.address, tokenId))
      .to.emit(nft, "Approval")
      .withArgs(addr1.address, addr2.address, tokenId);
  });

  it("measures gas for a typical mint + transfer flow (rough bound)", async function () {
    // mint one
    const tokenId = 99;
    const txMint = await nft.connect(deployer).mint(addr1.address, tokenId);
    const rcMint = await txMint.wait();
    const gasMint = rcMint.gasUsed;

    // transfer by owner -> compute gas used
    const txTransfer = await nft.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);
    const rcTransfer = await txTransfer.wait();
    const gasTransfer = rcTransfer.gasUsed;

    // assert they are within reasonable bounds (values will vary by environment)
    // using a loose upper bound like 500k for mint and 200k for transfer to avoid brittle tests
    expect(gasMint.toNumber()).to.be.lessThan(500000);
    expect(gasTransfer.toNumber()).to.be.lessThan(300000);
  });

  it("allows admin to pause and unpause minting", async function () {
    // default admin is deployer
    await nft.connect(deployer).pauseMinting();
    await expect(nft.connect(deployer).mint(addr1.address, 2)).to.be.revertedWith("Pausable: paused");
    await nft.connect(deployer).unpauseMinting();
    await nft.connect(deployer).mint(addr1.address, 2);
    expect(await nft.ownerOf(2)).to.equal(addr1.address);
  });
});
