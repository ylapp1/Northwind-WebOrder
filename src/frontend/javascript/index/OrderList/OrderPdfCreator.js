/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Creates a pdf from a order.
 *
 * @property {jsPDF} document The pdf document that will be written
 */
function OrderPdfCreator()
{
    this.document = new jsPDF();
}

OrderPdfCreator.prototype = {

    /**
     * Creates a PDF file from order details.
     *
     * @param {Object} _orderData The order row from the database
     * @param {Object} _orderDetails The corresponding order detail rows for the order row
     */
    createPdfFromOrder: function(_orderData, _orderDetails)
    {
        // Create objects for jspdf-autotable from the order details
        var orderDetails = _orderDetails.map(function(_orderDetail){
            return {
                articleId: _orderDetail.ArtikelNr,
                articleName: _orderDetail.article_name,
                amount: _orderDetail.amount,
                unitPrice: Utils.formatNumberAsEuros(_orderDetail.unit_price),
                discount: Utils.formatNumberAsEuros(_orderDetail.discount),
                totalPrice: Utils.formatNumberAsEuros(_orderDetail.total_price)
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
                [ "BestellNr", _orderData.BestellNr ],
                [ "Kunde", _orderData.Kunde ],
                [ "Sachbearbeiter", _orderData.workerName ],
                [ "Versandfirma", _orderData.shipperName ],
                [ "Bestelldatum", Utils.formatDate(new Date(_orderData.BestellDatum)) ],
                [ "Frachtkosten", Utils.formatNumberAsEuros(_orderData.Frachtkosten) ],
                [ "Gesamtwert", Utils.formatNumberAsEuros(_orderData.Gesamtwert) ],
                [ "Gesamtwarenwert", Utils.formatNumberAsEuros(_orderData.Gesamtwarenwert) ]
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

        // Save the PDF as "Bestellung_<orderId>"
        this.document.save("Bestellung_" + _orderData.BestellNr + ".pdf");
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
