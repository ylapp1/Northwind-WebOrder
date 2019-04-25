

function OrdersTable()
{
    this.ordersTableElement = $("table#resultTable");
}


OrdersTable.prototype = {


    initialize: function(_orders)
    {
        this.initializeTable(_orders);
        this.initializeComboBoxFilters();
    },


    /**
     * Initializes the order list table.
     *
     * @param {Object[]} _orders The list of orders
     */
    initializeTable: function(_orders)
    {
        var self = this;
        $(this.ordersTableElement).bootstrapTable({

            data: _orders,
            uniqueId: "order_id",

            pagination: true,
            search: true,
            filter: true,
            detailView: true,

            // TODO: change id to more meaningful name
            toolbar: "#toolbar",
            theadClasses: "thead-dark",
            locale: "de-DE",

            // TODO: adjust height to screen
            height: 550,

            onExpandRow: this.expandOrderDetails.bind(this),
            //onResetView: this.initializeFlatpickr.bind(this),

            columns: [{
                field: "order_id",
                title: "Bestellnummer",
                sortable: true,
                filter: {
                    type: "input"
                },
            }, {
                field: "customer_name",
                title: "Kunde",
                sortable: true,
                filter: {
                    type: "select",
                }
            }, {
                field: "case_worker_name",
                title: "Sachbearbeiter",
                sortable: true,
                filter: {
                    type: "select"
                }
            }, {
                field: "shipper_name",
                title: "Versandfirma",
                sortable: true,
                filter: {
                    type: "select"
                }
            }, {
                field: "order_date",
                title: "Bestelldatum",
                sortable: true,
                width: "200",

                // TODO: Fix this filter
                filter: {
                    template: this.getDateRangeFilterInput.bind(this),
                    setFilterValue: function(_filter, _field, _value) {
                        if (_value) {
                            $(_filter).find("input.flatpickr-input").val(_value.value);
                        }
                    }
                },
                formatter: function(_value){
                    return Utils.formatDate(new Date(_value));
                }
            }, {
                field: "total_order_items_price",
                title: "Gesamtwarenwert",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
            }, {
                field: "shipping_costs",
                title: "Frachtkosten",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
            }, {
                field: "total_price",
                title: "Gesamtwert",
                sortable: true,
                formatter: Utils.formatNumberAsEuros,
            }]
        });


    },

    getDateRangeFilterInput()
    {
        
    },



    initializeComboBoxFilters: function()
    {
        // Fetch the data for the combo boxes
        var defaultItem = [ "" ];

        var self = this;

        dataFetcher.get("customers").then(function(_customers){

            var customerNames = _customers.map(function(_customer){
                return _customer.customer_name;
            });
            customerNames = defaultItem.concat(customerNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "customer_name", customerNames);
        });

        dataFetcher.get("case-workers").then(function(_caseWorkers){

            var caseWorkerNames = _caseWorkers.map(function(_caseWorker){
                return _caseWorker.case_worker_name;
            });
            caseWorkerNames = defaultItem.concat(caseWorkerNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "case_worker_name", caseWorkerNames);
        });

        dataFetcher.get("shippers").then(function(_shippers){

            var shipperNames = _shippers.map(function(_shipper){
                return _shipper.shipper_name;
            });
            shipperNames = defaultItem.concat(shipperNames);

            $(self.ordersTableElement).bootstrapTable("setSelect2Data", "shipper_name", shipperNames);
        });
    },


    /**
     * Expands the order details sub table for a order.
     *
     * @param {int} _index The index of the data row
     * @param {Object} _row The data row
     * @param {Node} _detail The html node that provides space for the sub table
     */
    expandOrderDetails: function(_index, _row, _detail){
        var orderDetailsTable = new OrderDetailsTable(_row);
        orderDetailsTable.appendToElement(_detail);
    }
};
