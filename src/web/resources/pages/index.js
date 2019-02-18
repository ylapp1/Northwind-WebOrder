
$(document).ready(function(){

    fetchDataRows().then(function(_dataRows){
        initializeResultTable(_dataRows);
        renderResultTable();
        initializeFilters();
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
 * Initialize the results and filters for the result table.
 */
function initializeResultTable(_resultRows)
{
    $("table#resultTable").data("rows", _resultRows);
    $("table#resultTable").data("filters", {});
}

/**
 * Renders the result table.
 */
function renderResultTable()
{
    var resultTable = $("table#resultTable");
    resultTable.empty();

    var resultRows = applyFilters(resultTable.data("rows"), resultTable.data("filters"));

    if (resultRows.length == 0) $(resultTable).html("Keine Einträge vorhanden");
    else
    { // Create the table headers

        var headerRow = $("<tr>");
        for (var propertyName in resultRows[0])
        {
            headerRow.append($("<th>").html(propertyName));
        }

        resultTable.append($(headerRow));
    }

    for (var i = 0; i < resultRows.length; i++)
    {
        var resultRow = resultRows[i];
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

/**
 * Applies the filters to the order data rows and returns only the rows that match the filters.
 */
function applyFilters(_rows, _filters)
{
    var resultRows = [];

    for (var i = 0; i < _rows.length; i++)
    {
        var row = _rows[i];
        var rowMatchesFilters = true;

        // Iterate over the property names (the column titles) of the result row
        for (var columnName in _filters) {
            if (row.hasOwnProperty(columnName))
            {
                if (_filters[columnName] !== "all")
                {
                    var columnValue = row[columnName];
                    if (columnValue !== _filters[columnName])
                    {
                        rowMatchesFilters = false;
                        break;
                    }
                }
            }
        }

        // Check the date range
        var orderDate = Date.parse(row.BestellDatum);
        if (_filters.dateFrom && orderDate < _filters.dateFrom) rowMatchesFilters = false;
        if (_filters.dateTo && orderDate > _filters.dateTo) rowMatchesFilters = false;

        if (rowMatchesFilters) resultRows.push(row);
    }

    return resultRows;
}

/**
 * Initializes the available list filters.
 */
function initializeFilters()
{
    initializeComboBox("select#customerFilter", "customers", "Kunde");
    initializeComboBox("select#workerFilter", "workers", "Sachbearbeiter");
    initializeComboBox("select#providerFilter", "providers", "Lieferant");
    initializeDateRangeFilter("input#dateRangeFilter", "dateRange");
}

/**
 * Initializes a combo box.
 *
 * @param String _comboBoxSelector The combo box selector
 * @param String _dataURL The url from which the values for the combo box can be fetched
 * @param String _optionValueKey The key of the values in the data rows
 */
function initializeComboBox(_comboBoxSelector, _dataURL, _optionValueKey)
{
    var comboBox = $(_comboBoxSelector);
    comboBox.empty();
    comboBox.append($("<option value=\"all\">Alle</option>"));

    $.get(_dataURL, function(_data, _status){
        for (var i = 0; i < _data.length; i++)
        {
            var optionValue = _data[i][_optionValueKey];
            comboBox.append($("<option value=\"" + optionValue + "\">" + optionValue + "</option>"));
        }
    });

    comboBox.on("change", function(_event){
        var comboBox = $(_event.target);
        var selectedOption = $(_event.target).find("option:selected")[0];

        var resultTable = $("table#resultTable");
        resultTable.data("filters")[comboBox.data("column")] = $(selectedOption).val();
        renderResultTable();
    });
}

/**
 * Initializes the date range filter.
 *
 * @param String _inputFieldSelector The input field selector
 * @param String _dateURL The URL from which the min and max date can be fetched
 */
function initializeDateRangeFilter(_inputFieldSelector, _dataURL)
{
    var inputField = $(_inputFieldSelector);
    inputField.val = null;

    $.get(_dataURL, function(_data, _status){

        var minDate = Date.parse(_data[0].MinBestellDatum);
        var maxDate = Date.parse(_data[0].MaxBestellDatum);

        // Initialize the date range picker
        $(_inputFieldSelector).flatpickr({
            minDate: minDate,
            maxDate: maxDate,
            defaultDate: [ minDate, maxDate ],
            mode: "range",
            formatDate: function(_selectedDate){
                return _selectedDate.toLocaleDateString("de-DE");
            },
            locale: {
                rangeSeparator: " bis "
            },
            onClose: function(_selectedDates){
                var resultTable = $("table#resultTable");

                var minDate = _selectedDates[0];
                var maxDate = _selectedDates[1];
                minDate.setHours(minDate.getHours() + 2);
                maxDate.setHours(maxDate.getHours() + 2);

                resultTable.data("filters")["dateFrom"] = minDate;
                resultTable.data("filters")["dateTo"] = maxDate;

                renderResultTable();
            }
        });

    });
}
