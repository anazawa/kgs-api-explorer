"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.filters",
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
    $scope.DEFAULT_MESSAGES = {};
    $scope.AUTH_LEVELS = {
        normal: 1,
        robot_ranked: 2,
        teacher: 3,
        jr_admin: 10,
        sr_admin: 11,
        super_admin: 12
    };

    var reset = function (availableTypes, type) {
        availableTypes = availableTypes || $scope.availableTypes;
        type = type || availableTypes[0];
        $scope.availableTypes = availableTypes;
        $scope.message = angular.copy($scope.DEFAULT_MESSAGES[type]);
    };

    $http.get("data/default-messages.json").then(function (response) {
        response.data.forEach(function (message) {
            $scope.DEFAULT_MESSAGES[message.type] = message;
        });
        reset(["LOGIN"]);
    });

    $http.get("data/locales.json").then(function (response) {
        $scope.locales = response.data;
        $scope.LOCALES = response.data;
    });

    //$scope.history = kgsPoller.upstreamMessages();
    $scope.isSending = false;
    $scope.error = "";
    $scope.authLevel = null;

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
    on("LOGIN_SUCCESS", function (message) {
        $scope.authLevelString = message.you.authLevel || "normal";
        $scope.authLevel = $scope.AUTH_LEVELS[$scope.authLevelString];
        reset(Object.keys($scope.DEFAULT_MESSAGES).filter(function (key) {
            return key !== "LOGIN";
        }));
    }).
    on("logout", function () {
        reset(["LOGIN"]);
    });
}).
controller("upstreamMessagesCtrl", function ($scope, kgsPoller, page) {
    angular.extend($scope, {
        entries: kgsPoller.upstreamMessages(),
        entriesPerPage: 5,
        currentPage: 1
    }, page);
}).
controller("downstreamCtrl", function ($scope, kgsPoller, page, $filter) {
    angular.extend($scope, {
        entries: [],
        entriesPerPage: 10,
        currentPage: 1
    }, page);

    $scope.isPolling = false;
    $scope.error = "";

    $scope.updateMessages = function (currentPage) {
        var entries = kgsPoller.downstreamMessages();
        if (this.query) {
            entries = $filter("filter")(entries, {
                body: {
                    $: this.query
                }
            });
        }

        this.entries.length = 0;
        this.entries.push.apply(this.entries, entries);

        this.currentPage = currentPage || this.currentPage;
    };

    kgsPoller.
    on("startPolling", function () {
        $scope.isPolling = true;
    }).
    on("stopPolling", function () {
        $scope.isPolling = false;
    }).
    on("message", function () {
        $scope.updateMessages();
    }).
    on("error", function (error) {
        if (error.type === "kgsPollerPollingError") {
            $scope.error = error.toString();
        }
    });
}).
controller("channelsCtrl", function ($scope, kgsPoller) {
    kgsPoller.
    on("login", function () {
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
    on("logout", function () {
        $scope.channels = null;
    });
}).
controller("exporterCtrl", function ($scope, kgsPoller) {
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

