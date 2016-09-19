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
}).
directive("kgsMessage", function () {
    return {
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$parsers.push(function (value) {
                if (!angular.isUndefined(value)) {
                    try {
                        var message = JSON.parse(value);
                        if (angular.isString(message.type)) {
                            return message;
                        }
                    }
                    catch (e) {
                    }
                }
            });
            ctrl.$formatters.push(function (value) {
                return JSON.stringify(value, null, 2);
            });
        }
    };
}).
directive("userName", function () {
    return {
        require: "ngModel",
        link: function (scope, elm, attrs, ctrl) {
            ctrl.$validators.userName = function (modelValue) {
                return ctrl.$isEmpty(modelValue) ||
                       /^[a-zA-Z][a-zA-Z0-9]{0,9}$/.test(modelValue);
            };
        }
    };
});

