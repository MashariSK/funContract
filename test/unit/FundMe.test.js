const { messagePrefix } = require("@ethersproject/hash")
const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

describe("FundMe",  function () {
    let fundMe
    let deployer
    let mockV3Aggregator

    const oneEth = ethers.utils.parseEther("1")
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
            await fundMe.fund({ value: oneEth })
            const res = await fundMe.getFunder(0)
            assert.equal(res, deployer )
        })

        it("Updated the amount funded ", async () => {
            await fundMe.fund({value: oneEth})
            const res = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(res.toString(), oneEth.toString())
        })
    })

    describe("withdraw", function () {
        beforeEach(async () => {
            await fundMe.fund({ value: oneEth })
        })

        it("withdraws ETH from a single funder", async () => {

            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)

            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString())
        })

        it("is allows us to withdraw with multiple funders", async () => {
            const accounts = await ethers.getSigners()

            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({ value: oneEth })
            }

            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance =  await fundMe.provider.getBalance(deployer)

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
            // console.log(`GasCost: ${withdrawGasCost}`)
            // console.log(`GasUsed: ${gasUsed}`)
            // console.log(`GasPrice: ${effectiveGasPrice}`)
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(withdrawGasCost).toString())

            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) 
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            
        })

        it("Only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const exploit = await fundMe.connect(accounts[1])
          await expect(exploit.withdraw()).to.be.revertedWith("FundMe__NotOwner")
        })
    })
})