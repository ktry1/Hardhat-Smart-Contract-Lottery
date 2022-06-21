require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const RINKEBY_URL = process.env.RINKEBY_URL;
const RINKEBY_ACCOUNT1 = process.env.RINKEBY_ACCOUNT1;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
module.exports = {
  solidity: "0.8.7",
  defaultNetwork:"hardhat",
  namedAccounts:{
    deployer:{
      default:0,
    },
    player:{
      default:1,
    }
  },
  networks:{
    rinkeby:{
      url:RINKEBY_URL,
      accounts: [RINKEBY_ACCOUNT1],
      blockConfirmations:6,
      chainId: 4,
    },
    hardhat:{
      chainId:31337,
      blockConfirmations:1,
    }
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    noColors:true,
    coinmarketcap:process.env.COINMARKETCAP_API_KEY, 
    token: "ETH",
    outputFile: "gas_report.txt"
  },
  mocha: {
    timeout:300000,
  },
  etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
    }
  }
};
