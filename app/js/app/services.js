"use strict";

angular.module("kgsApiExplorer.services", [
]).
factory("kgsPoller", function ($log, $rootScope, $q) {
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

    that.send = (function (superSend) {
        return function (message) {
            var that = this;
            return $q(function (resolve, reject) {
                superSend.call(that, message, resolve, reject);
            });
        };
    }(that.send));

    return that;
});

