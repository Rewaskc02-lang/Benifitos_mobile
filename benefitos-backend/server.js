require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(
    `🚀 BENEFITOS INTELLIGENCE CORE RUNNING SMOOTHLY ON PORT ${PORT}`,
  );
  console.log(`🤝 Hand this endpoint matrix to antigravity for Expo execution`);
  console.log(`=============================================================`);
});
