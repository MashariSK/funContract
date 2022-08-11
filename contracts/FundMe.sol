// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.15;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "./console.sol";

error FundMe__owner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 10**18;
    address private immutable owner;
    address[] private funders;
    mapping(address => uint256) private addressAmountfunded;
    AggregatorV3Interface private priceFeed;

    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != owner) revert FundMe__owner(); 
        _;
    }

    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        owner = msg.sender;
    }

    function fund() public payable {
        require(msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,"You need to spend more ETH!");
        addressAmountfunded[msg.sender] += msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        address[] memory funders = funders;
        // mappings can't be in memory, sorry!
        for (uint256 i = 0; i < funders.length; i++) {
            address funder = funders[i];
            addressAmountfunded[funder] = 0;
        }
        funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "call failed");
    }

    function getVersion() public view returns (uint256) {
        return priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return funders[index];
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }

    function getAddressToAmountFunded(address fundingAddress) public view returns(uint256) {
        return addressAmountfunded[fundingAddress];
    }
}
