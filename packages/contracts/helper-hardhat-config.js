const { ethers } = require("hardhat")

const networkConfig = {
	31415926: {
		name: "localnet",
		tokenUri: "http://localhost:8080/nft/{id}.json",
		//tokenUri: "https://node.collect3.me/nft/{id}.json",
	},
	314159: {
		name: "calibrationnet",
		// tokenUri: "http://localhost:8080/nft/{id}.json",
		tokenUri: "https://node.collect3.me/nft/{id}.json",
	},
	314: {
		name: "filecoinmainnet",
		tokenUri: "http://localhost:8080/nft/{id}.json",
	},
}

// const developmentChains = ["hardhat", "localhost"]

module.exports = {
	networkConfig,
	// developmentChains,
}
