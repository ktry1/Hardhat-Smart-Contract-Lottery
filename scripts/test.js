const { ethers } = require("hardhat");
const {developmentChains,networkConfig} = require("../helper-hardhat-config");


async function test(){
await console.log("Test");
};

async function main() {
    const chainId = network.config.chainId;
const VRF_FUND_AMOUNT = ethers.utils.parseEther("2");
const entranceFee = networkConfig[chainId]["entranceFee"];
const gasLane = networkConfig[chainId]["gasLane"];
const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];
const subscriptionId = "gsgsgsg";
const interval  = networkConfig[chainId]["interval"];

VRFCoordinatorV2Address = "ggsgsgs";
const args = [VRFCoordinatorV2Address, entranceFee,gasLane,subscriptionId,callbackGasLimit,interval];
    // We get the contract to deploy
    const Contract = await ethers.getContractFactory("Raffle");
    const contract = await Contract.deploy(VRFCoordinatorV2Address, entranceFee,gasLane,subscriptionId,callbackGasLimit,interval);
    await contract.deployed();
    console.log("Greeter deployed to:", contract.address);
  }
  
  async function megaTest(){
  await new Promise((resolve,reject)=>{
    try{
    main();
    resolve();
    }
    catch(e){
        reject();
    };
  });

  await test();
  };


  megaTest();
