'use strict';

angular.module('composeUiApp')
  .directive('projectDetail', function($resource, $log, projectService, $window, $location){
    return {
      restrict: 'E',
      scope: {
        projectId: '=',
        path: '='
      },
      templateUrl: 'views/project-detail.html',
      controller: function($scope) {

        var Project = $resource('api/v1/projects/:id', null, {
          remove: {
            method: 'DELETE',
            url: 'api/v1/remove-project/:id'
          }
        });



        var Host = $resource('api/v1/host');
        var Yml = $resource('api/v1/projects/yml/:id');
        var Readme = $resource('api/v1/projects/readme/:id');

        $scope.$watch('projectId', function (val) {
          if (val) {
            $log.debug('refresh ' + val);
            Project.get({id: val}, function (data) {
              $scope.services = projectService.groupByService(data);
            }, function (err) {
              alertify.alert(err.data);
            });

            Host.get(function (data) {
              var host = data.host;
              $scope.hostName = host ? host.split(':')[0] : null;
            });

            Readme.get({
              id: $scope.projectId
            }, function (data) {
              $scope.readmeData = data.readme;
              $scope.readmeExists = data.readme && data.readme.length > 0;
              $scope.readmeShow = $scope.readmeExists;
            });

          }

        });

        var Logs = $resource('api/v1/logs/:id/:container/:limit');

        $scope.displayLogs = function (id) {
          Logs.get({id: $scope.projectId, limit: 100, container: id}, function (data) {
            $scope.containerLogs = id;
            $scope.showDialog = true;
            $scope.logs = data.logs;
          });
        };

        $scope.rebuild = function(serviceName) {
          $scope.working = true;
          Project.save({id: $scope.projectId, service_names: [serviceName], do_build: true},
            function () {
              $scope.working = false;
              alertify.success(serviceName + " rebuild successful.");
            },
            function (err) {
              $scope.working = false;
              alertify.alert(err.data);
          });
        };

        var Service = $resource('api/v1/services', null, {
          scale: {
            method: 'PUT'
          }
        });

        $scope.scale = function (service) {
          alertify.prompt('how many instances of service ' + service + '?', 1, function (evt, num) {

            if (!isNaN(num)) {
              $scope.working = true;

              Service.scale({service: service, project: $scope.projectId, num: num}, function () {

                Project.get({id: $scope.projectId}, function (data) {
                  $scope.services = projectService.groupByService(data);
                  $scope.working = false;
                }, function (err) {
                  $scope.working = false;
                  alertify.alert(err.data);
                });

              }, function (err) {
                $scope.working = false;
                alertify.alert(err.data);
              });
            }

          });

        };

        $scope.isEmpty = function (obj) {
          return angular.equals({}, obj);
        };

        $scope.yml = function () {
          Yml.get({
            id: $scope.projectId
          }, function (data) {
            $scope.ymlData = data.yml;
          });

        };


        $scope.deleteProject = function (id) {
          alertify.confirm('Do you really want to remove project ' + id + '?', function (rm) {
            if (rm) {
              Project.remove({
                id: id
              }, function () {
                alertify.message('deleted ' + id);
                $scope.$parent.reload(false);
                $location.path('/');
              }, function (r) {
                alertify.error('cannot delete ' + id + ': ' + r.data);
              });
            }
          });
        };


      }
    };
  })
  .directive('markdown', function() {
      return {
          restrict: 'AE',
          scope: {
              status: '='
          },
          link: function (scope, element, attrs, controller) {
            var md_content = attrs.content;
            var html_content = markdown.toHTML(md_content);
            $(html_content).appendTo(element);
          }
      };
  });
