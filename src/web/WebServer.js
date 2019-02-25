
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
        this.express.get("/customers", this.customersResponse.bind(this));
        this.express.get("/workers", this.workersResponse.bind(this));
        this.express.get("/providers", this.providersResponse.bind(this));
        this.express.get("/dateRange", this.dateRangeResponse.bind(this));
        this.express.get("/orderDetails", this.orderDetailsResponse.bind(this));

        // Static paths
        this.express.use("/css", express.static(__dirname + "/resources/pages"));
        this.express.use("/javascript", express.static(__dirname + "/resources/pages"));
        this.express.use("/jquery", express.static(__dirname + "/../../node_modules/jquery/dist"));
        this.express.use("/jquery-ui", express.static(__dirname + "/../../node_modules/jquery-ui-dist"));
        this.express.use("/flatpickr", express.static(__dirname + "/../../node_modules/flatpickr/dist"));
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

    /**
     * Responds to a request with the result of a query
     *
     * @param _request The request
     * @param _response The response
     * @param String _query The query to execute
     */
    queryResponse(_request, _response, _query)
    {
        this.databaseConnection.query(_query, function(_error, _result){
            if (! _error) _response.json(_result);
        });
    }

    /**
     * Responds to a request to the "/orders" route.
     *
     * @param _request The request
     * @param _response The response
     */
    ordersResponse(_request, _response)
    {
        // This query was the initial task
        //let sqlQuery = "SELECT * FROM artikel";

        this.queryResponse(
            _request,
            _response,
            `SELECT *, (Gesamtwert + Frachtkosten) AS Gesamtwarenwert FROM
             (
               SELECT
                 BestellNr,
                 kunden.Firma AS Kunde,
                 CONCAT(personal.Vorname, " ", personal.Nachname) AS \`Vor- und Nachname des Sachbearbeiters\`,
                 DATE_FORMAT(BestellDatum, "%Y-%m-%d") AS BestellDatum,
                 lieferanten.Firma AS Lieferant,
                 ROUND(Frachtkosten, 2) AS Frachtkosten,
                 ROUND(SUM(EinzelPreis * Anzahl * (1 - Rabatt)), 2) AS Gesamtwert
               FROM bestellungen
               JOIN bestelldetails USING (BestellNr)
               JOIN kunden USING(KundenCode)
               JOIN personal USING(PersonalNr)
               JOIN lieferanten ON VersandUeber = lieferanten.LieferantenNr
               GROUP BY (BestellNr)
             ) AS result;
           `);
    }

    /**
     * Responds to a request to the "/customers" route.
     *
     * @param _request The request
     * @param _response The response
     */
    customersResponse(_request, _response)
    {
        this.queryResponse(
            _request,
            _response,
            `SELECT
               Kunden.Firma AS Kunde
             FROM Kunden
             ORDER BY Kunde ASC;`
        );
    }

    /**
     * Responds to a request to the "/workers" route.
     *
     * @param _request The request
     * @param _response The response
     */
    workersResponse(_request, _response)
    {
        this.queryResponse(
            _request,
            _response,
            `SELECT
               CONCAT(personal.Vorname, ' ', personal.Nachname) AS Sachbearbeiter
             FROM Personal
             ORDER BY Sachbearbeiter ASC;
            `
        );
    }

    /**
     * Responds to a request to the "/providers" route.
     *
     * @param _request The request
     * @param _response The response
     */
    providersResponse(_request, _response)
    {
        this.queryResponse(
            _request,
            _response,
            `SELECT
               lieferanten.Firma AS Lieferant
             FROM Lieferanten
             ORDER BY Lieferant ASC;`
        );
    }

    /**
     * Responds to a request to the "/dateRange" route.
     *
     * @param _request The request
     * @param _response The response
     */
    dateRangeResponse(_request, _response)
    {
        this.queryResponse(
            _request,
            _response,
            `SELECT
               DATE_FORMAT(MIN(BestellDatum), "%Y-%m-%d") AS MinBestellDatum,
               DATE_FORMAT(MAX(BestellDatum), "%Y-%m-%d") AS MaxBestellDatum
             FROM Bestellungen;
            `
        );
    }

    /**
     * Responds to a request to the "/orderDetails" route.
     *
     * @param _request The request
     * @param _response The response
     */
    orderDetailsResponse(_request, _response)
    {
        let orderId = _request.query.orderId;

        if (orderId)
        {
            this.queryResponse(
                _request,
                _response,
                `SELECT
                   Artikelname,
                   Anzahl,
                   bestelldetails.Einzelpreis AS Einzelpreis,
                   Rabatt,
                   ROUND(bestelldetails.Einzelpreis * Anzahl * (1 - Rabatt), 2) AS Gesamtpreis
                 FROM bestelldetails
                   JOIN Artikel USING(ArtikelNr)
                 WHERE
                   BestellNr = ` + orderId + ";"
            );
        }
        else _response.status(400).send("Could not fetch order details: No order id specified");
    }
}

module.exports = WebServer;
