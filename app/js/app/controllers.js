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
controller("upstreamCtrl", function ($scope, $http, client) {
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
controller("downstreamCtrl", function ($scope, client, page, $filter) {
    angular.extend($scope, {
        entries: [],
        entriesPerPage: 10,
        currentPage: 1
    }, page);

    $scope.isPolling = false;
    $scope.error = "";

    $scope.setCurrentPage = function (page) {
        if (page === -1) {
            $scope.currentPage = $scope.lastPage();
        }
        else if (page) {
            $scope.currentPage = page;
        }
    };

    $scope.updateMessages = function (currentPage) {
        var entries = client.messages();
        if (this.query) {
            entries = $filter("filter")(entries, {
                body: {
                    $: this.query
                }
            });
        }

        this.entries.length = 0;
        this.entries.push.apply(this.entries, entries);
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
        var page =
            $scope.currentPage === $scope.lastPage()
                ? -1 : $scope.currentPage;
        $scope.updateMessages();
        $scope.setCurrentPage(page);
    }).
    on("xhrError", function (xhr) {
        $scope.error = xhr.status+" "+xhr.statusText;
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

