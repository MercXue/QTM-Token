const QTMToken = artifacts.require('QTMToken');
const { BN, constants, expectRevert } = require('openzeppelin-test-helpers');

contract('QTMToken', async accounts =>{

    let owner;
    let crowdsaleAddress;
    let companyAddress;
    let testAddress1;
    let testAddress2;
    let testAddress3;
    let name, symbol, decimals;
    let token, tokenAddress;
    before(async() => {
        owner = accounts[0];
        crowdsaleAddress = accounts[1];
        companyAddress = accounts[2];
        testAddress1 = accounts[3];
        testAddress2 = accounts[4];
        testAddress3 = accounts[5];
        name = "QuantumToken";
        symbol = "QTM";
        decimals = 18; 
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        tokenAddress = token.address;
     });

    it('constructor: verify initial parameters', async() => {
        assert.strictEqual(await token.name(), name);
        assert.strictEqual(await token.symbol(), symbol);
        assert.strictEqual((await token.decimals()).toNumber(), decimals);
        assert.strictEqual((await token.balanceOf(crowdsaleAddress)).div(new BN(10).pow(new BN(18))).toNumber(), 125000000); // 125,000,000 to crowdsale address
        assert.strictEqual((await token.balanceOf(companyAddress)).div(new BN(10).pow(new BN(18))).toNumber(), 125000000); // 125,000,000 to company address
    });

    it('transfer: transfer tokens to testAddress1 and transfer to testAddress2 from testAddress1, initially when contract is not paused', async() => {
        await token.transfer(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);

        await token.transfer(testAddress2, new BN(200).mul(new BN(10).pow(new BN(18))), { from:testAddress1});
        assert.strictEqual((await token.balanceOf(testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 200);
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 300);
    });

    it('transfer: transfer tokens to zero address (should fail)', async() => {
        await expectRevert(token.transfer(constants.ZERO_ADDRESS, new BN(500).mul(new BN(10).pow(new BN(18))), {from:crowdsaleAddress}), "ERC20: transfer to the zero address");
    });

    it('transfer: transfer more than balance (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.transfer(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await expectRevert(token.transfer(testAddress2, new BN(600).mul(new BN(10).pow(new BN(18))), { from:testAddress1 }), "SafeMath: subtraction overflow");
    });

    it('approve: approve tokens, initially when contract is not paused', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
    });

    it('approve: approve tokens to zero address (should fail)', async() => {
        await expectRevert(token.approve(constants.ZERO_ADDRESS, new BN(500).mul(new BN(10).pow(new BN(18))), {from:crowdsaleAddress}), "ERC20: approve to the zero address");
    });

    it('increaseAllowance: approve more tokens, initially when contract is not paused', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await token.increaseAllowance(testAddress1, new BN(5000).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 5500);
    });

    it('increaseAllowance: without previous approval', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.increaseAllowance(testAddress1, new BN(5000).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 5000);
    });

    it('increaseAllowance: using zero address (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await expectRevert(token.increaseAllowance(constants.ZERO_ADDRESS, new BN(5000).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress }),"ERC20: approve to the zero address");
    });

    it('decreaseAllowance: decrease approval amount of tokens, initially when contract is not paused', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await token.decreaseAllowance(testAddress1, new BN(200).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 300);
    });

    it('decreaseAllowance: after increaseAllowance', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await token.increaseAllowance(testAddress1, new BN(200).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 700);
        await token.decreaseAllowance(testAddress1, new BN(300).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 400);
    });

    it('decreaseAllowance: decrease more than previously approved (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await expectRevert(token.decreaseAllowance(testAddress1, new BN(600).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress }), "SafeMath: subtraction overflow");
    });

    it('decreaseAllowance: using zero address (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.increaseAllowance(testAddress1, new BN(200).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        await expectRevert(token.decreaseAllowance(constants.ZERO_ADDRESS, new BN(100).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress }), "SafeMath: subtraction overflow");
    });

    it('transferFrom: transfer from approved tokens, initially when contract is not paused', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await token.increaseAllowance(testAddress1, new BN(200).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 700);
        await token.decreaseAllowance(testAddress1, new BN(300).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 400);
        await token.transferFrom(crowdsaleAddress, testAddress2, new BN(150).mul(new BN(10).pow(new BN(18))), { from:testAddress1 });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 250);
    });

    it('transferFrom: transfer from approved tokens more than approval limit (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await expectRevert(token.transferFrom(crowdsaleAddress, testAddress2, new BN(600).mul(new BN(10).pow(new BN(18))), { from:testAddress1 }), "SafeMath: subtraction overflow");
    });

    it('transferFrom: transfer from zero address (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await expectRevert(token.transferFrom(constants.ZERO_ADDRESS, testAddress2, new BN(600).mul(new BN(10).pow(new BN(18))), { from:testAddress1 }), "ERC20: transfer from the zero address");
    });

    it('transferFrom: transfer to zero address (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.approve(testAddress1, new BN(500).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        assert.strictEqual((await token.allowance(crowdsaleAddress, testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 500);
        await expectRevert(token.transferFrom(crowdsaleAddress, constants.ZERO_ADDRESS, new BN(600).mul(new BN(10).pow(new BN(18))), { from:testAddress1 }), "ERC20: transfer to the zero address");
    });


    it('pause: by owner', async() => {
        await token.pause({ from:owner});
        assert.strictEqual(await token.paused(), true);
    });

    it('pause: by other address (should fail)', async() => {
        await expectRevert(token.pause({ from:testAddress1}), "Ownable: caller is not the owner");
    });

    it('notPauseable: by owner', async() => {
        await token.notPauseable({ from:owner});
        assert.strictEqual(await token.paused(), false);
    });

    it('notPauseable: by other address (should fail)', async() => {
        await expectRevert(token.notPauseable({ from:testAddress1}), "Ownable: caller is not the owner");
    });

    it('pause: by owner, after making notPauseable (should fail)', async() => {
        await expectRevert(token.pause({ from:owner}), "Pausable: can not be paused");
    });

    it('token: token operations by owner, after pause', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.transfer(owner, new BN(5000).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        await token.approve(owner, new BN(4000).mul(new BN(10).pow(new BN(18))), { from:companyAddress });
        await token.pause({ from:owner});
        assert.strictEqual(await token.paused(), true);
        //token operations
        await token.transfer(testAddress1, new BN(1000).mul(new BN(10).pow(new BN(18))), { from:owner });
        assert.strictEqual((await token.balanceOf(testAddress1)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);

        await token.transferFrom(companyAddress, testAddress2, new BN(4000).mul(new BN(10).pow(new BN(18))), { from:owner });
        assert.strictEqual((await token.allowance(companyAddress, owner)).div(new BN(10).pow(new BN(18))).toNumber(), 0);


        await token.approve(testAddress2, new BN(1200).mul(new BN(10).pow(new BN(18))), { from:owner });
        assert.strictEqual((await token.allowance(owner, testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 1200);

        await token.increaseAllowance(testAddress2, new BN(300).mul(new BN(10).pow(new BN(18))), { from:owner });
        assert.strictEqual((await token.allowance(owner, testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 1500);

        await token.decreaseAllowance(testAddress2, new BN(500).mul(new BN(10).pow(new BN(18))), { from:owner });
        assert.strictEqual((await token.allowance(owner, testAddress2)).div(new BN(10).pow(new BN(18))).toNumber(), 1000);
    });

    it('token: token operations by other address, after pause (should fail)', async() => {
        token = await QTMToken.new(crowdsaleAddress, companyAddress, name, symbol, decimals);
        await token.transfer(testAddress3, new BN(5000).mul(new BN(10).pow(new BN(18))), { from:crowdsaleAddress });
        await token.approve(testAddress3, new BN(4000).mul(new BN(10).pow(new BN(18))), { from:companyAddress });
        
        await token.pause({ from:owner});
        assert.strictEqual(await token.paused(), true);

        //token operations
        await expectRevert(token.transfer(testAddress1, new BN(1000).mul(new BN(10).pow(new BN(18))), {from:testAddress3}), "Pausable: paused");
    
        await expectRevert(token.transferFrom(companyAddress, testAddress2, new BN(1000).mul(new BN(10).pow(new BN(18))), {from:testAddress3}), "Pausable: paused");
        
        await expectRevert(token.approve(testAddress2, new BN(500).mul(new BN(10).pow(new BN(18))), {from:testAddress3}), "Pausable: paused");
        
        await expectRevert(token.increaseAllowance(testAddress2, new BN(500).mul(new BN(10).pow(new BN(18))), {from:testAddress3}), "Pausable: paused");
        
        await expectRevert(token.decreaseAllowance(testAddress2, new BN(500).mul(new BN(10).pow(new BN(18))), {from:testAddress3}), "Pausable: paused");
    });
});