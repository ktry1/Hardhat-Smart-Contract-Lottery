const { network, ethers } = require("hardhat");
const {developmentChains, networkConfig} = require("../helper-hardhat-config");
const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

module.exports  = async function({getNamedAccounts, deployments}){
    const {deploy,log} = deployments;
    const {deployer} = await getNamedAccounts();
    
    if(developmentChains.includes(network.name)){
        console.log("Local network detected! Deploying mocks...")
    
    await deploy("VRFCoordinatorV2Mock",{
        from:deployer,
        args:[BASE_FEE,GAS_PRICE_LINK],
        log:true,
    });
    console.log("---------------------------------------------");
}
}

module.exports.tags = ["all","mocks"];



