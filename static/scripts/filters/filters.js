'use strict';

angular.module('composeUiApp')
  .constant('pageSize', 10)
  .filter('filterActive', function () {
    return function (projects, activeNames, activeOnly) {

      if (activeOnly) {
        var activeProjects = {};

        _.each(projects, function (v, k) {
          var normalizedId = k.toLowerCase().replace(/[^a-z0-9]/g, '');
          var isActive = activeNames.indexOf(normalizedId) >= 0;
          if (isActive) {
            activeProjects[k] = v;
          }
        });
        return activeProjects;

      } else {
        return projects;
      }
    };
  })
  .filter('filterByPage', function (pageSize) {
    return function (projects, page) {
      var filteredProjects = {};

      var start = page * pageSize;

      var projectIds = Object.keys(projects || {}).splice(start, pageSize);

      _.each(projectIds, function (projectId) {
        filteredProjects[projectId] = projects[projectId];
      });

      return filteredProjects;

    };
  })
  .filter('filterByName', function () {
    return function (projects, query) {

      var filteredProjects;

      if (query) {

        filteredProjects = _.chain(projects)
          .map(function (path, name) {
            return {
              name: name,
              path: path
            };
          })
          .filter(function (item) {
            return item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
          })
          .map(function (item) {
            return [item.name, item.path];
          })
          .fromPairs()
          .value();

      } else {
        filteredProjects = projects;
      }

      return filteredProjects;
    };
  });