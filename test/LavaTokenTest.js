/*

https://medium.com/@adrianmcli/migrating-your-truffle-project-to-web3-v1-0-ed3a56f11a4
*/

const { getWeb3, getContractInstance } = require("./web3helpers")
const web3 = getWeb3()
const getInstance = getContractInstance(web3)

var secp256k1 = require('secp256k1');
const ethAbi = require('ethereumjs-abi')
var ethUtil =  require('ethereumjs-util');
var web3utils =  require('web3-utils');

const Tx = require('ethereumjs-tx')


var EIP712Helper = require("./EIP712Helper");

var EIP712HelperV3 = require("./EIP712HelperV3");

var LavaTestUtils = require("./LavaTestUtils");

var lavaTestUtils = new LavaTestUtils();

var relayAuthorityAddress = '0x0000000000000000000000000000000000000000';

var test_account= {
    'address': '0x087964cd8b33ea47c01fbe48b70113ce93481e01',
    'privateKey': 'dca672104f895219692175d87b04483d31f53af8caad1d7348d269b35e21c3df'
}



contract("LavaToken", (accounts) => {

  var lavaContract ;
  var tokenContract;
  var demutatorContract;
  //var kingContract;
//  var mintHelperContract;
//  var doubleKingsRewardContract;
  //  var MiningDelegate;


  it("can deploy ", async function () {
    lavaContract = getInstance("LavaToken")
    tokenContract = getInstance("_0xBitcoinToken")

    demutatorContract = getInstance("DeMutator")
  //  kingContract = getInstance("MiningKing")
  //  mintHelperContract = getInstance("MintHelper")
  //  miningDelegateContract = getInstance("MiningDelegate")
  //  doubleKingsRewardContract = getInstance("DoubleKingsReward")


    assert.ok(lavaContract);
  })




      it("finds schemahash", async function () {


        //https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js

        const typedData = {
                types: {
                    EIP712Domain: [
                        { name: "contractName", type: "string" },
                        { name: "version", type: "string" },
                        { name: "chainId", type: "uint256" },
                        { name: "verifyingContract", type: "address" }
                    ],
                    LavaPacket: [
                        { name: 'methodName', type: 'string' },
                        { name: 'relayAuthority', type: 'address' },
                        { name: 'from', type: 'address' },
                        { name: 'to', type: 'address' },
                        { name: 'wallet', type: 'address' },
                        { name: 'tokens', type: 'uint256' },
                        { name: 'relayerRewardTokens', type: 'uint256' },
                        { name: 'expires', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' }
                    ],
                },
                primaryType: 'LavaPacket',
                domain: {
                  contractName: 'Lava Wallet',
                  version: '1',
                  chainId: 1,
                  verifyingContract: lavaContract.options.address
                },
                message: {   //what is word supposed to be ??
                    methodName: 'approve',
                    relayAuthority: relayAuthorityAddress,
                    from: test_account.address,
                    to: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                    wallet: lavaContract.options.address,
                    tokens: 0,
                    relayerRewardTokens: 0,
                    expires: 999999999,
                    nonce: 0
                },
            };

            const types = typedData.types;


              var typedDataHash = ethUtil.sha3(
                  Buffer.concat([
                      Buffer.from('1901', 'hex'),
                      EIP712HelperV3.structHash('EIP712Domain', typedData.domain, types),
                      EIP712HelperV3.structHash(typedData.primaryType, typedData.message, types),
                  ]),
              );


                  var testpacketdata = {
                    methodName: 'approve',
                    relayAuthority: relayAuthorityAddress,
                    from: test_account.address,
                    to: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                    wallet: lavaContract.options.address,
                    tokens: 0,
                    relayerRewardTokens: 0,
                    expires: 999999999,
                    nonce: 0
                  }

                var computedMessageHash = EIP712HelperV3.structHash(typedData.primaryType, typedData.message, types)
                var contractMessageHash = await lavaContract.methods.getLavaPacketHash(testpacketdata.methodName,testpacketdata.relayAuthority,testpacketdata.from,testpacketdata.to,testpacketdata.wallet,testpacketdata.tokens,testpacketdata.relayerRewardTokens,testpacketdata.expires,testpacketdata.nonce).call();

                assert.equal('0x'+computedMessageHash.toString('hex'), contractMessageHash)

                var computedDomainHash = EIP712HelperV3.structHash('EIP712Domain', typedData.domain, types)
                var contractDomainHash = await lavaContract.methods.getEIP712DomainHash('Lava Wallet','1',1,lavaContract.options.address).call();

                assert.equal('0x'+computedDomainHash.toString('hex'), contractDomainHash)

                const sig = ethUtil.ecsign(typedDataHash , Buffer.from(test_account.privateKey, 'hex') );

                //assert.equal(ethUtil.bufferToHex(typedDataHash), '0xa5b19006c219117816a77e959d656b48f0f21e037fc152224d97a5c016b63692' )
                assert.ok(sig )

            });


            it("checks sub hashes  ", async function () {

             var lavaPacketTypehash = await lavaContract.methods.getLavaPacketTypehash().call()




              var methodName =  'approve'    //convert to bytes
              var relayAuthority = relayAuthorityAddress
              var from= test_account.address
              var to= "0x357FfaDBdBEe756aA686Ef6843DA359E2a85229c"
              var walletAddress=lavaContract.options.address
            //  var tokenAddress=tokenContract.options.address
              var tokenAmount=2000000
            //  var relayerRewardToken=tokenContract.options.address
              var relayerRewardTokens=1000000
              var expires=336504400
              var nonce='0xc18f687c56f1b2749af7d6151fa351'
              //var expectedSignature="0x8ef27391a81f77244bf95df58737eecac386ab9a47acd21bdb63757adf71ddf878169c18e4ab7b71d60f333c870258a0644ac7ade789d59c53b0ab75dbcc87d11b"

               //add new code here !!

              var typedData = LavaTestUtils.getLavaTypedDataFromParams(
                methodName,
                relayAuthority,
                from,
                to,
                walletAddress,
                //tokenAddress,
                tokenAmount,
              //  relayerRewardToken,
                relayerRewardTokens,
                expires,
                nonce);


          //    var domainStructHash =  EIP712Helper.typeHash('EIP712Domain', typedData.types);
              var lavaPacketStructHash =  EIP712HelperV3.typeHash('LavaPacket', typedData.types);


        //      assert.equal(LavaTestUtils.bufferToHex(domainStructHash), domainTypehash    ); //initialized

               assert.equal(LavaTestUtils.bufferToHex(lavaPacketStructHash), lavaPacketTypehash  ); //initialized



               var lavaPacketTuple = [methodName,
                                       relayAuthority,
                                       from,
                                       to,
                                       walletAddress,
                                       tokenAmount,
                                       relayerRewardTokens,
                                       expires,
                                       nonce]

                console.log('lavaPacketTypehash ', lavaPacketTypehash)
                console.log('STRUCT HASH!',LavaTestUtils.bufferToHex(lavaPacketStructHash))


              console.log('lava packet tuple ', lavaPacketTuple)


          //     var domainHash = await walletContract.methods.getDomainHash(["Lava Wallet",walletContract.options.address]).call()
               var lavaPacketHash = await lavaContract.methods.getLavaPacketHash(
                 methodName,
                 relayAuthority,
                 from,
                 to,
                 walletAddress,
                 tokenAmount,
                 relayerRewardTokens,
                 expires,
                 nonce
               ).call()



           //assert.equal(domainHash, LavaTestUtils.bufferToHex( EIP712Helper.structHash('EIP712Domain', typedData.domain, typedData.types) )    );


           //why is this failing on the values !?
           assert.equal(lavaPacketHash, LavaTestUtils.bufferToHex( EIP712HelperV3.structHash('LavaPacket', typedData.message, typedData.types) )     );



            });








            it("can approveTokensWithSignature ", async function () {


                await printBalance(test_account.address,tokenContract)




                var addressFrom = test_account.address;

                console.log( addressFrom )

                //var msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C'
                var requestRecipient = test_account.address;
                var requestQuantity = 500;



                 var requestNonce = web3utils.randomHex(32);

                 var privateKey = test_account.privateKey;


                 var methodName =   'approve'    //convert to bytes
                 var relayAuthority = relayAuthorityAddress
                 var from= addressFrom
                 var to= "0x357FfaDBdBEe756aA686Ef6843DA359E2a85229c"
                 var walletAddress=lavaContract.options.address
                 var tokenAddress=tokenContract.options.address
                 var tokenAmount=2000000
                 var relayerRewardToken=tokenContract.options.address
                 var relayerRewardTokens=1000000
                 var expires=336504400
                 var nonce='0xc18f687c56f1b2749af7d6151fa351'
                 //var expectedSignature="0x8ef27391a81f77244bf95df58737eecac386ab9a47acd21bdb63757adf71ddf878169c18e4ab7b71d60f333c870258a0644ac7ade789d59c53b0ab75dbcc87d11b"

                  //add new code here !!

                 var typedData = LavaTestUtils.getLavaTypedDataFromParams(
                   methodName,
                   relayAuthority,
                   from,
                   to,
                   walletAddress,
                   //tokenAddress,
                   tokenAmount,
                  // relayerRewardToken,
                   relayerRewardTokens,
                   expires,
                   nonce);


                    const types = typedData.types;


                const typedDataHash = LavaTestUtils.getLavaTypedDataHash(typedData,types);


                  //https://github.com/ethers-io/ethers.js/issues/46/


                  var packetData ={
                    methodName:methodName,
                    relayAuthority:relayAuthority,
                    from: from,
                    to: to,
                    wallet:walletAddress,
                   // token:token,
                    tokens:tokenAmount,
                   // relayerRewardToken:relayerRewardToken,
                    relayerRewardTokens:relayerRewardTokens,
                    expires:expires,
                    nonce:nonce
                  }




                  var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash(
                  methodName,
                  relayAuthority,
                  from,
                  to,
                  walletAddress,
                  tokenAmount,
                  relayerRewardTokens,
                  expires,
                  nonce ).call({from: test_account.address})

                  ///msg hash signed is 0x89017d25e83a6025edb85c3e4ff6ef4dc0bb34b0f9d0a89d19ac1ed1eda512e8
                console.log('lavaMsgHash',lavaMsgHash)
                console.log('typedDataHash.toString()',typedDataHash.toString('hex'))

                assert.equal(lavaMsgHash, '0x' + typedDataHash.toString('hex') ); //initialized




            var computedSignature = LavaTestUtils.signTypedData( typedDataHash,privateKey)
            packetData.signature = computedSignature;



                //how to generate a good signature using web3 ?
                //---------------??????????????????????
                //https://github.com/ethereumjs/ethereumjs-util/blob/master/test/index.js


                  var privKey = Buffer.from(privateKey, 'hex')

                var bufferToSign = Buffer.from(typedDataHash , 'hex')


                //var sigBytes = (secp256k1.sign(typedDataHash, privKey)).signature;


              const sig = ethUtil.ecsign(typedDataHash , privKey );
              //    let sig = await web3.eth.sign(typedDataHash, privKey);

            //  console.log("siggy",sigBytes)



              //  console.log('@@ sig',  signatureData)
              let recover = ethUtil.ecrecover(typedDataHash, sig.v , sig.r , sig.s)

              var publicKey = recover.toString('hex');
              var recoveredAddress = ethUtil.publicToAddress(recover);

                console.log('@@ recover', recoveredAddress.toString('hex')  )

               assert.equal( '0x'+recoveredAddress.toString('hex') , test_account.address.toLowerCase())


               assert.equal( LavaTestUtils.lavaPacketHasValidSignature( packetData   )  ,true );



               ///bad format ?
             let signatureData = ethUtil.toRpcSig(sig.v,sig.r,sig.s);
             console.log('meep sig',signatureData)

               var lavaPacketStruct =   typedData.message



                console.log('@@ struct ',  lavaPacketStruct)

                var fullPacket = LavaTestUtils.getLavaPacket(
                  methodName,
                  relayAuthority,
                  from,
                  to,
                  walletAddress,
                //  tokenAddress,
                  tokenAmount,
                  //relayerRewardToken,
                  relayerRewardTokens,
                  expires,
                  nonce,
                  signatureData
                )

                assert.equal(  LavaTestUtils.lavaPacketHasValidSignature( fullPacket ) , true   )


                //finish me

                //walletContract.methods.approveTokensWithSignature(    )
              /*  assert.equal(lavaPacketStruct.methodName ,  'approve'  )

                        if(lavaPacketStruct.methodName ==    'approve'  )
                        {

                        var response = await new Promise((resolve, reject) => {
                             walletContract.methods.approveTokensWithSignature(

                              lavaPacketStruct,
                              signatureData

                            ).send( {} , function(response){
                              resolve(response)
                            });

                            });///promise

                            console.log('res',response)
                            assert.ok(response); //initialized


                          }
                */


                  });






                  it("can approveTokensWithSignature ", async function () {


                      await printBalance(test_account.address,tokenContract)




                      var addressFrom = test_account.address;

                      //var msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C'
                      var requestRecipient = test_account.address;
                      var requestQuantity = 500;




                      /*
                      SIGNING A LAVA PACKET
                      */

                       var requestNonce = web3utils.randomHex(32);


                       var methodname = 'approve'
                       var relayAuthority = relayAuthorityAddress
                       var from = test_account.address
                       var to = "0x357FfaDBdBEe756aA686Ef6843DA359E2a85229c"
                       var walletAddress=lavaContract.options.address
                       var tokenAmount=2000000
                       var relayerReward=0 //1000000
                       var expires=336504400
                       var nonce='0xc18f687c56f1b2749af7d6151fa351'
                       //var expectedSignature="0x8ef27391a81f77244bf95df58737eecac386ab9a47acd21bdb63757adf71ddf878169c18e4ab7b71d60f333c870258a0644ac7ade789d59c53b0ab75dbcc87d11b"

                        //add new code here !!

                       var typedData = LavaTestUtils.getLavaTypedDataFromParams(
                         methodname,
                         relayAuthority,
                         from,
                         to,
                         walletAddress,
                         tokenAmount,
                         relayerReward,
                         expires,
                         nonce);


                          const types = typedData.types;


                          var msgHash = LavaTestUtils.getLavaTypedDataHash(typedData,types);

                          var privateKey = test_account.privateKey;

                         var privKey = Buffer.from(privateKey, 'hex')

                        const sig = ethUtil.ecsign(msgHash , privKey );
                        var signature = ethUtil.toRpcSig(sig.v,sig.r,sig.s);

                        console.log('@@ lavaContract',  lavaContract.address)


                        var lavaPacketStruct =   typedData.message
                        console.log('  lavaPacketStruct   ',   lavaPacketStruct  )


                          console.log('  lavaContract.methods   ',   lavaContract.methods  )


                      ///msg hash signed is 0x9201073a01df85b87dab83ad2498bf5b2190bf62cb03b2a407ba7d77279a4ceb
                    //  var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash('approve', tuple ).send()
                      //console.log('lavaMsgHash',lavaMsgHash)

                      var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash(
                        methodname,
                        relayAuthority,
                        from,
                        to,
                        walletAddress,
                        tokenAmount,
                        relayerReward,
                        expires,
                        nonce ).call({from: test_account.address})

                        console.log('lavaMsgHash',lavaMsgHash)

                      assert.equal(lavaMsgHash, '0x'+ msgHash.toString('hex') );



                      /*





                      lavaSignature = signature;
                      console.log('lava signatureaa',msgParams,signature)

                      msgParams.sig = signature;



                      var recoveredAddress = lavaTestUtils.recoverTypedSignature(msgParams);

                      assert.equal(recoveredAddress, test_account.address ); //initialized


                      console.log('result1', lavaMsgHash )


                      console.log('addressFrom',addressFrom)
                      console.log('meeep',[from,to,tokenAddress,tokenAmount,relayerReward,expires,nonce,signature])

                    */
                    //  var result = await walletContract.approveTokensWithSignature.call(from,to,tokenAddress,tokenAmount,relayerReward,expires,nonce )


                    console.log('making tx data',
                      [methodname,
                      relayAuthority,
                      from,
                      to,
                      walletAddress,
                      tokenAmount,
                      relayerReward,
                      expires,
                      nonce,
                      signature]);

                      var txData = web3.eth.abi.encodeFunctionCall({
                              name: 'approveTokensWithSignature',
                              type: 'function',
                              payable: false,
                              stateMutability: "nonpayable",
                              "inputs": [
                                {
                                  "name": "methodName",
                                  "type": "string"
                                },
                                {
                                  "name": "relayAuthority",
                                  "type": "address"
                                },
                                {
                                  "name": "from",
                                  "type": "address"
                                },
                                {
                                  "name": "to",
                                  "type": "address"
                                },
                                {
                                  "name": "wallet",
                                  "type": "address"
                                },
                                {
                                  "name": "tokens",
                                  "type": "uint256"
                                },
                                {
                                  "name": "relayerRewardTokens",
                                  "type": "uint256"
                                },
                                {
                                  "name": "expires",
                                  "type": "uint256"
                                },
                                {
                                  "name": "nonce",
                                  "type": "uint256"
                                },
                                {
                                  "name": "signature",
                                  "type": "bytes"
                                }
                              ],
                                outputs: [
                                  {
                                    "name": "success",
                                    "type": "bool"
                                  }
                              ]


                        }, [methodname,
                          relayAuthority,
                          from,
                          to,
                          walletAddress,
                          tokenAmount,
                          relayerReward,
                          expires,
                          nonce,
                          signature]);


                        try{
                            var txCount = await web3.eth.getTransactionCount(addressFrom);
                            console.log('txCount',txCount)
                           } catch(error) {  //here goes if someAsyncPromise() rejected}
                            console.log(error);

                             return error;    //this will result in a resolved promise.
                           }

                           var addressTo = lavaContract.address;
                           var privateKey = test_account.privateKey;

                          const txOptions = {
                            nonce: web3utils.toHex(txCount),
                            gas: web3utils.toHex("1704624"),
                            gasPrice: web3utils.toHex(web3utils.toWei("4", 'gwei') ),
                            value: 0,
                            to: addressTo,
                            from: addressFrom,
                        //    data: txData
                          }

                          /*

                        var txhash = await new Promise(function (result,error) {

                              sendSignedRawTransaction(web3,txOptions,addressFrom,privateKey, function(err, res) {

                              if (err) error(err)
                                result(res)
                            })

                          }.bind(this));

                          */

                          var result2 = await lavaContract.methods.approveTokensWithSignature(
                              methodname,
                              relayAuthority,
                              from,
                              to,
                              walletAddress,
                              tokenAmount,
                              relayerReward,
                              expires,
                              nonce,
                              signature
                             ).send(txOptions, (error, txhash) => {
                                console.log('meep',error,txhash)
                              });

                        //  assert.ok(txhash)

                          var allowance = await lavaContract.methods.getAllowance(from,to).call();

                          assert.equal( allowance  , tokenAmount);

                          var burnStatus = await lavaContract.methods.signatureHashBurnStatus(lavaMsgHash).call();

                         assert.equal( burnStatus  , 0x1); //initialized

                    });





                    it("can approveAndCallTokensWithSignature ", async function () {


                        await printBalance(test_account.address,tokenContract)




                        var addressFrom = test_account.address;

                        //var msg = '0x8CbaC5e4d803bE2A3A5cd3DbE7174504c6DD0c1C'
                        var requestRecipient = test_account.address;
                        var requestQuantity = 500;




                        /*
                        SIGNING A LAVA PACKET
                        */

                         var requestNonce = web3utils.randomHex(32);


                         var methodname = 'demutate'
                         var relayAuthority = relayAuthorityAddress
                         var from = test_account.address
                         var to = demutatorContract.options.address
                         var walletAddress=lavaContract.options.address
                         var tokenAmount= 0
                         var relayerReward=0 //1000000
                         var expires=336504400
                         var nonce='0xc18f687c56f1b2749af7d6151fa351'
                         //var expectedSignature="0x8ef27391a81f77244bf95df58737eecac386ab9a47acd21bdb63757adf71ddf878169c18e4ab7b71d60f333c870258a0644ac7ade789d59c53b0ab75dbcc87d11b"

                          //add new code here !!

                         var typedData = LavaTestUtils.getLavaTypedDataFromParams(
                           methodname,
                           relayAuthority,
                           from,
                           to,
                           walletAddress,
                           tokenAmount,
                           relayerReward,
                           expires,
                           nonce);


                            const types = typedData.types;


                            var msgHash = LavaTestUtils.getLavaTypedDataHash(typedData,types);



                            var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash(
                              methodname,
                              relayAuthority,
                              from,
                              to,
                              walletAddress,
                              tokenAmount,
                              relayerReward,
                              expires,
                              nonce ).call({from: test_account.address})

                              console.log('lavaMsgHash',lavaMsgHash)

                            assert.equal(lavaMsgHash, '0x'+ msgHash.toString('hex') );

                            

                            var privateKey = test_account.privateKey;

                           var privKey = Buffer.from(privateKey, 'hex')

                          const sig = ethUtil.ecsign(msgHash , privKey );
                          var signature = ethUtil.toRpcSig(sig.v,sig.r,sig.s);

                          console.log('@@ lavaContract',  lavaContract.address)


                          var lavaPacketStruct =   typedData.message
                          console.log('  lavaPacketStruct   ',   lavaPacketStruct  )


                            console.log('  lavaContract.methods   ',   lavaContract.methods  )


                        ///msg hash signed is 0x9201073a01df85b87dab83ad2498bf5b2190bf62cb03b2a407ba7d77279a4ceb
                      //  var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash('approve', tuple ).send()
                        //console.log('lavaMsgHash',lavaMsgHash)

                        var lavaMsgHash = await lavaContract.methods.getLavaTypedDataHash(
                          methodname,
                          relayAuthority,
                          from,
                          to,
                          walletAddress,
                          tokenAmount,
                          relayerReward,
                          expires,
                          nonce ).call({from: test_account.address})

                          console.log('lavaMsgHash',lavaMsgHash)

                        assert.equal(lavaMsgHash, '0x'+ msgHash.toString('hex') );





                        var txData = web3.eth.abi.encodeFunctionCall({
                                name: 'approveAndCallWithSignature',
                                type: 'function',
                                payable: false,
                                stateMutability: "nonpayable",
                                "inputs": [
                                  {
                                    "name": "methodName",
                                    "type": "string"
                                  },
                                  {
                                    "name": "relayAuthority",
                                    "type": "address"
                                  },
                                  {
                                    "name": "from",
                                    "type": "address"
                                  },
                                  {
                                    "name": "to",
                                    "type": "address"
                                  },
                                  {
                                    "name": "wallet",
                                    "type": "address"
                                  },
                                  {
                                    "name": "tokens",
                                    "type": "uint256"
                                  },
                                  {
                                    "name": "relayerRewardTokens",
                                    "type": "uint256"
                                  },
                                  {
                                    "name": "expires",
                                    "type": "uint256"
                                  },
                                  {
                                    "name": "nonce",
                                    "type": "uint256"
                                  },
                                  {
                                    "name": "signature",
                                    "type": "bytes"
                                  }
                                ],
                                  outputs: [
                                    {
                                      "name": "success",
                                      "type": "bool"
                                    }
                                ]


                          }, [methodname,
                            relayAuthority,
                            from,
                            to,
                            walletAddress,
                            tokenAmount,
                            relayerReward,
                            expires,
                            nonce,
                            signature]);


                          try{
                              var txCount = await web3.eth.getTransactionCount(addressFrom);
                              console.log('txCount',txCount)
                             } catch(error) {  //here goes if someAsyncPromise() rejected}
                              console.log(error);

                               return error;    //this will result in a resolved promise.
                             }

                             var addressTo = lavaContract.address;
                             var privateKey = test_account.privateKey;

                            const txOptions = {
                              nonce: web3utils.toHex(txCount),
                              gas: web3utils.toHex("1704624"),
                              gasPrice: web3utils.toHex(web3utils.toWei("4", 'gwei') ),
                              value: 0,
                              to: addressTo,
                              from: addressFrom,
                          //    data: txData
                            }


                            var result2 = await lavaContract.methods.approveAndCallWithSignature(
                                methodname,
                                relayAuthority,
                                from,
                                to,
                                walletAddress,
                                tokenAmount,
                                relayerReward,
                                expires,
                                nonce,
                                signature
                               ).send(txOptions, (error, txhash) => {
                                  console.log('meep',error,txhash)
                                });


                          //  var allowance = await lavaContract.methods.getAllowance(from,to).call();

                          //  assert.equal( allowance  , tokenAmount);

                            var burnStatus = await lavaContract.methods.signatureHashBurnStatus(lavaMsgHash).call();

                           assert.equal( burnStatus  , 0x1); //initialized

                      });






})


async function sendSignedRawTransaction(web3,txOptions,addressFrom,fullPrivKey,callback) {


  var privKey = truncate0xFromString( fullPrivKey )

  const privateKey = new Buffer( privKey, 'hex')
  const transaction = new Tx(txOptions)


  transaction.sign(privateKey)


  const serializedTx = transaction.serialize().toString('hex')

    try
    {
      var result =  web3.eth.sendSignedTransaction('0x' + serializedTx, callback)
    }catch(e)
    {
      console.log(e);
    }
}


 function truncate0xFromString(s)
{

  if(s.startsWith('0x')){
    return s.substring(2);
  }
  return s;
}

async function getBalance (account ,tokenContract)
{
      var balance_eth = await (web3.eth.getBalance(account ));
     var balance_token = await tokenContract.methods.balanceOf(account).call({from: account });

     return {ether: web3utils.fromWei(balance_eth.toString(), 'ether'), token: balance_token  };

 }

 async function printBalance (account ,tokenContract)
 {
       var balance_eth = await (web3.eth.getBalance(account ));
      var balance_token = await tokenContract.methods.balanceOf(account).call( {from: account });


      console.log('acct balance', account, web3utils.fromWei(balance_eth.toString() , 'ether')  , balance_token )

  }
