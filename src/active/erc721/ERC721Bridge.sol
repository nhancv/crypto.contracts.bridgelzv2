// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import { OAppUpgradeable, Origin, MessagingReceipt, MessagingFee } from "../oapp/OAppUpgradeable.sol";

abstract contract ERC721Bridge is OAppUpgradeable, ReentrancyGuardUpgradeable {
  // NFT Contract
  ERC721 public nft;

  // Events
  event NFTSent(bytes32 indexed guid, uint64 nonce);

  /**
   * @dev Constructor
   */
  function ERC721BridgeInit(ERC721 _nft, address _endpoint) external initializer {
    __ReentrancyGuard_init();
    __OAppUpgradeable_init(_endpoint, _msgSender());
    nft = _nft;
  }

  // @dev Estimate fee
  function quoteSend(
    uint32 _dstEid,
    address _toAddress,
    uint[] memory _tokenIds,
    bytes calldata _options
  ) external view returns (MessagingFee memory fee) {
    bytes memory _payload = abi.encode(_toAddress, _tokenIds);
    return _quote(_dstEid, _payload, _options, false);
  }

  // @dev Send NFT to destination chain
  function send(
    uint32 _dstEid,
    address _toAddress,
    uint[] memory _tokenIds,
    bytes calldata _options
  ) external payable nonReentrant {
    require(_tokenIds.length > 0, "tokenIds[] is empty");
    require(_tokenIds.length <= 100, "tokenIds[] is too much");

    address sender_ = _msgSender();
    _debit(sender_, _tokenIds);

    // Encodes message as bytes
    bytes memory _payload = abi.encode(_toAddress, _tokenIds);

    MessagingReceipt memory msgReceipt = _lzSend(
      _dstEid, // Destination chain's endpoint ID.
      _payload, // Encoded message payload being sent.
      _options, // Message execution options (e.g., gas to use on destination).
      MessagingFee(msg.value, 0), // Fee struct containing native gas and ZRO token.
      payable(sender_) // The refund address in case the send call reverts.
    );
    emit NFTSent(msgReceipt.guid, msgReceipt.nonce);
  }

  /**
   * @dev Abstract debit function when user send asset to the bridge
   * Assume we maintain a fixed supply on src chain:
   * - Src chain 'debit' = transfer from User to Bridge
   * - Dst chain 'debit' = burn from user
   */
  function _debit(address sender, uint[] memory tokenIds) internal virtual;

  // @dev Implementing _lzReceive
  function _lzReceive(
    Origin calldata /*_origin*/, // struct containing info about the message sender
    bytes32 /*_guid*/, // global packet identifier
    bytes calldata _payload, // encoded message payload being received
    address /*_executor*/, // the Executor address.
    bytes calldata /*_extraData*/ // arbitrary data appended by the Executor
  ) internal override {
    // decode and load the toAddress
    (address toAddress, uint[] memory tokenIds) = abi.decode(_payload, (address, uint[]));

    _credit(toAddress, tokenIds);
  }

  /**
   * @dev Abstract credit function when user receive asset from the bridge
   * Assume we maintain a fixed supply on src chain:
   * - Src chain 'credit' = transfer from Bridge to User
   * - Dst chain 'credit' = mint to user
   */
  function _credit(address receiver, uint[] memory tokenIds) internal virtual;

  /**
   * IERC721Receiver
   * @dev Whenever an {IERC721} `tokenId` token is transferred to this contract via {IERC721-safeTransferFrom}
   * by `operator` from `from`, this function is called.
   *
   * It must return its Solidity selector to confirm the token transfer.
   * If any other value is returned or the interface is not implemented by the recipient, the transfer will be reverted.
   *
   * The selector can be obtained in Solidity with `IERC721.onERC721Received.selector`.
   */
  function onERC721Received(
    address operator,
    address, // _owner,
    uint256, // _tokenId,
    bytes calldata
  ) external view returns (bytes4) {
    require(operator == address(this), "self");
    return this.onERC721Received.selector;
  }
}
