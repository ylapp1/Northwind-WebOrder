/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides a website to show the result of database queries.
 * The website can be visited via localhost:8080.
 */

const WebServer = require(__dirname + "/src/backend/WebServer");
const mysql = require("mysql");

// Initialize the connection to the xampp MySQL server
let databaseConnection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "nordwind",
  multipleStatements: true
});

// Create a new WebServer
let webServer = new WebServer(databaseConnection);
webServer.initialize();
