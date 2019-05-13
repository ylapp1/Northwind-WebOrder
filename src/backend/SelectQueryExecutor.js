/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const nunjucks = require("nunjucks");

/**
 * Provides all SELECT queries that can be triggered from the front end.
 *
 * Use executeQuery() to execute one of the queries
 *
 * @property {Connection} databaseConnection The database connection
 * @property {String[]} queries The query templates
 */
class SelectQueryExecutor
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
     * @param {Object} _arguments The arguments to fill the query templates with (optional)
     *
     * @return {Promise} The promise that executes the query
     */
    executeQuery(_queryName, _arguments = {})
    {
        // Fetch the query template
        let queryTemplate = SelectQueryExecutor.queries[_queryName];
        if (typeof queryTemplate === "undefined")
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


// Static list of available SELECT queries
SelectQueryExecutor.queries = {

    // Table contents
    articles: `SELECT
                 \`artikel\`.\`ArtikelNr\` AS \`article_id\`,
                 \`artikel\`.\`Artikelname\` AS \`article_name\`,
                 \`artikel\`.\`Liefereinheit\` AS \`delivery_unit\`,
                 \`artikel\`.\`Einzelpreis\` AS \`unit_price\`
               FROM \`artikel\`
               ORDER BY \`article_name\` ASC;`,

    caseWorkers: `SELECT
                    \`personal\`.\`PersonalNr\` AS \`case_worker_id\`,
                    CONCAT(\`personal\`.\`Vorname\`, ' ', \`personal\`.\`Nachname\`) AS \`case_worker_name\`
                  FROM \`personal\`
                  ORDER BY \`case_worker_name\` ASC;`,

    customers: `SELECT
                  \`kunden\`.\`KundenCode\` AS \`customer_code\`,
                  \`kunden\`.\`Firma\` AS \`customer_name\`
                FROM \`kunden\`
                ORDER BY \`customer_code\` ASC;`,

    orders: `SELECT *, ROUND(\`total_order_items_price\` + \`shipping_costs\`, 2) AS \`total_price\` FROM
             (
               SELECT
                 \`bestellungen\`.\`BestellNr\` AS \`order_id\`,
                 \`kunden\`.\`Firma\` AS \`customer_name\`,
                 CONCAT(\`personal\`.\`Vorname\`, ' ', \`personal\`.\`Nachname\`) AS \`case_worker_name\`,
                 UNIX_TIMESTAMP(\`bestellungen\`.\`Bestelldatum\`) * 1000 AS \`order_date\`,
                 \`versandfirmen\`.\`Firma\` AS \`shipper_name\`,
                 \`bestellungen\`.\`Frachtkosten\` AS \`shipping_costs\`,
                 ROUND(SUM(\`bestelldetails\`.\`EinzelPreis\` * \`bestelldetails\`.\`Anzahl\` * (1 - \`bestelldetails\`.\`Rabatt\`)), 2) AS \`total_order_items_price\`
               FROM \`bestellungen\`
               INNER JOIN \`bestelldetails\` USING(\`BestellNr\`)
               INNER JOIN \`kunden\` USING(\`KundenCode\`)
               INNER JOIN \`personal\` USING(\`PersonalNr\`)
               INNER JOIN \`versandfirmen\` ON \`bestellungen\`.\`VersandUeber\` = \`versandfirmen\`.\`FirmenNr\`
               GROUP BY (\`bestellungen\`.\`BestellNr\`)
             ) AS \`order_summaries\`
             ORDER BY \`order_id\` ASC;`,

    shippers: `SELECT
                  \`versandfirmen\`.\`FirmenNr\` AS \`shipper_id\`,
                  \`versandfirmen\`.\`Firma\` AS \`shipper_name\`
                FROM \`versandfirmen\`
                ORDER BY \`shipper_name\` ASC;`,


    // Database statistics
    dateRange: `SELECT
                  UNIX_TIMESTAMP(MIN(\`bestellungen\`.\`Bestelldatum\`)) * 1000 AS \`minimum_order_date\`,
                  UNIX_TIMESTAMP(MAX(\`bestellungen\`.\`Bestelldatum\`)) * 1000 AS \`maximum_order_date\`
                FROM \`bestellungen\`;`,


    // Dynamic Queries
    orderDetails: `SELECT
                     \`artikel\`.\`ArtikelNr\` AS \`article_id\`,
                     \`artikel\`.\`Artikelname\` AS \`article_name\`,
                     \`bestelldetails\`.\`Anzahl\` AS \`amount\`,
                     \`bestelldetails\`.\`Einzelpreis\` AS \`unit_price\`,
                     \`bestelldetails\`.\`Rabatt\` AS \`discount_percentage\`,
                     ROUND(\`bestelldetails\`.\`Einzelpreis\` * \`bestelldetails\`.\`Anzahl\` * (1 - \`bestelldetails\`.\`Rabatt\`), 2) AS \`total_order_item_price\`
                   FROM \`bestelldetails\`
                   JOIN \`artikel\` USING(\`ArtikelNr\`)
                   WHERE
                     \`bestelldetails\`.\`BestellNr\` = {{ orderId }}
                   ORDER BY \`article_name\` ASC;`
};


module.exports = SelectQueryExecutor;
