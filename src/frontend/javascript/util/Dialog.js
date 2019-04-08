/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Base class for dialogs.
 * Provides methods to initialize, show and close a dialog.
 * Internally uses the dialog functions of jQuery UI.
 *
 * @property {String} dialogElementSelector The css selector that targets the div element for this dialog
 * @property {Object} dialogSettings The settings for the jQuery UI dialog
 * @property {Node} dialogElement The html element for this dialog
 */
function Dialog(_dialogElementSelector, _dialogSettings)
{
    this.dialogElementSelector = _dialogElementSelector;
    this.dialogSettings = _dialogSettings;
}

Dialog.prototype = {

    /*
     * Initializes the dialog.
     * This method can be used to initialize event listeners on elements inside the dialog.
     */
    initialize: function(){
        this.dialogElement = $(this.dialogElementSelector);
        //$(this.dialogElement).dialog(this.dialogSettings);

        // Make the dialog resizable
        /*$(this.dialogElement).find(".modal-content").resizable({
            //alsoResize: ".modal-dialog",
            minHeight: 300,
            minWidth: 300
        });*/

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
        //$(this.dialogElement).dialog("close");
    }
};
