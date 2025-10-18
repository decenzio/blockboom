import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys RankGame using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

  // Deploy RankGame
  const rankGameDeployment = await deploy("RankGame", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const rankGame = await hre.ethers.getContract<Contract>("RankGame", deployer);
  console.log("🏆 RankGame deployed!", rankGameDeployment.address);
  console.log("🔢 NUM_ITEMS:", await rankGame.NUM_ITEMS());
  console.log("👥 MAX_PLAYERS:", await rankGame.MAX_PLAYERS());
  console.log("💸 ENTRY_FEE:", await rankGame.ENTRY_FEE());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags RankGame
deployYourContract.tags = ["RankGame"];
