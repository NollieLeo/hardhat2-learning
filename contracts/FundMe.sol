// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// chainlink aggregator
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// 1. 创建一个收款函数
// 2. 记录投资人并且能查看
// 3. 限制付款最小ETH值（改为最小USD需要从DON获取dataFeed --- chainlink）
// 4. 在锁定期内，达到目标值，生产商可以提款
contract FundMe {
    mapping(address => uint256) public fundersToAmount;

    uint256 MIN_ETH_VALUE = 1 * 10 ** 18; // 单位wei
    uint256 MIN_USD_VALUE = 1 * 10 ** 18; // USD

    // constant设置常量
    uint256 constant TARGET_USD = 1 * 10 ** 18;

    address internal SEPOLIA_ETH_TO_USD_TEST_NET =
        0x694AA1769357215DE4FAC081bf1f309aDC325306;

    address public owner;

    address erc20;

    AggregatorV3Interface internal dataFeed;

    uint256 deployTimestamp;
    uint256 lockTimestamp;

    // flag 是否被提取了
    bool public getFundSuccess;

    constructor(uint256 _lockTimestamp) {
        dataFeed = AggregatorV3Interface(SEPOLIA_ETH_TO_USD_TEST_NET);
        owner = msg.sender;

        // block: 内置区块实例, 从中获取此合约部署到区块的时间
        deployTimestamp = block.timestamp;
        lockTimestamp = _lockTimestamp;
    }

    // payable 标记为收款函数
    function fund() external payable {
        require(
            block.timestamp < deployTimestamp + lockTimestamp,
            "window is closed"
        );
        uint256 usdValue = convertEthToUsd(msg.value);
        // require(condition, revert message)
        require(usdValue >= MIN_USD_VALUE, "You need to spend more ETH!");
        fundersToAmount[msg.sender] = msg.value;
    }

    /**
     * Returns the latest answer.
     * 这里根据dataField获取 1eth 对应的USD 价格
     * ETH / USD percision 10 ** 8
     * X / ETH 10 ** 18
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int256) {
        // prettier-ignore
        (
      /* uint80 roundId */
      ,
      int256 answer,
      /*uint256 startedAt*/
      ,
      /*uint256 updatedAt*/
      ,
      /*uint80 answeredInRound*/
    ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        // 处以 10 ** 8 是为了将最终的输出位数转为18位
        return (ethAmount * ethPrice) / (10 ** 8);
    }

    // 转移owner 同理，只允许被owner调用
    function transferOwner(address newOwner) public OnlyOwner {
        owner = newOwner;
    }

    // getFund 只允许被owner调用
    function getFund() external WindowClosedRequired OnlyOwner {
        // address(this) -- this指当前合约，address this 表达当前合约在链上地址， balance表示当前地址持有的以太币数量（wei）
        uint256 allBalance = address(this).balance /* wei */;
        uint256 currentUSD = convertEthToUsd(allBalance);
        require(currentUSD >= TARGET_USD, "Target is not reached");
        // 🌟transfer: transfer ETH and revert if tx failed
        payable(owner).transfer(allBalance);

        getFundSuccess = true;
        fundersToAmount[msg.sender] = 0;

        // 🌟send: transfer ETH and return false if tx failed
        // bool success = payable(owner).send(allBalance)

        // 🌟call: transfer ETH with data return value of function and bool
        // (bool success, ) = payable(owner).call{value: allBalance}("");
    }

    function refund() external WindowClosedRequired {
        uint256 funderAmount = fundersToAmount[msg.sender];
        require(funderAmount > 0, "You are not funder");
        uint256 currentUSD = convertEthToUsd(address(this).balance);
        require(currentUSD < TARGET_USD, "Target is reached");
        (bool success, ) = payable(msg.sender).call{value: funderAmount}("");
        require(success, "failed to transfer");
        fundersToAmount[msg.sender] = 0;
    }

    function setFunderToAmount(address funder, uint256 amount) external {
        require(msg.sender == erc20, "You have no permission");
        fundersToAmount[funder] = amount;
    }

    function setERC20Address(address erc20Addr) public OnlyOwner {
        erc20 = erc20Addr;
    }

    modifier WindowClosedRequired() {
        require(
            block.timestamp >= deployTimestamp + lockTimestamp,
            "window is not closed"
        );
        _;
    }

    modifier OnlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }
}
