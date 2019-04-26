/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Base class for dialogs.
 * Provides methods to initialize, show and close a dialog.
 * Internally uses bootstrap dialogs/modals.
 *
 * @property {String} dialogElementSelector The css selector that targets the div element for this dialog
 * @property {Node} dialogElement The html element for this dialog
 */
function Dialog(_dialogElementSelector)
{
    this.dialogElementSelector = _dialogElementSelector;
}

Dialog.prototype = {

    /*
     * Initializes the dialog.
     * This method can be used to initialize event listeners on elements inside the dialog.
     */
    initialize: function(){
        this.dialogElement = $(this.dialogElementSelector);

        // Make the dialog draggable
        $(this.dialogElement).find(".modal-dialog").draggable({
            handle: $(this.dialogElement).find(".modal-header")
        });
    },

    /*
     * Shows the dialog.
     */
    show: function(){
        $(this.dialogElement).modal("show");
    },

    /**
     * Closes the dialog.
     */
    close: function(){
        $(this.dialogElement).modal("hide");
    }
};
