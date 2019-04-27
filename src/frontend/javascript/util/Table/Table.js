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
    this.selectedComboBoxValues = {};
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

            /*
             * For some reason multiple combo box filters at once do not work with the OrdersTable so this method manually filters
             * the data rows and loads the filtered rows into the orders table.
             */
            for (var fieldName in self.selectedComboBoxValues)
            {
                if (self.selectedComboBoxValues.hasOwnProperty(fieldName))
                {
                    if (self.selectedComboBoxValues[fieldName] !== _dataRow[fieldName])
                    {
                        rowMatchesFilters = false;
                        break;
                    }
                }
            }

            if (rowMatchesFilters) filteredDataRows.push(_dataRow);
        });

        // Load the filtered data rows into the bootstrap table
        $(this.tableElement).bootstrapTable("load", filteredDataRows);
    },

    /**
     * Event handler that is called after the rendering of the table header is finished.
     */
    onPostHeader: function()
    {
        var fixedTableHeaderSelectElements = $(this.tableElement).closest(".bootstrap-table").find(".fixed-table-header").find("select");

        var self = this;
        $(fixedTableHeaderSelectElements).on("select2:select", function(_event){
            var dataField = $(_event.target).data("filter-field");
            var selectedValue = $(_event.target).val();
            if (selectedValue === "") selectedValue = null;

            self.setSelectedComboBoxValue(dataField, selectedValue);
        });

        // Must use unselecting because unselect doesn't fire
        $(fixedTableHeaderSelectElements).on("select2:unselecting", function(_event){
            var dataField = $(_event.target).data("filter-field");
            self.setSelectedComboBoxValue(dataField, null);
        });
    },

    /**
     * Sets the internally selected value of one of the combo box filters.
     *
     * @param {string} _dataField The name of the data field
     * @param {mixed} _value The new value
     */
    setSelectedComboBoxValue: function(_dataField, _value)
    {
        var valueEqualsCurrentValue = ((! this.selectedComboBoxValues[_dataField] && _value === null) ||
                                       this.selectedComboBoxValues[_dataField] === _value);

        if (! valueEqualsCurrentValue)
        {
            if (_value === null) delete this.selectedComboBoxValues[_dataField];
            else this.selectedComboBoxValues[_dataField] = _value;
            this.applyFilters();
        }
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
            self.onPostHeader();
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
