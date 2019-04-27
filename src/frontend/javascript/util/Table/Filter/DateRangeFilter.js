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

    this.currentSelectedMinDate = null;
    this.currentSelectedMaxDate = null;

    this.initializeFlatPickr();
}

DateRangeFilter.prototype = Object.create(Filter.prototype);
DateRangeFilter.prototype.constructor = DateRangeFilter;


// Public Methods

/**
 * Returns the current selected minimum date.
 *
 * @return {Date} The current selected minimum date
 */
DateRangeFilter.prototype.getCurrentSelectedMinDate = function()
{
    if (this.currentSelectedMinDate === null) return this.minDate;
    else return this.currentSelectedMinDate;
};

/**
 * Returns the current selected maximum date.
 *
 * @return {Date} The current selected maximum date
 */
DateRangeFilter.prototype.getCurrentSelectedMaxDate = function()
{
    if (this.currentSelectedMaxDate === null) return this.maxDate;
    else return this.currentSelectedMaxDate;
};

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

    if (this.flatpickr)
    {
        this.flatpickr.set("minDate", this.minDate);
        this.flatpickr.set("maxDate", this.maxDate);
        this.flatpickr.setDate([ this.minDate, this.maxDate ]);
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
    else return this.filterFunction(_row, this.getCurrentSelectedMinDate(), this.getCurrentSelectedMaxDate());
};


// Event handlers

/**
 * Event handler that is called after the rendering of the table header is finished.
 */
DateRangeFilter.prototype.onPostHeader = function()
{
    // Find the input element inside the "fixed-table-header"
    var fixedTableHeader = $(this.parentTable.tableElement).closest(".bootstrap-table").find(".fixed-table-header");
    var fixedTableHeaderDateRangeFilter = $(fixedTableHeader).find("input#" + this.elementId)[0];

    if (! fixedTableHeaderDateRangeFilter._flatpickr)
    { // If the element in the fixed table header is no flatpickr input

        if (this.flatpickr) this.flatpickr.destroy();
        this.flatpickr = flatpickr(fixedTableHeaderDateRangeFilter, this.getFlatpickrConfig());
    }
    else fixedTableHeaderDateRangeFilter._flatpickr.setDate([ this.getCurrentSelectedMinDate(), this.getCurrentSelectedMaxDate() ]);
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
        defaultDate: [ this.getCurrentSelectedMinDate(), this.getCurrentSelectedMaxDate() ],
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


    var dateRangeChanged = (! deepEqual(this.getCurrentSelectedMinDate(), selectedMinDate) ||
                            ! deepEqual(this.getCurrentSelectedMaxDate(), selectedMaxDate));

    // Check if the current selected dates must be changed
    if (this.minDate === selectedMinDate) this.currentSelectedMinDate = null;
    else this.currentSelectedMinDate = selectedMinDate;

    if (this.maxDate === selectedMaxDate) this.currentSelectedMaxDate = null;
    else this.currentSelectedMaxDate = selectedMaxDate;

    if (dateRangeChanged) this.parentTable.applyFilters();
    else this.flatpickr.setDate([this.getCurrentSelectedMinDate(), this.getCurrentSelectedMaxDate()]);
};
