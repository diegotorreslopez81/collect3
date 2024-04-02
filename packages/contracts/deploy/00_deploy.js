require("hardhat-deploy")
require("hardhat-deploy-ethers")

const { networkConfig } = require("../helper-hardhat-config")

const private_key = network.config.accounts[0]
const wallet = new ethers.Wallet(private_key, ethers.provider)

module.exports = async ({ deployments }) => {
	const { deploy } = deployments
	console.log("Wallet Ethereum Address:", wallet.address)
	const chainId = network.config.chainId
	const tokenUri = networkConfig[chainId]["tokenUri"]

	const Collect3 = await deploy("Collect3", {
		from: wallet.address,
		args: [tokenUri],
		log: true,
	})
	console.log("Collect3 deployed to:", Collect3.address)
}
