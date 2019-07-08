const QTMToken = artifacts.require('QTMToken');
const QTMCrowdsale = artifacts.require('QTMCrowdsale');
const companyAddress = "0xd054550cf1780aebe636a1ee986fc76d9add61f1";
const beneficiaryAddress = "0xa158de873ebada1077b11840ea914e5e6104f3f5";
const name = 'Quantum Tokem';
const symbol = 'QTM';
const decimals = '18';
const startDate = Date.now();
const endDate = startDate + 86400*365;

module.exports = function(deployer,network){
    deployer.deploy(QTMCrowdsale, beneficiaryAddress, startDate, endDate).then(function(){
        deployer.deploy(QTMToken, QTMCrowdsale.address, companyAddress, name, symbol, decimals); 
    })
}