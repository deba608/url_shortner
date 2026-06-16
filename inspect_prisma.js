const prisma = require("./src/config/database");
console.log("Prisma keys:", Object.keys(prisma));
if (prisma.user) {
  console.log("User model exists");
} else {
  console.log("User model is undefined");
}
if (prisma.url) {
  console.log("Url model exists");
} else {
  console.log("Url model is undefined");
}
