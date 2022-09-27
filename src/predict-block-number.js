// Predicts a block number from a given future date

require("dotenv/config");

const Web3 = require("web3");
const BN = Web3.utils.BN;

(async () => {
  const network = "mainnet";
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
    )
  );

  await getTargetFromLatest();

  async function getTargetFromLatest() {
    // Get current block
    const number = await web3.eth.getBlockNumber();
    const block = await web3.eth.getBlock(number);
    console.log("Latest Block Number", number);

    // Get block date
    const date = new Date(block.timestamp * 1000);
    console.log("Latest Block Time:", date.toUTCString());

    // Choose a future date
    const month = 9;
    const monthIndex = month - 1;
    const dayOfMonth = 28;
    const year = 2022;
    const hourInUTC = 16;
    const minute = 1;
    const second = 39;
    const endDate = new Date(
      Date.UTC(year, monthIndex, dayOfMonth, hourInUTC, minute, second)
    );

    // Get approximately how many slots are needed
    const seconds = (endDate.getTime() - date.getTime()) / 1000;
    const slotTimeSec = 12;
    const fixedNumberOfSlots = Math.round(seconds / slotTimeSec);
    const fixedEndDate = new Date(
      date.getTime() + fixedNumberOfSlots * slotTimeSec * 1000
    );
    const endBlockNumber = fixedNumberOfSlots + number;

    // Note this will not be perfect as some slots might be missed
    console.log("Target Block Time:", endDate.toUTCString());
    console.log("Predicted Block Number:", endBlockNumber);
    console.log("Predicted Block Time:", fixedEndDate.toUTCString());

    return {
      date: fixedEndDate,
      number: endBlockNumber,
    };
  }
})();
