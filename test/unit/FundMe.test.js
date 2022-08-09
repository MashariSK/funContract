const { messagePrefix } = require("@ethersproject/hash")
const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe",  function () {
    let fundMe
    let deployer
    let mockV3Aggregator

    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async () => {

        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", function () {
        it("adds funder to array funder", async () => {
            // const tx = await fundMe.fund()
            await fundMe.fund({ value: sendValue })
            const res = await fundMe.getFunder(0)
            assert.equal(res, deployer )
        })

        it("Updated the amount funded ", async () => {
            await fundMe.fund({value: sendValue})
            const res = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(res.toString(), sendValue.toString())
        })
    })

    describe("withdraw", function() {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })

        it("remove funder after withdrawing", async () => {
            //todo
        })
    })
})