/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const nunjucks = require("nunjucks");

/**
 * Provides all queries that can be triggered from the front end.
 *
 * Use executeQuery() to execute one of the queries
 *
 * @property {Connection} databaseConnection The database connection
 * @property {String[]} queries The query templates
 */
class DatabaseQueryExecutor
{
    /**
     * DatabaseQueryExecutor constructor.
     *
     * @param {Connection} _databaseConnection The database connection
     */
    constructor(_databaseConnection)
    {
        this.databaseConnection = _databaseConnection;
    }

    /**
     * Executes one of the defined queries.
     *
     * @param {String} _queryName The query template name
     * @param {Object} _arguments The arguments to fill the query templates with
     *
     * @return {Promise} The promise that executes the query
     */
    executeQuery(_queryName, _arguments = {})
    {
        // Fetch the query template
        let queryTemplate = DatabaseQueryExecutor.queries[_queryName];
        if (! queryTemplate)
        {
            return new Promise(function(_resolve, _reject){
                _reject("Could not find a query with the name " + _queryName);
            });
        }

        // Render the query template
        let queryString = nunjucks.renderString(queryTemplate, _arguments);

        // Execute the query and return the result with a promise
        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(queryString, function(_error, _result){
                if (_error) _reject(_error);
                else _resolve(_result);
            });
        });
    }
}


// Static list of available queries
DatabaseQueryExecutor.queries = {

  // Table contents
  articles: `SELECT
               ArtikelNr,
               ArtikelName,
               Liefereinheit,
               Einzelpreis
             FROM artikel;`,

  customers: `SELECT
                Kunden.KundenCode AS customerCode,
                Kunden.Firma AS name
              FROM Kunden
              ORDER BY customerCode ASC;`,

  orders: `SELECT *, (Gesamtwert + Frachtkosten) AS Gesamtwarenwert FROM
           (
             SELECT
               BestellNr,
               kunden.Firma AS Kunde,
               CONCAT(personal.Vorname, " ", personal.Nachname) AS \`workerName\`,
               (UNIX_TIMESTAMP(BestellDatum) + 2 * 60 * 60) * 1000 AS BestellDatum,
               versandfirmen.Firma AS shipperName,
               ROUND(Frachtkosten, 2) AS Frachtkosten,
               ROUND(SUM(EinzelPreis * Anzahl * (1 - Rabatt)), 2) AS Gesamtwert
             FROM bestellungen
             INNER JOIN bestelldetails USING (BestellNr)
             INNER JOIN kunden USING(KundenCode)
             INNER JOIN personal USING(PersonalNr)
             INNER JOIN versandfirmen ON VersandUeber = versandfirmen.FirmenNr
             GROUP BY (BestellNr)
           ) AS result;`,

  shippers: `SELECT
                FirmenNr AS id,
                Firma AS shipperName
              FROM versandfirmen
              ORDER BY shipperName ASC;`,

  workers: `SELECT
              personal.PersonalNr AS id,
              CONCAT(personal.Vorname, ' ', personal.Nachname) AS Sachbearbeiter
            FROM Personal
            ORDER BY Sachbearbeiter ASC;`,


  // Database statistics
  dateRange: `SELECT
                DATE_FORMAT(MIN(BestellDatum), "%Y-%m-%d") AS MinBestellDatum,
                DATE_FORMAT(MAX(BestellDatum), "%Y-%m-%d") AS MaxBestellDatum
              FROM Bestellungen;`,


  // Dynamic Queries
  orderDetails:  `SELECT
                    ArtikelNr,
                    Artikelname AS article_name,
                    Anzahl AS amount,
                    bestelldetails.Einzelpreis AS unit_price,
                    Rabatt AS discount,
                    ROUND(bestelldetails.Einzelpreis * Anzahl * (1 - Rabatt), 2) AS total_price
                  FROM bestelldetails
                  JOIN Artikel USING(ArtikelNr)
                  WHERE
                    BestellNr = {{ orderId }};`
    // TODO: This should not calculate the total_price, frontend should do that
};


module.exports = DatabaseQueryExecutor;
