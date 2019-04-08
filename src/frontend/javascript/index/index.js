/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

var createOrderDialog;
var dataFetcher;
var orderList;

// TODO: Rename worker to caseWorker
// TODO: Fix field names from german to english
$(window).on("load", function(){

    createOrderDialog = new CreateOrderDialog();
    dataFetcher = new DataFetcher();
    orderList = new OrderList();

    createOrderDialog.initialize();
    orderList.initialize();
});
