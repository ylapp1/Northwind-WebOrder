/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Displays a list of orders.
 */
function OrdersTable()
{
    Table.call(this);
}

OrdersTable.prototype = Object.create(Table.prototype);
OrdersTable.prototype.constructor = OrdersTable;


// Public Methods

/**
 * Initializes the table.
 */
OrdersTable.prototype.initialize = function()
{
    this.initializeConfig();
    this.initializeFilters();

    this.createFromElement($("table#ordersTable"));
    this.loadFilterData();
};

/**
 * Expands the order details sub table for a order.
 *
 * @param {int} _index The index of the data row
 * @param {Object} _row The data row
 * @param {Node} _detail The html node that provides space for the sub table
 */
OrdersTable.prototype.expandOrderDetails =  function(_index, _row, _detail)
{
    var orderDetailsTable = new OrderDetailsTable(_row);
    orderDetailsTable.appendToElement(_detail);
};


// Private Methods

/**
 * Initializes the bootstrap table configuration for this table.
 * @protected
 */
OrdersTable.prototype.initializeConfig = function()
{
    var self = this;
    this.tableConfig = {

        url: "orders",
        uniqueId: "order_id",

        pagination: true,
        search: true,
        filter: true,

        detailView: true,

        showRefresh: true,

        toolbar: "#ordersTableToolbar",
        theadClasses: "thead-dark",
        locale: "de-DE",

        height: 550,

        onExpandRow: this.expandOrderDetails.bind(this),

        onPostBody: function(){

            // Close all combo boxes that are still opened
            // This fixes the bug that the combo box stays open when you select an item and then unselect it with the "X" while
            // the combo box is still opened
            var comboBoxes = $(self.tableElement).closest(".bootstrap-table").find("div.filter select.select2-hidden-accessible");
            $(comboBoxes).each(function(_i, _comboBox){
                $(_comboBox).select2("close");
            });
        },

        columns: [{
            field: "order_id",
            title: "Bestellnummer",
            sortable: true,
            filter: {
                type: "input"
            }
        },{
            field: "customer_name",
            title: "Kunde",
            sortable: true,
            filter: {
                type: "select"
            }
        },{
            field: "case_worker_name",
            title: "Sachbearbeiter",
            sortable: true,
            filter: {
                type: "select"
            }
        },{
            field: "shipper_name",
            title: "Versandfirma",
            sortable: true,
            filter: {
                type: "select"
            }
        },{
            field: "order_date",
            title: "Bestelldatum",
            sortable: true,
            width: "200",
            formatter: function(_value){
                return Utils.formatDate(new Date(_value));
            }
        },{
            field: "total_order_items_price",
            title: "Gesamtwarenwert",
            sortable: true,
            formatter: Utils.formatNumberAsEuros
        },{
            field: "shipping_costs",
            title: "Frachtkosten",
            sortable: true,
            formatter: Utils.formatNumberAsEuros
        },{
            field: "total_price",
            title: "Gesamtwert",
            sortable: true,
            formatter: Utils.formatNumberAsEuros
        }]
    };

    Table.prototype.initializeConfig.call(this);
};

/**
 * Initializes all custom filters for this table.
 * @protected
 */
OrdersTable.prototype.initializeFilters = function()
{
    this.filters = [];

    // Create the date range filter
    var dateRangeFilterFunction = function(_row, _minDate, _maxDate){
        return (_minDate.getTime() <= _row.order_date &&  _row.order_date <= _maxDate.getTime());
    };

    this.dateRangeFilter = new DateRangeFilter(this, "order_date", dateRangeFilterFunction);
    this.filters.push(this.dateRangeFilter);

    Table.prototype.initializeFilters.call(this);
};

/**
 * Loads the data for all filters.
 * @private
 */
OrdersTable.prototype.loadFilterData = function()
{
    var self = this;

    // Load the date range for the date range picker
    dataFetcher.get("date-range").then(function(_dateRange){
        var minDate = new Date(_dateRange[0].minimum_order_date);
        var maxDate = new Date(_dateRange[0].maximum_order_date);

        self.dateRangeFilter.loadData(minDate, maxDate);
    });

    // Load the combo box filters data
    var defaultComboBoxItem = [ "" ];

    dataFetcher.get("customers").then(function(_customers){
        var customerNames = _customers.map(function(_customer){
            return _customer.customer_name;
        });
        $(self.tableElement).bootstrapTable("setSelect2Data", "customer_name", defaultComboBoxItem.concat(customerNames));
    });

    dataFetcher.get("case-workers").then(function(_caseWorkers){
        var caseWorkerNames = _caseWorkers.map(function(_caseWorker){
            return _caseWorker.case_worker_name;
        });
        $(self.tableElement).bootstrapTable("setSelect2Data", "case_worker_name", defaultComboBoxItem.concat(caseWorkerNames));
    });

    dataFetcher.get("shippers").then(function(_shippers){
        var shipperNames = _shippers.map(function(_shipper){
            return _shipper.shipper_name;
        });
        $(self.tableElement).bootstrapTable("setSelect2Data", "shipper_name", defaultComboBoxItem.concat(shipperNames));
    });
};
