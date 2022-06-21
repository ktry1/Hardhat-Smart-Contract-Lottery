const { expect, assert } = require("chai");
const { network, getNamedAccounts,deployments, ethers } = require("hardhat");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");
const RAFFLE_ENTRANCE_FEE = ethers.utils.parseEther("0.01");
developmentChains.includes(network.name) ? describe.skip
:describe("Raffle Staging tests",async function () {
    let raffle,deployer;
    
    beforeEach(async function(){
        deployer = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract("Raffle",deployer);
    });
    describe("Constructor",function () {
        it("Works with live Chainlink Keepers and Chainlink VRF, we get a random winner",async function(){
            const startingTimeStamp = await raffle.getLastTimestamp();
            const accounts = await ethers.getSigners();
            await new Promise(async(resolve,reject) =>{
                raffle.once("WinnerPicked",async ()=>{
                    console.log("Event found!");
                    try{
                        console.log("Getting recent winner...");
                        const recentWinner = await raffle.getRecentWinner();
                        console.log("Getting Raffle state...");
                        const raffleState = await raffle.getRaffleState();
                        console.log("Getting ending balance...");
                        const winnerEndingBalance = await accounts[0].getBalance();
                        console.log("Getting ending timestamp...");
                        const endingTimestamp = await raffle.getLastTimestamp();
                        console.log("-------------------------------------------");
                        console.log("Assertion time!");
                        console.log("-------------------------------------------");
                        console.log("Checking that there are no players...");
                        await expect(raffle.getPlayer(0)).to.be.reverted;
                        console.log("Checking that the winner is correct...");
                        assert.equal(recentWinner.toString(), accounts[0].address);
                        console.log("Checking Raffle State...");
                        assert.equal(raffleState,0);
                        console.log("Checking ending balance...");
                        assert.equal(winnerEndingBalance.toString(),winnerStartingBalance.add(RAFFLE_ENTRANCE_FEE).toString());
                        console.log("Checking the timestamps...");
                        assert(endingTimestamp > startingTimeStamp);
                        resolve();
                    }
                    catch(e){
                        console.log(e);
                        reject();   
                    }
                    
                });
                console.log("Entering Raffle...");
                await raffle.enterRaffle({value:RAFFLE_ENTRANCE_FEE});
                console.log("Getting starting balance...");
                const winnerStartingBalance = await accounts[0].getBalance();
                
            });
        });
    });
});