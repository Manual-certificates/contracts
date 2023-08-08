import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";

import { Reverter } from "@/test/helpers/reverter";

describe("TokenContractDeployer", () => {
  const reverter = new Reverter();

  let ProxyBeacon: ContractFactory;
  let TokenContract: ContractFactory;
  let tokenContractDeployer: Contract;
  let proxyBeacon: Contract;

  const contractName = "Deployed";
  const contractSymbol = "DP";
  const defaultBaseURI = "baseURI/";

  before(async () => {
    const TokenContractDeployer = await ethers.getContractFactory("TokenContractDeployer");
    TokenContract = await ethers.getContractFactory("TokenContract");
    ProxyBeacon = await ethers.getContractFactory("ProxyBeacon");

    proxyBeacon = await ProxyBeacon.deploy();
    const tokenContract = await TokenContract.deploy();

    await proxyBeacon.upgrade(tokenContract.address);
    tokenContractDeployer = await TokenContractDeployer.deploy(proxyBeacon.address);

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("TokenContractDeployer", function () {
    describe("#deployTokenContract", function () {
      it("should deploy", async function () {
        const params = ethers.utils.defaultAbiCoder
          .encode(["string", "string", "string", "address"], [contractName, contractSymbol, defaultBaseURI, tokenContractDeployer.address])
          .substring(2);

        const encoded = TokenContract.interface.getSighash("__TokenContract_init").concat(params);

        const salt = ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString(), 32);

        await tokenContractDeployer.deployTokenContract(encoded, salt);

        let addr = await tokenContractDeployer.predictTokenAddress(encoded, salt);

        const tokenContract = TokenContract.attach(addr);

        expect(await tokenContract.name()).to.equal(contractName);
        expect(await tokenContract.symbol()).to.equal(contractSymbol);
        expect(await tokenContract.baseURI()).to.equal(defaultBaseURI);
      });

      it("should deploy", async function () {
        const name = "some name";
        const symbol = "sm";
        const uri = "uri";

        const params = ethers.utils.defaultAbiCoder
          .encode(["string", "string", "string", "address"], [name, symbol, uri, tokenContractDeployer.address])
          .substring(2);

        const encoded = TokenContract.interface.getSighash("__TokenContract_init").concat(params);

        const salt = ethers.utils.hexZeroPad(ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString(), 32);

        await tokenContractDeployer.deployTokenContract(encoded, salt);

        let addr = await tokenContractDeployer.predictTokenAddress(encoded, salt);

        const tokenContract = TokenContract.attach(addr);

        expect(await tokenContract.name()).to.equal(name);
        expect(await tokenContract.symbol()).to.equal(symbol);
        expect(await tokenContract.baseURI()).to.equal(uri);
      });
    });

    describe("#setTokenImplementation", function () {
      it("should set implementation", async function () {
        const tokenContract = await TokenContract.deploy();

        const newProxyBeacon = await ProxyBeacon.deploy();
        await newProxyBeacon.upgrade(tokenContract.address);

        await tokenContractDeployer.setTokenImplementation(newProxyBeacon.address);
        const implementation = await ProxyBeacon.attach(await tokenContractDeployer.tokenContract()).implementation();

        expect(implementation).to.equal(tokenContract.address);
      });
    });
  });
});
