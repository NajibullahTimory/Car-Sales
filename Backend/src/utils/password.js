const { scrypt, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64;
// پسورد را هش میکند
async function verifyScryptPassword(password, storedValue) {
  if (typeof storedValue !== "string" || storedValue.startsWith("disabled$"))
    return false;
  const [algorithm, salt, keyHex] = storedValue.split("$");
  if (algorithm !== "scrypt" || !salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(expected, actual);
}

module.exports = { verifyScryptPassword };
