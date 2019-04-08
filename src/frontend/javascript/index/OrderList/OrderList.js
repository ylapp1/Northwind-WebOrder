/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Handles rendering and displaying of the orders list table.
 * Internally uses bootstrap-table for rendering and filtering and flatpickr as date range picker.
 */
function OrderList()
{
}

OrderList.prototype = {

    /**
     * Loads the orders from the server and initializes the filters.
     * Also initializes the order details dialog.
     */
    initialize: function(){

        this.ordersTableElement = $("table#resultTable");

        var self = this;
        dataFetcher.get("orders").then(function(_orders){
          self.initializeOrdersTable(_orders);
        });
    },

    /**
     * Initializes the order list table.
     *
     * @param {Object[]} _orders The list of orders
     */
    initializeOrdersTable: function(_orders)
    {
        this.orders = _orders;

        // Set the flatpickr language to german
        flatpickr.localize(flatpickr.l10ns.de);


        var self = this;
        $(this.ordersTableElement).bootstrapTable({

            data: _orders,
            uniqueId: "BestellNr",

            pagination: true,
            search: true,
            filter: true,
            detailView: true,
            //cache: true,

            toolbar: "#toolbar",
            theadClasses: "thead-dark",
            locale: "de-DE",
            height: 550,

            onExpandRow: this.expandOrderDetails.bind(this),
            //onResetView: this.initializeFlatpickr.bind(this),

            columns: [{
                field: "BestellNr",
                title: "Bestellnummer",
                sortable: true,
                filter: {
                    type: "input"
                },
            }, {
                field: "Kunde",
                title: "Kunde",
                sortable: true,
                filter: {
                    type: "select",
                }
            }, {
                field: "workerName",
                title: "Sachbearbeiter",
                sortable: true,
                filter: {
                    type: "select"
                }
            }, {
                field: "BestellDatum",
                title: "Bestelldatum",
                sortable: true,
                width: "200",
                filter: {
                    template: this.getDateRangeFilterInput.bind(this),
                    setFilterValue: function(_filter, _field, _value) {
                        console.log("now");
                        if (_value) {
                            $(_filter).find("input.flatpickr-input").val(_value.value);
                        }
                    }
                },
                formatter: function(_value){
                    return Utils.formatDate(new Date(_value));
                }
            }, {
                field: "shipperName",
                title: "Versandfirma",
                sortable: true,
                filter: {
                    type: "select"
                }
            }, {
                field: "Frachtkosten",
                title: "Frachtkosten",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
                align: "top"
            }, {
                field: "Gesamtwert",
                title: "Gesamtwert",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
                align: "top"
            }, {
                field: "Gesamtwarenwert",
                title: "Gesamtwarenwert",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
                align: "top"
            }]
        });


        // Fetch the data for the combo boxes
        var defaultItem = [ "" ];

        dataFetcher.get("customers").then(function(_customers){

            var customerNames = _customers.map(function(_customer){
                return _customer.name;
            });
            customerNames = defaultItem.concat(customerNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "Kunde", customerNames);
        });

        dataFetcher.get("workers").then(function(_workers){

            var workerNames = _workers.map(function(_worker){
                return _worker.Sachbearbeiter;
            });
            workerNames = defaultItem.concat(workerNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "workerName", workerNames);
        });

        dataFetcher.get("providers").then(function(_providers){

            var providerNames = _providers.map(function(_provider){
                return _provider.shipperName;
            });
            providerNames = defaultItem.concat(providerNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "shipperName", providerNames);
        });

        dataFetcher.get("dateRange").then(function(_dateRange){
            // TODO
        });
    },

    /**
     * Initializes the date range filter.
     *
     * @param {Node} _bootstrapTable The bootstrap-table element
     * @param {Object} _column The column settings
     * @param {string} _isVisible The value for the visibility css property
     */
    getDateRangeFilterInput: function(_bootstrapTable, _column, _isVisible, _not)
    {
        var inputField =  $("<input/>", {
            "data-filter-field": _column.field,
            type: "text",
            class: "form-control",
            style: "visibility: " + _isVisible + ";"
        });

        this.initializeFlatpickr();

        return inputField;
    },

    initializeFlatpickr: function(){

        var self = this;
        dataFetcher.get("dateRange").then(function(_dateRange){

            var inputField = $("input.form-control[data-filter-field=\"BestellDatum\"]");

            var minDate = new Date(_dateRange[0].MinBestellDatum);
            var maxDate = new Date(_dateRange[0].MaxBestellDatum);

            self.currentSelectedMinDate = minDate;
            self.currentSelectedMaxDate = maxDate;

            // Initialize the date range picker
            self.flatpickr = $(inputField).flatpickr({
                minDate: minDate,
                maxDate: maxDate,
                defaultDate: [ minDate, maxDate ],
                defaultHour: 0,
                defaultMinute: 0,
                mode: "range",
                animate: false,
                position: "below",
                weekNumbers: true,
                locale: {
                    rangeSeparator: " - "
                },
                dateFormat: "d.m.Y",
                onClose: function(_selectedDates){

                    var selectedMinDate = new Date(_selectedDates[0] + "UTC");
                    if (selectedMinDate.getHours() === 4) selectedMinDate = minDate;

                    var selectedMaxDate = new Date(_selectedDates[1] + "UTC");
                    if (selectedMaxDate.getHours() === 4) selectedMaxDate = maxDate;

                    if (! selectedMaxDate) selectedMaxDate = maxDate;

                    if (! deepEqual(self.currentSelectedMinDate, selectedMinDate) ||
                        ! deepEqual(self.currentSelectedMaxDate, selectedMaxDate))
                    {
                        self.currentSelectedMinDate = selectedMinDate;
                        self.currentSelectedMaxDate = selectedMaxDate;

                        self.filterByDateRange();
                    }

                    var inputField = $("input.form-control[data-filter-field=\"BestellDatum\"]");
                }
            });
        });
    },

    /**
     * Filters the results by a date range.
     */
    filterByDateRange: function(){

        if (! this.currentSelectedMinDate && ! this.currentSelectedMaxDate) return;

        var filteredOrders = [];
        var self = this;
        this.orders.forEach(function(_dataRow){

            if (self.currentSelectedMinDate.getTime() <= _dataRow.BestellDatum &&
                _dataRow.BestellDatum <= self.currentSelectedMaxDate.getTime())
            {
                filteredOrders.push(_dataRow);
            }
        });

        $(this.ordersTableElement).bootstrapTable("load", filteredOrders);
        /*
        $(this.ordersTableElement).bootstrapTable("filterBy", {
            BestellDatum: filteredOrderDates
        });
        */
    },

    /**
     * Expands the order details sub table for a order.
     *
     * @param {int} _index The index of the data row
     * @param {Object} _row The data row
     * @param {Node} _detail The html node that provides space for the sub table
     */
    expandOrderDetails: function(_index, _row, _detail){

        var orderId = _row.BestellNr;

        var exportAsPdfButton = $("<button/>", {
            class: "btn btn-primary",
            text: "Als PDF exportieren",
            style: "margin-bottom: 5px"
        });

        var self = this;


        dataFetcher.get("orderDetails", { orderId: orderId }).then(function(_orderDetails){

            $(_detail).append(exportAsPdfButton);

            $(exportAsPdfButton).on("click", function(){
                self.exportAsPDF(_row, _orderDetails);
            });

            var orderDetailsTable = $("<table/>").bootstrapTable({

                data: _orderDetails,
                formatNoMatches: function(){
                    return "Die Bestellung enthält keine Artikel";
                },

                toolbar: "#subTableToolBar",

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
                    field: "discount",
                    title: "Rabatt",
                    formatter: Utils.formatNumberAsEuros
                }, {
                    field: "total_price",
                    title: "Gesamtpreis",
                    formatter: Utils.formatNumberAsEuros
                }]
            });

            $(_detail).append(orderDetailsTable);
        });
    },

    /**
     * Exports one order as a pdf.
     */
    exportAsPDF: function(_orderData, _orderDetails)
    {
        var pdfCreator = new OrderPdfCreator();
        pdfCreator.createPdfFromOrder(_orderData, _orderDetails);
    }
};
