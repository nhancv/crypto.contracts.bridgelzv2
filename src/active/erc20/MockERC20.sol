// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  constructor(string memory _name, string memory _symbol, uint256 _initialSupply) ERC20(_name, _symbol) {
    _mint(msg.sender, _initialSupply * 10 ** decimals());
  }
}
