/**
 * Created by ivar on 25.11.15.
 */
define([
    'angularAMD',
     'SynSetService',
     'SenseRelTypeService'/*,
     'WorkflowDefinitionService',
     'WorkflowAddDefinitionModalController',
     'WorkflowAddModalController'*/
], function (angularAMD) {

    angularAMD.controller('AdminCtrl', ['$scope','$state', 'SynSetService', 'SenseRelTypeService'/*,'WorkflowDefinitionService'*/, 'UserService', function ($scope, $state, projectService, senseRelTypeService/*, workflowDefinitionService*/, userService) {
        console.log('AdminController');

        /*senseRelTypeService.getList({}, function (data) {
            $scope.senseRelTypes = data;
        });

        $scope.openCreateModal = function () {

        };*/

        /*$scope.synSets = projectService.getList({}, function (a, b) {
        console.log('my callback');
        console.debug(a);
        console.debug(b);

        $scope.synSets = projectService.getProject(b[0].id, function (a, b) {
        console.log('my callback get project');
        console.debug(a);
        console.debug(b);
        });
        });*/


        /*if(!userService.isAuthenticated()){
         $state.go('auth');
         return;
         }

         projectService.getHomeProject( function (err, project) {
         if(err){
         console.error(err);
         return alert('Err');
         }

         if(!project){
         return;
         }


         $scope.project = project;
         $scope.projectId = project.id;

         projectService.getProjectWorkflows($scope.projectId, function (err, workflows) {
         if(err){
         console.error(err);
         return alert('Err');
         }
         $scope.workflows = workflows;
         });
         });

         $scope.openDefineWorkflowModal = function () {
         workflowDefinitionService.openAddDefinitionModal($scope, $scope.project);
         };

         $scope.openAddWorkflowModal = function () {
         workflowDefinitionService.openAddWorkflowModal($scope, $scope.project);
         };*/

    }]);
});