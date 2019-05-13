/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Stores the data for one order article.
 *
 * @param {Object} _article The article
 */
function OrderArticle(_article)
{
    this.article = _article;
    this.amount = 1;
    this.discount = 0;
}

OrderArticle.prototype = {

    // Getters and Setters

    /**
     * Returns the article.
     *
     * @return {Object} The article
     */
    getArticle: function(){
        return this.article;
    },

    /**
     * Returns the amount of this OrderArticle.
     *
     * @return {int} The amount of this OrderArticlesList
     */
    getAmount: function(){
        return this.amount;
    },

    /**
     * Sets the amount of this OrderArticle.
     *
     * @param {int} _amount The amount
     */
    setAmount: function(_amount){
        this.amount = _amount;
    },

    /**
     * Returns the discount of this OrderArticle.
     *
     * @return {float} The discount of this OrderArticle
     */
    getDiscount: function(){
        return this.discount;
    },

    /**
     * Sets the discount of this OrderArticle.
     *
     * @param {float} _discount The discount
     */
    setDiscount: function(_discount){
        this.discount = _discount;
    },


    // Public Methods

    /**
     * Validates this OrderArticle.
     * This method assumes that the article id, name and price are set.
     * It also assumes that the min attributes of the input elements block invalid values.
     *
     * @return {Object|null} The object that contains information about an error or null if this OrderArticle is valid
     */
    validate: function(){

        if (this.amount === 0)
        {
            return { attribute: "amount", errorMessage: "Die Artikelanzahl muss größer als 1 sein." };
        }
        else if (this.discount < 0)
        {
            return { attribute: "discount", errorMessage: "Der Rabatt darf nicht kleiner als 0 sein." };
        }
        else if (this.discount > 100)
        {
            return { attribute: "discount", errorMessage: "Der Rabatt darf nicht größer sein als 100%" };
        }

        return null;
    },

    /**
     * Returns the total price without the discount subtracted.
     *
     * @return float The price
     */
    getPrice: function()
    {
        return this.article.unit_price * this.amount;
    },

    /**
     * Returns the discount in euros.
     *
     * @return float The discount
     */
    getDiscountInEuros: function()
    {
        return this.getPrice() * (this.discount  / 100);
    }
};
