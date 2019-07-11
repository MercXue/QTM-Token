const QTMToken = artifacts.require('QTMToken');
const QTMCrowdsale = artifacts.require('QTMCrowdsale');
const { BN, constants, expectRevert, send, balance, time } = require('openzeppelin-test-helpers');

contract('QTMCrowdsale', async accounts =>{

    let owner;
    let beneficiaryAddress;
    let companyAddress;
    let testAddress1;
    let testAddress2;
    let testAddress3;
    let testAddress4;
    let testAddress5;
    let name, symbol, decimals;
    let startDate, endDate;
    before(async() => {
        owner = accounts[0];
        beneficiaryAddress = accounts[1];
        companyAddress = accounts[2];
        testAddress1 = accounts[3];
        testAddress2 = accounts[4];
        testAddress3 = accounts[5];
        testAddress4 = accounts[6];
        testAddress5 = accounts[7];
        name = "QuantumToken";
        symbol = "QTM";
        decimals = 18;
        startDate = 1563148800; // Monday, 15 July 2019 00:00:00
        endDate = startDate + 86400*365; 
     });

    it('constructor: verify initial parameters', async() => {
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        assert.strictEqual(await crowdsale.beneficiaryAddress(), beneficiaryAddress);
        assert.strictEqual((await crowdsale.startDate()).toNumber(), startDate);
        assert.strictEqual((await crowdsale.endDate()).toNumber(), endDate);
    });

    it('constructor: with zero beneficiary address (should fail)', async() => {
        await expectRevert(QTMCrowdsale.new(constants.ZERO_ADDRESS, startDate, endDate), "QTMCrowdsale: zero beneficiary address");
    });

    it('setTokenAddress: by owner', async() => {
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address);
        assert.strictEqual(await crowdsale.tokenAddress(), token.address);
    });

    it('setTokenAddress: by other address (should fail)', async() => {
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await expectRevert(crowdsale.setTokenAddress(token.address, {from: testAddress1}), "Ownable: caller is not the owner");
    });

    it('setTokenAddress: with zero token address (should fail)', async() => {
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        await expectRevert(crowdsale.setTokenAddress(constants.ZERO_ADDRESS), "QTMCrowdsale: zero token address");
    });

    it('setTokenAddress: by owner, again after setting once (should fail)', async() => {
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token1 = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        let token2 = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token1.address);
        await expectRevert(crowdsale.setTokenAddress(token2.address), "QTMCrowdsale: token address already set");  
    });

    it('buyTokens via fallback: at certain stages of supply with various discount and after end of token supply', async() => {
        startDate = await time.latest();
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, startDate + 86400*365);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        assert.strictEqual(await crowdsale.tokenAddress(), token.address);
        await time.increase(60);
        let beneficiaryBalance1 = (await balance.current(beneficiaryAddress));
        await web3.eth.sendTransaction({
            from: testAddress1,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('1500', 'ether')
        });
        let beneficiaryBalance2 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance2.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 1500);
        // current rate after 80 % discount: .0006 ETH per token , 1500/.0006 = 2500000
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 2500000);  
        await web3.eth.sendTransaction({
            from: testAddress1,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('1500', 'ether')
        });
        let beneficiaryBalance3 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance3.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 3000);
        // current rate after 80 % discount: .0006 ETH per token , 1500/.0006 = 2500000, Total: 5,000,000
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 5000000); 

        await web3.eth.sendTransaction({
            from: testAddress2,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('12000', 'ether')
        });
        let beneficiaryBalance4 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance4.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 15000);
        // current rate after 60 % discount: .0012 ETH per token , 12000/.0012 = 10000000, Total: 15,000,000
        assert.strictEqual((await token.balanceOf(testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 10000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 15000000)
        await web3.eth.sendTransaction({
            from: testAddress3,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('12000', 'ether')
        });
        let beneficiaryBalance5 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance5.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 27000);
        // current rate after 60 % discount: .0012 ETH per token , 12000/.0012 = 10,000,000, Total: 25,000,000
        assert.strictEqual((await token.balanceOf(testAddress3)).div(new BN(10).pow(new BN(18))).toNumber(), 10000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 25000000) 

        await web3.eth.sendTransaction({
            from: testAddress2,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('15000', 'ether')
        });
        let beneficiaryBalance6 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance6.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 42000);
        // current rate after 50 % discount: .0015 ETH per token , 15000/.0015 = 10000000, Total: 35,000,000
        assert.strictEqual((await token.balanceOf(testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 20000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 35000000)
        await web3.eth.sendTransaction({
            from: testAddress3,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('15000', 'ether')
        });
        let beneficiaryBalance7 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance7.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 57000);
        // current rate after 50 % discount: .0015 ETH per token , 15000/.0015 = 10000000, Total: 45,000,000
        assert.strictEqual((await token.balanceOf(testAddress3)).div(new BN(10).pow(new BN(18))).toNumber(), 20000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 45000000) 

        await web3.eth.sendTransaction({
            from: testAddress2,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('18000', 'ether')
        });
        let beneficiaryBalance8 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance8.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 75000);
        // current rate after 40 % discount: .0018 ETH per token , 18000/.0018 = 10000000, Total: 55,000,000
        assert.strictEqual((await token.balanceOf(testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 30000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 55000000)
        await web3.eth.sendTransaction({
            from: testAddress3,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('18000', 'ether')
        });
        let beneficiaryBalance9 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance9.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 93000);
        // current rate after 40 % discount: .0018 ETH per token , 18000/.0018 = 10000000, Total: 65,000,000
        assert.strictEqual((await token.balanceOf(testAddress3)).div(new BN(10).pow(new BN(18))).toNumber(), 30000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 65000000)
        
        await web3.eth.sendTransaction({
            from: testAddress4,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('21000', 'ether')
        });
        let beneficiaryBalance10 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance10.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 114000);
        // current rate after 30 % discount: .0021 ETH per token , 21000/.0018 = 10000000, Total: 75,000,000
        assert.strictEqual((await token.balanceOf(testAddress4)).div(new BN(10).pow(new BN(18))).toNumber(), 10000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 75000000)
        await web3.eth.sendTransaction({
            from: testAddress4,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('21000', 'ether')
        });
        let beneficiaryBalance11 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance11.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 135000);
        // current rate after 30 % discount: .0021 ETH per token , 21000/.0018 = 10000000, Total: 85,000,000
        assert.strictEqual((await token.balanceOf(testAddress4)).div(new BN(10).pow(new BN(18))).toNumber(), 20000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 85000000)
        await web3.eth.sendTransaction({
            from: testAddress5,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('21000', 'ether')
        });
        let beneficiaryBalance12 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance12.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 156000);
        // current rate after 30 % discount: .0021 ETH per token , 21000/.0018 = 10000000, Total: 95,000,000
        assert.strictEqual((await token.balanceOf(testAddress5)).div(new BN(10).pow(new BN(18))).toNumber(), 10000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 95000000)
        await web3.eth.sendTransaction({
            from: testAddress5,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('21000', 'ether')
        });
        let beneficiaryBalance13 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance13.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 177000);
        // current rate after 30 % discount: .0021 ETH per token , 21000/.0018 = 10000000, Total: 105,000,000
        assert.strictEqual((await token.balanceOf(testAddress5)).div(new BN(10).pow(new BN(18))).toNumber(), 20000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 105000000)
        await web3.eth.sendTransaction({
            from: testAddress5,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('10500', 'ether')
        });
        let beneficiaryBalance14 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance14.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 187500);
        // current rate after 30 % discount: .0021 ETH per token , 10500/.0018 = 5000000, Total: 110,000,000
        assert.strictEqual((await token.balanceOf(testAddress5)).div(new BN(10).pow(new BN(18))).toNumber(), 25000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 110000000)

        await web3.eth.sendTransaction({
            from: testAddress4,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('30000', 'ether')
        });
        let beneficiaryBalance15 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance15.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 217500);
        // current rate after no discount: .0030 ETH per token , 30000/.0030 = 10000000, Total: 120,000,000
        assert.strictEqual((await token.balanceOf(testAddress4)).div(new BN(10).pow(new BN(18))).toNumber(), 30000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 120000000)
        await web3.eth.sendTransaction({
            from: testAddress3,
            to: crowdsale.address,
            gas: 300000,
            value: web3.utils.toWei('15000', 'ether')
        });
        let beneficiaryBalance16 = (await balance.current(beneficiaryAddress));
        assert.strictEqual((beneficiaryBalance16.sub(beneficiaryBalance1).div(new BN(10).pow(new BN(18)))).toNumber(), 232500);
        // current rate after no discount: .0030 ETH per token , 15000/.0030 = 5000000, Total: 125,000,000
        assert.strictEqual((await token.balanceOf(testAddress3)).div(new BN(10).pow(new BN(18))).toNumber(), 35000000);
        assert.strictEqual((await crowdsale.soldTokens()).div(new BN(10).pow(new BN(18))).toNumber(), 125000000)
        // after end of token supply
        await expectRevert(web3.eth.sendTransaction({ from: testAddress3, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('1', 'ether')}), "SafeMath: subtraction overflow")
    });

    it('buyTokens via fallback: before startDate (should fail)', async() => {
        startDate = await time.latest() + 1000;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        await expectRevert(web3.eth.sendTransaction({ from: testAddress1, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('1', 'ether')}), "QTMCrowdsale: incorrect time for token purchase")
    });

    it('buyTokens via fallback: after endDate (should fail)', async() => {
        startDate = await time.latest();
        endDate = startDate.toNumber() + 86400 * 365;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        await time.increase(86400 * 365 + 60);
        await expectRevert(web3.eth.sendTransaction({ from: testAddress1, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('1', 'ether')}), "QTMCrowdsale: incorrect time for token purchase")
    });

    it('buyTokens via fallback: without setting token address (should fail)', async() => {
        startDate = await time.latest();
        endDate = startDate.toNumber() + 86400 * 365;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        time.increase(60);
        await expectRevert(web3.eth.sendTransaction({ from: testAddress1, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('1', 'ether')}), "QTMCrowdsale: token address not set")
    });

    it('buyTokens via fallback: without sending any ether (should fail)', async() => {
        startDate = await time.latest();
        endDate = startDate.toNumber() + 86400 * 365;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        time.increase(60);
        await expectRevert(web3.eth.sendTransaction({ from: testAddress1, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('0', 'ether')}), "QTMCrowdsale: no value tx detected")
    });

    it('withdrawTokens: after endDate', async() => {
        startDate = await time.latest();
        endDate = startDate.toNumber() + 86400 * 365;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        // purchase 5 MLN
        web3.eth.sendTransaction({ from: testAddress1, to: crowdsale.address,gas: 300000, value: web3.utils.toWei('3000', 'ether')});
        await time.increase(60);
        await time.increase(86400 * 365);
        // withdraw remaining tokens 125 MLN - 5 MLN = 120 MLN
        await crowdsale.withdrawTokens(accounts[9]); 
        assert.strictEqual((await token.balanceOf(accounts[9])).div(new BN(10).pow(new BN(18))).toNumber(), 120000000);
    });

    it('withdrawTokens: before endDate (should fail)', async() => {
        startDate = await time.latest();
        endDate = startDate.toNumber() + 86400 * 365;
        let crowdsale = await QTMCrowdsale.new(beneficiaryAddress, startDate, endDate);
        let token = await QTMToken.new(crowdsale.address, companyAddress, name, symbol, decimals);
        await crowdsale.setTokenAddress(token.address); 
        await expectRevert( crowdsale.withdrawTokens(accounts[9]), "QTMCrowdsale: crowdsale not ended"); 
    });
});

