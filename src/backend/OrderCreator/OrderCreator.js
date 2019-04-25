/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const OrderValidator = require(__dirname + "/OrderValidator.js");

/**
 * Handles validating and inserting of new orders into the database.
 *
 * The order objects must be in this format:
 * {
 *   customerCode: string,
 *   caseWorkerId: int,
 *   shipperId: int,
 *   orderArticles: Object[]
 * }
 *
 * Each order article must be in this format:
 * {
 *   articleId: int,
 *   amount: int,
 *   discountPercent: float
 * }
 *
 *
 * @property {Connection} databaseConnection The database connection
 * @property {OrderValidator} orderValidator The order validator
 */
class OrderCreator
{
    /**
     * OrderCreator constructor.
     *
     * @param {Connection} _databaseConnection The database connection
     */
    constructor(_databaseConnection)
    {
        this.databaseConnection = _databaseConnection;
        this.orderValidator = new OrderValidator(_databaseConnection);
    }


    /**
     * Adds a order to the database.
     *
     * @param {Object} _order The order object that shall be inserted into the database
     *
     * @return {Promise} The promise that inserts the order into the database
     */
    createOrder(_order)
    {
        let self = this;
        return new Promise(function(_resolve, _reject){
            self.orderValidator.validate(_order).then(function(){
                self.saveOrder(_order).then(function(_stocksWarnings){
                    _resolve(_stocksWarnings);
                });
            });
        });
    }


    // Private Methods

    /**
     * Fetches the necessary values from the database and inserts the order into the database.
     *
     * @param {Object} _order The order object that shall be inserted into the database
     *
     * @return {Promise} The promise that inserts the order into the database
     * @private
     */
    saveOrder(_order)
    {
        let self = this;
        return new Promise(function(_resolve, _reject){
            self.getNewOrderId().then(function(_newOrderId){

                self.databaseConnection.beginTransaction(function(){

                    self.insertOrderIntoOrdersTable(_newOrderId, _order).then(function(){
                        self.saveOrderArticles(_newOrderId, _order).then(function(_stockWarnings){

                            self.databaseConnection.commit(function(_error){
                                if (_error) _reject(_error);
                                _resolve(_stockWarnings);
                            });

                        });
                    }).catch(function(_error){
                        self.databaseConnection.rollback(function(){
                            _reject(_error);
                        });
                    });

                });
            });
        });
    }

