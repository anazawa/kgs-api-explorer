"use strict";

angular.module("kgsApiExplorer.services", [
]).
factory("client", function ($log, $rootScope, $q, $timeout) {
    var self = kgsClient({ logger: $log }),
        upstreamMessages = [],
        downstreamMessages = [];

    self.upstreamMessages = function () {
        return upstreamMessages;
    };

    self.downstreamMessages = function () {
        return downstreamMessages;
    };

    self.emit = (function (superEmit) {
        return function () {
            var args = arguments;
            $timeout(function () {
                superEmit.apply(self, args);
            });
        };
    }(self.emit));

    self.send = (function (superSend) {
        return function (message) {
            upstreamMessages.push({
                date: new Date(),
                body: message
            });
            return $q(function (resolve, reject) {
                superSend.call(self, message, resolve, reject);
            });
        };
    }(self.send));

    self.toString = function (replacer, space) {
        return JSON.stringify({
            apiEndpoint: self.url(),
            upstream: upstreamMessages,
            downstream: downstreamMessages,
            errors: []
        }, replacer, space);
    };

    self.on("message", function (message) {
        self.emit(message.type, message);
        downstreamMessages.push({
            date: new Date(),
            body: message
        });
    });

    self.on("error", function (error) {
        self.logger().error(error);
    });

    return self;
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

