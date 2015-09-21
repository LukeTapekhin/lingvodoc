'use strict';

var model = {};

model.Value = function() {
    this.export = function() {
        return {};
    }
};

model.TextValue = function(content) {
    this.content = content;
    this.export = function() {
        return {
            'content': content,
            'data_type': 'text'
        }
    };
};
model.TextValue.prototype = new model.Value();

model.SoundValue = function(name, mime, content) {
    this.name = name;
    this.mime = mime;
    this.content = content;

    this.export = function() {
        return {
            'content': content,
            'filename': name,
            'data_type': 'sound'
        }
    };
};
model.SoundValue.prototype = new model.Value();

model.ImageValue = function(name, mime, content) {
    this.name = name;
    this.mime = mime;
    this.content = content;

    this.export = function() {
        return {
            'content': content,
            'filename': name,
            'data_type': 'image'
        }
    };
};
model.ImageValue.prototype = new model.Value();


model.MarkupValue = function(name, mime, content) {
    this.name = name;
    this.mime = mime;
    this.content = content;

    this.export = function() {
        return {
            'content': content,
            'filename': name,
            'data_type': 'markup'
        }
    };
};
model.MarkupValue.prototype = new model.Value();




var app = angular.module('EditDictionaryModule', ['ui.bootstrap']);

app.directive('wavesurfer', function() {
    return {
        restrict: 'E',

        link: function($scope, $element, $attrs) {
            $element.css('display', 'block');

            var options = angular.extend({container: $element[0]}, $attrs);
            var wavesurfer = WaveSurfer.create(options);

            if ($attrs.url) {
                wavesurfer.load($attrs.url, $attrs.data || null);
            }

            $scope.$emit('wavesurferInit', wavesurfer);
        }
    };
});


app.directive('onReadFile', function($parse) {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);

            element.on('change', function(onChangeEvent) {
                var reader = new FileReader();
                var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];

                reader.onload = function(onLoadEvent) {
                    scope.$apply(function() {
                        var b64file = btoa(onLoadEvent.target.result);
                        fn(scope, {
                            $fileName: file.name,
                            $fileType: file.type,
                            $fileContent: b64file
                        });
                    });
                };
                reader.readAsBinaryString(file);
            });
        }
    };
});


