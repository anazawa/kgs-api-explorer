"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.services" 
]).
controller("requestCtrl", function ($scope, $http, kgsPoller) {
    var MESSAGE_TYPES = [
        "LOGIN",
        "LOGOUT"
    ];
    $http.get("data/locales.json").then(function (response) {
        $scope.locales = response.data;
    });

    $scope.isPolling = false;
    $scope.message = { type: "LOGIN" };
    $scope.history = [];
    $scope.types = MESSAGE_TYPES.slice(0, 1);

    kgsPoller.
    on("LOGIN_SUCCESS", function () {
        $scope.types = MESSAGE_TYPES.slice(1);
        $scope.message = { type: $scope.types[0] };
    }).
    on("LOGOUT", function () {
        $scope.types = MESSAGE_TYPES.slice(0, 1);
        $scope.message = { type: $scope.types[0] };
    });

    $scope.send = function () {
        kgsPoller.send($scope.message);
        $scope.history.unshift($scope.message);
    };
}).
controller("responseCtrl", function ($scope, kgsPoller) {
    $scope.messages = [];
    $scope.isPolling = false;
    kgsPoller.
    on("message", function (message) {
        $scope.messages.unshift(message);
    }).
    on("HELLO", function () {
        $scope.isPolling = true;
    }).
    on("LOGOUT", function () {
        $scope.isPolling = false;
    });
}).
controller("summaryCtrl", function ($scope) {
});

