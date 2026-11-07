"use strict";
const fs = require("fs");
const path = require("path");
const data = path.join(__dirname, "..", "data");
if (!fs.existsSync(data)) fs.mkdirSync(data, { recursive: true });
fs.writeFileSync(path.join(data, "journal.json"), "[]\n");
fs.writeFileSync(path.join(data, "tokens.json"), "{}\n");
console.log("Journal et tokens réinitialisés.");
