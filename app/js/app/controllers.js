"use strict";

angular.module("kgsApiExplorer.controllers", [
    "kgsApiExplorer.filters",
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
controller("upstreamMessageCtrl", function ($scope, $http, client) {
    $scope.isSending = false;
    $scope.useTextEditor = false;
    $scope.error = "";
    $scope.send = function (form) {
        if (form.$valid) {
            $scope.isSending = true;
            client.send(this.message).then(function () {
                $scope.error = "";
                $scope.$broadcast("upstreamMessage.send.success", form);
            }, function (xhr) {
                $scope.error = xhr.status ? xhr.status+" "+xhr.statusText : "";
                $scope.$broadcast("upstreamMessage.send.fail", form);
            }).finally(function () {
                $scope.isSending = false;
            });
        }
    };
}).
controller("editorCtrl", function ($scope, $http) {
    $http.get("data/locales.json").then(function (response) {
        $scope.LOCALES = response.data;
    });

    $scope.UPSTREAM_MESSAGES = {};
    $http.get("data/upstream-messages.json").then(function (response) {
        response.data.forEach(function (message) {
            $scope.UPSTREAM_MESSAGES[message.type] = message;
        });
        $scope.messageType = "LOGIN";
        $scope.message = angular.copy($scope.UPSTREAM_MESSAGES.LOGIN);
    });

    $scope.reset = function (form) {
        form.$setPristine();
        form.$setUntouched();
        this.message = angular.copy(this.UPSTREAM_MESSAGES[this.messageType]);
    };

    $scope.$on("upstreamMessage.send.success", function (event, form) {
        $scope.reset(form);
    });
}).
controller("textEditorCtrl", function ($scope, $http) {
    $scope.TEMPLATES = { blank: { type: "" } };
    $http.get("data/templates.json").then(function (response) {
        angular.extend($scope.TEMPLATES, response.data);
        $scope.loadTemplate();
    });
    $scope.loadTemplate = function (name) {
        this.templateName = name || this.templateName || "blank";
        this.message = angular.copy(this.TEMPLATES[this.templateName]);
    };
}).
controller("upstreamMessagesCtrl", function ($scope, client, page) {
    angular.extend($scope, {
        entries: client.upstreamMessages(),
        entriesPerPage: 5,
        currentPage: 1
    }, page);
}).
controller("downstreamCtrl", function ($scope, client, page, $filter) {
    angular.extend($scope, {
        entries: [],
        entriesPerPage: 10,
        currentPage: 1
    }, page);

    $scope.isPolling = false;
    $scope.error = "";

    $scope.updateMessages = function (currentPage) {
        var entries = client.downstreamMessages();
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

    client.
    on("stateChange", function (state) {
        if (state === kgsClient.LOGGING_IN) {
            $scope.isPolling = true;
        }
        else if (state === kgsClient.LOGGED_OUT) {
            $scope.isPolling = false;
        }
    }).
    on("message", function () {
        $scope.updateMessages();
    }).
    on("xhrError", function (xhr) {
        $scope.error = xhr.status+" "+xhr.statusText;
    });
}).
controller("channelsCtrl", function ($scope, client) {
    client.
    on("stateChange", function (state) {
        if (state === kgsClient.LOGGED_IN) {
            $scope.channels = [];
        }
        else if (state === kgsClient.LOGGED_OUT) {
            $scope.channels = null;
        }
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
    });
}).
controller("exporterCtrl", function ($scope, client) {
    $scope.isAvailable = typeof Blob === "function";
    $scope.hidePassword = true;
    $scope.indent = "4";
    $scope.export = function () {
        saveAs(
            new Blob(
                [client.toString(
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

