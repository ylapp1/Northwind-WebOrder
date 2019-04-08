/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides some static util functions.
 */
var Utils = {

    /**
     * Resets the validity of an HTML element.
     */
    resetValidity: function(_element){
        _element.setCustomValidity("");
    },

    /**
     * Returns a number formatted as euros.
     *
     * @param {int|float} _number The number
     *
     * @return {String} The formatted number
     */
    formatNumberAsEuros: function(_number){
        return _number.toFixed(2).replace(".", ",") + " €";
    },

    formatDate: function(_date){
        return _date.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
};
