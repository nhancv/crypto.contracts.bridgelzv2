// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFTAdapter.sol";

contract MockOFTAdapter is OFTAdapter {
  constructor(
    address _token, // a deployed, already existing ERC20 token address
    address _layerZeroEndpoint // local endpoint address
  )
    OFTAdapter(_token, _layerZeroEndpoint, _msgSender()) // solhint-disable-next-line no-empty-blocks
  {}
}
