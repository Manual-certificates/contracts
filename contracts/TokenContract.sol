// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/ITokenContract.sol";

contract TokenContract is ITokenContract, OwnableUpgradeable, UUPSUpgradeable, ERC721Upgradeable {
    string public override baseURI;

    uint256 internal _currentTokenId;

    mapping(uint256 => string) internal _tokenURIs;

    function mint(
        address to_,
        string memory tokenURI_
    ) public override onlyOwner returns (uint256 tokenId_) {
        require(balanceOf(to_) == 0, "TokenContract: User already has a token.");

        tokenId_ = _currentTokenId++;

        _mint(to_, tokenId_);

        _tokenURIs[tokenId_] = tokenURI_;
    }

    function setBaseURI(string memory baseURI_) public override onlyOwner {
        baseURI = baseURI_;
    }

    function __TokenContract_init(
        string memory tokenName_,
        string memory tokenSymbol_,
        string memory baseURI_
    ) external override initializer {
        __Ownable_init();

        __UUPSUpgradeable_init();

        __ERC721_init(tokenName_, tokenSymbol_);

        setBaseURI(baseURI_);
    }

    function mintBatch(
        address[] memory to_,
        string[] memory tokenURIs_
    ) external override onlyOwner returns (uint256[] memory tokenIds_) {
        require(to_.length == tokenURIs_.length, "TokenContract: Unequal length of parameters.");

        tokenIds_ = new uint256[](to_.length);

        for (uint256 i = 0; i < to_.length; i++) {
            tokenIds_[i] = mint(to_[i], tokenURIs_[i]);
        }
    }

    function burn(uint256 tokenId_) external override onlyOwner {
        _burn(tokenId_);

        delete _tokenURIs[tokenId_];
    }

    /**
     * @inheritdoc ERC721Upgradeable
     */
    function tokenURI(uint256 tokenId_) public view override returns (string memory) {
        _requireMinted(tokenId_);

        string memory tokenURI_ = _tokenURIs[tokenId_];
        string memory base_ = _baseURI();

        if (bytes(base_).length == 0) {
            return tokenURI_;
        }
        if (bytes(tokenURI_).length > 0) {
            return string.concat(base_, tokenURI_);
        }

        return super.tokenURI(tokenId_);
    }

    function _beforeTokenTransfer(
        address from_,
        address to_,
        uint256 firstTokenId_,
        uint256 batchSize_
    ) internal override {
        super._beforeTokenTransfer(from_, to_, firstTokenId_, batchSize_);

        _checkOwner();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _isApprovedOrOwner(address, uint256) internal view override returns (bool) {
        return _msgSender() == owner();
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
