// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "../TokenContract.sol";

contract TokenContractV2 is TokenContract {
    function TOKEN_CONTRACT_V2_NAME() external pure returns (string memory) {
        return "TOKEN_CONTRACT_V2_NAME";
    }
}
