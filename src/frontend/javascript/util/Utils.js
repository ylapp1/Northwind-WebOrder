/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides some static util functions.
 */
var Utils = {

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

    /**
     * Formats a date as "dd.mm.yyyy".
     *
     * @param {Date} _date The date
     *
     * @return {string} The formatted date
     */
    formatDate: function(_date){
        return _date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    },

    /**
     * Formats a float value as percentage.
     *
     * @tparam {float} _float The float value
     *
     * @treturn {string} The formatted float value
     */
    formatFloatAsPercent: function(_float){
        return (_float * 100) + " %";
    },


    // Toast messages

    /**
     * Shows a success message.
     *
     * @param {string} _message The message
     */
    showSuccessMessage: function(_message){
        nativeToast({
            message: _message,
            position: "north-east",
            closeOnClick: true,

            timeout: 5000,
            type: "success"
        });
    },

    /**
     * Shows a error message.
     *
     * @param {string} _message The error message
     */
    showErrorMessage: function(_message){
        nativeToast({
            message: _message,
            position: "north-east",
            closeOnClick: true,

            timeout: 5000,
            type: "error"
        });
    }
};
