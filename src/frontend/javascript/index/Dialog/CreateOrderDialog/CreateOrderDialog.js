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


/**
 * Initializes the dialog.
 */
CreateOrderDialog.prototype.initialize = function(){

    Dialog.prototype.initialize.call(this);

    this.orderArticlesTable = $(this.dialogElement).find("table#orderArticlesTable");
    this.initializeOrderArticlesTable();

    this.addArticleDialog.initialize();
    this.initializeComboBoxes();

    // Initialize event handlers
    var self = this;
    $(this.dialogElement).find("form#createOrderForm").on("submit", this.saveOrder.bind(this));

    $(this.dialogElement).on("show.bs.modal", this.onShow.bind(this));
    $(this.dialogElement).on("shown.bs.modal", this.onShown.bind(this));
    $(this.dialogElement).find("button#saveOrderButton").on("click", this.saveOrder.bind(this));
};

CreateOrderDialog.prototype.initializeOrderArticlesTable = function(){

    var self = this;
    $(this.orderArticlesTable).bootstrapTable({

        showFooter: true,

        height: 200,
        data: [],

        formatNoMatches: function(){
            return "Bestellung enthält keine Artikel";
        },

        sortName: "article.ArtikelName",
        uniqueId: "article.ArtikelNr",

        columns: [{
            field: "article.ArtikelName",
            title: "Artikelname",
            footerFormatter: function(){
                return "Gesamt";
            }
        }, {
            field: "article.Liefereinheit",
            title: "Liefereinheit"
        }, {
            field: "article.Einzelpreis",
            title: "Einzelpreis",
            formatter: Utils.formatNumberAsEuros,
            footerFormatter: function(){
                var totalPrice = self.order.calculateTotalPrice();
                self.renderSummary();

                return Utils.formatNumberAsEuros(totalPrice);
            }
        }, {
            field: "amount",
            title: "Anzahl",
            formatter: this.getAmountInputElement.bind(this)
        }, {
            field: "discount",
            title: "Rabatt",
            formatter: this.getDiscountInputElement.bind(this),
            footerFormatter: function(){
                var totalDiscount = self.order.calculateTotalArticleDiscount();
                return Utils.formatNumberAsEuros(totalDiscount);
            }
        }]
    });
};

CreateOrderDialog.prototype.getAmountInputElement = function(_value, _row, _index, _field)
{
    var inputElement = $("<input/>", {
        type: "number",
        value: _value,
        class: "form-control",
        min: 1,
        "data-row-index": _index,
        onchange: `var rowIndex = $(this).data("row-index");
                   var newAmount = parseInt(this.value);

                   $("table#orderArticlesTable").bootstrapTable("updateCell", {
                     index: rowIndex,
                     field: "amount",
                     value: newAmount
                   });`
    });

    return inputElement[0].outerHTML;
};

/**
 * Returns a input element string for a the discount column in the order articles table.
 */
CreateOrderDialog.prototype.getDiscountInputElement = function(_value, _row, _index)
{
    var inputElement = $("<input/>", {
        type: "number",
        value: _value,
        class: "form-control",
        min: 0,
        step: 0.01,
        "data-row-index": _index,
        onchange: `var rowIndex = $(this).data("row-index");
                   var newDiscount = parseFloat(this.value);

                   $("table#orderArticlesTable").bootstrapTable("updateCell", {
                     index: rowIndex,
                     field: "discount",
                     value: newDiscount
                   });`
    });

    return inputElement[0].outerHTML;
};

/**
 * Initializes the combo boxes for the customer, worker and provider selection.
 */
