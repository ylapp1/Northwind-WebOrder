

/**
 * Dialog for the stocks warnings messages.
 */
function StocksWarningsDialog(_warningMessages)
{
    Dialog.call(this, "div#stocksWarningsDialog");
    this.warningMessages = _warningMessages;
}

StocksWarningsDialog.prototype = Object.create(Dialog.prototype);
StocksWarningsDialog.prototype.constructor = StocksWarningsDialog;

StocksWarningsDialog.prototype.initialize = function(){

    Dialog.prototype.initialize.call(this);

    var warningMessagesList = $(this.dialogElement).find("ul#stocksWarningsList");
    $(warningMessagesList).empty();
    this.warningMessages.forEach(function(_warningMessage){
        $(warningMessagesList).append($("<li/>", {
            text: _warningMessage
        }));
    });
};
