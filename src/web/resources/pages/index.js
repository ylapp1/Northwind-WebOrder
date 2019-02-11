
$(document).ready(function(){

    fetchDataRows().then(function(_dataRows){
        updateResultTable(_dataRows);
    });

});

/**
 * Fetches all data rows from the orders table from the web server.
 */
function fetchDataRows()
{
    return new Promise(function(_resolve){
        $.get("orders", function(_data, _status){
            _resolve(_data);
        });
    });
}

/**
 * Updates the result table.
 */
function updateResultTable(_resultRows)
{
    var resultTable = $("table#resultTable");

    if (_resultRows.length == 0) $(resultTable).html("Keine Einträge vorhanden");
    else
    { // Create the table headers

        var headerRow = $("<tr>");
        for (var propertyName in _resultRows[0])
        {
            headerRow.append($("<th>").html(propertyName));
        }

        resultTable.append($(headerRow));
    }

    for (var i = 0; i < _resultRows.length; i++)
    {
        var resultRow = _resultRows[i];
        var tableRow = $("<tr>");

        // Iterate over the property names (the column titles) of the result row
        for (var propertyName in resultRow) {
            if (resultRow.hasOwnProperty(propertyName))
            {
                var resultCell = resultRow[propertyName];
                tableRow.append($("<td>").html(resultCell));

            }
        }

        $(resultTable).append($(tableRow));
    }
}
