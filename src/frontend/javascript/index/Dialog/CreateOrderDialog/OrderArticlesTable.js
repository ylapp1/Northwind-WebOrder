/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Shows a list of OrderArticle's.
 */
function OrderArticlesTable(_parentCreateOrderDialog, _element)
{
    this.parentCreateOrderDialog = _parentCreateOrderDialog;
    this.tableElement = _element;
}

OrderArticlesTable.prototype = {

    /**
     * Loads data into this table.
     */
    loadData: function(_dataRows){
        $(this.tableElement).bootstrapTable("load", _dataRows);
    },

    /**
     * Removes all entries from this table.
     */
    clear: function(){
        $(this.tableElement).bootstrapTable("removeAll");
    },

    /**
     * Redraws the table.
     */
    redraw: function(){
        $(this.tableElement).bootstrapTable("resetView");
    },

    /**
     * Initializes the order articles table.
     */
    initialize: function(){

        var self = this;
        $(this.tableElement).bootstrapTable({

            showFooter: true,

            height: 200,
            data: [],

            formatNoMatches: function(){
                return "Bestellung enthält keine Artikel";
            },

            sortName: "article.ArtikelName",
            uniqueId: "article.ArtikelNr",

            columns: [{
                field: "article.article_name",
                title: "Artikelname",
                footerFormatter: function(){
                    return "Gesamt";
                }
            },{
                field: "article.delivery_unit",
                title: "Liefereinheit"
            },{
                field: "article.unit_price",
                title: "Einzelpreis",
                formatter: Utils.formatNumberAsEuros,
                footerFormatter: function(){
                    var totalPrice = self.parentCreateOrderDialog.getOrder().calculateTotalPrice();
                    self.parentCreateOrderDialog.renderSummary();

                    return Utils.formatNumberAsEuros(totalPrice);
                }
            },{
                field: "amount",
                title: "Anzahl",
                formatter: this.getAmountInputElement.bind(this)
            },{
                field: "discount",
                title: "Rabatt (in %)",
                formatter: this.getDiscountInputElement.bind(this),
                footerFormatter: function(){
                    var totalDiscount = self.parentCreateOrderDialog.getOrder().calculateTotalArticleDiscount();
                    return Utils.formatNumberAsEuros(totalDiscount);
                }
            }]
        });
    },

    /**
     * Returns the amount input element for one row of the order articles table.
     */
    getAmountInputElement: function(_value, _row, _index, _field)
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
    },

    /**
     * Returns a input element string for a the discount column in the order articles table.
     */
    getDiscountInputElement: function(_value, _row, _index)
    {
        var inputElement = $("<input/>", {
            type: "number",
            value: _value,
            class: "form-control",
            min: 0,
            max: 1,
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
    }
};
