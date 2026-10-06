// Run: node app/lib/amountInWords.test.mjs
import assert from "node:assert/strict";
import { amountInWords } from "./amountInWords.ts";

assert.equal(amountInWords(0), "Rupees Zero Only");
assert.equal(amountInWords(17700), "Rupees Seventeen Thousand Seven Hundred Only");
assert.equal(amountInWords(1050.5), "Rupees One Thousand Fifty and Fifty Paise Only");
assert.equal(
  amountInWords(1234567.89),
  "Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Eighty Nine Paise Only",
);
assert.equal(amountInWords(100000000), "Rupees Ten Crore Only");
assert.equal(amountInWords(1234500000), "Rupees One Hundred Twenty Three Crore Forty Five Lakh Only");
assert.equal(amountInWords(0.1 + 0.2), "Rupees Zero and Thirty Paise Only");
console.log("amountInWords: ok");
