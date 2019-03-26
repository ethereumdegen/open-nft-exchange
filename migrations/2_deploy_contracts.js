var _0xBitcoinToken = artifacts.require("./_0xBitcoinToken.sol");

//var MiningDelegate = artifacts.require("./MiningDelegate.sol");

//var wEthToken = artifacts.require("./WETH9.sol");

//var ECRecovery = artifacts.require("./ECRecovery.sol");

//var MintHelper = artifacts.require("./MintHelper.sol");

var LavaToken = artifacts.require("./LavaToken.sol");

var DeMutator = artifacts.require("./DeMutator.sol");

//var DoubleKingsReward = artifacts.require("./DoubleKingsReward.sol")

module.exports = function(deployer) {

  deployer.deploy(LavaToken);


    //deployer.link(ECRecovery, LavaWallet)
    //deployer.deploy(wEthToken);

  return deployer.deploy(_0xBitcoinToken).then(function(){
    console.log('deploy 1 ')

    return deployer.deploy(DeMutator).then(function(){
      console.log('deploy 2 ')


            return deployer.deploy(LavaToken).then(function(){
                console.log('deploy 3 ',  LavaToken.address)
                 return LavaToken.deployed()
          });


      });
  });

  //  deployer.deploy(miningKing);






};
