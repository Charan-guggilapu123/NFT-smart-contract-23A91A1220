import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("NftCollection", function () {
  let nft;
  let admin;
  let user1;
  let user2;

  const NAME = "My NFT";
  const SYMBOL = "MNFT";
  const BASE_URI = "https://example.com/meta/";
  const MIN_ID = 1;
  const MAX_ID = 10;
  const MAX_SUPPLY = 5;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("NftCollection");
    nft = await Factory.deploy(
      NAME,
      SYMBOL,
      BASE_URI,
      MIN_ID,
      MAX_ID,
      MAX_SUPPLY
    );
    await nft.waitForDeployment();
  });

  /* ------------------------------------------------ */
  /* INITIAL VALUES                                  */
  /* ------------------------------------------------ */
  describe("Initial values", function () {
    it("should set name and symbol", async function () {
      expect(await nft.name()).to.equal(NAME);
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("should start with zero total supply", async function () {
      expect(await nft.totalSupply()).to.equal(0);
    });

    it("should set max supply correctly", async function () {
      expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
    });
  });

  /* ------------------------------------------------ */
  /* ADMIN-ONLY MINT                                 */
  /* ------------------------------------------------ */
  describe("Admin-only mint", function () {
    it("should allow admin to mint", async function () {
      await nft.mint(user1.address, 1);

      expect(await nft.totalSupply()).to.equal(1);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
      expect(await nft.balanceOf(user1.address)).to.equal(1);
    });

    it("should revert if non-admin tries to mint", async function () {
      await expect(
        nft.connect(user1).mint(user1.address, 1)
      ).to.be.revertedWith("caller is not admin");
    });
  });

  /* ------------------------------------------------ */
  /* MAX SUPPLY REVERT                               */
  /* ------------------------------------------------ */
  describe("Max supply", function () {
    it("should revert when max supply is exceeded", async function () {
      for (let i = 0; i < MAX_SUPPLY; i++) {
        await nft.mint(admin.address, MIN_ID + i);
      }

      await expect(
        nft.mint(admin.address, MIN_ID + MAX_SUPPLY)
      ).to.be.revertedWith("max supply reached");
    });
  });

  /* ------------------------------------------------ */
  /* PAUSE / UNPAUSE                                 */
  /* ------------------------------------------------ */
  describe("Pause and unpause minting", function () {
    it("should block minting when paused", async function () {
      await nft.pauseMinting();

      await expect(
        nft.mint(user1.address, 1)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("should allow minting after unpause", async function () {
      await nft.pauseMinting();
      await nft.unpauseMinting();

      await nft.mint(user1.address, 1);
      expect(await nft.totalSupply()).to.equal(1);
    });
  });

  /* ------------------------------------------------ */
  /* TRANSFERS & APPROVALS                           */
  /* ------------------------------------------------ */
  describe("Transfers and approvals", function () {
    beforeEach(async function () {
      await nft.mint(admin.address, 1);
    });

    it("should allow owner to transfer token", async function () {
      await nft.transferFrom(admin.address, user1.address, 1);
      expect(await nft.ownerOf(1)).to.equal(user1.address);
    });

    it("should allow approved address to transfer", async function () {
      await nft.approve(user1.address, 1);

      await nft.connect(user1).transferFrom(
        admin.address,
        user2.address,
        1
      );

      expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it("should allow operator approval", async function () {
      await nft.setApprovalForAll(user1.address, true);

      await nft.connect(user1).transferFrom(
        admin.address,
        user2.address,
        1
      );

      expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it("should revert transfer by unapproved user", async function () {
      await expect(
        nft.connect(user1).transferFrom(admin.address, user1.address, 1)
      ).to.be.revertedWith("caller is not token owner nor approved");
    });
  });
});
