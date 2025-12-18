const fs = require("fs");
const path = require("path");

const filePath = path.join(
  process.cwd(),
  "..",
  "KamaProperties.Properties.json"
);

try {
  const rawData = fs.readFileSync(filePath, "utf8");
  const properties = JSON.parse(rawData);

  const cleanedProperties = properties.map((prop) => {
    const { _id, ...rest } = prop;
    return rest;
  });

  fs.writeFileSync(filePath, JSON.stringify(cleanedProperties, null, 2));
  console.log("Successfully removed _id fields from properties.json");
} catch (error) {
  console.error("Error processing file:", error);
}
