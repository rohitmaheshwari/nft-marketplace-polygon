
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function () {
  it("Should create and execute market sales", async function () {
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();
    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    await nft.deployed();
    const nftContractAdress = nft.address;

    let listingPrice = await market.getListingPrice();
    listingPrice = listingPrice.toString();
    // console.log(listingPrice);

    const auctionPrice = ethers.utils.parseUnits('100', 'ether');

    await nft.createToken("www.google.com");
    await nft.createToken("www.yahoo.com");

    await market.createMarketItem(nftContractAdress, 1, auctionPrice, { value: listingPrice });
    await market.createMarketItem(nftContractAdress, 2, auctionPrice, { value: listingPrice });

    // console.log(await ethers.getSigners());

    const [_, buyerAddress] = await ethers.getSigners();

    await market.connect(buyerAddress).createMarketSale(nftContractAdress, 1, { value: auctionPrice });

    let items = await market.fetchMarketItems();
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }));
    console.log("items: ", items);

  });
});
