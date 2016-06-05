"use strict";

angular.module("kgsApiExplorer.services", [
]).
factory("kgsPoller", function ($log, $rootScope) {
    var that = kgsPoller({
        logger: $log
    });

    that.emit = (function (superEmit) {
        return function () {
            var ret = superEmit.apply(this, arguments);
            $rootScope.$apply();
            return ret;
        };
    }(that.emit));

    return that;
});

