import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys BlockBoom using the deployer account.
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

  // Deploy BlockBoom (frontend expects this contract name and ABI)
  const blockBoomDeployment = await deploy("BlockBoom", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  const blockBoom = await hre.ethers.getContract<Contract>("BlockBoom", deployer);
  console.log("🎵 BlockBoom deployed!", blockBoomDeployment.address);
  console.log("🔢 MAX_SONGS:", await blockBoom.MAX_SONGS());
  console.log("🗳️ VOTE_THRESHOLD:", await blockBoom.VOTE_THRESHOLD());
  console.log("💸 MIN_BET_AMOUNT:", await blockBoom.MIN_BET_AMOUNT());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags BlockBoom
deployYourContract.tags = ["BlockBoom"];