app.controller('EditDictionaryController', ['$scope', '$http', '$modal', '$log', '$timeout', function($scope, $http, $modal, $log, $timeout) {


    var currentClientId = $('#clientId').data('lingvodoc');
    var dictionaryClientId  = $('#dictionaryClientId').data('lingvodoc');
    var dictionaryObjectId  = $('#dictionaryObjectId').data('lingvodoc');
    var perspectiveClientId  = $('#perspectiveClientId').data('lingvodoc');
    var perspectiveId  = $('#perspectiveId').data('lingvodoc');

    WaveSurferController.call(this, $scope);

    $scope.perspective = {
        'fields': []
    };

    $scope.fields = [];
    $scope.lexicalEntries = [];
    $scope.dictionaryMatrix = [];

    $scope.pageIndex = 1;
    $scope.pageSize = 50;
    $scope.pageCount = 1;

    var enabledInputs = [];

    $scope.getFieldValues = function (entry, field) {

        var value;
        var values = [];
        if (entry && entry.contains) {

            if (field.isGroup) {

                for (var fieldIndex = 0; fieldIndex < field.contains.length; fieldIndex++) {
                    var subField = field.contains[fieldIndex];

                    for (var valueIndex = 0; valueIndex < entry.contains.length; valueIndex++) {
                        value = entry.contains[valueIndex];
                        if (value.entity_type == subField.entity_type) {
                            values.push(value);
                        }
                    }
                }
            } else {
                for (var i = 0; i < entry.contains.length; i++) {
                    value = entry.contains[i];
                    if (value.entity_type == field.entity_type) {
                        values.push(value);
                    }
                }
            }
        }
        return values;
    };

    $scope.annotate = function(soundEntity, markupEntity) {

        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'annotationModal.html',
            controller: 'AnnotationController',
            size: 'lg',
            resolve: {
                soundUrl: function() {
                    return soundEntity.content;
                },
                annotationUrl: function() {
                    return markupEntity.content;
                }
            }
        });
    };

    $scope.getPage = function(pageNumber) {
        if (pageNumber > 0 && pageNumber <= $scope.pageCount) {
            $scope.pageIndex = pageNumber;
            loadEntries();
        }
    };


    $scope.range = function(min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) {
            input.push(i);
        }
        return input;
    };

    $scope.enableInput = function(clientId, objectId, entityType) {
        if (!$scope.isInputEnabled(clientId, objectId, entityType)) {
            enabledInputs.push({
                'clientId': clientId,
                'objectId': objectId,
                'entityType': entityType
            });
        } else {
            $scope.disableInput(clientId, objectId, entityType);
        }
    };

    $scope.isInputEnabled = function(clientId, objectId, entityType) {
        for (var i = 0; i < enabledInputs.length; i++) {
            var checkItem = enabledInputs[i];
            if (checkItem.clientId === clientId && checkItem.objectId == objectId && checkItem.entityType === entityType) {
                return true;
            }
        }
        return false;
    };

    $scope.disableInput = function(clientId, objectId, entityType) {

        var removeIndex = -1;
        for (var i = 0; i < enabledInputs.length; i++) {
            var checkItem = enabledInputs[i];
            if (checkItem.clientId === clientId && checkItem.objectId == objectId && checkItem.entityType === entityType) {
                removeIndex = i;
                break;
            }
        }

        if (removeIndex >= 0) {
            enabledInputs.splice(removeIndex, 1);
        }
    };

    $scope.addedByUser = function(entry) {
        return (entry.client_id == $('#clientId').data('lingvodoc'));
    };


    $scope.addNewLexicalEntry = function() {

        var createLexicalEntryUrl = $('#createLexicalEntryUrl').data('lingvodoc');

        $http.post(createLexicalEntryUrl).success(function (data, status, headers, config) {

            $scope.lexicalEntries.unshift({
                'client_id': data.client_id,
                'object_id': data.object_id,
                'contains': []
            });

        }).error(function (data, status, headers, config) {
            alert('Failed to create lexical entry!');
        });
    };

    $scope.saveTextValue = function(entry, field, event, parent) {
        if (event.target.value) {
            $scope.saveValue(entry, field, new model.TextValue(event.target.value), parent);
        }
    };

    $scope.saveSoundValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.SoundValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.saveImageValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.ImageValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.saveMarkupValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.MarkupValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.editGroup = function(entry, field, values) {

        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'editGroupModal.html',
            controller: 'editGroupController',
            size: 'lg',
            resolve: {
                'groupParams': function() {
                    return {
                        'entry': entry,
                        'field': field,
                        'values': values
                    };
                }
            }
        });

        modalInstance.result.then(function (value) {

        }, function () {

        });
    };

    $scope.editGroupingTag = function(entry, field, values) {

        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'editGroupingTagModal.html',
            controller: 'editGroupingTagController',
            size: 'lg',
            resolve: {
                'groupParams': function() {
                    return {
                        'clientId': entry.client_id,
                        'objectId': entry.object_id,
                        'fields': $scope.fields
                    };
                }
            }
        });

        modalInstance.result.then(function (value) {

        }, function () {

        });
    };

    $scope.saveValue = function(entry, field, value, parent) {

        var url;
        if (field.level) {
            switch (field.level) {
                case  'leveloneentity':
                    url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(entry.client_id) + '/' + encodeURIComponent(entry.object_id) + '/leveloneentity';
                    break;
                case 'leveltwoentity':
                    if (parent.client_id && parent.object_id) {
                        url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(entry.client_id) + '/' + encodeURIComponent(entry.object_id) + '/leveloneentity/' + encodeURIComponent(parent.client_id) + '/' + encodeURIComponent(parent.object_id) + '/leveltwoentity';
                    } else {
                        $log.error('Attempting to create Level2 entry with no Level1 entry.');
                        return;
                    }
                    break;
                case 'groupingentity':
                    return;
                    break;
            }

            var entryObject = value.export();

            // TODO: get locale_id from cookies
            entryObject['entity_type'] = field.entity_type;
            entryObject['locale_id'] = 1;
            entryObject['metadata'] = {};


            $http.post(url, entryObject).success(function(data, status, headers, config) {

                if (data.client_id && data.object_id) {

                    entryObject.client_id = data.client_id;
                    entryObject.object_id = data.object_id;

                    var getSavedEntityUrl = '/leveloneentity/' + data.client_id + '/' + data.object_id;
                    $http.get(getSavedEntityUrl).success(function(data, status, headers, config) {
                        // add to parent lexical entry
                        for (var i = 0; i < $scope.lexicalEntries.length; i++) {
                            if ($scope.lexicalEntries[i].object_id == entry.object_id &&
                                $scope.lexicalEntries[i].client_id == entry.client_id) {
                                $scope.lexicalEntries[i].contains.push(data);
                                break;
                            }
                        }

                        // and finally close input
                        $scope.disableInput(entry.client_id, entry.object_id, field.entity_type);

                    }).error(function(data, status, headers, config) {

                    });
                }

            }).error(function(data, status, headers, config) {

            });
        }
    };

    $scope.removeValue = function(entry, field, fieldValue, parent) {

        var url;
        if (field.level) {
            switch (field.level) {
                case  'leveloneentity':
                    url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(entry.client_id) + '/' + encodeURIComponent(entry.object_id) + '/leveloneentity/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id);
                    break;
                case 'leveltwoentity':
                    if (parentClientId && parentObjectId) {
                        url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id) + '/leveloneentity/' + encodeURIComponent(parent.client_id) + '/' + encodeURIComponent(parent.object_id) + '/leveltwoentity/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id);
                    } else {
                        $log.error('Attempting to delete Level2 entry with no Level1 entry.');
                        return;
                    }
                    break;
                case 'groupingentity':
                    return;
                    break;
            }

            $http.delete(url).success(function(data, status, headers, config) {

                for (var i = 0; i < $scope.lexicalEntries.length; i++) {
                    if ($scope.lexicalEntries[i].object_id == entry.object_id &&
                        $scope.lexicalEntries[i].client_id == entry.client_id) {

                        var lexicalEntry = $scope.lexicalEntries[i];

                        for (var j = 0; j < lexicalEntry.contains.length; j++) {
                            if (lexicalEntry.contains[j].client_id == fieldValue.client_id && lexicalEntry.contains[j].object_id == fieldValue.object_id) {
                                $scope.lexicalEntries[i].contains[j].marked_for_deletion = true;
                            }
                        }
                        break;
                    }
                }

            }).error(function(data, status, headers, config) {

            });
        }
    };


    $scope.$watch('lexicalEntries', function (updatedEntries) {

        var getFieldValues = function (entry, field) {

            var value;
            var values = [];
            if (entry && entry.contains) {

                if (field.isGroup) {

                    for (var fieldIndex = 0; fieldIndex < field.contains.length; fieldIndex++) {
                        var subField = field.contains[fieldIndex];

                        for (var valueIndex = 0; valueIndex < entry.contains.length; valueIndex++) {
                            value = entry.contains[valueIndex];
                            if (value.entity_type == subField.entity_type) {
                                values.push(value);
                            }
                        }
                    }
                } else {
                    for (var i = 0; i < entry.contains.length; i++) {
                        value = entry.contains[i];
                        if (value.entity_type == field.entity_type) {
                            values.push(value);
                        }
                    }
                }
            }
            return values;
        };

        var mapFieldValues = function(allEntries, allFields) {
            var result = [];
            for (var i = 0; i < allEntries.length; i++) {
                var entryRow = [];
                for (var j = 0; j < allFields.length; j++) {
                    entryRow.push(getFieldValues(allEntries[i], allFields[j]));
                }
                result.push(entryRow);
            }
            return result;
        };

        $scope.dictionaryMatrix = mapFieldValues(updatedEntries, $scope.fields);

    }, true);


    var addUrlParameter = function(url, key, value) {
        return url + (url.indexOf('?') >= 0 ? "&" : '?') + encodeURIComponent(key) + "=" + encodeURIComponent(value);
    };

    var perspectiveToDictionaryFields = function(perspective) {
        var fields = [];
        for (var i = 0; i < perspective.fields.length; i++) {
            var field = perspective.fields[i];
            if (typeof field.group == 'string') {

                var createNewGroup = true;
                for (var j = 0; j < fields.length; j++) {
                    if (fields[j].entity_type == field.group && fields[j].isGroup) {
                        fields[j].contains.push(field);
                        createNewGroup = false;
                        break;
                    }
                }

                if (createNewGroup) {
                    fields.push({
                        'entity_type': field.group,
                        'isGroup': true,
                        'contains': [field]
                    });
                }

            } else {
                fields.push(field);
            }
        }

        return fields;
    };

    var getDictStats = function() {
        var getDictStatsUrl = $('#allLexicalEntriesCountUrl').data('lingvodoc');
        $http.get(getDictStatsUrl).success(function(data, status, headers, config) {
            var totalEntries = data.count;
            $scope.pageCount = Math.ceil(totalEntries / $scope.pageSize);
            loadEntries();
        }).error(function(data, status, headers, config) {
            $log.error('Failed to load dictionary size!');

            $scope.pageCount = Math.ceil(5000 / $scope.pageSize);
            loadEntries();

        });
    };


    var loadEntries = function() {
        var allLexicalEntriesUrl  = $('#allLexicalEntriesUrl').data('lingvodoc');
        allLexicalEntriesUrl = addUrlParameter(allLexicalEntriesUrl, 'start_from', ($scope.pageIndex - 1) * $scope.pageSize);
        allLexicalEntriesUrl = addUrlParameter(allLexicalEntriesUrl, 'count', $scope.pageSize);
        $http.get(allLexicalEntriesUrl).success(function(data, status, headers, config) {
            $scope.lexicalEntries = data.lexical_entries;
        }).error(function(data, status, headers, config) {
            $log.error('Failed to load entries!');
        });
    };

    var loadPerspective = function() {
        var getFieldsUrl = $('#getPerspectiveFieldsUrl').data('lingvodoc');
        $http.get(getFieldsUrl).success(function(data, status, headers, config) {

            $scope.perspective['fields'] = data.fields;
            $scope.fields = perspectiveToDictionaryFields($scope.perspective);

            getDictStats();

        }).error(function(data, status, headers, config) {
            $log.error('Failed to load perspective!');
        });
    };

    loadPerspective();

}]);



