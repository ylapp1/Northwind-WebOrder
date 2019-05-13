/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

const SelectQueryExecutor = require(__dirname + "/SelectQueryExecutor.js");
const OrderCreator = require(__dirname + "/OrderCreator/OrderCreator.js");
const express = require("express");
const bodyParser = require("body-parser");
const nunjucks = require("nunjucks");

/**
 * Provides html contents for several routes.
 * Also provides json results for queries.
 *
 * @property {DatabaseQueryExecutor} databaseQueryExecutor The database query executor
 * @property {express} express The express instance
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
        this.selectQueryExecutor = new SelectQueryExecutor(_databaseConnection);
        this.orderCreator = new OrderCreator(_databaseConnection);
    }


    // Public Methods

    /**
     * Initializes the web server.
     */
    initialize()
    {
        // Initialize the web server
        this.express = express();
        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());

        this.initializeRoutes();
        this.express.listen(8080);

        nunjucks.configure(__dirname + "/../frontend/templates", {
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
        this.express.get("/", function(_request, _response){
            _response.render("index/index.njk");
        });

        // Static paths
        this.express.use("/css", express.static(__dirname + "/../frontend/css"));
        this.express.use("/javascript", express.static(__dirname + "/../frontend/javascript"));

        // External libraries
        this.express.use("/bootstrap", express.static(__dirname + "/../../node_modules/bootstrap/dist"));
        this.express.use("/bootstrap-table", express.static(__dirname + "/../../node_modules/bootstrap-table/dist"));
        this.express.use("/deep-eql", express.static(__dirname + "/../../node_modules/deep-eql"));
        this.express.use("/flatpickr", express.static(__dirname + "/../../node_modules/flatpickr/dist"));
        this.express.use("/font-awesome", express.static(__dirname + "/../../node_modules/@fortawesome/fontawesome-free"));
        this.express.use("/jspdf", express.static(__dirname + "/../../node_modules/jspdf/dist"));
        this.express.use("/jspdf-autotable", express.static(__dirname + "/../../node_modules/jspdf-autotable/dist"));
        this.express.use("/native-toast", express.static(__dirname + "/../../node_modules/native-toast/dist"));
        this.express.use("/jquery", express.static(__dirname + "/../../node_modules/jquery/dist"));
        this.express.use("/jquery-ui", express.static(__dirname + "/../../node_modules/jquery-ui-dist"));
        this.express.use("/popper-js", express.static(__dirname + "/../../node_modules/popper.js/dist/umd"));
        this.express.use("/select2", express.static(__dirname + "/../../node_modules/select2/dist"));

        this.initializeQueryResponses();
        this.express.post("/createOrder", this.createOrderResponse.bind(this));
    }

    /**
     * Initializes the query response routes.
     */
    initializeQueryResponses()
    {
        let self = this;
        this.express.get("/orders", function(_request, _response){
            self.queryResponse(_request, _response, "orders");
        });

        this.express.get("/customers", function(_request, _response){
            self.queryResponse(_request, _response, "customers");
        });

        this.express.get("/case-workers", function(_request, _response){
            self.queryResponse(_request, _response, "caseWorkers");
        });

        this.express.get("/shippers", function(_request, _response){
            self.queryResponse(_request, _response, "shippers");
        });

        this.express.get("/date-range", function(_request, _response){
            self.queryResponse(_request, _response, "dateRange");
        });

        this.express.get("/order-details", function(_request, _response){
            let orderId = _request.query.orderId;
            if (orderId)
            {
                self.queryResponse(_request, _response, "orderDetails", { orderId: parseInt(orderId) });
            }
            else _response.status(400).send("Could not fetch order details: No order id specified");
        });

        this.express.get("/articles", function(_request, _response){
            self.queryResponse(_request, _response, "articles");
        });
    }

    /**
     * Responds to a request with the result of a query.
     *
     * @param {http.IncomingMessage} _request The request from the user
     * @param {http.ServerResponse} _response The object that can be used to respond to the request
     * @param {String} _queryName The query template to execute
     * @param {Object} _arguments The query template arguments
     */
    queryResponse(_request, _response, _queryName, _arguments)
    {
        this.selectQueryExecutor.executeQuery(_queryName, _arguments).then(function(_result){
            _response.json(_result);
        });
    }

    /**
     * Responds to the "/createOrder" route.
     */
    createOrderResponse(_request, _response)
    {
        let order = _request.body.order;
        this.orderCreator.createOrder(order).then(function(_stocksWarnings){
            _response.send({ success: true, stocksWarnings: _stocksWarnings });
        }).catch(function(_errorMessage){
            _response.send({ success: false, errorMessage: _errorMessage });
        });
    }
}

module.exports = WebServer;
