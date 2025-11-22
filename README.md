
# Learning log


use @chainlink/contracts to add chainlink aggregator


## deploy contract
import ethers from hardhat and deploy

```js
const { ethers } = require("hardhat");

async function main() {
  // create factory
  const fundMeFactory = await ethers.getContractFactory("FundMe");
  // deploy contract from factory
  console.info("Start to deploy FundMe");
  const fundMe = await fundMeFactory.deploy(10);
  await fundMe.waitForDeployment();
  console.log(
    `Contract has been deployed successfully, contract address is ${fundMe.target}`
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}

```

## hardhat config

```js
require("@chainlink/env-enc").config();

module.exports = {
  solidity: "0.8.28", // your solidity version
  defaultNetwork: "hardhat", // default use in progress hardhat network
  networks: { // real testnet
    sepolia: {
      // https://dashboard.alchemy.com/apps/0sgi3lgcebssjhbb/setup
      url: process.env.SEPOLIA_URL,
      accounts: [
        // 测试 私钥
        process.env.PRIVATE_KEY,
      ],
    },
  },
};
```

you can get the endpoint url from alchemy
https://dashboard.alchemy.com/

### @chainlink/env-enc

use @chainlink/env-enc to encode your private info

```shell
    npx env-enc set-pw
    npx env-enc set
```


### Etherscan api key config 
```js
module.exports = {
...
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```
add etherscan apiKey to verify your contract which is deployed

```shell
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "Constructor argument 1"
```

or using js

```js
await hre.run("verify:verify", {
  address: contractAddress,
  constructorArguments: [
    50,
    "a string argument",
    {
      x: 10,
      y: 5,
    },
    "0xabcdef",
  ],
});
```

他妈的etherscan的verify老爆，大多是Nodejs与代理软件设置之间IPv6或协议解析不一致
如果 Node.js 版本是 v17 或更高，它默认会优先尝试解析 IPv6 (::1)。而大多数代理软件（Clash, V2Ray 等）默认监听的是 IPv4 (127.0.0.1)。

当你在终端设置代理时，如果写的是 localhost，Node.js 可能会尝试走 IPv6 导致连接被瞬间重置。··