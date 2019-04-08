/**
 * @version 0.1
 * @author Yannick Lapp <yannick.lapp@cn-consult.eu>
 */

/**
 * Provides methods to fetch data from urls and to cache the results.
 * Internally uses the jQuery.get function.
 *
 * @property {Object[]} cachedResults The cached results
 * @property {int} cacheValidDurationInSeconds The number of seconds for which entries in the cache are valid before they must be refreshed
 */
// TODO: Rename to QueryExecutor and use the REST stuff (if enough time to implement this)
function DataFetcher()
{
    this.cachedResults = [];
    this.cacheValidDurationInSeconds = 300;
}

DataFetcher.prototype = {

    /**
     * Fetches data from a URL with a "GET" request.
     *
     * @param {String} _url The URL
     * @param {mixed[]} _parameters The URL parameters
     * @param {boolean} _cacheResult If true the result will be cached
     */
    get: async function(_url, _parameters = {}, _cacheResult = true){

        var cachedResult = this.getCachedResultForUrl(_url, _parameters);

        var self = this;
        return new Promise(function(_resolve){

            if (cachedResult === null)
            {
                $.get(_url, _parameters, function(_data, _status){

                    var result = {
                        url: _url,
                        parameters: _parameters,
                        data: _data,
                        timestamp: Date.now()
                    };

                    if (_cacheResult) self.cachedResults.push(result);

                    _resolve(result.data);

                });
            }
            else _resolve(cachedResult.data);
        });
    },


    // Private Methods

    /**
     * Returns the cached result for a specific url and parameter combination.
     *
     * @param {String} _url The URL
     * @param {mixed[]} _parameters The URL parameters
     *
     * @return {Object|null} The cached result or null if there is no cached result for this url and parameter combination
     * @private
     */
    getCachedResultForUrl: function(_url, _parameters){

        for (var i = 0; i < this.cachedResults.length; i++)
        {
            if (this.cachedResults[i].url === _url && deepEqual(this.cachedResults[i].parameters, _parameters))
            {
                var millisecondsSinceCached = this.cachedResults[i].timestamp - Date.now();
                if (millisecondsSinceCached > this.cacheValidDurationInSeconds * 1000)
                {
                    this.cachedResults.splice(i, i);
                    return null;
                }
                else return this.cachedResults[i];
            }
        }

        return null;
    }
};
