import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "Rank5Game" using the deployer account.
 * The Rank5Game contract has no constructor arguments.
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

  await deploy("Rank5Game", {
    from: deployer,
    // Contract constructor arguments - Rank5Game has no constructor arguments
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const rank5Game = await hre.ethers.getContract<Contract>("Rank5Game", deployer);
  console.log("🎮 Rank5Game deployed!");
  console.log("📊 Entry fee:", await rank5Game.ENTRY_FEE(), "wei");
  console.log("🔢 Number of items:", await rank5Game.NUM_ITEMS());
  console.log("👥 Max players:", await rank5Game.MAX_PLAYERS());
  console.log("📋 Current phase:", await rank5Game.phase());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Rank5Game
deployYourContract.tags = ["Rank5Game"];
