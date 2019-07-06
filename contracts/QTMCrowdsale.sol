pragma solidity ^0.5.10;

/**
* @title QTMCrowdsale
* @dev The QTMCrowdsale contract contains the logic about Quantum token Crowdsale.
*/

import "./QTMToken.sol";

contract QTMCrowdsale is Ownable {

    using SafeMath for uint256;

    QTMToken public token;

    uint256 public startDate;
    uint256 public endDate;
    uint256 public soldTokens;
    uint256 public totalEthRaised;
    address payable public beneficiaryAddress;
    address public tokenAddress;

    event TokenBought(address indexed _buyer, uint256 _noOftokens, uint256 _timestamp);
    event TokenAddressSet(address _token, uint256 _timestamp);

    /**
    * @dev Constructor sets beneficiaryAddress, startDate and endDate for crowdsale.
    * @param _beneficiaryAddress crowsale contract address
    * @param _startDate start date
    * @param _endDate end date
    */
    constructor(address payable _beneficiaryAddress, uint256 _startDate, uint256 _endDate) public {
        require(_beneficiaryAddress != address(0), "QTMCrowdsale: zero beneficiary address");
        beneficiaryAddress = _beneficiaryAddress;
        startDate = _startDate;
        endDate = _endDate;
    }

    /**
    * @dev To set the token contract address.
    * @param _tokenAddress address of token contract.
    */
    function setTokenAddress(address _tokenAddress) public onlyOwner  {
        require(tokenAddress == address(0), "QTMCrowdsale: zero token address");
        token = QTMToken(_tokenAddress);
        tokenAddress = _tokenAddress;
        emit TokenAddressSet(tokenAddress, now);
    }

    /**
    * @dev fallback function which accepts the ether
    */
    function () external payable  {
        buyTokens(msg.sender);
    }

    /**
    * @dev Return the rate based on total tokens sold
    */

    function getRate() public view returns(uint256) {
        if(soldTokens < 5000000){
            return 6;  // 80% discount till 5,000,000, rate will be .0006 ETH per token
        } else if(soldTokens >= 5000000 && soldTokens < 25000000){
            return 12; // 60% discount from 5,000,000 to total 25,000,000, rate will be .0012 ETH per token
        } else if(soldTokens >= 25000000 && soldTokens < 45000000){
            return 15; // 50% discount from 25,000,000 to total 45,000,000, rate will be .0015 ETH per token
        } else if(soldTokens >= 45000000 && soldTokens < 65000000){
            return 18; // 40% discount from 45,000,000 to total 65,000,000, rate will be .0018 ETH per token
        } else if(soldTokens >= 65000000 && soldTokens < 110000000){
            return 21; // 30% discount from 65,000,000 to total 110,000,000, rate will be .0021 ETH per token
        } else {
            return 30; // No discount from 110,000,000 to total 120,000,000, rate will be .0030 ETH per token
        }
    }

    /**
    * @dev Transfer the tokens to the buyer address.
    * @param _buyerAddress buyer address
    */
    function buyTokens(address _buyerAddress) public payable {
        require(now > startDate && now < endDate, "QTMCrowdsale: incorrect time for token purchase");
        require(tokenAddress != address(0), "QTMCrowdsale: token address not set");
        require(_buyerAddress != address(0), "QTMCrowdsale: invalid buyer");
        require(msg.value > 0, "QTMCrowdsale: no value tx detected");
        uint256 amount;
        amount = (msg.value).mul(10000).div(getRate());
        totalEthRaised = totalEthRaised.add(msg.value);
        soldTokens = soldTokens.add(amount);
        beneficiaryAddress.transfer(msg.value);
        require(token.transfer(_buyerAddress, amount), "QTMCrowdsale: tokens not transferred");
        emit TokenBought(_buyerAddress, amount, now);
    }

    /**
    * @dev Allow owner to withdraw remaining token after end of crowdsale
    * @param companyAddress address of transfer tokens.
    */
    function withdrawTokens(address companyAddress) public onlyOwner{
        require(now > endDate, "QTMCrowdsale: crowdsale not ended");
        uint256 remaining = token.balanceOf(address(this));
        require(token.transfer(companyAddress, remaining), "QTMCrowdsale: tokens not transferred");
    }

}