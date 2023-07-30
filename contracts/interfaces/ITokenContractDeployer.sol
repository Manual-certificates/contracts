// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

/**
 * This is TokenContractDeployer, that is used to deploy TokenContract.
 */
interface ITokenContractDeployer {
    /**
     * @notice Deploy new token contract instance.
     *
     * @dev This function is using the Create2 mechanism.
     *
     * @param data_ is values (token name, symbol, uri) that encoded with
     * ABI encoding approach. Note, that the order of encoding input is
     * important to have desired values in result
     * @param salt_ is a random unique data
     */
    function deployTokenContract(bytes memory data_, bytes32 salt_) external;

    /**
     * @notice Predicts address of the contract that was deployed using `deployTokenContract`
     * function.
     *
     * @dev All function parameters must be the same as in `deployTokenContract` function in
     * order to get right address.
     *
     * @param data_ is values (token name, symbol, uri) that encoded with
     * ABI encoding approach. Note, that the order of encoding input is
     * important to have desired values in result
     * @param salt_ is a random unique data
     */
    function predictTokenAddress(
        bytes memory data_,
        bytes32 salt_
    ) external view returns (address);

    /**
     * @notice Updates token implementation address in proxy beacon mechanism.
     *
     * @param tokenImplementation_ address of deployed `TokenContract` implementation
     */
    function setTokenImplementation(address tokenImplementation_) external;
}
