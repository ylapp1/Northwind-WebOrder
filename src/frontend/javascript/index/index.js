/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

var createOrderDialog;
var dataFetcher;
var ordersTable;

$(window).on("load", function(){

    createOrderDialog = new CreateOrderDialog();
    dataFetcher = new DataFetcher();
    ordersTable = new OrdersTable();

    createOrderDialog.initialize();
    ordersTable.initialize();
});
