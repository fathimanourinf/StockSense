// Generates human-friendly document references like RCPT-000123, DO-000045.
const Counter = require("../models/Counter");

async function nextReference(prefix) {
  const counter = await Counter.findOneAndUpdate(
    { key: prefix },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  const seq = String(counter.seq).padStart(6, "0");
  return `${prefix}-${seq}`;
}

module.exports = nextReference;