app.controller('AnnotationController',
    ['$scope', '$http', 'soundUrl', 'annotationUrl', function($scope, $http, soundUrl, annotationUrl) {

        var activeUrl = null;

        var createRegions = function(annotaion) {
            if (annotaion instanceof elan.Document) {
                annotaion.tiers.forEach(function(tier) {

                    tier.annotations.forEach(function(a) {

                        var offset1 = annotaion.timeSlotRefToSeconds(a.timeslotRef1);
                        var offset2 = annotaion.timeSlotRefToSeconds(a.timeslotRef2);

                        var r = $scope.wavesurfer.addRegion({
                            id: a.id,
                            start: offset1,
                            end: offset2,
                            color: 'rgba(0, 255, 0, 0.1)'
                        });
                    });
                });
            }
        };

        var loadAnnotation = function(url) {
            // load annotation
            $http.get(url).success(function(data, status, headers, config) {

                try {
                    var xml = (new DOMParser()).parseFromString(data, "application/xml");
                    var annotation = new elan.Document();
                    annotation.importXML(xml);
                    $scope.annotation = annotation;

                    createRegions(annotation);

                } catch (e) {
                    alert('Failed to parse ELAN annotation: ' + e);
                }

            }).error(function(data, status, headers, config) {
            });
        };

        $scope.paused = true;
        $scope.annotation = null;

        $scope.playPause = function() {
            if ($scope.wavesurfer) {
                $scope.wavesurfer.playPause();
            }
        };

        $scope.playAnnotation = function(a) {
            if ($scope.wavesurfer && $scope.annotation) {
                var offset1 = $scope.annotation.timeSlotRefToSeconds(a.timeslotRef1);
                var offset2 = $scope.annotation.timeSlotRefToSeconds(a.timeslotRef2);
                $scope.wavesurfer.play(offset1, offset2);
            }
        };

        $scope.selectRegion = function() {

        };

        // signal handlers
        $scope.$on('wavesurferInit', function(e, wavesurfer) {

            $scope.wavesurfer = wavesurfer;


            if ($scope.wavesurfer.enableDragSelection) {
                $scope.wavesurfer.enableDragSelection({
                    color: 'rgba(0, 255, 0, 0.1)'
                });
            }

            $scope.wavesurfer.on('play', function() {
                $scope.paused = false;
            });

            $scope.wavesurfer.on('pause', function() {
                $scope.paused = true;
            });

            $scope.wavesurfer.on('finish', function() {
                $scope.paused = true;
                $scope.wavesurfer.seekTo(0);
                $scope.$apply();
            });

            // regions events
            $scope.wavesurfer.on('region-click', function(region, event) {

            });

            $scope.wavesurfer.on('region-dblclick', function(region, event) {
                region.remove(region);
            });


            $scope.wavesurfer.once('ready', function() {
                // load annotation once file is loaded
                loadAnnotation(annotationUrl);
                $scope.$apply();
            });

            // load file once wavesurfer is ready
            $scope.wavesurfer.load(soundUrl);
        });

        $scope.$on('modal.closing', function(e) {
            $scope.wavesurfer.stop();
            $scope.wavesurfer.destroy();
        });

    }]);


