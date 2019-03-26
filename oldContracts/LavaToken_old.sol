pragma solidity ^0.5.0;


pragma experimental ABIEncoderV2;


/*
LAVA Token  (0xBTC Token Proxy with Lava Enabled)

This is a 0xBTC proxy token contract.  Deposit your 0xBTC in this contract to receive LAVA tokens.

LAVA tokens can be spent not just by your address, but by anyone as long as they have an ECRecovery signature signed by your private key.

The signature is a 'lava packet signature.'  This means that LAVA can be sent by paying a fee of LAVA for the gas, not ETH.

LAVA is 1:1 pegged to 0xBTC.

*/


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}


contract ECRecovery {

  /**
   * @dev Recover signer address from a message by using their signature
   * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
   * @param sig bytes signature, the signature is generated using web3.eth.sign()
   */
  function recover(bytes32 hash, bytes memory sig) internal  pure returns (address) {
    bytes32 r;
    bytes32 s;
    uint8 v;

    //Check the signature length
    if (sig.length != 65) {
      return (address(0));
    }

    // Divide the signature in r, s and v variables
    assembly {
      r := mload(add(sig, 32))
      s := mload(add(sig, 64))
      v := byte(0, mload(add(sig, 96)))
    }

    // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
    if (v < 27) {
      v += 27;
    }

    // If the version is correct return the signer address
    if (v != 27 && v != 28) {
      return (address(0));
    } else {
      return ecrecover(hash, v, r, s);
    }
  }

}



contract RelayAuthorityInterface {
    function getRelayAuthority() public returns (address);
}


contract ERC20Interface {
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}


contract ApproveAndCallFallBack {
    function receiveApproval(address from, uint256 tokens,  bytes memory data) public;
}


