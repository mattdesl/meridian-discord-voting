// Utility to check date of user accounts
const users = require("../output/users.json");

const EPOCH = 1420070400000n;

function getTimestamp(snowflake) {
  return Number((BigInt(snowflake) >> BigInt(22)) + EPOCH);
}

(async () => {
  for (let d of Object.entries(users)) {
    const [id, user] = d;
    const date = new Date(getTimestamp(id));
    if (date.getFullYear() === 2022) console.log(date, user.username);
  }
})();
