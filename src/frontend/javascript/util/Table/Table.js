/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Displays data rows on the website.
 * Internally uses bootstrap-table.
 */
function Table()
{
    this.tableConfig = {};
    this.filters = [];
}

Table.prototype = {

    /**
     * Creates this Table from a specified element.
     *
     * @param {Node} _element The element
     */
    createFromElement: function(_element)
    {
        this.tableElement = _element;
        this.bootstrapTable = $(_element).bootstrapTable(this.tableConfig);
    },

    /**
     * Appends this Table to a specified element.
     *
     * @param {Node} _element The element
     */
    appendToElement: function(_element)
    {
        $(_element).append(this.createFromElement($("<table/>")));
    },

    /**
     * Applies the custom filters to all table rows.
     */
    applyFilters()
    {
        var filteredDataRows = [];
        var self = this;

        this.dataRows.forEach(function(_dataRow){

            var rowMatchesFilters = true;
            for (var i = 0; i < self.filters.length; i++)
            {
                if (! self.filters[i].rowMatchesFilter(_dataRow))
                {
                    rowMatchesFilters = false;
                    break;
                }
            }

            if (rowMatchesFilters) filteredDataRows.push(_dataRow);
        });

        // Load the filtered data rows into the bootstrap table
        $(this.tableElement).bootstrapTable("load", filteredDataRows);
    },


    /**
     * Event handler that is called when one of the custom filters is filtered.
     */
    onFilter()
    {
        /*
         * For some reason multiple filters at once do not work with the OrdersTable so this method manually filters the data rows
         * and loads the filtered rows into the orders table.
         */
        var fixedTableHeader = $(this.tableElement).closest(".bootstrap-table").find(".fixed-table-header");

        // Find the selected combo box values
        var selectedValues = {};
        $(fixedTableHeader).find("select").each(function(_i, _select){

            var selectValue = $(_select).val();
            if (selectValue !== "")
            {
                selectedValues[$(_select).data("filter-field")] = selectValue;
            }
        });

        /*
         * Check if the selected values match the last selected values, this is necessary to avoid a infinite loop because the load
         * method triggeres this event handler.
         */
        if (deepEqual(this.lastSelectedValues, selectedValues)) return;
        else this.lastSelectedValues = selectedValues;

        var filteredRows = [];
        this.dataRows.forEach(function(_row){

            var rowMatchesFilters = true;
            for (var fieldName in selectedValues)
            {
                if (selectedValues.hasOwnProperty(fieldName))
                {
                    if (selectedValues[fieldName] !== _row[fieldName])
                    {
                        rowMatchesFilters = false;
                        break;
                    }
                }
            }

            if (rowMatchesFilters) filteredRows.push(_row);
        });

        $(this.tableElement).bootstrapTable("load", filteredRows);
    },

    /**
     * Initializes all custom filters for this table.
     * @protected
     */
    initializeFilters: function()
    {
        var self = this;
        this.filters.forEach(function(_filter){

            // Find the column with the target field name
            self.tableConfig.columns.forEach(function(_columnConfig){

                if (_columnConfig.field === _filter.getTargetFieldName())
                {
                    _columnConfig.filter = {
                        template: _filter.template.bind(_filter),
                        setFilterValue: _filter.setFilterValue.bind(_filter)
                    };
                }
            });
        });
    },

    /**
     * Initializes the bootstrap table configuration for this table.
     * @protected
     */
    initializeConfig: function()
    {
        var self = this;
        this.addEventHandler("onPostHeader", function(){
            self.forwardEventToFilters("onPostHeader");
        });

        this.addEventHandler("onLoadSuccess", function(_dataRows){
            if (self.filters.length > 0)
            {
                self.dataRows = _dataRows;
                self.applyFilters();
            }
        });
    },

    /**
     * Adds a event handler to the table configuration on top of a custom event handler if necessary.
     *
     * @param {string} _eventName The event name
     * @param {function} _eventHandler The event handling function
     * @private
     */
    addEventHandler: function(_eventName, _eventHandler)
    {
        var customEventHandler = this.tableConfig[_eventName];
        if (customEventHandler)
        {
            this.tableConfig[_eventName] = function(){
                _eventHandler();
                customEventHandler();
            };
        }
        else this.tableConfig[_eventName] = _eventHandler;
    },

    /**
     * Forwards an event to all custom filters.
     *
     * @param {string} _eventName The event name
     * @private
     */
    forwardEventToFilters: function(_eventName)
    {
        this.filters.forEach(function(_filter){
            _filter[_eventName]();
        });
    }
};
