"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.directives",
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
 
    $scope.history = [];
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
                $scope.history.unshift($scope.message);
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
controller("downstreamCtrl", function ($scope, kgsPoller, parseQuery) {
    $scope.messages = [];
    $scope.isPolling = false;
    $scope.error = "";
    $scope.parseQuery = parseQuery;

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
        var index = $scope.channels.findIndex(function (channel) {
            return channel.id === message.channelId;
        });
        $scope.channels.splice(index, 1);
    }).
    on("LOGOUT", function () {
        $scope.channels = null;
    });
}).
controller("aboutCtrl", function ($scope, kgsPoller) {
    kgsPoller.
    on("HELLO", function (message) {
        $scope.serverVersion = {
            major: message.versionMajor,
            minor: message.versionMinor,
            bugfix: message.versionBugfix,
            toString: function () {
                return this.major+"."+this.minor+"."+this.bugfix;
            }
        };
        $scope.clientBuild = message.jsonClientBuild;
    }).
    on("LOGOUT", function () {
        $scope.serverVersion = null;
        $scope.clientBuild = null;
    });
});

