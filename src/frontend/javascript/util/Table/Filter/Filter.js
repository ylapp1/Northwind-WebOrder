/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Base class for custom table filters.
 * These filters are added to the table headers with the select2-filter bootstrap-table extension but the filtering is
 * done manually.
 *
 * @param {Table} _parentTable The parent table of this Filter
 * @param {string} _targetFieldName The name of this filters target field
 */
function Filter(_parentTable, _targetFieldName)
{
    this.parentTable = _parentTable;
    this.targetFieldName = _targetFieldName;
}

Filter.prototype = {

    // Getters and Setters

    /**
     * Returns the target field name of this Filter.
     *
     * @return {string} The target field name
     */
    getTargetFieldName: function()
    {
        return this.targetFieldName;
    },


    // Public Methods

    /**
     * Appends this Filter's element to the bootstrap-table header.
     * The template method is supposed to return a node that the select2-filter extension can insert into the header, however that
     * functionality is buggy so this is done manually.
     *
     * @param {Object} _bootstrapTable The bootstrap-table data
     * @param {Object} _column The column settings
     * @param {string} _isVisible The value for the visibility css property
     */
    template: function(_bootstrapTable, _column, _isVisible)
    {
        var filterElement = this.createFilterElement();
        $(filterElement).css("visibility", _isVisible);

        var targetFieldColumnHeader = _bootstrapTable.$header.find("th[data-field=\"" + _column.field + "\"] div.filter")[0];
        $(targetFieldColumnHeader).append(filterElement);
    },

    /**
     * Sets the filter value of this Filter's HTML element to a specific value (not).
     *
     * @param {Node} _filterElement The filter element
     * @param {Object} _field The field configuration
     * @param {mixed} _value The value to set this Filter's HTML element to
     */
    setFilterValue: function(_filterElement, _field, _value)
    {
        // Ignore the filter value, select2-filter doesn't know this Filter's value or how it does filtering
        this.parentTable.onFilter();
    },

    /**
     * Returns whether a specific row matches this Filter's current filter value.
     *
     * @param {mixed[]} _row The data row
     *
     * @return {bool} True if this Filter's current filter value matches the row, false otherwise
     */
    rowMatchesFilter: function(_row)
    {
    },


    // Event Handlers

    /**
     * Event handler that is called after the rendering of the table header is finished.
     */
    onPostHeader: function()
    {
    },

    // Protected Methods

    /**
     * Creates and returns a element that can be used by the user to input data into this filter.
     *
     * @treturn {Node} The input element
     * @protected
     */
    createFilterElement: function()
    {
    }
};