CreateOrderDialog.prototype.initializeComboBoxes = function()
{
    var customerSelect = $(this.dialogElement).find("select#customer");
    var workerSelect = $(this.dialogElement).find("select#worker");
    var providerSelect = $(this.dialogElement).find("select#provider");

    var defaultItem = [ { id: "", text: "" } ];

    var self = this;

    dataFetcher.get("customers").then(function(_customers){

        var customers = _customers.map(function(_customer){
            return { id: _customer.customerCode, text: _customer.name };
        });

        $(customerSelect).select2({
            placeholder: "Kunden wählen",
            data: defaultItem.concat(customers)
        });

        $(customerSelect).on("change", function(_event){
            Utils.resetValidity(_event.target);

            var customerId = $(_event.target).val();
            if (customerId === "") customerId = null;

            self.order.setCustomerId(customerId);
            self.validateOrder();
        });
    });

    dataFetcher.get("workers").then(function(_workers){

        var workers = _workers.map(function(_worker){
            return { id: _worker.id, text: _worker.Sachbearbeiter };
        });

        $(workerSelect).select2({
            placeholder: "Sachbearbeiter wählen",
            data: defaultItem.concat(workers)
        });

        $(workerSelect).on("change", function(_event){
            Utils.resetValidity(_event.target);

            var workerId = $(_event.target).val();
            if (workerId === "") workerId = null;

            self.order.setWorkerId(workerId);
            self.validateOrder();
        });

    });

    dataFetcher.get("providers").then(function(_providers){

        var providers = _providers.map(function(_provider){
            return { id: _provider.id, text: _provider.shipperName };
        });

        $(providerSelect).select2({
            placeholder: "Versandfirma wählen",
            data: defaultItem.concat(providers)
        });

        $(providerSelect).on("change", function(_event){
            Utils.resetValidity(_event.target);

            var providerId = $(_event.target).val();
            if (providerId === "") providerId = null;

            self.order.setProviderId(providerId);
            self.validateOrder();
        });
    });
};

CreateOrderDialog.prototype.onShow = function(){

    this.order.reset();
    this.addOrderWasClicked = false;
    this.render();

    $(this.orderArticlesTable).bootstrapTable("removeAll");
    $(this.orderArticlesTable).bootstrapTable("showLoading");
};

CreateOrderDialog.prototype.onShown = function(){
    $(this.orderArticlesTable).bootstrapTable("resetView");
    $(this.orderArticlesTable).bootstrapTable("hideLoading");
};


CreateOrderDialog.prototype.addOrderArticles = function(_selectedArticle)
{
    var self = this;
    _selectedArticle.forEach(function(_selectedArticle){
        self.order.addOrderArticle(new OrderArticle(_selectedArticle));
    });

    $(this.orderArticlesTable).bootstrapTable("load", this.order.getOrderArticles());

    this.render();
};

/**
 * Adds the order to the database.
 *
 * @param _event The event that triggered this addOrder call
 */
CreateOrderDialog.prototype.saveOrder = function(_event)
{
    // Prevent the form from reloading the page
    _event.preventDefault();

    this.addOrderWasClicked = true;

    var self = this;
    if (this.validateOrder()){
        this.order.save().then(function(_stocksWarnings){

            nativeToast({
                message: "Bestellung erfolgreich eingetragen",
                position: "north-east",
                closeOnClick: true,

                timeout: 5000,
                type: "success"
            });

            if (_stocksWarnings.length > 0){
                console.log(_stocksWarnings);
                var stocksWarningsDialog = new StocksWarningsDialog(_stocksWarnings);
                stocksWarningsDialog.initialize();
                stocksWarningsDialog.show();
            }

        }).catch(function(_errorMessage){
            self.showErrorMessage(_errorMessage);
        });
    }
};


// Private Methods

CreateOrderDialog.prototype.validateOrder = function()
{
    if (! this.addOrderWasClicked)  return true;

    var nextErroneousOrderAttribute = this.order.validate();
    if (nextErroneousOrderAttribute !== null)
    {
        this.renderErroneousOrderAttribute(nextErroneousOrderAttribute);
        return false;
    }
    else return true;
};

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
 * Renders a errornous order attribute by setting the custom validity of the affected element to a error message.
 *
 * @param {Object} _errornousOrderAttribute The errornous order attribute information
 */
CreateOrderDialog.prototype.renderErroneousOrderAttribute = function(_erroneousOrderAttribute){

    var errorMessage;

    if (_erroneousOrderAttribute.attributeName === "orderArticle")
    {
        var articleId = _erroneousOrderAttribute.articleId;
        var error = _erroneousOrderAttribute.error;

        errorMessage = "Fehler in Artikel " + articleId + ": " + error.errorMessage;
    }
    else errorMessage = _erroneousOrderAttribute.errorMessage;

    this.showErrorMessage(errorMessage);
};

/**
 * Shows a error message.
 */
CreateOrderDialog.prototype.showErrorMessage = function(_message){
    nativeToast({
        message: _message,
        position: "north-east",
        closeOnClick: true,

        timeout: 5000,
        type: "error"
    });
};
