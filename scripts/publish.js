const execSync = require("child_process").execSync;

// get latest version from command line
const version = process.argv[2];

// update package.json
const fs = require("fs");
const packageJsonFile = JSON.parse(fs.readFileSync("package.json"));
packageJsonFile.version = version;

fs.writeFileSync("package.json", JSON.stringify(packageJsonFile, null, 2));

// git add, and commit
try {
  execSync("git add .");
  execSync(`git commit -m "v${version}"`);
} catch (e) {
  console.log("No changes to commit");
}

// use NPM_TOKEN to authenticate
execSync(
  `npm config set //registry.npmjs.org/:_authToken ${process.env.NPM_TOKEN}`,
);
// publish to npm
execSync("npm publish");
