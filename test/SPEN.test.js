const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPEN", function () {
  let spen;
  let owner;
  let addr1;
  let erc20Mock;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const SPEN = await ethers.getContractFactory("SPEN");
    spen = await SPEN.deploy();
    await spen.deployed();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    erc20Mock = await ERC20Mock.deploy("MockToken", "MCK", ethers.utils.parseEther("1000"));
    await erc20Mock.deployed();

    await erc20Mock.approve(spen.address, ethers.utils.parseEther("1000"));
  });

  it("Should mint a new NFT and set token URI", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    expect(await spen.tokenURI(0)).to.equal(tokenURI);
  });

  it("Should return the correct total supply", async function () {
    const tokenURI1 = '{"name": "Test Token 1", "description": "This is a test token", "contentId": 1}';
    const tokenURI2 = '{"name": "Test Token 2", "description": "This is another test token", "contentId": 2}';
    await spen.mintNFT(addr1.address, tokenURI1, 1);
    await spen.mintNFT(addr1.address, tokenURI2, 2);
    expect(await spen.totalSupply()).to.equal(2);
  });

  it("Should fail when querying token URI for nonexistent token", async function () {
    await expect(spen.tokenURI(999)).to.be.revertedWith("ERC721: invalid token ID");
  });

  it("Should withdraw Ether sent to the contract", async function () {
    await owner.sendTransaction({ to: spen.address, value: ethers.utils.parseEther("1.0") });
    const contractBalance = await ethers.provider.getBalance(spen.address);
    expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));
    await spen.withdraw();
    const newContractBalance = await ethers.provider.getBalance(spen.address);
    expect(newContractBalance).to.equal(0);
  });

  it("Should withdraw ERC20 tokens sent to the contract", async function () {
    await erc20Mock.transfer(spen.address, 100);
    const contractTokenBalance = await erc20Mock.balanceOf(spen.address);
    expect(contractTokenBalance).to.equal(100);
    await spen.withdrawToken(erc20Mock.address);
    const newContractTokenBalance = await erc20Mock.balanceOf(spen.address);
    expect(newContractTokenBalance).to.equal(0);
  });

  it("Should not mint NFT if minting is disabled", async function () {
    await spen.setMintingEnabled(false);
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await expect(spen.mintNFT(addr1.address, tokenURI, 1)).to.be.revertedWith("Minting is currently disabled");
  });

  it("Should not mint NFT with duplicate contentId", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    await expect(spen.mintNFT(addr1.address, tokenURI, 1)).to.be.revertedWith("Content has already been minted");
  });

  it("Should mint NFT for free by default", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    expect(await spen.tokenURI(0)).to.equal(tokenURI);
    expect(await erc20Mock.balanceOf(spen.address)).to.equal(0);
  });

  it("Should mint NFT with payment when price and token are set", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.setPaymentToken(erc20Mock.address);
    await spen.setMintPrice(ethers.utils.parseEther("10"));
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    expect(await spen.tokenURI(0)).to.equal(tokenURI);
    expect(await erc20Mock.balanceOf(spen.address)).to.equal(ethers.utils.parseEther("10"));
  });

  it("Should toggle between free mint and paid mint", async function () {
    const tokenURI1 = '{"name": "Test Token 1", "description": "This is a test token", "contentId": 1}';
    const tokenURI2 = '{"name": "Test Token 2", "description": "This is another test token", "contentId": 2}';
    await spen.mintNFT(addr1.address, tokenURI1, 1);
    expect(await erc20Mock.balanceOf(spen.address)).to.equal(0);
    await spen.setPaymentToken(erc20Mock.address);
    await spen.setMintPrice(ethers.utils.parseEther("10"));
    await spen.mintNFT(addr1.address, tokenURI2, 2);
    expect(await erc20Mock.balanceOf(spen.address)).to.equal(ethers.utils.parseEther("10"));
  });

  it("Should return correct mint configuration", async function () {
    await spen.setMintPrice(ethers.utils.parseEther("20"));
    await spen.setPaymentToken(erc20Mock.address);
    await spen.setMintingEnabled(true);

    const config = await spen.getMintConfig();
    expect(config.mintingEnabled).to.be.true;
    expect(config.mintPrice).to.equal(ethers.utils.parseEther("20"));
    expect(config.paymentTokenAddress).to.equal(erc20Mock.address);
    expect(config.isFreeMint).to.be.false;
    expect(config.paymentTokenSymbol).to.equal("MCK");
  });

  it("Should return correct payment token symbol", async function () {
    await spen.setPaymentToken(erc20Mock.address);
    expect((await spen.getMintConfig()).paymentTokenSymbol).to.equal("MCK");
    await spen.setPaymentToken(ethers.constants.AddressZero);
    expect((await spen.getMintConfig()).paymentTokenSymbol).to.equal("ETH");
  });

  it("Should burn NFT", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    await spen.connect(addr1).burn(0);
    await expect(spen.ownerOf(0)).to.be.revertedWith("ERC721: invalid token ID");
    expect(await spen.totalSupply()).to.equal(1);
  });

  it("Should receive ERC20 tokens and check balance", async function () {
    await spen.receiveToken(erc20Mock.address, 100);
    const contractTokenBalance = await erc20Mock.balanceOf(spen.address);
    expect(contractTokenBalance).to.equal(100);
  });

  it("Should receive Ether and check balance", async function () {
    await owner.sendTransaction({ to: spen.address, value: ethers.utils.parseEther("1.0") });
    const contractBalance = await ethers.provider.getBalance(spen.address);
    expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));
  });

  it("Should mint NFT with sufficient ETH balance", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    const mintPrice = ethers.utils.parseEther("1.0");
    await spen.setMintPrice(mintPrice);
    await spen.setPaymentToken(ethers.constants.AddressZero); // Setting payment token to ETH
    await spen.mintNFT(addr1.address, tokenURI, 1, { value: mintPrice });
    expect(await spen.totalSupply()).to.equal(1);
    expect(await spen.tokenURI(0)).to.equal(tokenURI);
  });

  it("Should fail to mint NFT with insufficient ETH balance", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    const mintPrice = ethers.utils.parseEther("1.0");
    await spen.setMintPrice(mintPrice);
    await spen.setPaymentToken(ethers.constants.AddressZero); // Setting payment token to ETH
    await expect(spen.mintNFT(addr1.address, tokenURI, 1, { value: ethers.utils.parseEther("0.5") }))
      .to.be.revertedWith("Insufficient funds to mint");
  });

  it("Should mint NFT with sufficient ERC20 balance", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    const mintPrice = ethers.utils.parseEther("10");
    await spen.setMintPrice(mintPrice);
    await spen.setPaymentToken(erc20Mock.address); // Setting payment token to ERC20

    await erc20Mock.transfer(addr1.address, mintPrice); // Transfer sufficient ERC20 to addr1
    await erc20Mock.connect(addr1).approve(spen.address, mintPrice);
    await spen.connect(addr1).mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    expect(await spen.tokenURI(0)).to.equal(tokenURI);
    expect(await erc20Mock.balanceOf(spen.address)).to.equal(mintPrice);
  });

  it("Should fail to mint NFT with insufficient ERC20 balance", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    const mintPrice = ethers.utils.parseEther("10");
    await spen.setMintPrice(mintPrice);
    await spen.setPaymentToken(erc20Mock.address); // Setting payment token to ERC20

    await erc20Mock.transfer(addr1.address, ethers.utils.parseEther("5")); // Transfer insufficient ERC20 to addr1
    await erc20Mock.connect(addr1).approve(spen.address, mintPrice);
    await expect(spen.connect(addr1).mintNFT(addr1.address, tokenURI, 1))
      .to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Should burn an existing NFT and fail to get token URI", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    await spen.connect(addr1).burn(0);
    await expect(spen.tokenURI(0)).to.be.revertedWith("ERC721: invalid token ID");
  });

  it("Should allow reminting after burning the NFT", async function () {
    const tokenURI = '{"name": "Test Token", "description": "This is a test token", "contentId": 1}';
    await spen.mintNFT(addr1.address, tokenURI, 1);
    expect(await spen.totalSupply()).to.equal(1);
    await spen.connect(addr1).burn(0);
    await expect(spen.ownerOf(0)).to.be.revertedWith("ERC721: invalid token ID");
    await spen.mintNFT(addr1.address, tokenURI, 1); // Remint after burning
    expect(await spen.totalSupply()).to.equal(2);
    expect(await spen.tokenURI(1)).to.equal(tokenURI);
  });
});
