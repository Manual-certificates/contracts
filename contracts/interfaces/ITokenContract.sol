// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

/**
 * This is TokenContract, which is an ERC721 SBT.
 */
interface ITokenContract {
    /**
     * @notice Initializes the contract.
     * @param tokenName_ The name of the token.
     * @param tokenSymbol_ The symbol of the token.
     * @param baseURI_ The base URI of the tokens.
     */
    function __TokenContract_init(
        string memory tokenName_,
        string memory tokenSymbol_,
        string memory baseURI_
    ) external;

    /**
     * @notice Mints a new token.
     * @dev Only the owner can mint tokens.
     * @param to_ The address of the receiver.
     * @param tokenURI_ The URI of the token.
     * @return tokenId_ The id of the minted token.
     */
    function mint(address to_, string memory tokenURI_) external returns (uint256 tokenId_);

    /**
     * @notice Mints a batch of new tokens.
     * @dev Only the owner can mint tokens.
     * @param to_ The addresses of the receivers.
     * @param tokenURIs_ The URIs of the tokens.
     * @return tokenIds_ The ids of the minted tokens.
     */
    function mintBatch(
        address[] memory to_,
        string[] memory tokenURIs_
    ) external returns (uint256[] memory tokenIds_);

    /**
     * @notice Burns a token.
     * @dev Only the owner can burn tokens.
     * @param tokenId_ The id of the token.
     */
    function burn(uint256 tokenId_) external;

    /**
     * @notice Sets the base URI of the token.
     * @dev Only the owner can set the base URI.
     * @param baseURI_ The base URI of the token.
     */
    function setBaseURI(string memory baseURI_) external;

    /**
     * @notice Returns the base URI of the token.
     * @return The base URI of the token.
     */
    function baseURI() external view returns (string memory);
}
