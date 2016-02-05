define([
    'angularAMD',
    'underscore',
    'TreeViewCtrl',
    'controller/synset/RelationTrees',
    'service/AnchorService',
    'service/LexiconService',
    'service/SynSetRelTypeService',
    'service/SynSetService'
], function (angularAMD) {

    angularAMD.controller('SynSetCtrl', [
        '$scope',
        '$rootScope',
        '$state',
        '$stateParams',
        '$uibModal',
        '$log',
        '$q',
        'wnwbApi',
        'service/AnchorService',
        'service/LexiconService',
        'service/SynSetRelTypeService',
        'service/SynSetService',
        'relTypes',
        function (
            $scope,
            $rootScope,
            $state,
            $stateParams,
            $uibModal,
            $log,
            $q,
            wnwbApi,
            AnchorService,
            lexiconService,
            relTypeService,
            synSetService,
            relTypes
        ) {

            var baseState = 'synset';

            $scope.relTypeList = null;
            $scope.relTypes = relTypes;

            relTypeListPromise = relTypeService.getList();

            var synSetDeferred = $q.defer();
            var synSetPromise = synSetDeferred.promise;
            $scope.anchorSynSetPromise = null;

            var synSetId = 0;
            if($stateParams.id) {
                synSetId = $stateParams.id;
            }

            $scope.currentSynSet = null;

            $scope.sensesToAdd = {};
            $scope.sensesToRem = {};

            $scope.currentDefinition = null;

            $scope.selectedRel = null;

            $scope.relTree = [];



            $scope.setCurrentSynSet = function (synSet) {
                $scope.sensesToAdd = {};
                $scope.sensesToRem = {};
                $scope.currentSynSet = synSet;
            };

            $scope.selectSynset = function (synSetId) {
                $log.log('selectSynset '+synSetId);
                $state.go('synset', {id: $scope.anchorSynSet.id});
                synSetPromise = wnwbApi.SynSet.get({id: synSetId}).$promise;
                $scope.synSetPromise = synSetPromise;
                synSetPromise.then(function (synSet) {
                    $scope.setCurrentSynSet(synSet);
                });
            };

            $scope.selectTab = function (tabName) {
                //change controller
            };



            //////////////////////
            // Definition methods
            //////////////////////

            $scope.currentDefinition = null;
            $scope.tempDef = {};

            $scope.selectDefinition = function (def) {
                $scope.currentDefinition = def;
                if($scope.currentDefinition) {
                    $state.go('synset').then(function () {
                        $state.go('synset.def', {defId: $scope.currentDefinition.id}).then(function () {

                        });
                    });
                }
            };

            $scope.getDefinition = function (definitionId) {
                var deferred = $q.defer();

                if(definitionId) {
                    synSetPromise.then(function (synSet) {
                        var definition = synSetService.getDefinitionById(synSet, definitionId);

                        if(definition) {
                            return $scope.currentDefinition = definition;
                            deferred.resolve(definition);
                        } else {
                            deferred.reject('not found');
                        }
                    });
                } else {
                    if($scope.currentDefinition) {
                        deferred.resolve($scope.currentDefinition);
                    } else {
                        deferred.resolve(null);
                    }
                }

                return deferred.promise;
            };

            $scope.addDefinition = function () {
                $state.go('synset.def');
                $scope.currentDefinition = null;
            };

            $scope.deleteDefinition = function (definition) {
                var index = $scope.currentSynSet.synset_definitions.indexOf(definition);
                if (index > -1) {
                    $scope.currentSynSet.synset_definitions.splice(index, 1);
                }
            };

            $scope.saveDefinition = function (definition) {
                //TODO: validate language

                if($scope.currentDefinition) {
                    angular.copy(definition, $scope.currentDefinition);
                } else {
                    synSetService.addDefinition($scope.currentSynSet, definition);
                }
            };

            $scope.discardDefinition = function () {
                $state.go('synset');
            };

            $scope.setPrimaryDefinition = function (value) {
                synSetService.setPrimaryDefinition($scope.currentSynSet, value);
            };



            //////////////////////////
            // Sense variants methods
            //////////////////////////

            $scope.selectSense = function (sense) {
                $state.go('synset.sense', {senseId: sense.id});
                $scope.currentDefinition = null;
            };

            $scope.removeSense = function (sense) {
                delete $scope.sensesToAdd[sense.id];
                $scope.sensesToRem[sense.id] = sense;
                for(k in $scope.currentSynSet.senses) {
                    if($scope.currentSynSet.senses[k].id == sense.id) {
                        $scope.currentSynSet.senses.splice(k, 1);
                    }
                }
            };

            $scope.createSense = function () {
                $state.go('synset.sense', {senseId: null});
            };

            $scope.addSense = function () {
                return $uibModal.open({
                    templateUrl: 'view/main/literalSerachModal.html',
                    scope: $scope,
                    controller: 'main/literalSearchCtrl',
                    resolve: {
                        searchType: function () {return 'sense';},
                        lexiconMode: function () {return null;}
                    }
                }).result.then(function (sense) {
                        $state.go('synset.sense', {senseId: sense.id});
                    },
                    function (result) {

                    });
            };

            $scope.saveSense = function (sense) {
                var listObj = {
                    id: sense.id,
                    label: sense.label,
                    primary_definition: sense.primary_definition,
                    primary_example: sense.primary_example};
                var fFound = false;
                for(var i = 0;i < $scope.currentSynSet.senses.length;i++) {
                    if($scope.currentSynSet.senses[i].id == sense.id) {
                        fFound = true;
                        $scope.currentSynSet.senses[i] = listObj;
                        break;
                    }
                }
                if(!fFound) {
                    $scope.currentSynSet.senses.push(listObj);
                }
            };

            $scope.testSenseSelect = function (sense) {
                var fAdd = true;
                for(k in $scope.currentSynSet.senses) {
                    if($scope.currentSynSet.senses[k].id == sense.id) {
                        fAdd = false;
                        break;
                    }
                }
                if(fAdd) {
                    delete $scope.sensesToRem[sense.id];
                    $scope.sensesToAdd[sense.id] = sense;
                    $scope.currentSynSet.senses.push(sense);
                }
            };



            ////////////////////
            // Relation methods
            ////////////////////

            $scope.$watchCollection('currentSynSet.relations', function (newValue, oldValue) {
                if(newValue) {

                    $scope.relTree = [
                        {name: 'Directional (outgoing)', type: 'do', nodes: []},
                        {name: 'Directional (incoming)', type: 'di', nodes: []},
                        {name: 'Bidirectional', type: 'bd', nodes: []},
                        {name: 'Non-directional', type: 'nd', nodes: []}
                    ];

                    var relationsGrouped = _.groupBy($scope.currentSynSet.relations, function (item) {
                        return item.rel_type;
                    });

                    for(k in relationsGrouped) {
                        var relType = relTypeService.getById(k);
                        if(!relType) {
                            $log.log('relType null');
                            $log.log($scope.currentSynSet.relations);
                            $log.log(relationsGrouped);
                            $log.log(k);
                        }
                        var nodes_out = [];
                        var nodes_in = [];
                        for(k2 in relationsGrouped[k]) {
                            var obj = {
                                rel: relationsGrouped[k][k2],
                                name: relationsGrouped[k][k2].targetlabel,
                                type: 'rel',
                                nodes: []
                            };
                            if(relationsGrouped[k][k2].a_synset == $scope.currentSynSet.id) {
                                nodes_out.push(obj);
                            }
                            if(relationsGrouped[k][k2].b_synset == $scope.currentSynSet.id) {
                                nodes_in.push(obj);
                            }
                        }
                        if(relType.direction == 'd') {
                            $scope.relTree[0].nodes.push({
                                name: relType.name,
                                type: 'rel_type',
                                relType: relType,
                                nodes: nodes_out
                            });
                            $scope.relTree[1].nodes.push({
                                name: relType.name,
                                type: 'rel_type',
                                relType: relType,
                                nodes: nodes_in
                            });
                        }
                        if(relType.direction == 'b') {
                            $scope.relTree[2].nodes.push({
                                name: relType.name,
                                type: 'rel_type',
                                relType: relType,
                                nodes: _.union(nodes_in, nodes_out)
                            });
                        }
                        if(relType.direction == 'n') {
                            $scope.relTree[3].nodes.push({
                                name: relType.name,
                                type: 'rel_type',
                                relType: relType,
                                nodes: _.union(nodes_in, nodes_out)
                            });
                        }
                    }
                }
            });

            $scope.getRelation = function (relId) {
                var deferred = $q.defer();

                if(relId) {
                    synSetPromise.then(function (synSet) {
                        var fFound = false;
                        for (k in synSet.relations) {
                            if (synSet.relations[k].id == relId) {
                                $scope.selectedRelation = synSet.relations[k];
                                deferred.resolve(synSet.relations[k]);
                                fFound = true;
                                break;
                            }
                        }
                        if (fFound) {
                            deferred.reject('not found');
                        }

                        deferred.resolve(null);
                    });
                } else {
                    deferred.resolve(null);
                }

                return deferred.promise;
            };

            $scope.getRelationList = function () {
                var deferred = $q.defer();

                $log.log('Get relation list');

                synSetPromise.then(function (synSet) {
                    $log.log('relation list resolve');
                    deferred.resolve($scope.currentSynSet.relations);
                });

                return deferred.promise;
            };

            $scope.addRel = function () {
                $state.go('synset.rel', {relId: null});
            };

            $scope.selectRel = function (relation) {
                $scope.selectedRel = relation;
                if(relation) {
                    $state.go('synset.rel', {relId: relation.id});
                } else {
                    $state.go('synset.rel', {relId: null});
                }
            };

            $scope.discardRel = function () {
                $state.go('^');
            };

            $scope.saveRel = function (rel, selectedRelType, counterRelType, targetSynSet) {


                $state.go('^');
            };

            $scope.deleteRel = function (relation) {
                if(relation) {
                    var aTypeId = null;
                    var relationList = $scope.currentSynSet.relations;

                    for(var i = 0;i < relationList.length;i++) {
                        if(relationList[i] == relation) {
                            aTypeId = relationList[i].rel_type;
                            relationList.splice(i, 1);
                            break;
                        }
                    }
                    if(aTypeId) {
                        aType = relTypeService.getById(aTypeId);
                        bTypes = relTypeService.getCounterRelTypes(aType.id);
                        //$log.log(aType);
                        //$log.log(bTypes);
                        for(k in bTypes) {
                            var bTypeId = bTypes[k].id;
                            for(var i = 0;i < relationList.length;i++) {
                                if(relationList[i].rel_type == bTypeId) {
                                    $log.log('removing counter');
                                    relationList.splice(i, 1);
                                    i--;
                                }
                            }
                        }
                    }
                }
            };



            ////////////////////////
            // External ref methods
            ////////////////////////

            $scope.addExtRef = function () {
                var newExtRef = {
                    system: '',
                    type_ref_code: '',
                    reference: ''
                };
                $scope.currentSynSet.synset_externals.push(newExtRef);
                $scope.selectedExtRef = newExtRef;
                $scope.tempExtRef = angular.copy(newExtRef);
            };

            $scope.tempExtRef = {};
            $scope.selectedExtRef = null;

            $scope.editExtRef = function (extRef) {
                if($scope.selectedExtRef) {
                    $scope.saveExtRef();
                }
                $scope.tempExtRef = angular.copy(extRef);
                $scope.selectedExtRef = extRef;
            };

            $scope.saveExtRef = function () {
                if($scope.selectedExtRef) {
                    angular.copy($scope.tempExtRef, $scope.selectedExtRef);
                    $scope.cancelExtRef();
                }
            };

            $scope.cancelExtRef = function () {
                $scope.selectedExtRef = null;
            };

            $scope.deleteExtRef = function (extRef) {
                var index = $scope.currentSynSet.synset_externals.indexOf(extRef);
                if (index > -1) {
                    $scope.currentSynSet.synset_externals.splice(index, 1);
                }
            };

            $scope.setExtRefKey = function (extRef) {
                return $uibModal.open({
                    templateUrl: 'view/main/literalSerachModal.html',
                    scope: $scope,
                    controller: 'main/literalSearchCtrl',
                    resolve: {
                        searchType: function () {return 'synset';},
                        lexiconMode: function () {return 'any';}
                    }
                }).result.then(function (synSet) {
                        if(synSet) {
                            $scope.tempExtRef.reference = synSet.id;
                        }
                    },
                    function (result) {

                    });
            };



            //////////////////
            // Synset methods
            //////////////////

            $scope.saveSynSet = function () {
                $scope.saveExtRef();
                
                var label = '';
                if($scope.currentSynSet.senses && $scope.currentSynSet.senses.length) {
                    var labels = [];
                    for(var i = 0;i < $scope.currentSynSet.senses.length;i++) {
                        labels.push($scope.currentSynSet.senses[i].label);
                    }
                    label = labels.join(', ');
                } else {
                    label = '?';
                }
                $scope.currentSynSet.label = label;

                if($scope.currentSynSet.id) {
                    var tempSynSet = angular.copy($scope.currentSynSet);
                    tempSynSet.$update({id: $scope.currentSynSet.id}, function () {
                        for(k in $scope.sensesToRem) {
                            var sense = wnwbApi.Sense.get({id: $scope.sensesToRem[k].id}, function () {
                                sense.synset = 0;
                                sense.$update({id: sense.id});
                            });
                        }
                        for(k in $scope.sensesToAdd) {
                            var sense = wnwbApi.Sense.get({id: $scope.sensesToAdd[k].id}, function () {
                                sense.synset = $scope.currentSynSet.id;
                                sense.$update({id: sense.id});
                            });
                        }
                    }).then(function () {
                        synSetPromise = wnwbApi.SynSet.get({id: $scope.currentSynSet.id}).$promise;
                        $scope.synSetPromise = synSetPromise;
                        synSetPromise.then(function (synSet) {
                            $scope.setCurrentSynSet(synSet);
                        });
                    });
                } else {
                    var result = $scope.currentSynSet.$save(function () {
                        for(k in $scope.sensesToRem) {
                            var sense = wnwbApi.Sense.get({id: $scope.sensesToRem[k].id}, function () {
                                sense.synset = 0;
                                sense.$update({id: sense.id});
                            });
                        }
                        for(k in $scope.sensesToAdd) {
                            var sense = wnwbApi.Sense.get({id: $scope.sensesToAdd[k].id}, function () {
                                sense.synset = $scope.currentSynSet.id;
                                sense.$update({id: sense.id});
                            });
                        }
                        $state.go('synset', {id: $scope.currentSynSet.id});
                    });
                }
            };

            $scope.discardSynSetChanges = function () {

            };



            ////////
            // Init
            ////////

            $scope.init = function () {
                if(synSetId) {
                    $scope.anchorSynSetPromise = wnwbApi.SynSet.get({id: synSetId}).$promise;

                    $scope.anchorSynSetPromise.then(function (synSet) {
                        $scope.anchorSynSet = synSet;
                        AnchorService.pushSynSet(synSet);
                        lexiconService.setWorkingLexiconId(synSet.lexicon);
                        synSetDeferred.resolve(synSet);
                        $scope.setCurrentSynSet(synSet);
                    });
                } else {
                    var synSet = new wnwbApi.SynSet();
                    synSet.label = 'test label';
                    synSet.lexicon = lexiconService.getWorkingLexicon().id;
                    synSet.synset_type = 'C';
                    synSet.status = 'D';
                    synSet.synset_definitions = [];
                    synSet.relations = [];
                    synSet.synset_externals = [];

                    $scope.anchorSynSet = synSet;
                    $scope.currentSynSet = synSet;

                    synSetDeferred.resolve(synSet);
                }
            };

            $q.all([lexiconService.getWorkingLexiconPromise(), relTypeListPromise]).then(function (qAllResults) {
                $scope.init();
            });
        }
    ]);
});