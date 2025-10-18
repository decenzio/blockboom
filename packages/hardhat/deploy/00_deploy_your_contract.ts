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

  const rankrDeployment = await deploy("Rankr", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const rankr = await hre.ethers.getContract<Contract>("Rankr", deployer);
  console.log("🏆 Rankr deployed!", rankrDeployment.address);
  console.log("🔢 NUM_ITEMS:", await rankr.NUM_ITEMS());
  console.log("👥 MAX_PLAYERS:", await rankr.MAX_PLAYERS());
  console.log("💸 ENTRY_FEE:", await rankr.ENTRY_FEE());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Rank5Game
deployYourContract.tags = ["Rankr"];
