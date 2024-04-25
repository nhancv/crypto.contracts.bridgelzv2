// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract MockERC721Upgradeable is ERC721Upgradeable, AccessControlUpgradeable {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  /**
   * @dev Upgradable initializer
   */
  function MockERC721UpgradeableInit(string memory _pName, string memory _pSymbol) external initializer {
    __ERC721_init(_pName, _pSymbol);
    __AccessControl_init();
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(MINTER_ROLE, msg.sender);
    _setupRole(BURNER_ROLE, msg.sender);
  }

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 _interfaceId
  ) public view virtual override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
    return super.supportsInterface(_interfaceId);
  }

  /**
   * @dev Allow mint
   */
  function fMint(address _pAccount, uint256 _pId) external onlyRole(MINTER_ROLE) {
    _mint(_pAccount, _pId);
  }

  /**
   * @dev Allow burn
   */
  function fBurn(uint256 _pId) external onlyRole(BURNER_ROLE) {
    _burn(_pId);
  }
}
