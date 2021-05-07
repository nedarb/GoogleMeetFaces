const fs = require("fs");
const path = require("path");

const packagePath = path.join(__dirname, "../", "package.json");
const manifestPath = path.join(__dirname, "../dist/manifest.json");

const packageContents = JSON.parse(
  fs.readFileSync(packagePath, { encoding: "utf8" })
);
const manifestContents = JSON.parse(
  fs.readFileSync(manifestPath, { encoding: "utf8" })
);

console.log(`Package version: ${packageContents.version}`);
console.log(`Manifest version: ${manifestContents.version}`);

if (packageContents.version !== manifestContents.version) {
  console.log("Updating manifest version to match");
  manifestContents.version = packageContents.version;
  fs.writeFileSync(manifestPath, JSON.stringify(manifestContents, null, 2), {
    encoding: "utf8",
  });
}
