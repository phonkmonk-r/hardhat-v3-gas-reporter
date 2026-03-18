import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Counter", function () {
  it("should deploy the Counter contract", async function () {
    const counter = await ethers.deployContract("Counter");
    expect(await counter.count()).to.equal(0n);
  });

  it("should increment", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.increment();
    expect(await counter.count()).to.equal(1n);
  });

  it("should incrementBy", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.incrementBy(5);
    expect(await counter.count()).to.equal(5n);
  });

  it("should reset", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.increment();
    await counter.increment();
    await counter.reset();
    expect(await counter.count()).to.equal(0n);
  });
});
