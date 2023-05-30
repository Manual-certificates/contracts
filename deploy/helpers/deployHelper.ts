import fs from "fs";

function nonEmptyField(field: string, fieldName: string, onlyUndefined = false) {
  if (field != undefined && (onlyUndefined || (field !== "" && field.length !== 0))) {
    return field;
  }

  throw new Error(`Empty ${fieldName} field.`);
}

export function parseConfig(path = "deploy/data/config.json") {
  const configJson = JSON.parse(fs.readFileSync(path, "utf8"));

  nonEmptyField(configJson.tokenName, "tokenName", false);
  nonEmptyField(configJson.tokenSymbol, "tokenSymbol", false);

  return {
    tokenName: configJson.tokenName,
    tokenSymbol: configJson.tokenSymbol,
    baseUri: configJson.baseUri,
    newOwner: configJson.newOwner,
  };
}
