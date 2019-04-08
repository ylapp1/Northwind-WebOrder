
const mysql = require("mysql");

class OrderCreator
{
    constructor(_databaseConnection)
    {
        this.databaseConnection = _databaseConnection;
    }

    /**
     * Tries to create a order in the database.
     */
    createOrder(_order)
    {
        let error = this.validateOrder(_order);
        if (error !== null) return new Promise(function(_resolve, _reject){
            _reject(error);
        });
        else return this.saveOrder(_order);
    }

    /**
     * Checks a order for everything that can be checked without using database queries.
     */
    validateOrder(_order)
    {
        // Check the order articles
        if (! Array.isArray(_order.orderArticles) || _order.orderArticles.length === 0) return "Bestellung enthält keine Artikel";

        if (Number.isNaN(_order.additionalDiscount) || _order.additionalDiscount < 0)
        {
            return "Zusatzrabtt der Bestellung ist ungültig";
        }


        let orderArticle;
        for (let i = 0; i < _order.orderArticles.length; i++)
        {
            orderArticle = _order.orderArticles[i];

            let articleId = (orderArticle.articleId);
            if (parseInt(articleId) + "" !== articleId)
            {
                return "Ein Bestellartikel hat eine ungültige ID";
            }

            let articleAmount = orderArticle.amount;
            if (parseInt(articleAmount) + "" !== articleAmount || parseInt(articleAmount) <= 0)
            {
                return "Ein Bestellartikel hat eine ungültige Anzahl";
            }
            else if (Number.isNaN(orderArticle.discount) || parseFloat(orderArticle.discount) < 0)
            {
                return "Ein Bestellartikel hat einen ungültigen Rabatt";
            }
        }

        return null;
    }

    /**
     * Fetches the necessary values from the database and inserts the new order.
     */
    saveOrder(_order)
    {
        let self = this;

        return new Promise(function(_resolve, _reject){
            self.getArticleIdsFromOrder(_order).then(function(_articleData){
                self.getCustomerCodeFromOrder(_order).then(function(_customerCode){
                    self.getWorkerIdFromOrder(_order).then(function(_workerId){
                        self.getProviderIdFromOrder(_order).then(function(_providerId){
                            self.getNewOrderId().then(function(_newOrderId){

                                self.insertOrder(_newOrderId, _order, _customerCode, _workerId, _providerId, _articleData.articleData);
                                _resolve(_articleData.stocksWarnings);

                            });
                        });
                    });
                });
            });
        });
}

