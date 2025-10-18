import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys RankGameFHE using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployRankGameFHE: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy RankGameFHE
  const rankGameFHEDeployment = await deploy("RankGameFHE", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const rankGameFHE = await hre.ethers.getContract<Contract>("RankGameFHE", deployer);
  console.log("🔐 RankGameFHE deployed!", rankGameFHEDeployment.address);
  console.log("🔢 MAX_ITEMS:", await rankGameFHE.MAX_ITEMS());
  console.log("👥 MAX_PLAYERS:", await rankGameFHE.MAX_PLAYERS());
  console.log("🗳️ MAX_VOTES:", await rankGameFHE.MAX_VOTES());
  console.log("📊 Current Phase:", await rankGameFHE.phase());
};

export default deployRankGameFHE;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags RankGameFHE
deployRankGameFHE.tags = ["RankGameFHE"];
