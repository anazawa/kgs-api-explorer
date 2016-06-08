"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.services" 
]).
controller("headerCtrl", function ($scope) {
    var messages = [
        "for testing!",
        "for developing!",
        "for fun!"
    ];
    $scope.message = messages[Math.floor(Math.random()*messages.length)];
}).
controller("upstreamCtrl", function ($scope, $http, kgsPoller) {
    var MESSAGE_TYPES = [
        "CHAT",
        "DETAILS_JOIN_REQUEST",
        "JOIN_ARCHIVE_REQUEST",
        "JOIN_TAG_ARCHIVE_REQUEST",
        "LOGOUT",
        "REQUEST_SERVER_STATS",
        "SYNC_REQUEST",
        "UNJOIN_REQUEST",
        "WAKE_UP"
    ];
    $http.get("data/locales.json").then(function (response) {
        $scope.locales = response.data;
    });

    $scope.types = ["LOGIN"];
    $scope.message = { type: "LOGIN" };
    $scope.history = [];
    $scope.isSending = false;
    $scope.error = "";

    $scope.send = function (form) {
        if (form.$valid) {
            $scope.isSending = true;
            kgsPoller.send($scope.message).then(function () {
                $scope.isSending = false;
                $scope.history.unshift($scope.message);
                if (kgsPoller.isLoggedIn()) {
                    $scope.message = { type: $scope.types[0] };
                }
                form.$setPristine();
                form.$setUntouched();
            }, function (xhr) {
                $scope.error = xhr.status ? xhr.status+" "+xhr.statusText : "";
            });
        }
    };

    kgsPoller.
    on("LOGIN_SUCCESS", function () {
        $scope.types = MESSAGE_TYPES.slice(0);
        $scope.message = { type: $scope.types[0] };
    }).
    on("LOGOUT", function () {
        $scope.types = ["LOGIN"];
        $scope.message = { type: "LOGIN" };
    });
}).
controller("downstreamCtrl", function ($scope, kgsPoller) {
    $scope.messages = [];
    $scope.isPolling = false;
    $scope.error = "";

    kgsPoller.
    on("message", function (message) {
        $scope.messages.unshift(message);
    }).
    on("HELLO", function () {
        $scope.isPolling = true;
    }).
    on("LOGOUT", function () {
        $scope.isPolling = false;
    }).
    on("error", function (error) {
        if (error.type === "kgsPollerPollingError") {
            $scope.error = error.toString();
        }
    });
}).
controller("channelSubscriptionsCtrl", function ($scope, kgsPoller) {
    kgsPoller.
    on("LOGIN_SUCCESS", function () {
        $scope.channels = {};
    }).
    on("ROOM_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "ROOM"
        };
    }).
    on("GAME_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "GAME"
        };
    }).
    on("CONVO_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "ARCHIVE"
        };
    }).
    on("ARCHIVE_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "ARCHIVE"
        };
    }).
    on("TAG_ARCHIVE_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "TAG_ARCHIVE"
        };
    }).
    on("DETAILS_JOIN", function (message) {
        $scope.channels[message.channelId] = {
            type: "DETAILS"
        };
    }).
    on("UNJOIN", function (message) {
        delete $scope.channels[message.channelId];
    }).
    on("LOGOUT", function () {
        $scope.channels = null;
    });
});

