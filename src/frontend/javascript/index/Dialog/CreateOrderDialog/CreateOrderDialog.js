/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Dialog for creating new orders.
 *
 * @property {AddArticleDialog} addArticleDialog The AddArticleDialog
 * @property {Order} order The Order
 */
function CreateOrderDialog()
{
    Dialog.call(this, "div#createOrderDialog", {
        resizable: true,
        height: 500,
        width: 700,
        autoOpen: false
    });

    this.addArticleDialog = new AddArticleDialog(this);
    this.order = new Order();
    this.addOrderWasClicked = false;
}

CreateOrderDialog.prototype = Object.create(Dialog.prototype);
CreateOrderDialog.prototype.constructor = CreateOrderDialog;


// Getters and Setters

/**
 * Returns the order of this CreateOrderDialog.
 *
 * @return {Order} The order
 */
CreateOrderDialog.prototype.getOrder = function(){
    return this.order;
};


// Public Methods

/**
 * Initializes the dialog.
 */
CreateOrderDialog.prototype.initialize = function(){

    Dialog.prototype.initialize.call(this);

    this.orderArticlesTable = new OrderArticlesTable(this, $(this.dialogElement).find("table#orderArticlesTable"));
    this.orderArticlesTable.initialize();

    this.addArticleDialog.initialize();
    this.initializeComboBoxes();

    // Initialize event handlers
    var self = this;
    $(this.dialogElement).find("form#createOrderForm").on("submit", this.saveOrder.bind(this));
    $(this.dialogElement).find("button#saveOrderButton").on("click", this.saveOrder.bind(this));

    $(this.dialogElement).on("show.bs.modal", this.onShow.bind(this));
    $(this.dialogElement).on("shown.bs.modal", this.onShown.bind(this));
};

/**
 * Adds OrderArticle's to this dialogs order.
 *
 * @param {Object[]} _selectedArticles The list of selected article data rows
 */
CreateOrderDialog.prototype.addOrderArticles = function(_selectedArticle)
{
    var self = this;
    _selectedArticle.forEach(function(_selectedArticle){
        self.order.addOrderArticle(new OrderArticle(_selectedArticle));
    });

    this.orderArticlesTable.loadData(this.order.getOrderArticles());
    this.render();
};


// Event Handlers

/**
 * Event handler that is called when the dialog is about to be shown.
 */
CreateOrderDialog.prototype.onShow = function(){

    this.order.reset();
    this.addOrderWasClicked = false;
    this.render();

    this.orderArticlesTable.clear();
};

/**
 * Event handler that is called when the dialog rendering is complete.
 */
CreateOrderDialog.prototype.onShown = function(){
    this.orderArticlesTable.redraw();
};


// Private Methods

/**
 * Initializes the combo boxes for the customer, worker and provider selection.
 * @private
 */
CreateOrderDialog.prototype.initializeComboBoxes = function()
{
    var defaultItem = [ { id: "", text: "" } ];

    var self = this;
    var onChangeHandler = function(_event, _orderSetMethodName){
        var selectedValue = $(_event.target).val();
        if (selectedValue === "") selectedValue = null;

        self.order[_orderSetMethodName](selectedValue);
        self.validateOrder();
    };

    // Initialize customer name combo box
    var customerSelect = $(this.dialogElement).find("select#customer");
    dataFetcher.get("customers").then(function(_customers){
        var customers = _customers.map(function(_customer){
            return { id: _customer.customer_code, text: _customer.customer_name };
        });

        $(customerSelect).select2({
            placeholder: "Kunden wählen",
            data: defaultItem.concat(customers)
        });

        $(customerSelect).on("change", function(_event){
            onChangeHandler(_event, "setCustomerId");
        });
    });

    // Initialize the case worker name combo box
    var workerSelect = $(this.dialogElement).find("select#worker");
    dataFetcher.get("case-workers").then(function(_caseWorkers){
        var caseWorkers = _caseWorkers.map(function(_caseWorker){
            return { id: _caseWorker.case_worker_id, text: _caseWorker.case_worker_name };
        });

        $(workerSelect).select2({
            placeholder: "Sachbearbeiter wählen",
            data: defaultItem.concat(caseWorkers)
        });

        $(workerSelect).on("change", function(_event){
            onChangeHandler(_event, "setWorkerId");
        });
    });

    // Initialize the shipper names combo box
    var providerSelect = $(this.dialogElement).find("select#provider");
    dataFetcher.get("shippers").then(function(_shippers){
        var shippers = _shippers.map(function(_shipper){
            return { id: _shipper.shipper_id, text: _shipper.shipper_name };
        });

        $(providerSelect).select2({
            placeholder: "Versandfirma wählen",
            data: defaultItem.concat(shippers)
        });

        $(providerSelect).on("change", function(_event){
            onChangeHandler(_event, "setProviderId");
        });
    });
};

