/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides a date range filter element.
 * Internally uses flatpickr.
 *
 * @param {Table} _parentTable The parent table
 * @param {string} _targetFieldName The name of this filters target field
 * @param {function} _filterFunction The function that returns whether a rows date matches this filter
 */
function DateRangeFilter(_parentTable, _targetFieldName, _filterFunction)
{
    Filter.call(this, _parentTable, _targetFieldName);
    this.elementId = this.targetFieldName + "-daterange-filter";
    this.filterFunction = _filterFunction;

    this.initializeFlatPickr();
}

DateRangeFilter.prototype = Object.create(Filter.prototype);
DateRangeFilter.prototype.constructor = DateRangeFilter;


// Public Methods

/**
 * Sets the minimum and a maximum date for the date range picker.
 *
 * @param {Date} _minimumDate The minimum selectable date
 * @param {Date} _maximumDate The maximumm selectable date
 */
DateRangeFilter.prototype.loadData = function(_minimumDate, _maximumDate)
{
    this.minDate = _minimumDate;
    this.minDate.setHours(0, 0, 0, 0);

    this.maxDate = _maximumDate;
    this.maxDate.setHours(23, 59, 59, 999);

    this.currentSelectedMinDate = this.minDate;
    this.currentSelectedMaxDate = this.maxDate;

    if (this.flatpickr)
    {
        this.flatpickr.set("minDate", this.minDate);
        this.flatpickr.set("maxDate", this.maxDate);
        this.flatpickr.setDate([ this.currentSelectedMinDate, this.currentSelectedMaxDate ]);
    }
};

/**
 * Returns whether a specific row matches this Filter's current filter value.
 *
 * @param {mixed[]} _row The data row
 *
 * @return {bool} True if this Filter's current filter value matches the row, false otherwise
 */
DateRangeFilter.prototype.rowMatchesFilter = function(_row)
{
    if (! this.currentSelectedMinDate && ! this.currentSelectedMaxDate)
    { // If no filter values are set every row matches
        return true;
    }
    else return this.filterFunction(_row, this.currentSelectedMinDate, this.currentSelectedMaxDate);
};


// Event handlers

/**
 * Event handler that is called after the rendering of the table header is finished.
 */
DateRangeFilter.prototype.onPostHeader = function()
{
    // Find the input element inside the "fixed-table-header"
    var fixedTableBody = $(this.parentTable.tableElement).closest(".bootstrap-table").find(".fixed-table-header");
    var fixedTableBodyDateRangeFilter = $(fixedTableBody).find("input#" + this.elementId)[0];

    if (! fixedTableBodyDateRangeFilter._flatpickr)
    { // If the element in the fixed table header is no flatpickr input

        if (this.flatpickr) this.flatpickr.destroy();
        this.flatpickr = flatpickr(fixedTableBodyDateRangeFilter, this.getFlatpickrConfig());
    }
    else fixedTableBodyDateRangeFilter._flatpickr.setDate([ this.currentSelectedMinDate, this.currentSelectedMaxDate ]);
};


// Protected Methods

/**
 * Creates and returns a element that can be used by the user to input data into this filter.
 *
 * @treturn {Node} The input element
 * @protected
 */
DateRangeFilter.prototype.createFilterElement = function()
{
    return $("<input/>", {
        id: this.elementId,
        type: "text",
        class: "form-control"
    });
};


// Private Methods

/**
 * Initializes general flatpickr settings.
 * @private
 */
DateRangeFilter.prototype.initializeFlatPickr = function()
{
    // Set the flatpickr language to german
    flatpickr.localize(flatpickr.l10ns.de);
};

/**
 * Initializes the flatpickr configuration object for flatpickr input elements.
 *
 * @return {Object} The flatpickr configuration
 * @private
 */
DateRangeFilter.prototype.getFlatpickrConfig = function(_selectedDates)
{
    return {

        // Set the mode to range instead of single date selection
        mode: "range",

        // Range limits
        minDate: this.minDate,
        maxDate: this.maxDate,

        // Default values
        defaultDate: [ this.currentSelectedMinDate, this.currentSelectedMaxDate ],
        defaultHour: 0,
        defaultMinute: 0,

        // Behaviour

        // Disable the animation because in Firefox some elements inside the "calendar" shift to the right during the animation
        // which looks not very good
        animate: false,

        position: "below",

        // Style
        weekNumbers: true,
        locale: {
            rangeSeparator: " - "
        },
        dateFormat: "d.m.Y",

        // Event Handlers
        onClose: this.onDateRangeFilterClose.bind(this)
    };
};

/**
 * Handles the onClose event of the flatpickr input element.
 *
 * @param {Date[]} _selectedDates The dates that were selected inside the flatpickr calendar
 * @private
 */
DateRangeFilter.prototype.onDateRangeFilterClose = function(_selectedDates)
{
    // Fetch the selected minimum date
    var selectedMinDate;
    if (_selectedDates[0])
    {
        selectedMinDate = _selectedDates[0];
        selectedMinDate.setHours(0, 0, 0, 0);

        if (deepEqual(this.minDate, selectedMinDate)) selectedMinDate = this.minDate;
    }
    else selectedMinDate = this.minDate;

    // Fetch the selected maximum date
    var selectedMaxDate;
    if (_selectedDates[1])
    {
        selectedMaxDate = _selectedDates[1];
        selectedMaxDate.setHours(23, 59, 59, 999);

        if (deepEqual(this.maxDate, selectedMaxDate)) selectedMaxDate = this.maxDate;
    }
    else selectedMaxDate = this.maxDate;

    // Check if the current selected dates must be changed
    if (this.minDate === selectedMinDate && this.maxDate === selectedMaxDate)
    {
        this.currentSelectedMinDate = null;
        this.currentSelectedMaxDate = null;
    }
    else if (this.currentSelectedMinDate !== selectedMinDate || this.currentSelectedMaxDate !== selectedMaxDate)
    {
        this.currentSelectedMinDate = selectedMinDate;
        this.currentSelectedMaxDate = selectedMaxDate;

        this.parentTable.applyFilters();
    }
};
