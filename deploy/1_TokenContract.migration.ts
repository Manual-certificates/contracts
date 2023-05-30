import { Deployer, Logger } from "@dlsl/hardhat-migrate";
import { artifacts } from "hardhat";

import { parseConfig } from "./helpers/deployHelper";

const ERC1967Proxy = artifacts.require("ERC1967Proxy");
const TokenContract = artifacts.require("TokenContract");

export = async (deployer: Deployer, logger: Logger) => {
  const tokenContract = await deployer.deploy(TokenContract);

  const proxyTokenContract = await deployer.deploy(ERC1967Proxy, tokenContract.address, "0x");

  const config = parseConfig();

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
    ["TokenContract proxy", proxyTokenContract.address]
  );
};
