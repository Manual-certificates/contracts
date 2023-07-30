// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;

import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import {ITokenContract} from "./interfaces/ITokenContract.sol";

contract TokenContract is
    ITokenContract,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ERC721URIStorageUpgradeable
{
    string public override baseURI;

    uint256 public override nextTokenId;

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

    function mint(
        address to_,
        string memory tokenURI_
    ) public override onlyOwner returns (uint256 tokenId_) {
        require(balanceOf(to_) == 0, "TokenContract: User already has a token.");

        tokenId_ = nextTokenId++;

        _mint(to_, tokenId_);

        _setTokenURI(tokenId_, tokenURI_);
    }

    function setBaseURI(string memory baseURI_) public override onlyOwner {
        baseURI = baseURI_;
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
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _isApprovedOrOwner(address, uint256) internal view override returns (bool) {
        _checkOwner();
        return true;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}
