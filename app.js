const debug = require("debug")("development");
const morgan = require("morgan");
const cors = require("cors");
const app = require("express")();

if (app.get("env") === "development") {
  app.use(morgan("tiny"));
  debug("Morgan enabled...");
}
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const corsOptions = require("./startup/corsOptions");

app.use(cors(corsOptions));
require("./startup/socket")(io);
const db = require("./startup/db")();
require("./startup/logging");
require("./startup/session")(app, db);
require("./startup/passport")(app);
require("./startup/routes")(app);
require("./startup/config")();
require("./startup/validation")();
require("./startup/prod")(app);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  debug(`Listening on port ${port}...`);
});
// 1- set debug=development 3- npm start
// "start": "nodemon --use_strict ./app",
