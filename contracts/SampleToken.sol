pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract ERC20FixedSupply is ERC20, ERC20Detailed, Ownable {
  constructor()
    Ownable()
    ERC20Detailed("Example Fixed Supply Token", "FIXED", 18)
    ERC20()
    public {
    _mint(super.owner(), 1000000 * 10**uint(super.decimals()));
  }
}