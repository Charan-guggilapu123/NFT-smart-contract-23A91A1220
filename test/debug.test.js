import { expect } from "chai";
import hre from "hardhat";
import fs from "fs";

describe("Simple Test", function () {
  it("should have ethers", async function () {
    this.timeout(10000);
    const output = [];
    output.push("=== DEBUG INFO ===");
    output.push("hre keys: " + Object.keys(hre).join(", "));
    output.push("hre.ethers exists: " + !!hre.ethers);
    
    if (hre.ethers) {
      output.push("hre.ethers.getSigners exists: " + (typeof hre.ethers.getSigners));
      try {
        const signers = await hre.ethers.getSigners();
        output.push("Got signers: " + signers.length);
      } catch (e) {
        output.push("Error getting signers: " + e.message);
      }
    }
    
    output.push("=== END DEBUG ===");
    fs.writeFileSync("debug-output.txt", output.join("\n"));
    
    // Fail the test so output shows
    expect(hre.ethers).to.not.be.undefined;
  });
});
