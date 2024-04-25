// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

interface IERC721Bridgeable {
  function fMint(address _pAccount, uint256 _pId) external; /* onlyRole(MINTER_ROLE) */

  function fBurn(uint256 _pId) external; /* onlyRole(BURNER_ROLE) */
}
