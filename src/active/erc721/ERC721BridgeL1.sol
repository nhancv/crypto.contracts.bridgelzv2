// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "./ERC721Bridge.sol";

/**
 * @title Source chain of NFT with a fixed supply
 * @dev Transfer only
 */
contract ERC721BridgeL1 is ERC721Bridge {
  // @dev Impl debit when user send
  function _debit(address sender, uint[] memory tokenIds) internal override {
    // Transfer NFT to bridge
    for (uint i = 0; i < tokenIds.length; i++) {
      nft.safeTransferFrom(sender, address(this), tokenIds[i]);
    }
  }

  // @dev Impl credit when user receive
  function _credit(address receiver, uint[] memory tokenIds) internal override {
    // Transfer NFT to the receiver
    for (uint i = 0; i < tokenIds.length; i++) {
      nft.safeTransferFrom(address(this), receiver, tokenIds[i]);
    }
  }
}
