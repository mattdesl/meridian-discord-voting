const axios = require("axios").default;
const fs = require("fs/promises");
const path = require("path");
const { existsSync } = require("fs");
const users = require("../output/users.json");

const EPOCH = 1420070400000n;

function isSnowflake(id) {
  return BigInt(id).toString() === id;
}

function getTimestamp(snowflake) {
  return Number((BigInt(snowflake) >> BigInt(22)) + EPOCH);
}

async function getUser(id) {
  const token = process.env.TOKEN;
  const headers = {
    Authorization: token,
  };

  // const params = {
  //   limit: limit,
  //   before: before,
  //   after: after,
  // };
  const url = `https://discord.com/api/v10/users/${id}`;
  const resp = await axios.get(url, {
    // params,
    headers,
  });
  return resp;
}

(async () => {
  // const id = "822293804496715796";
  // const user = await getUser(id);
  // const time = getTimestamp(id);
  // console.log(new Date(time));
  for (let d of Object.entries(users)) {
    const [id, user] = d;
    const date = new Date(getTimestamp(id));
    if (date.getFullYear() === 2022) console.log(date, user.username);
    // console.log(date, user.username);
  }
})();
