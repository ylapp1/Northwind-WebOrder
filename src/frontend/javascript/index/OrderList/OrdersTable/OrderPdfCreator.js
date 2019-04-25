/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Creates a PDF file from an order.
 *
 * @property {jsPDF} document The pdf document that will be written
 */
function OrderPdfCreator()
{
    this.document = new jsPDF();
}

OrderPdfCreator.prototype = {

    /**
     * Creates a PDF file from an order.
     *
     * @param {Object} _ordersRow The orders row of the order
     * @param {Object} _orderDetails The corresponding order detail rows for the order row
     */
    createPdfFromOrder: function(_orderData, _orderDetails)
    {
        // Order the order detail rows by article id
        var orderDetails = _orderDetails.sort(function(_orderDetailsA, _orderDetailsB){
            return _orderDetailsA.article_id > _orderDetailsB.article_id;
        });

        // Create objects for jspdf-autotable from the order details
        orderDetails = orderDetails.map(function(_orderDetail){
            return {
                articleId: _orderDetail.article_id,
                articleName: _orderDetail.article_name,
                amount: _orderDetail.amount,
                unitPrice: Utils.formatNumberAsEuros(_orderDetail.unit_price),
                discount: Utils.formatFloatAsPercent(_orderDetail.discount_percentage),
                totalPrice: Utils.formatNumberAsEuros(_orderDetail.total_order_item_price)
            };
        });

        // Write the headline
        this.document.setFontSize(25);
        this.writeCenteredText("Nordwind Bestelldetails", 20);

        // Write the order data as a table
        this.document.autoTable({
            theme: "grid",

            head: [],
            showHead: false,
            body: [
                [ "BestellNr", _orderData.order_id ],
                [ "Kunde", _orderData.customer_name ],
                [ "Sachbearbeiter", _orderData.case_worker_name ],
                [ "Versandfirma", _orderData.shipper_name ],
                [ "Bestelldatum", Utils.formatDate(new Date(_orderData.order_date)) ],
                [ "Gesamtwert", Utils.formatNumberAsEuros(_orderData.total_order_items_price) ],
                [ "Frachtkosten", Utils.formatNumberAsEuros(_orderData.shipping_costs) ],
                [ "Gesamtwarenwert", Utils.formatNumberAsEuros(_orderData.total_price) ]
            ],

            margin: { top: 30 }
        });

        // Write the order articles as a table
        this.document.autoTable({
            theme: "striped",

            columns: [{
                header: "ArtikelNr",
                dataKey: "articleId"
            }, {
                header: "Artikelname",
                dataKey: "articleName"
            }, {
                header: "Anzahl",
                dataKey: "amount"
            }, {
                header: "Einzelpreis",
                dataKey: "unitPrice"
            }, {
                header: "Rabatt",
                dataKey: "discount"
            }, {
                header: "Gesamtpreis",
                dataKey: "totalPrice"
            }],

            body: orderDetails,
            margin: { top: 60 },
        });

        // Save the PDF as "Bestellung_<orderId>.pdf"
        this.document.save("Bestellung_" + _orderData.order_id + ".pdf");
    },

    /**
     * Writes a centered line at a specified y position.
     *
     * @param {String} _text The text
     * @param {int} _y The y position of the line in the document
     */
    writeCenteredText: function(_text, _y){
        var pageWidth = this.document.internal.pageSize.width;
        this.document.text(_text, pageWidth/2, _y, "center");
    }
};
