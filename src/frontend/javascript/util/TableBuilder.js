/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * TableBuilder constructor.
 *
 * @param _tableNode The HTML node of the table
 * @param {Object[]} _dataRows The data rows
 */
function TableBuilder(_tableNode, _dataRows)
{
    this.tableNode = _tableNode;
    this.dataRows = _dataRows;
    this.tableEmptyText = "No data rows";
    this.rowDataAttributes = {};
    this.eventHandlers = {};
    this.columnRenderers = {};
}

/**
 * Renders json data rows to HTML tables.
 *
 * @property tableNode The html node of the result table
 * @property {String[]} columnTitles The column titles (optional)
 * @property {Object} dataRows The data rows
 * @property {String} tableEmptyText The text that will be displayed when the table is empty
 * @property {Object} rowDataAttributes The attributes per data row  whose values will be saved in the table row elements inside "data-x" attributes" (Structure must be "data attribute name": "dataRow property name")
 * @property {Object} eventHandlers The event handlers that will be added per table row
 * @property {Object} columnRenderers Custom renderers for the data row items (Default behaviour is displaying the value as raw text)
 */
TableBuilder.prototype = {

    // Getters and Setters

    setColumnTitles: function(_columnTitles)
    {
        this.columnTitles = _columnTitles;
    },

    setTableEmptyText: function(_tableEmptyText)
    {
        this.tableEmptyText = _tableEmptyText;
    },

    setRowDataAttributes: function(_rowDataAttributes)
    {
        this.rowDataAttributes = _rowDataAttributes;
    },

    setEventHandlers: function(_eventHandlers)
    {
        this.eventHandlers = _eventHandlers;
    },

    setColumnRenderers: function(_columnRenderers)
    {
        this.columnRenderers = _columnRenderers;
    },


    /**
     * Renders a data rows as a table.
     */
    render: function()
    {
        var resultTable = $(this.tableNode);

        // Clear the table
        resultTable.empty();

        if (this.dataRows.length == 0)
        { // There are no data rows, display the "table empty" text
            $(resultTable).html(this.tableEmptyText);
            return;
        }

        // Add the table header row
        var columnTitles;
        if (this.columnTitles) columnTitles = this.columnTitles;
        else columnTitles = Object.getOwnPropertyNames(this.dataRows[0]);

        var headerRow = $("<tr />", {
            class: "header"
        });
        for (var i = 0; i < columnTitles.length; i++)
        {
            headerRow.append($("<th>").html(columnTitles[i]));
        }
        resultTable.append($(headerRow));

        var tableRowClasses = [ "odd", "even" ];

        // Add the table data rows
        for (var i = 0; i < this.dataRows.length; i++)
        {
            var dataRow = this.dataRows[i];
            var tableRow = $("<tr/>", {
                class: tableRowClasses[i % 2]
            });

            // Additional data attributes per row
            for (var attributeName in this.rowDataAttributes)
            {
                if (this.rowDataAttributes.hasOwnProperty(attributeName))
                {
                    $(tableRow).data(attributeName, dataRow[this.rowDataAttributes[attributeName]]);
                }
            }

            // Additional event handlers per row
            for (var eventName in this.eventHandlers)
            {
                if (this.eventHandlers.hasOwnProperty(eventName))
                {
                    $(tableRow).on(eventName, this.eventHandlers[eventName]);
                }
            }

            // Iterate over the property names (the column titles) of the result row
            for (var dataRowColumnName in dataRow)
            {
                if (dataRow.hasOwnProperty(dataRowColumnName))
                {
                    let tableCell = $("<td>");
                    let value = dataRow[dataRowColumnName];
                    let resultCell;
                    if (this.columnRenderers[dataRowColumnName])
                    {
                        resultCell = this.columnRenderers[dataRowColumnName](value);
                        if (typeof resultCell === "string") tableCell.text(resultCell);
                        else tableCell.append(resultCell);
                    }
                    else
                    {
                        resultCell = dataRow[dataRowColumnName];
                        tableCell.html(resultCell);
                    }

                    tableRow.append(tableCell);
                }
            }

            $(resultTable).append($(tableRow));
        }
    }
};


// TODO: orderColumn on click on table header and show the small triangle things

// TODO: Table: min width per column = initial width with all rows + (available space to the right / number of columns)
