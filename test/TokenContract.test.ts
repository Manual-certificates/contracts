import { ZERO_ADDR } from "@/scripts/utils/constants";
import { Reverter } from "@/test/helpers/reverter";
import { TokenContract, TokenContractV2 } from "@ethers-v5";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("TokenContract", () => {
  const reverter = new Reverter();

  let OWNER: SignerWithAddress;
  let SECOND: SignerWithAddress;
  let THIRD: SignerWithAddress;

  let tokenContract: TokenContract;

  const defaultName = "Mock";
  const defaultSymbol = "MCK";
  const defaultBaseURI = "baseURI/";
  const defaultTokenURI = "tokenURI";
  const defaultFullURI = defaultBaseURI + defaultTokenURI;

  before(async () => {
    [OWNER, SECOND, THIRD] = await ethers.getSigners();

    const TokenContract = await ethers.getContractFactory("TokenContract");

    tokenContract = (await upgrades.deployProxy(
      TokenContract,
      [defaultName, defaultSymbol, defaultBaseURI, OWNER.address],
      {
        initializer: "__TokenContract_init",
        kind: "uups",
      }
    )) as TokenContract;

    await reverter.snapshot();
  });

  afterEach(reverter.revert);

  describe("proxy functionality", function () {
    describe("#__TokenContract_init", function () {
      it("should not initialize twice", async function () {
        await expect(
          tokenContract.__TokenContract_init(defaultName, defaultSymbol, defaultBaseURI, OWNER.address)
        ).to.be.revertedWith("Initializable: contract is already initialized");
      });
    });

    describe("#_authorizeUpgrade", function () {
      it("should not upgrade if caller is not the owner", async function () {
        await expect(
          upgrades.upgradeProxy(tokenContract.address, await ethers.getContractFactory("TokenContractV2", SECOND))
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("should upgrade if caller is the owner", async function () {
        const TokenContractV2 = await ethers.getContractFactory("TokenContractV2");

        const tokenContractV2 = (await upgrades.upgradeProxy(
          tokenContract.address,
          TokenContractV2
        )) as unknown as TokenContractV2;

        expect(tokenContract.address).to.be.eq(tokenContractV2.address);
        expect(await tokenContractV2.TOKEN_CONTRACT_V2_NAME()).to.be.eq("TOKEN_CONTRACT_V2_NAME");
      });
    });
  });

  describe("onlyOwner functionality", function () {
    const reason = "Ownable: caller is not the owner";
    it("should revert if caller is not the admin", async function () {
      await expect(tokenContract.connect(SECOND).mint(SECOND.address, defaultTokenURI)).to.be.revertedWith(reason);

      await expect(tokenContract.connect(SECOND).mintBatch([SECOND.address], [defaultTokenURI])).to.be.revertedWith(
        reason
      );

      await expect(tokenContract.connect(SECOND).burn(0)).to.be.revertedWith(reason);

      await expect(tokenContract.connect(SECOND).setBaseURI(defaultBaseURI)).to.be.revertedWith(reason);
    });
  });

  describe("TokenContract functionality", function () {
    describe("#mint", function () {
      it("should mint tokens", async function () {
        expect(await tokenContract.balanceOf(OWNER.address)).to.be.eq(0);

        const tx = await tokenContract.mint(OWNER.address, defaultTokenURI);

        await expect(tx).to.changeTokenBalance(tokenContract, OWNER, 1);
        await expect(tx).to.emit(tokenContract, "Transfer").withArgs(ZERO_ADDR, OWNER.address, 0);

        expect(await tokenContract.ownerOf(0)).to.be.eq(OWNER.address);
        expect(await tokenContract.tokenURI(0)).to.be.eq(defaultFullURI);
      });

      it("should revert if user already has a token", async function () {
        await tokenContract.mint(OWNER.address, defaultTokenURI);
        await expect(tokenContract.mint(OWNER.address, defaultTokenURI)).to.be.revertedWith(
          "TokenContract: User already has a token."
        );
      });
    });

    describe("#mintBatch", function () {
      it("should mint tokens batch", async function () {
        expect(await tokenContract.balanceOf(OWNER.address)).to.be.eq(0);
        expect(await tokenContract.balanceOf(SECOND.address)).to.be.eq(0);

        const secondTokenURI = defaultTokenURI + 1;

        const tx = await tokenContract.mintBatch([OWNER.address, SECOND.address], [defaultTokenURI, secondTokenURI]);

        await expect(tx).to.changeTokenBalance(tokenContract, OWNER, 1);
        await expect(tx).to.changeTokenBalance(tokenContract, SECOND, 1);

        await expect(tx).to.emit(tokenContract, "Transfer").withArgs(ZERO_ADDR, OWNER.address, 0);
        await expect(tx).to.emit(tokenContract, "Transfer").withArgs(ZERO_ADDR, SECOND.address, 1);

        expect(await tokenContract.ownerOf(0)).to.be.eq(OWNER.address);
        expect(await tokenContract.ownerOf(1)).to.be.eq(SECOND.address);

        expect(await tokenContract.tokenURI(0)).to.be.eq(defaultFullURI);
        expect(await tokenContract.tokenURI(1)).to.be.eq(defaultBaseURI + secondTokenURI);
      });

      it("should revert if arrays length mismatch", async function () {
        await expect(tokenContract.mintBatch([OWNER.address], [defaultTokenURI, defaultTokenURI])).to.be.revertedWith(
          "TokenContract: Unequal length of parameters."
        );
        await expect(tokenContract.mintBatch([OWNER.address], [])).to.be.revertedWith(
          "TokenContract: Unequal length of parameters."
        );
      });
    });

    describe("#burn", function () {
      it("should burn tokens", async function () {
        await tokenContract.mint(OWNER.address, defaultTokenURI);
        const tokenId = 0;

        const tx = await tokenContract.burn(tokenId);

        await expect(tx).to.changeTokenBalance(tokenContract, OWNER, -1);

        await expect(tx).to.emit(tokenContract, "Transfer").withArgs(OWNER.address, ZERO_ADDR, tokenId);

        expect(await tokenContract.balanceOf(OWNER.address)).to.be.eq(0);
      });

      it("should revert if nonexistent token", async function () {
        await expect(tokenContract.burn(0)).to.be.revertedWith("ERC721: invalid token ID");
      });
    });

    describe("#tokenURI", function () {
      context("when baseTokenURI is not set", function () {
        beforeEach(async function () {
          await tokenContract.setBaseURI("");
        });
        it("should return token URI", async function () {
          await tokenContract.mint(OWNER.address, defaultTokenURI);
          expect(await tokenContract.tokenURI(0)).to.be.eq(defaultTokenURI);
        });
      });

      context("when tokenURI is not set", function () {
        it("should return token URI", async function () {
          await tokenContract.mint(OWNER.address, "");
          expect(await tokenContract.tokenURI(0)).to.be.eq(defaultBaseURI + 0);
        });
      });

      context("when baseTokenURI and tokenURI are set", function () {
        it("should return token URI", async function () {
          await tokenContract.mint(OWNER.address, defaultTokenURI);
          expect(await tokenContract.tokenURI(0)).to.be.eq(defaultFullURI);
        });
      });

      it("should revert if nonexistent token", async function () {
        await expect(tokenContract.tokenURI(0)).to.be.revertedWith("ERC721: invalid token ID");
      });
    });

    describe("#SBT", function () {
      it("should revert if user transfers token", async function () {
        const reason = "Ownable: caller is not the owner";
        await tokenContract.mint(SECOND.address, defaultTokenURI);
        await expect(tokenContract.connect(SECOND).transferFrom(SECOND.address, THIRD.address, 0)).to.be.revertedWith(
          reason
        );

        await tokenContract.connect(SECOND).approve(THIRD.address, 0);
        await expect(tokenContract.connect(THIRD).transferFrom(SECOND.address, THIRD.address, 0)).to.be.revertedWith(
          reason
        );
      });

      it("owner should be able to transfer any tokens", async function () {
        await tokenContract.mint(SECOND.address, defaultTokenURI);
        expect(await tokenContract.ownerOf(0)).to.be.eq(SECOND.address);
        await tokenContract.transferFrom(SECOND.address, THIRD.address, 0);
        expect(await tokenContract.ownerOf(0)).to.be.eq(THIRD.address);
      });
    });
  });
});
