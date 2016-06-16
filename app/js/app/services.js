"use strict";

angular.module("kgsApiExplorer.services", [
]).
factory("kgsPoller", function ($log, $rootScope, $q) {
    var that = kgsPoller({
        logger: $log,
        url: "http://metakgs.org/api/access-201606062314"
    });

    that.upstreamMessages = function () {
        this._upstreamMessages = this._upstreamMessages || [];
        return this._upstreamMessages;
    };

    that.downstreamMessages = function () {
        this._downstreamMessages = this._downstreamMessages || [];
        return this._downstreamMessages;
    };

    that.emit = (function (superEmit) {
        return function () {
            var ret = superEmit.apply(this, arguments);
            $rootScope.$apply();
            return ret;
        };
    }(that.emit));

    that.send = (function (superSend) {
        return function (message) {
            this.upstreamMessages().push({
                date: new Date(),
                body: message
            });
            var that = this;
            return $q(function (resolve, reject) {
                superSend.call(that, message, resolve, reject);
            });
        };
    }(that.send));

    that.toString = function (replacer, space) {
        return JSON.stringify({
            apiEndpoint: this.url(),
            upstream: this.upstreamMessages(),
            downstream: this.downstreamMessages(),
            errors: []
        }, replacer, space);
    };

    that.on("message", function (message) {
        this.downstreamMessages().push({
            date: new Date(),
            body: message
        });
    });

    return that;
});

