

function OrderPdfCreator()
{
}

// TODO: include jspdf and jspdf-autotable in index.njk
// TODO: Instantiate this class in OrderList
OrderPdfCreator.prototype = {
    createPdfFromOrder: function(_orderDetails)
    {
        var document = new jsPDF();

        document.text("Nordwind Bestelldetails", 1, 1);
        document.text("BestellNr: " + _orderDetails.orderId, 3, 1);
        document.text("Kunde: " + _orderDetails.customerName, 4, 1);
        document.text("Sachbearbeiter: " + _orderDetails.worker, 5, 1);
        document.text("Versandfirma: " + _orderDetails.provider, 6, 1);
        document.text("Bestelldatum: " + _orderDetails.orderDate, 7, 1);
        document.text("Frachtkosten: " + _orderDetails.Frachtkosten, 8, 1);
        document.text("Gesamtwert: " + _orderDetails.Gesamtwert, 9, 1);
        document.text("Gesamtwarenwert: " + _orderDetails.Gesamtwarenwert, 10, 1);

        document.autoTable({
            theme: "striped",
            head: [ "ArtikelNr", "Artikelname", "Anzahl", "Einzelpreis", "Rabatt", "Gesamtpreis" ],
            body: _orderDetails.orderArticles
        });

        document.save("Bestellung_" + _orderDetails.orderId + ".pdf");
    }
};
