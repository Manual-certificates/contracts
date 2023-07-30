import { Deployer, Logger } from "@dlsl/hardhat-migrate";
import { artifacts } from "hardhat";

import { parseConfig } from "./helpers/deployHelper";

const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const ProxyBeacon = artifacts.require("ProxyBeacon");
const TokenContract = artifacts.require("TokenContract");
const TokenContractDeployer = artifacts.require("TokenContractDeployer");

export = async (deployer: Deployer, logger: Logger) => {
  const tokenContract = await deployer.deploy(TokenContract);

  const proxyBeacon = await deployer.deploy(ProxyBeacon);
  await proxyBeacon.upgrade(tokenContract.address);

  const proxyTokenContract = await deployer.deploy(ERC1967Proxy, tokenContract.address, "0x");

  const config = parseConfig();

  const tokenContractDeployer = await deployer.deploy(TokenContractDeployer, proxyBeacon.address);

  logger.logTransaction(
    await (
      await TokenContract.at(proxyTokenContract.address)
    ).__TokenContract_init(config.tokenName, config.tokenSymbol, config.baseUri),
    "Initialize TokenContract"
  );

  if (config.newOwner) {
    logger.logTransaction(
      await (await TokenContract.at(proxyTokenContract.address)).transferOwnership(config.newOwner),
      "Transfer ownership"
    );
  }

  logger.logContracts(
    ["TokenContract implementation", tokenContract.address],
    ["TokenContract proxy", proxyTokenContract.address],
    ["TokenContractDeployer", tokenContractDeployer.address]
  );
};
