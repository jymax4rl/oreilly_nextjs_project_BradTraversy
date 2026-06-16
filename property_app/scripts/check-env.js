require("dotenv").config();

const requiredMockEnv = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MONGODB_URI",
];

const optionalEnv = ["NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"];

console.log("--- Environment Variable Check ---");
requiredMockEnv.forEach((key) => {
  if (process.env[key]) {
    console.log(
      `${key}: Exists (starts with "${process.env[key].substring(0, 5)}...")`
    );
  } else {
    console.log(`${key}: MISSING`);
  }
});
optionalEnv.forEach((key) => {
  if (process.env[key]) {
    console.log(`${key}: Exists`);
  } else {
    console.log(`${key}: not set (address autocomplete will use manual fields)`);
  }
});
console.log("----------------------------------");
