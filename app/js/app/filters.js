"use strict";

angular.module("kgsApiExplorer.filters", [
]).
filter("keys", function () {
    return function (obj) {
        return Object.keys(obj);
    };
});

