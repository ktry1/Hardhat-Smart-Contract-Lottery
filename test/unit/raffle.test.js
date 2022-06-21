const { expect, assert } = require("chai");
const { network, getNamedAccounts,deployments, ethers } = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");
const RAFFLE_ENTRANCE_FEE = ethers.utils.parseEther("0.01");
!developmentChains.includes(network.name) ? describe.skip
:describe("Raffle Unit tests",async function () {
    let raffle, VRFCoordinatorV2Mock,deployer,interval;
    const chainId = network.config.chainId;
    beforeEach(async function(){
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle =await ethers.getContract("Raffle",deployer);
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock",deployer);
    });
    describe("Constructor",async function () {
    it("Initializes the raffle correctly", async function () {
        const raffleState = await raffle.getRaffleState();
        interval = await raffle.getInterval();
        assert.equal(raffleState.toString(),"0");
        assert.equal(interval.toString(),networkConfig[chainId]["interval"]);
        
     
        });
    });
    describe("enterRaffle", function () {
        it("Reverts if you don't pay enough", async function(){
            await expect(raffle.enterRaffle({value:ethers.utils.parseEther("0.001")})).to.be.revertedWith("Raffle__NotEnoughEth()");
        }); 
        it("Records players when they enter", async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            expect(await raffle.getNumberOfPlayers()).to.be.equal(1);
            expect(await raffle.getPlayer(0)).to.be.equal(deployer);
        });
        it("Emits event, containing entered player address",async function(){
            const transactionResponse = await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            const transactionReceipt = await transactionResponse.wait(1);
            expect(transactionReceipt.events[0].args.player).to.be.equal(deployer);
        });
        it("Doesn't allow to enterRaffle if it is not open", async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            await raffle.performUpkeep([]);
            await expect(raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE})).to.be.revertedWith("Raffle__NotOpen");
        });
    });
    describe("checkUpkeep",  function () {
        it("Returns False if people haven't sent any ETH",async  function(){
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            const upkeepNeeded = await raffle.callStatic.checkUpkeep([]);
            expect(upkeepNeeded[0]).to.be.equal(false);
        });
        it("Returns False if Raffle isn't open", async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            await raffle.performUpkeep([]);
            const upkeepNeeded = await raffle.callStatic.checkUpkeep([]);
            expect(upkeepNeeded[0]).to.be.equal(false);
        });
        it("Returns True if all checkUpkeep conditions are met", async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            const upkeepNeeded = await raffle.callStatic.checkUpkeep([]);
            expect(upkeepNeeded[0]).to.be.equal(true);
        });
    });
    describe("performUpkeep", function () {
        it("Can only run if checkUpkeep() is True", async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            const tx = await raffle.performUpkeep([]);
            assert(tx);
        });
        it("Reverts when checkUpkeep() is False",async function(){
            await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded");
        });
        it("Updates raffle state and calls vrf coordinator",async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
            const transactionResponse= await raffle.performUpkeep([]);
            const transactionReceipt = await transactionResponse.wait(1);
            const requestId = transactionReceipt.events[1].args.requestId;
            const raffleState = await raffle.getRaffleState();
            assert(requestId.toNumber() > 0);
            assert(raffleState == 1);
        })
    });
    describe("fulfilRandomWords", function () {
        beforeEach(async function(){
            await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine",[]);
        });
        it("Can only be called after performUpkeep",async function(){
            await expect(VRFCoordinatorV2Mock.fulfillRandomWords(0,raffle.address)).to.be.revertedWith("nonexistent request");
            await expect(VRFCoordinatorV2Mock.fulfillRandomWords(1,raffle.address)).to.be.revertedWith("nonexistent request");
        });
        it("Picks a winner, resets the lottery, and sends money", async function(){
            const additionalEntrants = 3;
            const startingAccountIndex = 1;
            const accounts = await ethers.getSigners();
            for(let i = startingAccountIndex; i<startingAccountIndex + additionalEntrants; i++){
                const accountconnectedRaffle = raffle.connect(accounts[i]);
                await accountconnectedRaffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
            };
            const startingTImeStamp = await raffle.getLastTimestamp();

            await new Promise(async(resolve,reject) => {
                raffle.once("WinnerPicked",async ()=>{
                    console.log("Found the event!");
                    try{
                        const recentWinner = await raffle.getRecentWinner();
                        const raffleState = await raffle.getRaffleState();
                        const endingTimeStamp = await raffle.getLastTimestamp();
                        const numPlayers = await raffle.getNumberOfPlayers();
                        const winnerEndingBalance = await accounts[1].getBalance();
                        assert.equal(numPlayers.toString(),"0");
                        assert.equal(raffleState.toString(),"0");
                        assert(endingTimeStamp > startingTImeStamp);

                        assert.equal(winnerEndingBalance.toString(),winnerStartingBalance.add(RAFFLE_ENTRANCE_FEE.mul(additionalEntrants).add(RAFFLE_ENTRANCE_FEE).toString()));
                    }
                    catch(e){
                        reject(e);
                    }
                    resolve();
                })
                const tx = await raffle.performUpkeep([]);
                const txReceipt = await tx.wait(1);
                const winnerStartingBalance = await accounts[1].getBalance();
                await VRFCoordinatorV2Mock.fulfillRandomWords(txReceipt.events[1].args.requestId,
                    raffle.address)
            })

        });
    });

});