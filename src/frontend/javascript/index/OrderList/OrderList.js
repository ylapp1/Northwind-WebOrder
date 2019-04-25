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

        this.ordersTable = new OrdersTable();

        var self = this;
        dataFetcher.get("orders").then(function(_orders){
            self.orders = _orders;
            self.ordersTable.initialize(_orders);
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
    }
};
