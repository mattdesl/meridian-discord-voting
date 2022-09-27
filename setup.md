# Meridian "Community Curated" Raffle

From Sept 15 to 23, users had a chance to vote on their favourite [Meridians](https://meridian.mattdesl.com/) within the Art Blocks `#matt-deslauriers` Discord channel to influence the "Community Curated" chapter of the upcoming [Meridian book](https://vetroeditions.com/products/meridian).

As a bonus, and to celebrate the 1-year anniversary of Meridian's release on September 28th, users who voted have been placed into two separate raffles:

- Book Raffle: A chance to win a signed copy of the book (if you voted for one or more Meridians)
- NFT Raffle: A chance to win [Meridian #784](https://opensea.io/assets/ethereum/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/163000784) (if you voted for all 14 different Meridian Styles)

The raffle winners will be announced September 28th, and will be decided with the _Trusted Setup Ceremony_ described below.

## Trusted Setup Ceremony

To create a fair raffle, I've decided to use a bit of cryptography and single leader election driven by Ethereum's new Proof of Stake RANDAO mechanism[^1]. In Ethereum PoS, each new block proposed to the network includes a `PREVRANDAO` field, which is a pseudo-random 256-bit integer.[^2] This integer will be used as a seed to select the raffle winners randomly from the list of eligible users.

_Consider this ceremony partly an artistic performance using the blockchain, and partly a multi-party computation scheme for a cryptographically verifiable random selection._

### Technical Details

TODO.

[^1]: You can read more about the mechanics of RANDAO [here](https://eth2book.info/altair/part2/building_blocks/randomness#updating-the-randao).
[^2]: This integer is computed by aggregating the BLS signature of each block producer.
