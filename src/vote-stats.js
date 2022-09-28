const FEATURES = require("../data/features.json");
const axios = require("axios").default;
const fs = require("fs/promises");
const path = require("path");
const { existsSync, rmSync } = require("fs");

const STYLE_TYPES = [
  "Charcoal",
  "Gilded",
  "Gouache",
  "Invert",
  "Lino",
  "Newsprint",
  "Paletted",
  "Polarized",
  "Prime",
  "Prismatic",
  "Procedural",
  "Screenprint",
  "Topographic",
  "Watercolour",
];

const data = require("../output/discord_messages.json");

const getStyle = (id) => {
  const tokenId = String(id + 163000000);
  const features = FEATURES[tokenId];
  return features.Style;
};

(async () => {
  const users = new Map();
  const votes = new Map();
  const emojis = new Map();
  let voteMessages = 0;
  data.forEach((msg) => {
    const reactions = msg.reactions;
    if (reactions) {
      reactions.forEach((r) => {
        const name = r.emoji.name;
        const count = r.count;
        if (!emojis.has(name)) {
          emojis.set(name, 0);
        }
        emojis.set(name, emojis.get(name) + count);
      });
    }

    if (!msg.content) return;
    const tag = msg.content.toLowerCase();
    if (!tag.includes("meridian")) return;
    const regex = /^\#([\d]+)\s*meridian/;
    const m = tag.match(regex);
    if (!m) return;

    const authorId = msg.author.id;
    users.set(authorId, msg.author);

    const authorDisplay = msg.author.username;

    const mintNumber = parseInt(m[1], 10);
    if (isNaN(mintNumber)) return;

    if (!votes.has(authorId)) {
      votes.set(authorId, new Set());
    }
    let userVoteSet = votes.get(authorId);
    userVoteSet.add(mintNumber);

    voteMessages++;
  });

  const emojiList = [...emojis.entries()].sort((a, b) => b[1] - a[1]);
  const totalEmojis = emojiList.reduce((sum, e) => sum + e[1], 0);
  const fullRaffle = [...votes.entries()].filter((e) => e[1].size >= 14);

  console.log("Total Messages since opening:", data.length);
  console.log("Total Votes Counted:", voteMessages);
  console.log("Number of Users Voted:", users.size);
  // console.log("# of Users Who Have Voted >= 14 Styles:", fullRaffle.length);

  const voteCounts = new Map();
  for (let [user, voteSet] of votes.entries()) {
    for (let id of voteSet) {
      if (!voteCounts.has(id)) voteCounts.set(id, 0);
      voteCounts.set(id, voteCounts.get(id) + 1);
    }
  }

  const votedResults = [...voteCounts.entries()].sort((a, b) => b[1] - a[1]);
  // console.log("Winnings, Unique:", votedResults.slice(0, 14));

  const styleSet = new Set();
  const bestPerStyle = new Map();
  for (let item of votedResults) {
    const [mintNumber, count] = item;
    const style = getStyle(mintNumber);

    if (!bestPerStyle.has(style)) {
      bestPerStyle.set(style, []);
    }
    bestPerStyle.get(style).push({
      id: mintNumber,
      count,
    });
  }

  let raffleBook = 0;
  let raffleNFT = 0;
  const idsVotedFor = new Set();

  const headers = ["User", "Styles Voted", "Styles Missing"];
  const csvData = [headers.join(",")];
  const missingUserNames = [];
  const raffleBookList = [];
  const raffleNFTList = [];

  // These User IDs have voluntarily opted themselves out of the
  // book and NFT raffle.
  const optedOutUsers = ["892792481232597054", "710776541268934677"];

  for (let [user, voteSet] of votes.entries()) {
    const userData = users.get(user);

    const styleSetForUser = new Set();

    for (let id of voteSet) {
      const style = getStyle(id);
      styleSetForUser.add(style);
      idsVotedFor.add(id);
    }

    if (optedOutUsers.includes(user)) {
      continue;
    }

    const userNameFull = `${userData.username}#${userData.discriminator}`;
    const stylesMissing = STYLE_TYPES.filter(
      (t) => !styleSetForUser.has(t)
    ).join(", ");
    // if (styleSetForUser.size < 14) {
    csvData.push(
      [userNameFull, styleSetForUser.size, stylesMissing]
        .map((n) => {
          n = String(n);
          if (n.includes(",")) n = JSON.stringify(n);
          return n;
        })
        .join(",")
    );
    // }

    raffleBook++;
    const inRaffleNFT = styleSetForUser.size >= 14;
    raffleBookList.push(userNameFull);
    if (inRaffleNFT) {
      raffleNFT++;
      raffleNFTList.push(userNameFull);
    } else {
      missingUserNames.push(userNameFull);
    }
    // console.log(
    //   "%s: %d votes, %d styles",
    //   users.get(user).username,
    //   voteSet.size,
    //   styleSetForUser.size
    // );
  }

  console.log("Number of Users in Book Raffle:", raffleBook);
  console.log("Number of Users in NFT Raffle:", raffleNFT);
  console.log("Meridian IDs receiving 1 or more votes:", idsVotedFor.size);
  console.log("Total Reactions Counted:", totalEmojis);
  console.log("Top Reaction:", emojiList[0][0], ` (x${emojiList[0][1]})`);
  console.log(
    "Emojis Reactions:",
    emojiList
      .map((d) => d[0])
      .filter((d) => !/[a-z]+/i.test(d))
      .join(", ")
  );
  console.log();

  const totalForEachStyle = new Map();
  for (let f of Object.values(FEATURES)) {
    const style = f.Style;
    if (!totalForEachStyle.has(style)) {
      totalForEachStyle.set(style, 0);
    }
    totalForEachStyle.set(style, totalForEachStyle.get(style) + 1);
  }

  for (let [style, set] of bestPerStyle.entries()) {
    set.sort((a, b) => b.count - a.count);
    console.log(
      style,
      `(${set.length} voted for, of ${totalForEachStyle.get(style)} total)`
    );
    for (let { id, count } of set.slice(0, 5)) {
      console.log(`#${String(id).padEnd(3, " ")} - ${count} votes`);
    }
    console.log();
  }

  // console.log(topMints);
  // const bestDir = path.resolve(__dirname, "best");
  // if (existsSync(bestDir)) {
  // rmSync(bestDir, { recursive: true, force: true });
  // await fs.rmdir(bestDir);
  // }
  // await fs.mkdir(bestDir);

  // for (let i = 0; i < topMints.length; i++) {
  //   const item = topMints[i];
  //   const id = item.id;
  //   const f = `${id}.jpg`;
  //   await fs.copyFile(
  //     path.resolve(__dirname, `640/${f}`),
  //     path.resolve(bestDir, `${i}-${f}`)
  //   );
  //   console.log(
  //     `  #${String(id).padEnd(4, " ")}`,
  //     `Style: ${item.style}`,
  //     `-- Count: ${item.count}`
  //     // `-- Mentions: ${item[1].mentions}`,
  //     // `-- Reaction Average: ${item[1].emojiCountAverage}`,
  //     // `-- Reactions:`,
  //     // item[1].totalReactions,
  //     // `${item[1].emojis.map((e) => `${e[0]} (${e[1]})`).join(", ")}`
  //     // `${item[1].topEmoji} => ${item[1].topEmojiCount}`
  //   );
  // }

  await fs.writeFile(
    path.resolve(__dirname, "../output/votes.csv"),
    csvData.join("\n")
  );

  // print raffle_book.csv
  // print raffle_nft.csv
  const toRow = (n, i) => [i, JSON.stringify(n)].join(",");
  const raffleHeader = ["id", "user"].join(",");

  await fs.writeFile(
    path.resolve(__dirname, "../output/raffle_book.csv"),
    [raffleHeader, ...raffleBookList.map(toRow)].join("\n")
  );
  await fs.writeFile(
    path.resolve(__dirname, "../output/raffle_nft.csv"),
    [raffleHeader, ...raffleNFTList.map(toRow)].join("\n")
  );

  // const names = missingUserNames
  //   .map((n) => `@${n}`)
  //   .join(", ");
  // console.log("Missing Names:\n", names);

  // const userSet = [...new Set(users.keys())];
  await fs.writeFile(
    path.resolve(__dirname, "../output/users.json"),
    JSON.stringify(Object.fromEntries(users))
  );

  // const d = new Date();
  // var datestring =
  //   d.getDate() +
  //   "-" +
  //   (d.getMonth() + 1) +
  //   "-" +
  //   d.getFullYear() +
  //   " " +
  //   d.getHours() +
  //   ":" +
  //   d.getMinutes();
  // console.log(datestring);
})();
