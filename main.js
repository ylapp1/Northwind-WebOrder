/**
 * Provides a website to show the result of database queries.
 * The website can be visited via localhost:8080.
 */

const WebServer = require(__dirname + "/src/web/WebServer");
const mysql = require("mysql");

// Initialize connection to xampp MySQL server
let databaseConnection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "nordwind"
});

// Create a new WebServer
let webServer = new WebServer(databaseConnection);
webServer.initialize();
