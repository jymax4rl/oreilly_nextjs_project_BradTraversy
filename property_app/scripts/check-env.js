require("dotenv").config();

const requiredMockEnv = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "MONGODB_URI",
];

const optionalEnv = [
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "BLOB_READ_WRITE_TOKEN",
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
optionalEnv.forEach((key) => {
  if (process.env[key]) {
    console.log(`${key}: Exists`);
  } else if (key === "GOOGLE_MAPS_API_KEY") {
    // Vercel name — OK if NEXT_PUBLIC_ variant is set instead
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.log(`${key}: not set (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set — OK)`);
    } else {
      console.log(
        `${key}: not set (Vercel Maps key name; also accepts NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)`,
      );
    }
  } else if (key === "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY") {
    if (process.env.GOOGLE_MAPS_API_KEY) {
      console.log(
        `${key}: not set (GOOGLE_MAPS_API_KEY is set — next.config maps it at build)`,
      );
    } else {
      console.log(
        `${key}: not set (Maps/Places autocomplete disabled; manual address + soft pin still work — enable Maps JavaScript API + Places API (New) when ready)`,
      );
    }
  } else if (key === "NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID") {
    console.log(
      `${key}: not set (classic Marker pin; set a Map ID for Advanced Markers)`,
    );
  } else {
    console.log(`${key}: not set`);
  }
});
console.log("----------------------------------");
