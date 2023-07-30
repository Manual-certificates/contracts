// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {PublicBeaconProxy} from "@dlsl/dev-modules/contracts-registry/pools/pool-factory/proxy/PublicBeaconProxy.sol";

import {ITokenContractDeployer} from "./interfaces/ITokenContractDeployer.sol";

contract TokenContractDeployer is ITokenContractDeployer {
    address public tokenContract;

    constructor(address tokenImplementation_) {
        tokenContract = tokenImplementation_;
    }

    /**
     * @inheritdoc ITokenContractDeployer
     */
    function deployTokenContract(bytes memory data_, bytes32 salt_) external {
        new PublicBeaconProxy{salt: salt_}(tokenContract, data_);
    }

    /**
     * @inheritdoc ITokenContractDeployer
     */
    function predictTokenAddress(
        bytes memory data_,
        bytes32 salt_
    ) external view returns (address) {
        bytes32 bytecodeHash = keccak256(
            abi.encodePacked(
                type(PublicBeaconProxy).creationCode,
                abi.encode(tokenContract, data_)
            )
        );

        return Create2.computeAddress(salt_, bytecodeHash);
    }

    /**
     * @inheritdoc ITokenContractDeployer
     */
    function setTokenImplementation(address tokenImplementation_) external {
        tokenContract = tokenImplementation_;
    }
}
