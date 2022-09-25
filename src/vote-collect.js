const axios = require("axios").default;
const fs = require("fs/promises");
const path = require("path");
const { existsSync } = require("fs");

const token = process.env.TOKEN;
const dataFile = path.resolve(__dirname, "../votes/output.json");

async function getMessages({
  channel = "",
  limit = 10,
  before = null,
  after = null,
} = {}) {
  const headers = {
    Authorization: token,
  };

  const params = {
    limit: limit,
    before: before,
    after: after,
  };
  const url = `https://discord.com/api/v10/channels/${channel}/messages`;
  const resp = await axios.get(url, {
    params,
    headers,
  });
  return resp;
}

function messageSort(a, b) {
  const ba = BigInt(a.id);
  const bb = BigInt(b.id);
  if (ba > bb) return 1;
  if (ba < bb) return -1;
  return 0;
}

function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function getReactionString(msg) {
  if (!msg.reactions) return "";
  return msg.reactions.map((n) => `${n.emoji.name} (${n.count})`).join(", ");
}

async function updateDatabase(dataToAppend) {
  let data = [];
  if (existsSync(dataFile)) {
    const oldStr = await fs.readFile(dataFile, "utf8");
    data = JSON.parse(oldStr);
  }
  dataToAppend.forEach((d) => data.push(d));
  const str = JSON.stringify(data);
  return fs.writeFile(dataFile, str);
}

(async () => {
  const CHANNEL_MATTDESL = "833713318107545670";
  const START_ID = "1019964919069810749";
  const ARTBOT_USER_ID = "794646394420854824";

  let previousId = null;
  let iterations = 0;
  let maxIterations = Infinity;

  if (existsSync(dataFile)) {
    const str = await fs.readFile(dataFile, "utf8");
    const data = JSON.parse(str);
    if (data && data.length > 0) {
      const last = data[data.length - 1];
      previousId = last.id;
      console.log("Loading data from file, using previous id:", previousId);
      console.log();
    }
  }

  while (iterations++ < maxIterations) {
    const limit = 100;
    let messages = [];
    try {
      const resp = await getMessages({
        channel: CHANNEL_MATTDESL,
        after: previousId || START_ID,
        limit,
      });
      messages = resp.data || [];
    } catch (err) {
      console.error("ERROR:", err.message);
      console.error(err);
    }

    if (messages.length > 0) {
      messages.sort(messageSort);
      // console.log(`\npage ${iterations} ----`);

      // print
      messages.forEach((msg) => {
        // if (msg.author.id == ARTBOT_USER_ID || !msg.content) return;
        console.log(
          `${msg.author.username}#${msg.author.discriminator}`.padStart(
            24,
            " "
          ),
          msg.content || "--",
          getReactionString(msg)
        );
      });

      try {
        await updateDatabase(messages);
      } catch (err) {
        console.error("Error updating JSON");
        console.error(err);
        break;
      }

      const last = messages[messages.length - 1];
      previousId = last.id;
      // console.log("Next ID:", previousId);

      const time = 1000;
      // console.log(`Sleeping for ${time} ms`);
      await sleep(time);
    } else {
      console.log("No more messages.");
      break;
    }
  }
})();