app.controller('editGroupController', ['$scope', '$http', '$modalInstance', '$log', 'groupParams', function($scope, $http, $modalInstance, $log, groupParams) {

    var dictionaryClientId  = $('#dictionaryClientId').data('lingvodoc');
    var dictionaryObjectId  = $('#dictionaryObjectId').data('lingvodoc');
    var perspectiveClientId  = $('#perspectiveClientId').data('lingvodoc');
    var perspectiveId  = $('#perspectiveId').data('lingvodoc');

    var enabledInputs = [];

    WaveSurferController.call(this, $scope);

    $scope.title = groupParams.field.entity_type;
    $scope.fields = groupParams.field.contains;
    $scope.parentEntry = groupParams.entry;

    var createVirtualEntries = function(values) {
        var virtualEntries = [];

        var addValue = function(value, entries) {

            var createNewEntry = true;
            if (value.additional_metadata) {
                for (var entryIndex = 0; entryIndex < entries.length; entryIndex++) {
                    var currentEntry = entries[entryIndex];

                    if (entries[entryIndex].client_id == value.client_id &&
                        entries[entryIndex].row_id == value.additional_metadata.row_id) {
                        entries[entryIndex].contains.push(value);
                        return;
                    }
                }

                entries.push(
                    {
                        'client_id': $scope.parentEntry.client_id,
                        'object_id': $scope.parentEntry.object_id,
                        'row_id': value.additional_metadata.row_id,
                        'contains': [value]
                    }
                );
            }
        };

        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            addValue(value, virtualEntries);
        }

        return virtualEntries;
    };

    $scope.entries = createVirtualEntries(groupParams.values);

    $scope.fieldsIdx = [];
    $scope.fieldsValues = [];
    $scope.mapFieldValues = function(allEntries, allFields) {
        $scope.fieldsValues = [];
        $scope.fieldsIdx = [];

        for (var i = 0; i < allEntries.length; i++) {
            var entryRow = [];
            for (var j = 0; j < allFields.length; j++) {
                entryRow.push($scope.getFieldValues(allEntries[i], allFields[j]));
            }
            $scope.fieldsValues.push(entryRow);
        }

        for (var k = 0; k < allFields.length; k++) {
            $scope.fieldsIdx.push(allFields[k]);
        }
    };

    $scope.getFieldValues = function(entry, field) {

        var value;
        var values = [];
        if (entry && entry.contains) {

            if (field.isGroup) {

                for (var fieldIndex = 0; fieldIndex < field.contains.length; fieldIndex++) {
                    var subField = field.contains[fieldIndex];

                    for (var valueIndex = 0; valueIndex < entry.contains.length; valueIndex++) {
                        value = entry.contains[valueIndex];
                        if (value.entity_type == subField.entity_type) {
                            values.push(value);
                        }
                    }
                }
            } else {
                for (var i = 0; i < entry.contains.length; i++) {
                    value = entry.contains[i];
                    if (value.entity_type == field.entity_type) {
                        values.push(value);
                    }
                }
            }
        }
        return values;
    };


    $scope.addNewEntry = function() {

        var maxRowId = 0;
        for (var i = 0; i < $scope.entries.length; i++) {
            maxRowId = Math.max(maxRowId, $scope.entries[i].row_id);
        }
        var rowId = maxRowId + 1;

        $scope.entries.push({
            'row_id': rowId,
            'client_id': dictionaryClientId,
            'object_id': $scope.parentEntry.object_id,
            'contains': []
        });
    };


    $scope.enableInput = function(clientId, objectId, entityType) {
        if (!$scope.isInputEnabled(clientId, objectId, entityType)) {
            enabledInputs.push({
                'clientId': clientId,
                'objectId': objectId,
                'entityType': entityType
            });
        }
    };

    $scope.isInputEnabled = function(clientId, objectId, entityType) {
        for (var i = 0; i < enabledInputs.length; i++) {
            var checkItem = enabledInputs[i];
            if (checkItem.clientId === clientId && checkItem.objectId == objectId && checkItem.entityType === entityType) {
                return true;
            }
        }
        return false;
    };

    $scope.disableInput = function(clientId, objectId, entityType) {

        var removeIndex = -1;
        for (var i = 0; i < enabledInputs.length; i++) {
            var checkItem = enabledInputs[i];
            if (checkItem.clientId === clientId && checkItem.objectId == objectId && checkItem.entityType === entityType) {
                removeIndex = i;
                break;
            }
        }

        if (removeIndex >= 0) {
            enabledInputs.splice(removeIndex, 1);
        }
    };

    $scope.saveTextValue = function(entry, field, event, parent) {
        if (event.target.value) {
            $scope.saveValue(entry, field, new model.TextValue(event.target.value), parent);
        }
    };

    $scope.saveSoundValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.SoundValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.saveImageValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.ImageValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.saveMarkupValue = function(entry, field, fileName, fileType, fileContent, parent) {
        var value = new model.MarkupValue(fileName, fileType, fileContent);
        $scope.saveValue(entry, field, value, parent);
    };

    $scope.addedByUser = function(entry) {
        return (entry.client_id == $('#clientId').data('lingvodoc'));
    };

    $scope.saveValue = function(entry, field, value, parent) {

        var url;
        if (field.level) {
            switch (field.level) {
                case  'leveloneentity':
                    url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent($scope.parentEntry.client_id) + '/' + encodeURIComponent($scope.parentEntry.object_id) + '/leveloneentity';
                    break;
                case 'leveltwoentity':
                    if (parent.client_id && parent.object_id) {
                        url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent($scope.parentEntry.client_id) + '/' + encodeURIComponent($scope.parentEntry.object_id) + '/leveloneentity/' + encodeURIComponent(parent.client_id) + '/' + encodeURIComponent(parent.object_id) + '/leveltwoentity';
                    } else {
                        $log.error('Attempting to create Level2 entry with no Level1 entry.');
                        return;
                    }
                    break;
                case 'groupingentity':
                    return;
                    break;
            }

            var entryObject = value.export();

            // TODO: get locale_id from cookies
            entryObject['entity_type'] = field.entity_type;
            entryObject['locale_id'] = 1;
            entryObject['additional_metadata'] = {
                'row_id': entry.row_id,
                'client_id': entry.client_id
            };

            $http.post(url, entryObject).success(function(data, status, headers, config) {

                if (data.client_id && data.object_id) {

                    entryObject.client_id = data.client_id;
                    entryObject.object_id = data.object_id;

                    var getSavedEntityUrl = '/leveloneentity/' + data.client_id + '/' + data.object_id;
                    $http.get(getSavedEntityUrl).success(function(data, status, headers, config) {
                        // add to parent lexical entry
                        for (var i = 0; i < $scope.entries.length; i++) {
                            if ($scope.entries[i].row_id == entry.row_id &&
                                $scope.entries[i].client_id == entry.client_id) {
                                $scope.entries[i].contains.push(data);
                                break;
                            }
                        }

                        // and finally close input
                        $scope.disableInput(entry.client_id, entry.object_id, field.entity_type);

                    }).error(function(data, status, headers, config) {

                    });
                }

            }).error(function(data, status, headers, config) {

            });
        }
    };

    $scope.removeValue = function(entry, field, fieldValue, parent) {

        var url;
        if (field.level) {
            switch (field.level) {
                case  'leveloneentity':
                    url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(entry.client_id) + '/' + encodeURIComponent(entry.object_id) + '/leveloneentity/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id);
                    break;
                case 'leveltwoentity':
                    if (parentClientId && parentObjectId) {
                        url ='/dictionary/' + encodeURIComponent(dictionaryClientId) + '/' + encodeURIComponent(dictionaryObjectId) + '/perspective/' + encodeURIComponent(perspectiveClientId) + '/' + encodeURIComponent(perspectiveId) + '/lexical_entry/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id) + '/leveloneentity/' + encodeURIComponent(parent.client_id) + '/' + encodeURIComponent(parent.object_id) + '/leveltwoentity/' + encodeURIComponent(fieldValue.client_id) + '/' + encodeURIComponent(fieldValue.object_id);
                    } else {
                        $log.error('Attempting to delete Level2 entry with no Level1 entry.');
                        return;
                    }
                    break;
                case 'groupingentity':
                    return;
                    break;
            }

            $http.delete(url).success(function(data, status, headers, config) {

                for (var i = 0; i < $scope.entries.length; i++) {
                    if ($scope.entries[i].row_id == entry.row_id &&
                        $scope.entries[i].client_id == entry.client_id) {

                        var lexicalEntry = $scope.entries[i];
                        for (var j = 0; j < lexicalEntry.contains.length; j++) {
                            if (lexicalEntry.contains[j].client_id == fieldValue.client_id && lexicalEntry.contains[j].object_id == fieldValue.object_id) {
                                $scope.entries[i].contains[j].marked_for_deletion = true;
                            }
                        }
                        break;
                    }
                }

            }).error(function(data, status, headers, config) {

            });
        }
    };


    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.$watch('entries', function (updatedEntries) {
        $scope.mapFieldValues(updatedEntries, $scope.fields);
    }, true);

}]);