/**
 * Adds the order to the database.
 *
 * @param _event The event that triggered this addOrder call
 * @private
 */
CreateOrderDialog.prototype.saveOrder = function(_event)
{
    // Prevent the form from reloading the page
    _event.preventDefault();

    this.addOrderWasClicked = true;

    var self = this;
    if (this.validateOrder()){
        this.order.save().then(function(_stocksWarnings){

            // Show a message that the order was successfully saved
            Utils.showSuccessMessage("Bestellung erfolgreich eingetragen");

            if (_stocksWarnings.length > 0)
            {
                var stocksWarningsDialog = new StocksWarningsDialog(_stocksWarnings);
                stocksWarningsDialog.initialize();
                stocksWarningsDialog.show();
            }

        }).catch(function(_errorMessage){
            Utils.showErrorMessage(_errorMessage);
        });
    }
};

/**
 * Validates this dialogs order if the "Save order" button was clicked at least once.
 * @private
 */
CreateOrderDialog.prototype.validateOrder = function()
{
    if (! this.addOrderWasClicked) return true;

    var nextErroneousOrderAttribute = this.order.validate();
    if (nextErroneousOrderAttribute !== null)
    {
        this.renderErroneousOrderAttribute(nextErroneousOrderAttribute);
        return false;
    }
    else return true;
};


// Render Methods

/**
 * Renders the dialogs combo boxes and the summary.
 * @private
 */
CreateOrderDialog.prototype.render = function()
{
    // Reset the combo box selections
    $("select#customer").val(this.order.getCustomerId()).trigger("change");
    $("select#worker").val(this.order.getWorkerId()).trigger("change");
    $("select#provider").val(this.order.getProviderId()).trigger("change");

    this.renderSummary();
};

/**
 * Renders the summary of the total discounts and total prices.
 * @private
 */
CreateOrderDialog.prototype.renderSummary = function()
{
    var totalPrice = this.order.calculateTotalPrice();

    var totalArticlesDiscount = this.order.calculateTotalArticleDiscount();
    var effectivePrice = totalPrice - totalArticlesDiscount;

    var effectivePriceText = Utils.formatNumberAsEuros(effectivePrice);
    $(this.dialogElement).find("span#effectivePrice").text(effectivePriceText);
};

/**
 * Renders a errornous order attribute by showing a toast message.
 *
 * @param {Object} _errornousOrderAttribute The errornous order attribute information
 * @private
 */
CreateOrderDialog.prototype.renderErroneousOrderAttribute = function(_erroneousOrderAttribute){

    var errorMessage;

    if (_erroneousOrderAttribute.attributeName === "orderArticle")
    {
        var articleName = _erroneousOrderAttribute.articleName;
        var error = _erroneousOrderAttribute.error;

        errorMessage = "Fehler in Artikel \"" + articleName + "\": " + error.errorMessage;
    }
    else errorMessage = _erroneousOrderAttribute.errorMessage;

    Utils.showErrorMessage(errorMessage);
};