    /**
     * Inserts a order into the "bestellungen" table and its articles into the "bestelldetails" table.
     */
    insertOrder(_newOrderId, _order, _customerCode, _workerId, _shipperId, _articleData)
    {
        let insertOrderQuery = `INSERT INTO Bestellungen
                                                    (
BestellNr,
                       KundenCode,
PersonalNr,
Bestelldatum,
 Lieferdatum,
Versanddatum,
Versandueber,
Frachtkosten,
Empfaenger,
Strasse,
Ort,
Region,
PLZ,
Bestimmungsland
)
VALUES(
  ` + _newOrderId + `,
  "` + _customerCode + `",
  ` + _workerId + `,
  NOW(),
  NOW(),
  NOW(),
  ` + _shipperId + `,
  1.5,
  "Max Mustermann",
  "Musterstrasse 2",
  "Musterhausen",
  "Musterregion",
  "1111",
  "Musterland"
);
`;

        var self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(insertOrderQuery, function(_error, _result){

                if (_error) _reject(_error);
                else
                {
                    self.insertOrderArticles(_newOrderId, _order, _articleData).then(function(){
                        self.updateRemainingStocks(_order, _articleData).then(function(){
                            _resolve("Bestellung eingetragen");
                        });
                    });
                }
            });
        });
    }

    /**
     * Inserts the order articles for a order.
     */
    insertOrderArticles(_orderId, _order, _articleData)
    {
        let sortArticlesByArtikelNrAsc = function(_articleA, _articleB){
            return _articleA.ArtikelNr > _articleB.ArtikelNr;
        };

        let sortedArticles = _order.orderArticles.sort(function(_articleA, _articleB){
            return _articleA.article.ArtikelNr > _articleB.article.ArtikelNr;
        });
        let sortedArticleData = _articleData.sort(sortArticlesByArtikelNrAsc);

        let insertOrderArticleQueries = "";
        for (let i = 0; i < sortedArticles.length; i++)
        {
            let insertOrderArticleQuery = `INSERT INTO bestelldetails
(
BestellNr,
ArtikelNr,
Einzelpreis,
Anzahl,
Rabatt
)
VALUES(
` + _orderId + `,
` + sortedArticleData[i].ArtikelNr + `,
` + sortedArticleData[i].Einzelpreis + `,
` + sortedArticles[i].amount + `,
` + sortedArticles[i].discount + `
);`;
            insertOrderArticleQueries += insertOrderArticleQuery;
        }

        var self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(insertOrderArticleQueries, function(_error, _result){
                if (_error) _reject(_error);
                else _resolve("Bestellung eingetragen");
            });
        });
    }

    /**
     * Updates the remaining stocks of all order articles.
     */
    updateRemainingStocks(_order, _articleData)
    {
        let sortArticlesByArtikelNrAsc = function(_articleA, _articleB){
            return _articleA.ArtikelNr > _articleB.ArtikelNr;
        };

        let sortedArticles = _order.orderArticles.sort(function(_articleA, _articleB){
            return _articleA.article.ArtikelNr > _articleB.article.ArtikelNr;
        });
        let sortedArticleData = _articleData.sort(sortArticlesByArtikelNrAsc);

        let updateArticleStocksQueries = "";
        for (let i = 0; i < sortedArticles.length; i++)
        {
            let newStocksAmount = sortedArticles[i].amount - sortedArticles[i].amount;

            let updateArticleStocksQuery = `UPDATE Artikel
SET Lagerbestand = ` + newStocksAmount + `
WHERE ArtikelNr = ` + sortedArticles[i].ArtikelNr + `;`;

            updateArticleStocksQueries += updateArticleStocksQuery;
        }

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(updateArticleStocksQueries, function(_result, _error){
                if (_error) _reject(_error);
                else _resolve("Bestellung eingetragen");
            });
        });
    }

    /**
     * Returns the customer code from a order.
     */
    getCustomerCodeFromOrder(_order)
    {
        if (_order.customerCode === null) return new Promise(function(_resolve, _reject){
            _reject("Bestellung enthält keinen Kunden");
        });
        else
        {
            let customerCodeQuery = `SELECT KundenCode
                                     FROM kunden
                                     WHERE KundenCode = ` + mysql.escape(_order.customerCode) + `;`;

            let self = this;
            return new Promise(function(_resolve, _reject){
                self.databaseConnection.query(customerCodeQuery, function(_error, _result){
                    if (_error) _reject(_error);
                    else
                    {
                        if (_result.length === 1) _resolve(_result[0].KundenCode);
                        else _reject("KundenCode nicht gefunden");
                    }
                });
            });
        }
    }

    /**
     * Returns the worker id from a order.
     */
    getWorkerIdFromOrder(_order)
    {
        if (Number.isInteger(_order.workerId)) return new Promise(function(_resolve, _reject){
            _reject("Bestellung enthält keinen Sachbearbeiter");
        });
        else
        {
            let workerIdQuery = `SELECT PersonalNr
                                 FROM personal
                                 WHERE PersonalNr = "` + _order.workerId + `";`;

            let self = this;
            return new Promise(function(_resolve, _reject){
                self.databaseConnection.query(workerIdQuery, function(_error, _result){
                    if (_error) _reject(_error);
                    else
                    {
                        if (_result.length === 1) _resolve(_result[0].PersonalNr);
                        else _reject("Sachbearbeiter nicht gefunden");
                    }
                });
            });
        }
    }

    /**
     * Returns the id of a shipper from a order.
     */
    getProviderIdFromOrder(_order)
    {
        if (_order.providerId == null) return new Promise(function(_resolve, _reject){
            _reject("Bestellung enthält keinen Lieferanten");
        });
        else
        {
            let providerId = parseInt(_order.providerId);
            let providerIdQuery = `SELECT FirmenNr
                                 FROM versandfirmen
                                 WHERE FirmenNr = ` + providerId + `;`;

            let self = this;
            return new Promise(function(_resolve, _reject){
                self.databaseConnection.query(providerIdQuery, function(_error, _result){
                    if (_error) _reject(_error);
                    else
                    {
                        if (_result.length === 1) _resolve(_result[0].FirmenNr);
                        else _reject("Lieferant nicht gefunden");
                    }
                });
            });
        }
    }

    /**
     * Returns the article ids from a order.
     */
    getArticleIdsFromOrder(_order)
    {
        let articleIds = _order.orderArticles.map(function(_article){
            return parseInt(_article.articleId);
        });

        let articleIdsQuery = `SELECT ArtikelNr, Artikelname, Einzelpreis, Lagerbestand, Mindestbestand
                               FROM artikel
                               WHERE ArtikelNr IN (` + articleIds.join(",") + `);`;

        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(articleIdsQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    let resultArticleIds = _result.map(function(_article){
                        return _article.ArtikelNr;
                    });

                    let missingArticleIds = articleIds.filter(function(_articleId){
                        return ! resultArticleIds.includes(_articleId);
                    });

                    let sortedOrderArticles = _order.orderArticles.sort(function(_orderArticleA, _orderArticleB){
                        return (_orderArticleA.articleId > _orderArticleB.articleId);
                    });

                    if (missingArticleIds.length > 0) _reject("Einige Artikelnummern konnten nicht gefunden werden");
                    else
                    {
                        // Validate the discounts
                        let totalPrice = 0;
                        let totalArticleDiscount = 0;

                        for (let i = 0; i < _result.length; i++)
                        {
                            let resultRow = _result[i];
                            let orderArticlePrice = resultRow.Einzelpreis;

                            if (sortedOrderArticles[i].amount * orderArticlePrice - sortedOrderArticles[i].discount < 0)
                            {
                                _reject("Ein Bestellartikel hat einen ungültigen Rabatt");
                            }

                            totalPrice += orderArticlePrice;
                            totalArticleDiscount += sortedOrderArticles[i].discount;
                        }

                        if (totalPrice - totalArticleDiscount - _order.additionalDiscount < 0)
                        {
                            _reject("Der Gesamtrabatt der Bestellung ist ungültig");
                        }

                        let stocksWarnings = self.checkMinimumStocks(_order, _result);
                        _resolve({
                            articleData: _result,
                            stocksWarnings: stocksWarnings
                        });
                    }
                }
            });
        });
    }

    /**
     * Returns a new unused order id for a order.
     */
    getNewOrderId()
    {
        let maximumOrderIdQuery = `SELECT MAX(BestellNr) AS maxId FROM bestellungen;`;
        let self = this;
        return new Promise(function(_resolve, _reject){
            self.databaseConnection.query(maximumOrderIdQuery, function(_error, _result){
                if (_error) _reject(_error);
                else
                {
                    if (_result.length === 0){
                        _resolve(0);
                    }
                    else _resolve(_result[0].maxId + 1);
                }
            });
        });
    }

    /**
     * Returns minimum stocks warnings.
     */
    checkMinimumStocks(_order, _articleData)
    {
        let stocksWarnings = [];

        let sortedArticles = _order.orderArticles.sort(function(_orderArticleA, _orderArticleB){
            return _orderArticleA.articleId > _orderArticleB.articleId;
        });
        let sortedArticleData = _articleData.sort(function(_articleA, _articleB){
            return _articleA.ArtikelNr > _articleB.ArtikelNr;
        });

        for (let i = 0; i < sortedArticles.length; i++)
        {
            let amount = sortedArticles[i].amount;

            if (sortedArticleData[i].Lagerbestand - sortedArticles[i].amount < sortedArticleData[i].Mindestbestand)
            {
                stocksWarnings.push("Lagerbestand für Artikel " + sortedArticleData[i].Artikelname + " zu niedrig für Bestellung (Lagerbestand: " + sortedArticleData[i].Lagerbestand + ", Mindestbestand: " + sortedArticleData[i].Mindestbestand);
            }
        }

        return stocksWarnings;
    }
}

module.exports = OrderCreator;