app.controller('editGroupingTagController', ['$scope', '$http', '$modalInstance', '$q', '$log', 'groupParams', function($scope, $http, $modalInstance, $q, $log, groupParams) {

    var dictionaryClientId  = $('#dictionaryClientId').data('lingvodoc');
    var dictionaryObjectId  = $('#dictionaryObjectId').data('lingvodoc');
    var perspectiveClientId  = $('#perspectiveClientId').data('lingvodoc');
    var perspectiveId  = $('#perspectiveId').data('lingvodoc');

    var enabledInputs = [];

    WaveSurferController.call(this, $scope);

    $scope.fields = groupParams.fields;
    $scope.connectedEntries = [];
    $scope.suggestedEntries = [];


    $scope.searchQuery = '';


    $scope.fieldsIdx = [];
    for (var k = 0; k < $scope.fields.length; k++) {
        $scope.fieldsIdx.push($scope.fields[k]);
    }

    $scope.fieldsValues = [];
    $scope.suggestedFieldsValues = [];
    $scope.mapFieldValues = function(allEntries, allFields) {

        var result = [];
        $scope.fieldsValues = [];
        for (var i = 0; i < allEntries.length; i++) {
            var entryRow = [];
            for (var j = 0; j < allFields.length; j++) {
                entryRow.push($scope.getFieldValues(allEntries[i], allFields[j]));
            }
            result.push(entryRow);
        }
        return result;
    };

    $scope.getFieldValues = function (entry, field) {

        var value;
        var values = [];
        if (entry && entry.contains) {

            if (field.isGroup) {

                for (var fieldIndex = 0; fieldIndex < field.contains.length; fieldIndex++) {
                    var subField = field.contains[fieldIndex];

                    for (var valueIndex = 0; valueIndex < entry.contains.length; valueIndex++) {
                        value = entry.contains[valueIndex];
                        if (value.entity_type == subField.entity_type) {
                            values.push(value);
                        }
                    }
                }
            } else {
                for (var i = 0; i < entry.contains.length; i++) {
                    value = entry.contains[i];
                    if (value.entity_type == field.entity_type) {
                        values.push(value);
                    }
                }
            }
        }
        return values;
    };

    $scope.linkEntry = function(index) {
        $scope.connectedEntries.push($scope.suggestedEntries[index]);
    };


    $scope.unlinkEntry = function(index) {
        $scope.connectedEntries.splice(index);
    };


    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.$watch('connectedEntries', function (updatedEntries) {
        $scope.fieldsValues = $scope.mapFieldValues(updatedEntries, $scope.fields);
    }, true);


    $scope.$watch('suggestedEntries', function (updatedEntries) {
        $scope.suggestedFieldsValues = $scope.mapFieldValues(updatedEntries, $scope.fields);
    }, true);


    $scope.$watch('searchQuery', function (updatedQuery) {

        if (!updatedQuery || updatedQuery.length < 3) {
            return;
        }

        var url = '/basic_search?leveloneentity=' + encodeURIComponent(updatedQuery);
        $http.get(url).success(function(data, status, headers, config) {
            $scope.suggestedEntries = [];

            var urls = [];
            for (var i = 0; i < data.length; i++) {
                var entr = data[i];
                var getEntryUrl = '/dictionary/' + encodeURIComponent(entr.origin_dictionary_client_id) +'/'+ encodeURIComponent(entr.origin_dictionary_object_id) + '/perspective/' + encodeURIComponent(entr.origin_perspective_client_id) +  '/' + encodeURIComponent(entr.origin_perspective_object_id) + '/lexical_entry/' + encodeURIComponent(entr.client_id) + '/' + encodeURIComponent(entr.object_id);
                urls.push(getEntryUrl);
            }

            var uniqueUrls = urls.filter(function(item, pos) {
                return urls.indexOf(item) == pos;
            });

            var requests = [];
            for (var j = 0; j < uniqueUrls.length; j++) {
                var r = $http.get(uniqueUrls[j]);
                requests.push(r);
            }

            $q.all(requests).then(function(results) {
                for (var k = 0; k < results.length; k++) {
                    if (results[k].data) {
                        $scope.suggestedEntries.push(results[k].data.lexical_entry);
                    }
                }
            });



        }).error(function(data, status, headers, config) {

        });

    }, true);


    var loadConnectedWords = function() {
        var url = '/lexical_entry/' + encodeURIComponent(groupParams.clientId) + '/' + encodeURIComponent(groupParams.objectId) + '/connected';
        $http.get(url).success(function(data, status, headers, config) {



        }).error(function(data, status, headers, config) {

        });

    };

    loadConnectedWords();

}]);

