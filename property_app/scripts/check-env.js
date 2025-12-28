require("dotenv").config();

const requiredMockEnv = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MONGODB_URI",
];

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
console.log("----------------------------------");
