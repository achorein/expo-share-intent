const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const plist = require("@expo/plist").default;
const {
  getPrivacyInfoContent,
} = require("../build/ios/writeIosShareExtensionFiles");

const expectedAccess = [
  {
    NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
    NSPrivacyAccessedAPITypeReasons: ["1C8F.1"],
  },
];

function parseAccessedApiTypes(content) {
  return JSON.parse(
    JSON.stringify(plist.parse(content).NSPrivacyAccessedAPITypes),
  );
}

test("generates the App Group UserDefaults reason for the share extension", () => {
  assert.deepEqual(
    parseAccessedApiTypes(getPrivacyInfoContent()),
    expectedAccess,
  );
});

test("ships the App Group UserDefaults reason with the native module", () => {
  const iosDirectory = path.resolve(__dirname, "../../ios");
  const manifest = fs.readFileSync(
    path.join(iosDirectory, "PrivacyInfo.xcprivacy"),
    "utf8",
  );
  const podspec = fs.readFileSync(
    path.join(iosDirectory, "ExpoShareIntentModule.podspec"),
    "utf8",
  );

  assert.deepEqual(parseAccessedApiTypes(manifest), expectedAccess);
  assert.match(
    podspec,
    /['"]ExpoShareIntentModule_privacy['"]\s*=>\s*\[\s*['"]PrivacyInfo\.xcprivacy['"]\s*\]/,
  );
});
