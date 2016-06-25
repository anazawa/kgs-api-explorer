"use strict";

angular.module("kgsApiExplorer.services", [
]).
factory("kgsPoller", function ($log, $rootScope, $q) {
    var that = kgsPoller({
        logger: $log
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
            var listenerCount = superEmit.apply(this, arguments);
            if (listenerCount) {
                $rootScope.$apply();
            }
            return listenerCount;
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

    that.on("error", function (error) {
        this.logger().error(error);
    });

    return that;
}).
service("page", function () {
    var that = {};

    that.totalEntries = function () {
        return this.entries.length;
    };

    that.firstPage = function () {
        return 1;
    };

    that.lastPage = function () {
        return Math.ceil(this.totalEntries()/this.entriesPerPage) || 1;
    };

    that.previousPage = function () {
        return this.currentPage > 1 ? this.currentPage-1 : null;
    };

    that.nextPage = function () {
        return this.currentPage < this.lastPage() ? this.currentPage+1 : null;
    };

    that.first = function () {
        return this.totalEntries() && (this.currentPage-1)*this.entriesPerPage;
    };

    that.last = function () {
        if (this.currentPage === this.lastPage()) {
            return Math.max(0, this.totalEntries()-1);
        }
        return this.currentPage*this.entriesPerPage-1;
    };

    return that;
});

