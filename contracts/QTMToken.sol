pragma solidity ^0.5.10;

/**
* @title QTMToken
* @dev The QTMToken contract contains the information about Quantum token.
*/

import "./ERC20/ERC20Pausable.sol";
import "./ERC20/ERC20Detailed.sol";

contract QTMToken is ERC20Pausable, ERC20Detailed {

    // Token Holders
    address public crowdsaleAddress;
    address public companyAddress;

    /**
    * @dev Constructor sets crowdsaleAddress and companyAddress to allocate the tokens.
    * @param _crowdsaleAddress crowsale contract address
    * @param _companyAddress company address
    */

    constructor(address _crowdsaleAddress, address _companyAddress, string memory _name, string memory _symbol, uint8 _decimals) public
        ERC20Detailed(_name, _symbol, _decimals)
    {
        crowdsaleAddress = _crowdsaleAddress;
        companyAddress = _companyAddress;
        _mint(crowdsaleAddress, 125000000 * (10 ** uint256(decimals())));
        _mint(companyAddress, 125000000 * (10 ** uint256(decimals())));
    }
}