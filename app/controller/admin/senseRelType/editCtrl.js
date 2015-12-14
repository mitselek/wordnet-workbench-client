/**
 * Created by ivar on 1.12.15.
 */

define([
    'angularAMD'
], function (angularAMD) {

    angularAMD.controller('admin/senseRelType/editCtrl', ['$scope', '$state', '$uibModal', '$modalInstance', 'wnwbApi', function ($scope, $state, $uibModal, $modalInstance, wnwbApi) {

        console.log('edit ctrl');

        $scope.setupOtherOptions = function () {
            $scope.otherOptions = [{id: 0, name: 'N/A'}];
            for(k in $scope.senseRelTypes) {
                if($scope.senseRelTypes[k].direction == $scope.senseRelType.direction) {
                    $scope.otherOptions.push($scope.senseRelTypes[k]);
                }
            }
        };

        $scope.$watch('senseRelType.direction', function (newVal, oldVal) {
            $scope.setupOtherOptions();
        });

        $scope.setupOtherOptions();

        $scope.save = function (form) {
            console.log('[admin/senseRelType/editCtrl] save '+$scope.senseRelType.id);

            form.submitted = true;
            if(!form.$valid){
                return;
            }
            $scope.senseRelType.$update({id: $scope.senseRelType.id}, function () {
                $modalInstance.close($scope.senseRelType);
                $scope.loadData();
            });
        };
    }]);
});