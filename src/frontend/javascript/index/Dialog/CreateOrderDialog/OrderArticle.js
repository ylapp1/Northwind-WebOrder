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

        if (this.discount > this.amount * this.articlePrice)
        {
            return { attribute: "discount", errorMessage: "Der Rabatt darf nicht größer sein als der Artikelwert" };
        }

        return null;
    }
};
