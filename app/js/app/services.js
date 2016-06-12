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
}).
factory("parseQuery", function () {
    var source, lastIndex;

    var WHITE_SPACE = /^\s*/g;
    var TERM = /^(?:(\w+):)?(\w+)\s*/g;

    var test = function () {
        var bool = this.exec(source.slice(lastIndex));
        lastIndex += this.lastIndex;
        this.lastIndex = 0;
        return bool;
    };

    var exec = function () {
        var array = this.exec(source.slice(lastIndex));
        lastIndex += this.lastIndex;
        this.lastIndex = 0;
        return array;
    };

    return function (str) {
        source = str || "";
        lastIndex = 0;

        test.call(WHITE_SPACE);

        var query = {};
        while (lastIndex < source.length) {
            var term = exec.call(TERM);

            if (term && term[1]) {
                query[term[1]] = term[2];
            }
            else if (term) {
                query["$"] = term[2];
            }
            else {
                query = str.trim();
                break;
            }
        }

        return query;
    };
});

