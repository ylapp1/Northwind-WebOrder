/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const mysql= require("mysql");

/**
 * Validates that order objects contain the necessary attributes and that the attributes are valid.
 *
 * @property {Connection} databaseConnection The database connection
 */
class OrderValidator
{
    /**
     * OrderValidator constructor.
     *
     * @param {Connection} _databaseConnection The database connection
     */
    constructor(_databaseConnection)
    {
        this.databaseConnection = _databaseConnection;
    }


    /*
     * Validates that a order object is valid.
     *
     * @param {Object} _order The order object to validate
     *
     * @return {Promise} The promise that validates that the object is valid
     */
    validate(_order)
    {
        let errorMessage = this.validateStructure(_order);
        if (errorMessage === null) errorMessage = this.validateValueRanges(_order);

        if (errorMessage !== null) return new Promise(function(_resolve, _reject){
            _reject(errorMessage);
        });

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.validateCustomerCode(_order).then(function(){
                self.validateCaseWorkerId(_order).then(function(){
                    self.validateShipperId(_order).then(function(){
                        self.validateOrderArticles(_order).then(function(){
                            _resolve("Order is valid");
                        });
                    });
                });
            });
        });
    }


    // Private Methods

    /*
     * Validates that a order object contains all necessary fields with the correct data type per attribute.
     *
     * @param {Object} _order The order object to validate
     *
     * @return {String|null} An error message or null if the structure of the object is valid
     * @private
     */
    validateStructure(_order)
    {
        // Total order object
        if (typeof _order !== "object") return "The order is not an object";

        // Customer code field
        if (typeof _order.customerCode === "undefined") return "The order contains no customer code field";

        // Case worker id field
        let caseWorkerId = _order.caseWorkerId;
        if (typeof caseWorkerId === "undefined") return "The order contains no case worker id field";
        else if (parseInt(caseWorkerId) + "" !== caseWorkerId) return "The case worker id of the order is not an integer";

        // Shipper id field
        let shipperId = _order.shipperId;
        if (typeof shipperId === "undefined") return "The order contains no shipper id field";
        else if (parseInt(shipperId) + "" !== shipperId) return "The shipper id of the order is not an integer";

        // Order articles field
        let orderArticlesDataType = (typeof _order.orderArticles);
        if (orderArticlesDataType === "undefined") return "The order contains no order articles field";
        else if (orderArticlesDataType !== "object" || ! Array.isArray(_order.orderArticles))
        {
            return "The order articles field of the order is not an array";
        }
        else if (_order.orderArticles.length === 0) return "The order articles array of the order is empty";

        // Order article items
        for (let i = 0; i < _order.orderArticles.length; i++)
        {
            let orderArticle = _order.orderArticles[i];

            // Article id field
            let articleId = orderArticle.articleId;
            if (typeof articleId === "undefined") return "Order article #" + i + " contains no article id field";
            else if (parseInt(articleId) + "" !== articleId) return "The article id of order article #" + i + " is not an integer";

            // Amount field
            let amount = orderArticle.amount;
            if (typeof amount === "undefined") return "Order article #" + i + " contains no amount field";
            else if (parseInt(amount) + "" !== amount) return "The amount of order article #" + i + " is not an integer";

            let discountPercent = orderArticle.discountPercent;
            if (typeof discountPercent === "undefined") return "Order article #" + i + " contains no discount percent field";
            else if (parseFloat(discountPercent) + "" !== discountPercent)
            {
                return "The discount percent of order article #" + i + " is not a float";
            }
        }

        return null;
    }

    /**
     * Validates that all values of the order are in the correct value range.
     *
     * @param {Object} _order The order to validate
     *
     * @return {String|null} The error message or null if all values of the order are in the correct value range
     * @private
     */
    validateValueRanges(_order)
    {
        // Check the order articles
        for (let i = 0; i < _order.orderArticles.length; i++)
        {
            let orderArticle = _order.orderArticles[i];

            if (orderArticle.amount <= 0) return "The amount of order article #" + i + " is invalid";
            else if (orderArticle.discount < 0 || orderArticle.discount > 1)
            {
                return "The discount of order article #" + i + " is invalid";
            }
        }

        return null;
    }

    /**
     * Validates that the customer code of an order object exists in the database.
     *
     * @param {Object} _order The order object
     *
     * @return {Promise} The promise that validates the customer code
     * @private
     */
    validateCustomerCode(_order)
    {
        let customerCodeQuery = `SELECT
                                   \`kunden\`.\`KundenCode\`
                                 FROM \`kunden\`
                                 WHERE \`kunden\`.\`KundenCode\` = ` + mysql.escape(_order.customerCode) + `;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(customerCodeQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    if (_result.length === 0)
                    {
                        _reject("Could not find customer with customer code \"" + _order.customerCode + "\"");
                    }
                    else if (_result.length > 1)
                    {
                        _reject("Found multiple customers with customer code \"" + _order.customerCode + "\"");
                    }
                    else _resolve("Customer code is valid");
                }
            });
        });
    }

    /**
     * Validates that the case worker id of an order object exists in the database.
     *
     * @param {Object} _order The order object
     *
     * @return {Promise} The promise that validates the case worker id
     * @private
     */
    validateCaseWorkerId(_order)
    {
        let caseWorkerIdQuery = `SELECT
                                   \`personal\`.\`PersonalNr\`
                                 FROM \`personal\`
                                 WHERE \`personal\`.\`PersonalNr\` = ` + _order.caseWorkerId + `;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(caseWorkerIdQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    if (_result.length === 0)
                    {
                        _reject("Could not find case worker with case worker id " + _order.caseWorkerId + "\"");
                    }
                    else if (_result.length > 1)
                    {
                        _reject("Found multiple case workers with case worker id \"" + _order.caseWorkerId + "\"");
                    }
                    else _resolve("Case worker id is valid");
                }
            });
        });
    }

    /**
     * Validates that the shipper id of an order object exists in the database.
     *
     * @param {Object} _order The order object
     *
     * @return {Promise} The promise that validates the shipper id
     * @private
     */
    validateShipperId(_order)
    {
        let shipperIdQuery = `SELECT
                                \`versandfirmen\`.\`FirmenNr\`
                              FROM \`versandfirmen\`
                              WHERE \`versandfirmen\`.\`FirmenNr\` = ` + _order.shipperId + `;`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(shipperIdQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    if (_result.length === 0)
                    {
                        _reject("Could not find shipper with shipper id " + _order.shipperId + "\"");
                    }
                    else if (_result.length > 1)
                    {
                        _reject("Found multiple shippers with shipper id \"" + _order.shipperId + "\"");
                    }
                    else _resolve("Shipper id is valid");
                }
            });
        });
    }

    /**
     * Validates that the order articles of an order object exist in the database.
     *
     * @param {Object} _order The order object
     *
     * @return {Promise} The promise that validates the order articles
     * @private
     */
    validateOrderArticles(_order)
    {
        let articleIds = _order.orderArticles.map(function(_orderArticle){
            return parseInt(_orderArticle.articleId);
        });

        let articleIdsQuery = `SELECT
                                 \`artikel\`.\`ArtikelNr\` AS \`article_id\`
                               FROM \`artikel\`
                               WHERE \`artikel\`.\`ArtikelNr\` IN (` + articleIds.join(",") + `);`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(articleIdsQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    let resultArticleIds = _result.map(function(_article){
                        return _article.article_id;
                    });

                    let missingArticleIds = articleIds.filter(function(_articleId){
                        return ! resultArticleIds.includes(_articleId);
                    });

                    if (missingArticleIds.length > 0)
                    {
                        _reject("Could not find the articles with the id(s) " + missingArticleIds.join(","));
                    }
                    else _resolve("Order articles are valid");
                }
            });
        });
    }
}

module.exports = OrderValidator;