contract LavaTokenOld is ECRecovery{

    using SafeMath for uint;


    address constant public masterToken = 0x9D2Cc383E677292ed87f63586086CfF62a009010;

    string public name     = "Lava";
    string public symbol   = "LAVA";
    uint8  public decimals = 8;
    uint private _totalSupply;

    event  Approval(address indexed src, address indexed ext, uint amt);
    event  Transfer(address indexed src, address indexed dst, uint amt);
    event  Deposit(address indexed dst, uint amt);
    event  Withdrawal(address indexed src, uint amt);

    mapping (address => uint)                       public  balances;
    mapping (address => mapping (address => uint))  public  allowance;



   mapping(bytes32 => uint256) public burnedSignatures;



  struct LavaPacket {
    string methodName;
    address relayAuthority; //either a contract or an account
    address from;
    address to;
    address wallet;  //this contract address
    uint256 tokens;
    uint256 relayerRewardTokens;
    uint256 expires;
    uint256 nonce;
  }




   bytes32 constant LAVAPACKET_TYPEHASH = keccak256(
      "LavaPacket(string methodName,address relayAuthority,address from,address to,address wallet,uint256 tokens,uint256 relayerRewardTokens,uint256 expires,uint256 nonce)"
  );

   function getLavaPacketTypehash() public pure returns (bytes32) {
      return LAVAPACKET_TYPEHASH;
  }

 function getLavaPacketHash(LavaPacket memory packet) public pure returns (bytes32) {
        return keccak256(abi.encode(
            LAVAPACKET_TYPEHASH,
            keccak256(bytes(packet.methodName)),
            packet.relayAuthority,
            packet.from,
            packet.to,
            packet.wallet,
            packet.tokens,
            packet.relayerRewardTokens,
            packet.expires,
            packet.nonce
        //    keccak256(bytes(packet.callData))
        ));
    }


    constructor() public {

    }

    /**
    * Do not allow Ether to enter
    */
     function() external payable
     {
         revert();
     }


    /**
     *
     * @dev Deposit original tokens, receive proxy tokens 1:1
     *
     * @param from Address to charge fees
     * @param amount Amount of protocol tokens to charge
     */
    function mutateTokens( address from, uint amount) public returns (bool)
    {
        require( amount > 0 );

        require( ERC20Interface( masterToken ).transferFrom( from, address(this), amount) );

        balances[from] = balances[from].add(amount);
        _totalSupply = _totalSupply.add(amount);

        return true;
    }



    /**
     * @dev Withdraw original tokens, burn proxy tokens 1:1
     *
     * @param from Address to charge fees
     *
     * @param amount Amount of protocol tokens to charge
     */
    function unmutateTokens(  address from, uint amount) public returns (bool)
    {
        require( amount > 0 );

        balances[from] = balances[from].sub(amount);
        _totalSupply = _totalSupply.sub(amount);

        require( ERC20Interface( masterToken ).transferFrom( address(this), from, amount) );

        return true;
    }



    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }




   //standard ERC20 method
  function approve(address spender,   uint tokens) public returns (bool success) {
      allowance[msg.sender][spender] = tokens;
      emit Approval(msg.sender, spender, tokens);
      return true;
  }


  //standard ERC20 method
   function transferTokens(address to,  uint tokens) public returns (bool success) {

        return transferTokensFrom(msg.sender, to, tokens);
    }


   //standard ERC20 method
   function transferTokensFrom( address from, address to,  uint tokens) public returns (bool success) {
       balances[from] = balances[from].sub(tokens);
       allowance[from][to] = allowance[from][to].sub(tokens);
       balances[to] = balances[to].add(tokens);
       emit Transfer( from, to, tokens);
       return true;
   }



  // function getLavaPacket(address from,)

   //This replaces getLavaTypedDataHash .. how to handle methodName?

   function getLavaTypedDataHash(LavaPacket memory packet) public  pure returns (bytes32) {


          // Note: we need to use `encodePacked` here instead of `encode`.
          bytes32 digest = keccak256(abi.encodePacked(
              "\x19\x01",
            //  DOMAIN_SEPARATOR,
              getLavaPacketHash(packet)
          ));
          return digest;
      }




   function _tokenApprovalWithSignature(  LavaPacket memory packet, bytes32 sigHash, bytes memory signature) internal returns (bool success)
   {

       /*
        Always allow relaying a packet if the specified relayAuthority is 0.
        If the authority address is not a contract, allow it to relay
        If the authority address is a contract, allow its defined 'getAuthority()' delegate to relay
       */

       require( packet.relayAuthority == address(0x0)
         || (!addressContainsContract(packet.relayAuthority) && msg.sender == packet.relayAuthority)
         || (addressContainsContract(packet.relayAuthority) && msg.sender == RelayAuthorityInterface(packet.relayAuthority).getRelayAuthority())  );



       address recoveredSignatureSigner = recover(sigHash,signature);


       //make sure the signer is the depositor of the tokens
       require(packet.from == recoveredSignatureSigner);


       //make sure the signature has not expired
       require(block.number < packet.expires);

       uint burnedSignature = burnedSignatures[sigHash];
       burnedSignatures[sigHash] = 0x1; //spent
       require(burnedSignature == 0x0);

       //approve the relayer reward
       allowance[packet.from][msg.sender] = packet.relayerRewardTokens;
        emit Approval(packet.from, msg.sender, packet.relayerRewardTokens);

       //transferRelayerReward
       require(transferTokensFrom(packet.from, msg.sender,   packet.relayerRewardTokens));

       //approve transfer of tokens
       allowance[packet.from][packet.to] = packet.tokens;
       emit Approval(packet.from,  packet.to, packet.tokens);


       return true;
   }



   function approveTokensWithSignature(LavaPacket memory packet, bytes memory signature) public returns (bool success)
   {
       require(bytesEqual('approve',bytes(packet.methodName)));

       bytes32 sigHash = getLavaTypedDataHash(packet);

       require(_tokenApprovalWithSignature(packet,sigHash,signature));


       return true;
   }


  function transferTokensWithSignature(LavaPacket memory packet, bytes memory signature) public returns (bool success)
  {

      require(bytesEqual('transfer',bytes(packet.methodName)));

      //check to make sure that signature == ecrecover signature
      bytes32 sigHash = getLavaTypedDataHash(packet);

      require(_tokenApprovalWithSignature(packet,sigHash,signature));

      //it can be requested that fewer tokens be sent that were approved -- the whole approval will be invalidated though
      require(transferTokensFrom( packet.from, packet.to,   packet.tokens));


      return true;

  }



     function burnSignature( LavaPacket memory packet,  bytes memory signature) public returns (bool success)
     {


        bytes32 sigHash = getLavaTypedDataHash( packet);

         address recoveredSignatureSigner = recover(sigHash,signature);

         //make sure the invalidator is the signer
         require(recoveredSignatureSigner == packet.from);

         //only the original packet owner can burn signature, not a relay
         require(packet.from == msg.sender);

         //make sure this signature has never been used
         uint burnedSignature = burnedSignatures[sigHash];
         burnedSignatures[sigHash] = 0x2; //invalidated
         require(burnedSignature == 0x0);

         return true;
     }


     function signatureBurnStatus(bytes32 digest) public view returns (uint)
     {
       return (burnedSignatures[digest]);
     }




       /*
         Receive approval to spend tokens and perform any action all in one transaction
       */
     function receiveApproval(address from, uint256 tokens, bytes memory data) public returns (bool success) {

        return mutateTokens(from,tokens);

     }

     /*
      Approve lava tokens for a smart contract and call the contracts receiveApproval method all in one fell swoop


      */
     function approveAndCall( LavaPacket memory packet, bytes memory signature ) public returns (bool success)   {

      // address from, address to, address token, uint256 tokens, uint256 relayerReward,  uint256 expires, uint256 nonce


      require(!bytesEqual('approve',bytes(packet.methodName))
      && !bytesEqual('transfer',bytes(packet.methodName))  );

        bytes32 sigHash = getLavaTypedDataHash( packet);

        require(_tokenApprovalWithSignature(packet,sigHash,signature));

        ApproveAndCallFallBack(packet.to).receiveApproval(packet.from, packet.tokens,  bytes(packet.methodName));

        return true;
     }



     function addressContainsContract(address _to) view internal returns (bool)
     {
       uint codeLength;

        assembly {
            // Retrieve the size of the code on target address, this needs assembly .
            codeLength := extcodesize(_to)
        }

         return (codeLength>0);
     }


     function bytesEqual(bytes memory b1,bytes memory b2) pure internal returns (bool)
        {
          if(b1.length != b2.length) return false;

          for (uint i=0; i<b1.length; i++) {
            if(b1[i] != b2[i]) return false;
          }

          return true;
        }




}
