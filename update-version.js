const fs = require("fs");

const { version } = JSON.parse(fs.readFileSync("package.json"));

const version_ts = `export const version = "v${version}";
`;

fs.writeFileSync("src/version.ts", version_ts);
