// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract SPEN is ERC721URIStorage, ERC721Burnable, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => bool) private _mintedContentIds;
    mapping(uint256 => bool) private _burnedTokens;
    mapping(uint256 => uint256) private _tokenIdToContentId;
    bool public mintingEnabled = true;
    uint256 public mintPrice;
    IERC20 public paymentToken;

    struct MintConfig {
        bool mintingEnabled;
        uint256 mintPrice;
        address paymentTokenAddress;
        bool isFreeMint;
        string paymentTokenSymbol;
    }

    constructor() ERC721("SuperPiccellEmbryoNFT", "SPEN") {}

    function setMintingEnabled(bool _enabled) public onlyOwner {
        mintingEnabled = _enabled;
    }

    function setMintPrice(uint256 _price) public onlyOwner {
        mintPrice = _price;
    }

    function setPaymentToken(IERC20 _token) public onlyOwner {
        paymentToken = _token;
    }

    function isFreeMint() public view returns (bool) {
        return mintPrice == 0;
    }

    function mintNFT(address to, string memory _tokenURI, uint256 contentId) public payable {
        require(mintingEnabled, "Minting is currently disabled");
        require(!_mintedContentIds[contentId], "Content has already been minted");

        if (!isFreeMint()) {
            if (address(paymentToken) == address(0)) {
                require(msg.value >= mintPrice, "Insufficient funds to mint");
            } else {
                require(paymentToken.transferFrom(msg.sender, address(this), mintPrice), "Payment failed");
            }
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        _mintedContentIds[contentId] = true;
        _tokenIdToContentId[tokenId] = contentId;
    }

    function getMintConfig() public view returns (MintConfig memory) {
        return MintConfig({
            mintingEnabled: mintingEnabled,
            mintPrice: mintPrice,
            paymentTokenAddress: address(paymentToken),
            isFreeMint: isFreeMint(),
            paymentTokenSymbol: paymentTokenSymbol()
        });
    }

    function paymentTokenSymbol() public view returns (string memory) {
        if (address(paymentToken) == address(0)) {
            return "ETH";
        }
        return IERC20Metadata(address(paymentToken)).symbol();
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(!_burnedTokens[tokenId], "ERC721: invalid token ID");
        return super.tokenURI(tokenId);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function withdrawToken(IERC20 _token) public onlyOwner {
        uint256 balance = _token.balanceOf(address(this));
        _token.transfer(owner(), balance);
    }

    function receiveToken(IERC20 _token, uint256 _amount) public onlyOwner {
        uint256 balanceBefore = _token.balanceOf(address(this));
        _token.transferFrom(msg.sender, address(this), _amount);
        uint256 balanceAfter = _token.balanceOf(address(this));
        require(balanceAfter - balanceBefore == _amount, "Transfer amount doesn't match");
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        _burnedTokens[tokenId] = true;
        uint256 contentId = _tokenIdToContentId[tokenId];
        _mintedContentIds[contentId] = false;
    }

    receive() external payable {}

    fallback() external payable {}

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
