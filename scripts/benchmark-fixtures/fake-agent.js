#!/usr/bin/env node

process.stdin.resume();
process.stdin.setEncoding("utf8");

let input = "";
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", () => {
  if (input.includes("Kafka")) {
    console.log("A compact mental model: Kafka is a durable event log. One example: an order service writes an event and other services read it when ready.");
    return;
  }

  console.log("This benchmark fixture produced a short response.");
});
