/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Stores the data for a new order.
 *
 * @property {int} customerId The customer id
 * @property {int} workerId The worker id
 * @property {int} providerId The provider id
 * @property {OrderArticle[]} orderArticles The list of OrderArticle's
 * @property {float} additionalDiscount The additional discount for the total order
 */
function Order()
{
    this.customerId = null;
    this.workerId = null;
    this.providerId = null;
    this.orderArticles = [];
}

Order.prototype = {

    // Getters and Setters

    /**
     * Returns the customer id.
     *
     * @return {int} The customer id
     */
    getCustomerId: function(_customerId){
        return this.customerId;
    },

    /**
     * Sets the customer id.
     *
     * @param {int} _customerId The customer id
     */
    setCustomerId: function(_customerId){
        this.customerId = _customerId;
    },

    /**
     * Returns the worker id.
     *
     * @return {int} The worker id
     */
    getWorkerId: function(_workerId){
        return this.workerId;
    },

    /**
     * Sets the worker id.
     *
     * @param {int} _workerId The worker id
     */
    setWorkerId: function(_workerId){
        this.workerId = parseInt(_workerId);
    },

    /**
     * Returns the provider id.
     *
     * @return {int} The provider id
     */
    getProviderId: function(_providerId){
        return this.providerId;
    },

    /**
     * Sets the provider id.
     *
     * @param {int} _providerId The provider id
     */
    setProviderId: function(_providerId){
        this.providerId = parseInt(_providerId);
    },

    /**
     * Returns the list of OrderArticle's.
     *
     * @return {OrderArticle[]} The list of OrderArticle's
     */
    getOrderArticles: function(){
        return this.orderArticles;
    },


    // Public Methods

    /**
     * Clears the contents of this order.
     */
    reset: function(){
        this.customerId = null;
        this.workerId = null;
        this.providerId = null;
        this.orderArticles = [];
    },

    /**
     * Adds an OrderArticle to this Order.
     *
     * @param {OrderArticle} _orderArticle The OrderArticle
     */
    addOrderArticle: function(_orderArticle){

        var orderArticleIndex = this.getOrderArticleIndexByArticleId(_orderArticle.getArticle().article_id);
        if (orderArticleIndex === null)
        {
            this.orderArticles.push(_orderArticle);
        }
        else
        {
            var orderArticle = this.orderArticles[orderArticleIndex];
            orderArticle.setAmount(orderArticle.getAmount() + 1);
        }
    },

    /**
     * Changes the amount of an OrderArticle.
     *
     * @param {int} _articleId The article id
     * @param {int} _newAmount The new amount
     */
    changeOrderArticleAmount: function(_articleId, _newAmount){

        var orderArticleIndex = this.getOrderArticleIndexByArticleId(_articleId);
        if (orderArticleIndex !== null)
        {
            this.orderArticles[orderArticleIndex].setAmount(_newAmount);
        }
    },

    /**
     * Changes the discount of an OrderArticle.
     *
     * @param {int} _articleId The article id
     * @param {float} _newDiscount The new discount
     */
    changeOrderArticleDiscount: function(_articleId, _newDiscount){

        var orderArticleIndex = this.getOrderArticleIndexByArticleId(_articleId);
        if (orderArticleIndex !== null)
        {
            this.orderArticles[orderArticleIndex].setDiscount(_newDiscount);
        }
    },

    /*
     * Returns the index of an OrderArticle in the list of existing OrderArticle's.
     *
     * @param {int} _articleId The article id
     *
     * @return {int|null} The index of the OrderArticle or null if the OrderArticle was not found in the list of existing OrderArticle's
     * @private
     */
    getOrderArticleIndexByArticleId: function(_articleId){

        for (var i = 0; i < this.orderArticles.length; i++)
        {
            if (this.orderArticles[i].getArticle().article_id === _articleId)
            {
                return i;
            }
        }

        return null;
    },


    /**
     * Calculates and returns the total price of all OrderArticle's in this Order.
     *
     * @return {float} The total price
     */
    calculateTotalPrice: function(){

        var totalPrice = 0;
        this.orderArticles.forEach(function(_orderArticle){
            totalPrice += _orderArticle.getPrice();
        });

        return totalPrice;
    },

    /*
     * Calculates and returns the total discount of all OrderArticle's in this Order.
     *
     * @return {float} The total discount
     */
    calculateTotalArticleDiscount: function(){

        var totalDiscount = 0;
        this.orderArticles.forEach(function(_orderArticle){
            totalDiscount += _orderArticle.getDiscountInEuros();
        });

        return totalDiscount;
    },


    /**
     * Validates this Order's attributes.
     *
     * @return {Object|null} The object that contains information about an error or null if this Order is valid
     */
    validate: function(){

        if (this.customerId === null)
        {
            return { attributeName: "customerId", errorMessage: "Bitte einen Kunden auswählen" };
        }
        else if (this.workerId === null)
        {
            return { attributeName: "workerId", errorMessage: "Bitte einen Sachbearbeiter auswählen" };
        }
        else if (this.providerId === null)
        {
            return { attributeName: "providerId", errorMessage: "Bitte einen Lieferanten auswählen" };
        }
        else
        {
            // Check whether there is at least one OrderArticle in this Order
            if (this.orderArticles.length === 0)
            {
                return { attributeName: "orderArticles", errorMessage: "Bitte mindestens einen Artikel zur Bestellung hinzufügen" };
            }

            // Check the OrderArticle's
            var nextErroneousAttribute;
            for (var i = 0; i < this.orderArticles.length; i++)
            {
                nextErroneousAttribute = this.orderArticles[i].validate();
                if (nextErroneousAttribute !== null)
                {
                    return {
                        attributeName: "orderArticle",
                        articleName: this.orderArticles[i].getArticle().article_name,
                        error: nextErroneousAttribute
                    };
                }
            }
        }

        return null;
    },

    /**
     * Saves this Order to the database.
     */
    save: function(){

        // Create a minimal object for the order
        var minifiedOrderArticles = this.orderArticles.map(function(_orderArticle){
            return {
                articleId: _orderArticle.getArticle().article_id,
                amount: _orderArticle.getAmount(),
                discountPercent: _orderArticle.getDiscount()
            };
        });

        var order = {
            customerCode: this.customerId,
            caseWorkerId: this.workerId,
            shipperId: this.providerId,
            orderArticles: minifiedOrderArticles
        };

        return new Promise(function(_resolve, _reject){
            $.post("/createOrder", { order: order }, function(_result, _status){
                if (_result.success === false) _reject(_result.errorMessage);
                else _resolve(_result.stocksWarnings);
            });
        });
    }
};
