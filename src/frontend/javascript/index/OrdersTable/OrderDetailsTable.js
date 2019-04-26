/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Generates and appends the html elements that are shown when a row of the OrdersTable is expanded.
 */

/*
 * OrderDetailsTable constructor.
 *
 * @param {Object} _ordersRow The OrdersTable row for which this OrderDetailsTable will show the details
 */
function OrderDetailsTable(_ordersRow)
{
    this.ordersRow = _ordersRow;
}

OrderDetailsTable.prototype = {

    /**
     * Appends the order details table to a specified html element.
     *
     * @param {Node} _element The HTML element
     */
    appendToElement: function(_element)
    {
        // Create the table
        var self = this;
        dataFetcher.get("order-details", { orderId: this.ordersRow.order_id }).then(function(_orderDetails){

            var exportsAsPdfButton = self.generateExportAsPdfButton(_orderDetails);
            $(_element).append(exportsAsPdfButton);

            var orderDetailsTable = self.generateOrderDetailsTable(_orderDetails);
            $(_element).append(orderDetailsTable);
        });
    },

    /**
     * Generates and returns the "Export as PDF" button.
     *
     * @param {Object[]} _orderDetails The order details rows
     *
     * @return {jQuery} The "Export as PDF" button element
     */
    generateExportAsPdfButton: function(_orderDetails)
    {
        var exportAsPdfButton = $("<button/>", {
            class: "btn btn-primary",
            style: "margin-bottom: 5px"
        });
        $(exportAsPdfButton).append($("<i/>", {
            class: "fas fa-file-export"
        }));
        $(exportAsPdfButton).append(" Als PDF exportieren");

        var self = this;
        $(exportAsPdfButton).on("click", function(){
            self.exportAsPdf(_orderDetails);
        });

        return exportAsPdfButton;
    },

    /**
     * Exports one order as a pdf.
     *
     * @param {Object[]} _orderDetails The order details rows
     */
    exportAsPdf: function(_orderDetails)
    {
        var pdfCreator = new OrderPdfCreator();
        pdfCreator.createPdfFromOrder(this.ordersRow, _orderDetails);
    },

    /**
     * Generates and returns the order details table.
     *
     * @param {Object[]} _orderDetails The order details rows
     *
     * @return {jQuery} The order details table element
     */
    generateOrderDetailsTable: function(_orderDetails)
    {
        return $("<table/>").bootstrapTable({

            data: _orderDetails,

            formatNoMatches: function(){
                return "Die Bestellung enthält keine Artikel";
            },

            columns: [{
                field: "article_name",
                title: "Artikelname"
            }, {
                field: "amount",
                title: "Anzahl"
            }, {
                field: "unit_price",
                title: "Einzelpreis",
                formatter: Utils.formatNumberAsEuros
            }, {
                field: "discount_percentage",
                title: "Rabatt",
                formatter: Utils.formatFloatAsPercent
            }, {
                field: "total_order_item_price",
                title: "Gesamtpreis",
                formatter: Utils.formatNumberAsEuros
            }]
        });
    }
};
