/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Dialog for the article selection in the create order dialog.
 *
 * @property {CreateOrderDialog} parentCreateOrderDialog The parent CreateOrderDialog
 */
function AddArticleDialog(_parentCreateOrderDialog)
{
    Dialog.call(this, "div#addArticleDialog");
    this.parentCreateOrderDialog = _parentCreateOrderDialog;
}

AddArticleDialog.prototype = Object.create(Dialog.prototype);
AddArticleDialog.prototype.constructor = AddArticleDialog;


/**
 * Initializes the dialog.
 */
AddArticleDialog.prototype.initialize = function(){

    Dialog.prototype.initialize.call(this);

    this.addArticlesTable = $(this.dialogElement).find("table#addArticlesTable");

    $(this.addArticlesTable).bootstrapTable({
        url: "articles",
        height: 430,
        width: 100,
        search: true,

        clickToSelect: true,
        sortName: "ArtikelName",

        columns: [{
            field: "state",
            checkbox: true
        }, {
            field: "ArtikelName",
            title: "Artikelname",
            searchable: true
        }, {
            field: "Liefereinheit",
            title: "Liefereinheit"
        }, {
            field: "Einzelpreis",
            title: "Einzelpreis",
            formatter: Utils.formatNumberAsEuros
        }]
    });

    $(this.dialogElement).on("show.bs.modal", this.onShow.bind(this));
    $(this.dialogElement).on("shown.bs.modal", this.onShown.bind(this));
    $(this.dialogElement).find("button#addArticlesButton").on("click", this.onAddArticlesButtonClick.bind(this));
};

/**
 * Called when the dialog is about to be shown.
 */
AddArticleDialog.prototype.onShow = function(){
    $(this.addArticlesTable).bootstrapTable("showLoading");
};

/**
 * Called when the dialog rendering is complete.
 */
AddArticleDialog.prototype.onShown = function(){

    // Refresh in order to remove the selected row backgrounds
    $(this.addArticlesTable).bootstrapTable("refresh");
    $(this.addArticlesTable).bootstrapTable("uncheckAll");
    $(this.addArticlesTable).bootstrapTable("resetView");
    $(this.addArticlesTable).bootstrapTable("hideLoading");
};

/**
 * Handles clicks on the "Add selected articles to order" button.
 * @private
 */
AddArticleDialog.prototype.onAddArticlesButtonClick = function(){

    var selectedRows = $(this.addArticlesTable).bootstrapTable("getSelections");
    this.parentCreateOrderDialog.addOrderArticles(selectedRows);

    Dialog.prototype.close.call(this);
};
