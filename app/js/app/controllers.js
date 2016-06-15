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
    var DEFAULTS = {
        CHAT: {
            type: "CHAT",
            text: ""
        },
        DETAILS_CHANGE: {
            type: "DETAILS_CHANGE",
            personalName: "",
            personalEmail: "",
            personalInfo: "",
            authLevel: "normal"
        },
        LOGIN: {
            type: "LOGIN",
            locale: "en_US"
        },
        ROOM_NAMES_REQUEST: {
            type: "ROOM_NAMES_REQUEST",
            rooms: []
        }
    };

    $http.get("data/locales.json").then(function (response) {
        $scope.locales = response.data;
    });

    var reset = function (types, type) {
        types = types || $scope.types;
        type = type || types[0];
        $scope.types = types;
        $scope.message = angular.copy(DEFAULTS[type] || {
            type: type
        });
    };

    $scope.history = kgsPoller.upstreamMessages();
    $scope.isSending = false;
    $scope.error = "";

    reset(["LOGIN"]);

    $scope.reset = function (form) {
        form.$setPristine();
        form.$setUntouched();
        reset($scope.types, $scope.message.type);
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

