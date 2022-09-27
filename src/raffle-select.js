// Raffle ceremony using Ethereum's RANDAO

require("dotenv/config");

const Web3 = require("web3");
const BN = Web3.utils.BN;

run();

async function run() {
  // Connect to a node provider of choice
  const network = "mainnet";
  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
    )
  );

  // This should be proposed on or around Wed, 28 Sep 2022 16:01:35 GMT
  // To coincide with the 1 year anniversary of Meridian's public minting
  const BLOCK_NUMBER = 15632936;

  // Fetch the block from Ethereum
  const block = await web3.eth.getBlock(BLOCK_NUMBER);
  if (!block) {
    throw new Error(`Block ${BLOCK_NUMBER} has not been proposed yet.`);
  }

  // Get the PREVRANDAO value stored in mixHash
  const BLOCK_KEY = "0x" + BN(block.mixHash).toJSON();

  // A 256-bit number selected by the artist @mattdesl
  // As a 0x-prefixed hex string
  const ARTIST_KEY = process.env.RANDOM_VALUE;

  // Display setup parameters
  console.log("Artist Key:", ARTIST_KEY);
  console.log("Block Number:", block.number);
  console.log("Block Time:", new Date(block.timestamp * 1000).toUTCString());
  console.log("Block Key:", BLOCK_KEY);

  // XOR the two keys to get a PRNG seed
  const mixA = BN(ARTIST_KEY);
  const mixB = BN(BLOCK_KEY);
  const seed = mixA.xor(mixB);
  console.log("PRNG Seed:", `0x${seed.toJSON()}`);

  // Get a 128-bit seed composed of 4 32-bit integers
  const bytes = seed.toBuffer();
  const rndState128Bit = new Uint32Array(4);
  const dataView = new DataView(rndState128Bit.buffer);
  for (let i = 0; i < 16; i++) {
    dataView.setUint8(i, bytes[i]);
  }

  // Seed the sfc32 PRNG
  const random = sfc32(...rndState128Bit);

  // Select the two winning IDs
  const RAFFLE_BOOK_SIZE = 277;
  const RAFFLE_NFT_SIZE = 201;
  const bookWinner = Math.floor(random() * RAFFLE_BOOK_SIZE);
  const nftWinner = Math.floor(random() * RAFFLE_NFT_SIZE);

  // Display results
  console.log("\nWinners:");
  console.log(`  - Raffle A (Book) Winning ID: ${bookWinner}`);
  console.log(`  - Raffle B (NFT) Winning ID: ${nftWinner}`);
}

// "Small Fast Counter" is a simple random number generator from PractRand
// https://github.com/bryc/code/blob/master/jshash/PRNGs.md#sfc32
function sfc32(a, b, c, d) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    var t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
