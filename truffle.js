module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
     ropsten:  {
    	network_id: 3,
    	host: "localhost",
    	port:  8545,
    	gas:   2900000

    }
  },
  compilers: {
      solc: {
        version: "0.5.0",
        }
      },
   rpc: {
	host: 'localhost',
	post:8080
   }
};
