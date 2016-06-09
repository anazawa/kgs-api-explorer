"use strict";

angular.module("kgsApiExplorer.directives", [
]).
directive("callbackKey", function () {
    return {
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.callbackKey = function (modelValue, viewValue) {
                return ctrl.$isEmpty(modelValue) ||
                       (Math.floor(modelValue) === modelValue && modelValue >= 0);
            };
        }
    };
}).
directive("channelId", function () {
    return {
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.channelId = function (modelValue, viewValue) {
                return ctrl.$isEmpty(modelValue) ||
                       (Math.floor(modelValue) === modelValue && modelValue >= 1);
            };
        }
    };
}).
directive("channelIdList", function () {
    var isChannelId = function (str) {
        return /^[1-9]\d*$/.test(str);
    };

    return {
        priority: 110,
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$$parserName = "channelIdList";
            ctrl.$parsers.push(function (value) {
                if (value && value.every(isChannelId)) {
                    return value.map(function (v) { return parseInt(v, 10); });
                }
            });
        }
    };
});

