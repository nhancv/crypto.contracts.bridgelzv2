// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.22;

import { OAppSenderUpgradeable, MessagingFee, MessagingReceipt } from "./OAppSenderUpgradeable.sol";
import { OAppReceiverUpgradeable, Origin } from "./OAppReceiverUpgradeable.sol";
import { OAppCoreUpgradeable } from "./OAppCoreUpgradeable.sol";

/**
 * @title OApp
 * @dev Abstract contract serving as the base for OApp implementation, combining OAppSender and OAppReceiver functionality.
 */
abstract contract OAppUpgradeable is OAppSenderUpgradeable, OAppReceiverUpgradeable {
  /**
   * @dev Constructor to initialize the OApp with the provided endpoint and owner.
   * @param _endpoint The address of the LOCAL LayerZero endpoint.
   * @param _delegate The delegate capable of making OApp configurations inside of the endpoint.
   */
  function __OAppUpgradeable_init(address _endpoint, address _delegate) internal initializer {
    __OAppUpgradeable_init_unchained(_endpoint, _delegate);
  }

  function __OAppUpgradeable_init_unchained(address _endpoint, address _delegate) internal initializer {
    __OAppCoreUpgradeable_init(_endpoint, _delegate);
  }

  /**
   * @notice Retrieves the OApp version information.
   * @return senderVersion The version of the OAppSender.sol implementation.
   * @return receiverVersion The version of the OAppReceiver.sol implementation.
   */
  function oAppVersion()
    public
    pure
    virtual
    override(OAppSenderUpgradeable, OAppReceiverUpgradeable)
    returns (uint64 senderVersion, uint64 receiverVersion)
  {
    return (SENDER_VERSION, RECEIVER_VERSION);
  }
}