    /**
     * Returns a new unused order id for a order.
     *
     * @return {Promise} The promise that returns a new unused order id for a order
     * @private
     */
    getNewOrderId()
    {
        let maximumOrderIdQuery = `SELECT
                                     MAX(\`bestellungen\`.\`BestellNr\`) AS \`maximum_order_id\`
                                   FROM \`bestellungen\`;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(maximumOrderIdQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    if (_result.length === 0)
                    { // There are no entries yet, start with the order id 1
                        _resolve(1);
                    }
                    else _resolve(_result[0].maximum_order_id + 1);
                }
            });
        });
    }

    /**
     * Inserts a order into the "bestellungen" table.
     *
     * @param {int} _newOrderId The id for the new order
     * @param {Object} _order The order object that shall be inserted into the database
     *
     * @return {Promise} The promise that inserts the order into the "bestellungen" table
     * @private
     */
    insertOrderIntoOrdersTable(_newOrderId, _order)
    {
        let insertOrderQuery = `INSERT INTO \`bestellungen\`
                                (?)
                                VALUES (?);`;

        let columnNames = [ "BestellNr", "KundenCode", "PersonalNr", "Bestelldatum", "Lieferdatum", "Versanddatum",
                            "Versandueber", "Frachtkosten", "Empfaenger", "Strasse", "Ort", "Region", "PLZ",
                            "Bestimmungsland"
                          ];
        let columnValues = [ _newOrderId, mysql.escape(_order.customerCode), _order.caseWorkerId, "NOW()", "NOW()", "NOW()",
                             _order.shipperId, 1.5, "Max Mustermann", "Musterstrasse 2", "Musterhausen", "Musterregion", "1111",
                             "Musterland"
                           ];

        var self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(insertOrderQuery, [ columnNames, columnValues ], function(_error, _result){
                if (_error) _reject(_error);
                else  _resolve("Added order to \"bestellungen\" table");
            });
        });
    }


    /**
     * Inserts the order articles of a order into the "bestelldetails" table.
     * Also updates the articles stocks value.
     *
     * @param {int} _orderId The id of the order in the "orders" table
     * @param {Object} _order The order object that shall be inserted into the database
     *
     * @return {Promise} The promise that inserts the order articles of the order into the "bestelldetails" table
     * @private
     */
    saveOrderArticles(_orderId, _order)
    {
        let articlesDataQuery = `SELECT
                                   \`artikel\`.\`Einzelpreis\` AS \`unit_price\`,
                                   \`artikel\`.\`Lagerbestand\` AS \`stock\`
                                   \`artikel\`.\`Mindestbestand\` AS \`minimum_stock\`
                                 FROM \`artikel\`
                                 ORDER BY \`artikel\`.\`ArtikelNr\` ASC;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(articlesDataQuery, function(_error, _result){

                let sortedOrderArticles = _order.orderArticles.sort(function(_orderArticleA, _orderArticleB){
                    return _orderArticleA.articleId > _orderArticleB.articleId;
                });

                let stockWarnings = [];
                for (let i = 0, promise = Promise.resolve(); i < _order.orderArticles.length; i++)
                {
                    let orderArticle = _order.orderArticles[i];
                    let newStock = _result[i].stock - orderArticle.amount;

                    if (newStock < _result[i].minimum_stock)
                    {
                        stockWarnings.push({
                            articleName: _orderArticle.articleId,
                            newStock: newStock,
                            minimumStock: _minimumStock
                        });
                    }

                    promise = promise.then(function(){
                        self.insertOrderArticleIntoOrderDetailsTable(_orderId, _order.orderArticles[i], _result[i].unit_price).then(function(){
                            self.updateOrderArticleStock(orderArticle.articleId, newStock);
                        });
                    });
                }

                _resolve(stockWarnings);
            });
        });
    }

    /**
     * Inserts a order article into the "bestelldetails" table.
     *
     * @param {int} _orderId The id of the order
     * @param {Object} _orderArticle The order article to insert
     * @param {float} _unitPrice The unit price per article
     *
     * @return {Promise} The promise that inserts the order article into the "bestelldetails" table
     * @private
     */
    insertOrderArticleIntoOrderDetailsTable(_orderId, _orderArticle, _unitPrice)
    {
        let insertOrderArticleQuery = `INSERT INTO \`bestelldetails\`
                                       (?)
                                       VALUES(?);`;
        let columnNames = [ "BestellNr", "ArtikelNr", "Einzelpreis", "Anzahl", "Rabatt"];
        let columnValues = [ _orderId, _orderArticle.articleId, _unitPrice, _orderArticle.amount, _orderArticle.discount ];

        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(insertOrderArticleQuery, [ columnNames, columnValues ], function(_error, _result){
                if (_error) _reject(_error);
                else _resolve("Added order article to \"bestelldetails\" table");
            });
        });
    }

    /**
     * Updates the remaining stocks of a article in the "artikel" table.
     *
     * @param {int} _articleId The article id
     * @param {int} _newStock The new stock
     *
     * @return {Promise} The promise that updates the remaining stocks of the article in the "artikel" table
     * @private
     */
    updateOrderArticleStock(_articleId, _newStock)
    {
        let updateArticleStockQuery = `UPDATE \`artikel\`
                                       SET \`artikel\`.\`Lagerbestand\` = ` + _newStock + `
                                       WHERE \`artikel\`.\`ArtikelNr\` = ` + _articleId + `;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(updateArticleStockQuery, function(_error, _result){
                if (_error) _reject(_error);
                else _resolve("Updated article stock for article " + _articleId);
            });
        });
    }
}

module.exports = OrderCreator;
