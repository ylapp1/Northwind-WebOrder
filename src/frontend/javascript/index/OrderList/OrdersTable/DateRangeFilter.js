
function DateRangeFilter()
{
}

DateRangeFilter.prototype = {

    /**
     * Initializes the date range filter.
     *
     * @param {Node} _bootstrapTable The bootstrap-table element
     * @param {Object} _column The column settings
     * @param {string} _isVisible The value for the visibility css property
     */
    getDateRangeFilterInput: function(_bootstrapTable, _column, _isVisible, _not)
    {
        var inputField =  $("<input/>", {
            "data-filter-field": _column.field,
            type: "text",
            class: "form-control",
            style: "visibility: " + _isVisible + ";"
        });

        this.initializeFlatpickr();

        return inputField;
    },

    initializeFlatpickr: function(){

        // Set the flatpickr language to german
        flatpickr.localize(flatpickr.l10ns.de);

        var self = this;
        dataFetcher.get("date-range").then(function(_dateRange){

            var inputField = $("input.form-control[data-filter-field=\"BestellDatum\"]");

            var minDate = new Date(_dateRange[0].minimum_order_date);
            var maxDate = new Date(_dateRange[0].maximum_order_date);

            self.currentSelectedMinDate = minDate;
            self.currentSelectedMaxDate = maxDate;

            // Initialize the date range picker
            self.flatpickr = $(inputField).flatpickr({
                minDate: minDate,
                maxDate: maxDate,
                defaultDate: [ minDate, maxDate ],
                defaultHour: 0,
                defaultMinute: 0,
                mode: "range",
                animate: false,
                position: "below",
                weekNumbers: true,
                locale: {
                    rangeSeparator: " - "
                },
                dateFormat: "d.m.Y",
                onClose: function(_selectedDates){

                    var selectedMinDate = new Date(_selectedDates[0] + "UTC");
                    if (selectedMinDate.getHours() === 4) selectedMinDate = minDate;

                    var selectedMaxDate = new Date(_selectedDates[1] + "UTC");
                    if (selectedMaxDate.getHours() === 4) selectedMaxDate = maxDate;

                    if (! selectedMaxDate) selectedMaxDate = maxDate;

                    if (! deepEqual(self.currentSelectedMinDate, selectedMinDate) ||
                        ! deepEqual(self.currentSelectedMaxDate, selectedMaxDate))
                    {
                        self.currentSelectedMinDate = selectedMinDate;
                        self.currentSelectedMaxDate = selectedMaxDate;

                        self.filterByDateRange();
                    }

                    var inputField = $("input.form-control[data-filter-field=\"BestellDatum\"]");
                }
            });
        });
    }
};
