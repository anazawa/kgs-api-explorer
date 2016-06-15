"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.directives",
    "kgsApiExplorer.services" 
]).
controller("headerCtrl", function ($scope, kgsPoller) {
    var messages = [
        "for testing!",
        "for developing!",
        "for fun!"
    ];
    $scope.message = messages[Math.floor(Math.random()*messages.length)];
}).
controller("upstreamCtrl", function ($scope, $http, kgsPoller) {
    var DEFAULT_MESSAGES = {};
    var reset = function (availableTypes, type) {
        availableTypes = availableTypes || $scope.availableTypes;
        type = type || availableTypes[0];
        $scope.availableTypes = availableTypes;
        $scope.message = angular.copy(DEFAULT_MESSAGES[type]);
    };

    $http.get("data/default-messages.json").then(function (response) {
        response.data.forEach(function (message) {
            DEFAULT_MESSAGES[message.type] = message;
        });
        reset(["LOGIN"]);
    });

    $http.get("data/locales.json").then(function (response) {
        $scope.locales = response.data;
    });

    $scope.history = kgsPoller.upstreamMessages();
    $scope.isSending = false;
    $scope.error = "";

    $scope.reset = function (form) {
        form.$setPristine();
        form.$setUntouched();
        reset($scope.availableTypes, $scope.message.type);
    };

    $scope.send = function (form) {
        if (form.$valid) {
            $scope.isSending = true;
            kgsPoller.send($scope.message).then(function () {
                $scope.isSending = false;
                form.$setPristine();
                form.$setUntouched();
                if (kgsPoller.isLoggedIn()) {
                    reset();
                }
            }, function (xhr) {
                $scope.error = xhr.status ? xhr.status+" "+xhr.statusText : "";
            });
        }
    };

    kgsPoller.
    on("LOGIN_SUCCESS", function () {
        reset([
            "AVATAR_REQUEST",
            "CHAT",
            "DETAILS_CHANGE",
            "DETAILS_JOIN_REQUEST",
            "JOIN_ARCHIVE_REQUEST",
            "JOIN_TAG_ARCHIVE_REQUEST",
            "LOGOUT",
            "REQUEST_SERVER_STATS",
            "ROOM_NAMES_REQUEST",
            "SYNC_REQUEST",
            "UNJOIN_REQUEST",
            "WAKE_UP"
        ]);
    }).
    on("LOGOUT", function () {
        reset(["LOGIN"]);
    });
}).
controller("downstreamCtrl", function ($scope, kgsPoller) {
    $scope.messages = kgsPoller.downstreamMessages();
    $scope.isPolling = false;
    $scope.error = "";

    kgsPoller.
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
controller("channelsCtrl", function ($scope, kgsPoller) {
    kgsPoller.
    on("LOGIN_SUCCESS", function () {
        $scope.channels = [];
    }).
    on("message", function (message) {
        if (/_JOIN$/.test(message.type)) {
            $scope.channels.push({
                id: message.channelId,
                type: message.type.replace(/_JOIN/, "")
            });
        }
    }).
    on("UNJOIN", function (message) {
        $scope.channels.splice($scope.channels.findIndex(function (channel) {
            return channel.id === message.channelId;
        }), 1);
    }).
    on("LOGOUT", function () {
        $scope.channels = null;
    });
}).
controller("exportCtrl", function ($scope, kgsPoller) {
    $scope.isAvailable = typeof Blob === "function";
    $scope.hidePassword = true;
    $scope.indent = "4";
    $scope.export = function () {
        saveAs(
            new Blob(
                [kgsPoller.toString(
                    !$scope.hidePassword ? null : function (key, value) {
                        return key === "password" ? "" : value;
                    },
                    $scope.indent === "tab" ? "\t" : parseInt($scope.indent, 0)
                )],
                { type: "application/json" }
            ),
            "kgs-messages.json"
        );
    };
});

