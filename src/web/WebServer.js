
const express = require("express");
const nunjucks = require("nunjucks");

/**
 * Provides html contents for several routes.
 */
class WebServer
{
    /**
     * WebServer constructor.
     *
     * @param {Connection} _databaseConnection The database connection
     */
    constructor(_databaseConnection)
    {
        this.databaseConnection = _databaseConnection;
    }


    // Public Methods

    /**
     * Initializes the web server.
     */
    initialize()
    {
        // Initialize the web server
        this.express = express();
        this.initializeRoutes();
        this.express.listen(8080);

        nunjucks.configure(__dirname + "/resources/pages", {
            autoescape: false,
            express: this.express
        });
    }

    // Private Methods

    /**
     * Initializes the routes that the web server provides.
     */
    initializeRoutes()
    {
        // Dynamic pages
        this.express.get("/", this.indexResponse.bind(this));
        this.express.get("/orders", this.ordersResponse.bind(this));

        // Static paths
        this.express.use("/javascript", express.static(__dirname + "/resources/pages"));
        this.express.use("/jquery", express.static(__dirname + "/external"));
    }


    // Route responses

    /**
     * Responds to a request to the "/" route.
     *
     * @param _request The request
     * @param _response The response
     */
    indexResponse(_request, _response)
    {
        _response.render("index.njk", {
            title: "Bestellübersicht",
        });
    }

    ordersResponse(_request, _response)
    {
        this.getOrders().then(function(_result){
            _response.json(_result);
        });
    }

    getOrders()
    {
        // This query was the initial task
        //let sqlQuery = "SELECT * FROM artikel";

        // This query selects some data
        let sqlQuery = `
          SELECT *, (Gesamtwert + Frachtkosten) AS Gesamtwarenwert FROM
          (
            SELECT
              BestellNr,
              kunden.Firma AS Kunde,
              CONCAT(personal.Vorname, " ", personal.Nachname) AS \`Vor- und Nachname des Sachbearbeiters\`,
              BestellDatum,
              lieferanten.Firma AS Lieferant,
              ROUND(Frachtkosten, 2) AS Frachtkosten,
              ROUND(SUM(EinzelPreis * Anzahl * (1 - Rabatt)), 2) AS Gesamtwert
            FROM bestellungen
            JOIN bestelldetails USING (BestellNr)
            JOIN kunden USING(KundenCode)
            JOIN personal USING(PersonalNr)
            JOIN lieferanten ON VersandUeber = lieferanten.LieferantenNr
            GROUP BY (BestellNr)
          ) AS result
        `;

        let self = this;
        return new Promise(function(_resolve, _reject){

            self.databaseConnection.query(sqlQuery, function(_error, _result){
                if (_error) _reject(_error);
                else _resolve(_result);
            });

        });
    }
}

module.exports = WebServer;
