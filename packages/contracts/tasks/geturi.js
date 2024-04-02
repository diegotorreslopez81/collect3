task("geturi", "Mint token in the Collect3 contract")
	.addParam("contract", "The address the Collect3 contract")
	.setAction(async (taskArgs) => {
		//store taskargs as useable variables
		const contractAddr = taskArgs.contract
		const id = taskArgs.id
		const networkId = network.name
		console.log("Minting token", id, "on network", networkId)

		//create a new wallet instance
		const wallet = new ethers.Wallet(network.config.accounts[0], ethers.provider)
		//call mint in Collect3
		const Collect3 = await ethers.getContractFactory("Collect3", wallet)
		const collect3Contract = await Collect3.attach(contractAddr)
		const uri = await collect3Contract.uri(1)
		console.log("Uri: ", uri)
	})
