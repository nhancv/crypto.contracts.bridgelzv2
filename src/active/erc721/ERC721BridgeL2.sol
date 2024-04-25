// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "./ERC721Bridge.sol";
import "./IERC721Bridgeable.sol";

/**
 * @title Dst chain of NFT with dynamic supply
 * @dev Mint & Burn
 */
contract ERC721BridgeL2 is ERC721Bridge {
  // @dev Impl debit when user send
  function _debit(address sender, uint[] memory tokenIds) internal override {
    // Burn sender's NFT
    for (uint i = 0; i < tokenIds.length; i++) {
      // solhint-disable-next-line reason-string
      require(nft.ownerOf(tokenIds[i]) == sender, "ERC721: transfer of token that is not own");
      IERC721Bridgeable(address(nft)).fBurn(tokenIds[i]);
    }
  }

  // @dev Impl credit when user receive
  function _credit(address receiver, uint[] memory tokenIds) internal override {
    // Mint NFT to the receiver
    for (uint i = 0; i < tokenIds.length; i++) {
      IERC721Bridgeable(address(nft)).fMint(receiver, tokenIds[i]);
    }
  }
}
