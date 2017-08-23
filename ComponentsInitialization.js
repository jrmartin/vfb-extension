define(function (require) {
    return function (GEPPETTO) {

        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/extensions/geppetto-vfb/css/VFB.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        // any required stuff
        var Query = require('./../../js/geppettoModel/model/Query');
        var ImportType = require('./../../js/geppettoModel/model/ImportType');
        var Bloodhound = require("typeahead.js/dist/bloodhound.min.js");
        var vfbTutorial = require('./tutorials/controlPanelTutorial.json');
        
        var markdown = require( "markdown" ).markdown;

        var stackMD = "https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/mdHelpFiles/stack.md";
        var termMD = "https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/mdHelpFiles/term.md";
        
        //Retrieve 
        function getMDText(urlLocation){
            var result = null;
            $.ajax( { url: urlLocation, 
                      type: 'get', 
                      dataType: 'html',
                      async: false,
                      success: function(data) { result = data; } 
                    }
            );
            return result;
        }
        
        //retrieve MD files text output and stores it into local variables
        var termHelpInfo = getMDText(termMD);
        var stackHelpInfo = getMDText(stackMD);
        
        /*ADD COMPONENTS*/
        
        //Logo initialization
        GEPPETTO.ComponentFactory.addComponent('LOGO', {logo: 'gpt-fly'}, document.getElementById("geppettologo"));

        //Tutorial component initialization
        GEPPETTO.ComponentFactory.addWidget('TUTORIAL', {
            name: 'VFB Tutorial',
            tutorialData: vfbTutorial,
            isStateless: true,
            closeByDefault : true
        }, function() {
            //temporary until sessions allow to customise the tutorial component
            GEPPETTO.Tutorial.addTutorial("https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/tutorials/queryTutorial.json");
            GEPPETTO.Tutorial.addTutorial("https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/tutorials/spotlightTutorial.json");
            GEPPETTO.Tutorial.addTutorial("https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/tutorials/termTutorial.json");
            GEPPETTO.Tutorial.addTutorial("https://raw.githubusercontent.com/jrmartin/vfb-extension/vfb-8/17/tutorials/stackTutorial.json");
        });
        
        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {enableInfiniteScroll: true}, document.getElementById("controlpanel"), function () {
            // CONTROLPANEL configuration
            // set column meta - which custom controls to use, source configuration for data, custom actions
            var controlPanelColMeta = [
                {
                    "columnName": "path",
                    "order": 1,
                    "locked": false,
                    "displayName": "Path",
                    "source": "$entity$.getPath()"
                },
                {
                    "columnName": "name",
                    "order": 2,
                    "locked": false,
                    "customComponent": GEPPETTO.LinkComponent,
                    "displayName": "Name",
                    "source": "$entity$.getName()",
                    "actions": "setTermInfo($entity$['$entity$' + '_meta'], $entity$.getName());"
                },
                {
                    "columnName": "type",
                    "order": 3,
                    "locked": false,
                    "customComponent": GEPPETTO.LinkArrayComponent,
                    "displayName": "Type",
                    "source": "$entity$.$entity$_meta.getTypes().map(function (t) {return t.type.getInitialValue().value})",
                    "actions": "window.fetchVariableThenRun('$entity$', window.setTermInfoCallback);",
                },
                {
                    "columnName": "controls",
                    "order": 4,
                    "locked": false,
                    "customComponent": GEPPETTO.ControlsComponent,
                    "displayName": "Controls",
                    "cssClassName": "controlpanel-controls-column",
                    "source": "",
                    "actions": "GEPPETTO.ControlPanel.refresh();"
                },
                {
                    "columnName": "image",
                    "order": 5,
                    "locked": false,
                    "customComponent": GEPPETTO.ImageComponent,
                    "displayName": "Image",
                    "cssClassName": "img-column",
                    "source": "GEPPETTO.ModelFactory.getAllVariablesOfMetaType($entity$.$entity$_meta.getType(), 'ImageType')[0].getInitialValues()[0].value.data"
                }
            ];
            GEPPETTO.ControlPanel.setColumnMeta(controlPanelColMeta);
            // which columns to display
            GEPPETTO.ControlPanel.setColumns(['name', 'type', 'controls', 'image']);
            // which instances to display in the control panel
            GEPPETTO.ControlPanel.setDataFilter(function (entities) {
                var visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
                var visualParents = [];
                for (var i = 0; i < visualInstances.length; i++) {
                	if (visualInstances[i].getParent() != null){
                		visualParents.push(visualInstances[i].getParent());
                	}
                }
                visualInstances = visualInstances.concat(visualParents);
                var compositeInstances = [];
                for (var i = 0; i < visualInstances.length; i++) {
                    if (visualInstances[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
                        compositeInstances.push(visualInstances[i]);
                    }
                }
                return compositeInstances;
            });
            // custom controls configuration in the controls column
            GEPPETTO.ControlPanel.setControlsConfig({
                "VisualCapability": {
                    "select": {
                        "id": "select",
                        "condition": "GEPPETTO.SceneController.isSelected($instance$.$instance$_obj != undefined ? [$instance$.$instance$_obj] : []) ||  GEPPETTO.SceneController.isSelected($instance$.$instance$_swc != undefined ? [$instance$.$instance$_swc] : [])",
                        "false": {
                            "actions": ["$instance$.select()"],
                            "icon": "fa-hand-stop-o",
                            "label": "Unselected",
                            "tooltip": "Select",
                            "id": "select",
                        },
                        "true": {
                            "actions": ["$instance$.deselect()"],
                            "icon": "fa-hand-rock-o",
                            "label": "Selected",
                            "tooltip": "Deselect",
                            "id": "deselect",
                        }
                    },
                    "color": {
                        "id": "color",
                        "actions": ["$instance$.setColor('$param$');"],
                        "icon": "fa-tint",
                        "label": "Color",
                        "tooltip": "Color"
                    },
                    "zoom": {
                        "id": "zoom",
                        "actions": ["GEPPETTO.SceneController.zoomTo($instances$)"],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                    "visibility_obj": {
                        "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_obj')",
                        "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_obj != undefined && $instance$.getType().$instance$_obj.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_obj != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_obj]); } return visible; })()",
                        "false": {
                            "id": "visibility_obj",
                            "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_obj'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { var col = instance.getParent().getColor(); instance.getType().resolve(function() { instance.setColor(col); GEPPETTO.trigger('experiment:visibility_changed', instance); GEPPETTO.ControlPanel.refresh(); }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show 3D Volume"
                        },
                        "true": {
                            "id": "visibility_obj",
                            "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_obj])"],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide 3D Volume"
                        }
                    },
                    "visibility_swc": {
                        "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_swc')",
                        "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_swc != undefined && $instance$.getType().$instance$_swc.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_swc != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_swc]); } return visible; })()",
                        "false": {
                            "id": "visibility_swc",
                            "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_swc'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { var col = instance.getParent().getColor(); instance.getType().resolve(function() { instance.setColor(col); GEPPETTO.trigger('experiment:visibility_changed', instance); GEPPETTO.ControlPanel.refresh(); }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show 3D Skeleton"
                        },
                        "true": {
                            "id": "visibility_swc",
                            "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_swc])"],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide 3D Skeleton"
                        }
                    },
                },
                "Common": {
                    "info": {
                        "id": "info",
                        "actions": ["var displayTxt = '$instance$'.split('.')['$instance$'.split('.').length - 1]; setTermInfo($instance$[displayTxt + '_meta'], displayTxt);"],
                        "icon": "fa-info-circle",
                        "label": "Info",
                        "tooltip": "Info"
                    },
                    "delete": {
                    	"showCondition": "$instance$.getId()!=window.templateID",
                        "id": "delete",
                        "actions": ["if($instance$.getPath() == ((window.termInfoPopup.data != undefined) ? eval(window.termInfoPopup.data).getParent().getPath() : undefined)) { setTermInfo(window[window.templateID][window.templateID+'_meta'], window[window.templateID][window.templateID+'_meta'].getParent().getId());} $instance$.deselect(); $instance$.delete();"],
                        "icon": "fa-trash-o",
                        "label": "Delete",
                        "tooltip": "Delete"
                    }
                }
            });
            // which controls will be rendered, strings need to match ids in the controls configuration
            GEPPETTO.ControlPanel.setControls({
                "Common": ['info', 'delete'],
                "VisualCapability": ['select', 'color', 'visibility', 'zoom', 'visibility_obj', 'visibility_swc']
            });
        });

        //Spotlight initialization
        GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {indexInstances: false}, document.getElementById("spotlight"), function () {
            // SPOTLIGHT configuration
            var spotlightConfig = {
                "SpotlightBar": {
                    "DataSources": {},
                    "CompositeType": {
                        "type": {
                            "actions": [
                                "setTermInfo($variableid$['$variableid$' + '_meta'],'$variableid$');GEPPETTO.Spotlight.close();",
                            ],
                            "icon": "fa-info-circle",
                            "label": "Show info",
                            "tooltip": "Show info"
                        },
                        "query": {
                            actions: [
                                "window.fetchVariableThenRun('$variableid$', window.addToQueryCallback);"
                            ],
                            icon: "fa-quora",
                            label: "Add to query",
                            tooltip: "Add to query"
                        },
                    },
                    "VisualCapability": {
                        "buttonOne": {
                            "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                            "false": {
                                "actions": ["GEPPETTO.SceneController.select($instances$)"],
                                "icon": "fa-hand-stop-o",
                                "label": "Unselected",
                                "tooltip": "Select"
                            },
                            "true": {
                                "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                                "icon": "fa-hand-rock-o",
                                "label": "Selected",
                                "tooltip": "Deselect"
                            },
                        },
                        "buttonTwo": {
                            "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                            "false": {
                                "actions": [
                                    "GEPPETTO.SceneController.show($instances$)"
                                ],
                                "icon": "fa-eye-slash",
                                "label": "Hidden",
                                "tooltip": "Show"
                            },
                            "true": {
                                "actions": [
                                    "GEPPETTO.SceneController.hide($instances$)"
                                ],
                                "icon": "fa-eye",
                                "label": "Visible",
                                "tooltip": "Hide"
                            }

                        },
                        "buttonThree": {
                            "actions": [
                                "GEPPETTO.SceneController.zoomTo($instances$);GEPPETTO.Spotlight.close();"
                            ],
                            "icon": "fa-search-plus",
                            "label": "Zoom",
                            "tooltip": "Zoom"
                        },
                    }
                }
            };
            GEPPETTO.Spotlight.setButtonBarConfiguration(spotlightConfig);
            // external datasource configuration
            var spotlightDataSourceConfig = {
                VFB: {
                    url: "https://www.virtualflybrain.org/search/select?fl=short_form,label,synonym,id,type,has_narrow_synonym_annotation,has_broad_synonym_annotation&start=0&fq=ontology_name:(fbbt)&fq=is_obsolete:false&fq=shortform_autosuggest:VFB_*%20OR%20shortform_autosuggest:FB*&rows=250&bq=is_defining_ontology:true%5E100.0%20label_s:%22%22%5E2%20synonym_s:%22%22%20in_subset_annotation:BRAINNAME%5E3%20short_form:FBbt_00003982%5E2&q=*$SEARCH_TERM$*%20OR%20$SEARCH_TERM$&defType=edismax&qf=label%20synonym%20label_autosuggest_ws%20label_autosuggest_e%20label_autosuggest%20synonym_autosuggest_ws%20synonym_autosuggest_e%20synonym_autosuggest%20shortform_autosuggest%20has_narrow_synonym_annotation%20has_broad_synonym_annotation&wt=json&indent=true",
                    crossDomain: true,
                    id: "short_form",
                    label: {field: "label", formatting: "$VALUE$"},
                    explode_fields: [{field: "short_form", formatting: "$VALUE$ ($LABEL$)"}],
                    explode_arrays: [{field: "synonym", formatting: "$VALUE$ ($LABEL$)"}],
                    type: {
                        class: {
                            icon: "fa-file-text-o",
                            buttons: {
                                buttonOne: {
                                    actions: ["window.fetchVariableThenRun('$ID$', window.setTermInfoCallback);"],
                                    icon: "fa-info-circle",
                                    label: "Show info",
                                    tooltip: "Show info"
                                },
                                buttonTwo: {
                                    actions: ["window.fetchVariableThenRun('$ID$', window.addToQueryCallback, '$LABEL$');"],
                                    icon: "fa-quora",
                                    label: "Add to query",
                                    tooltip: "Add to query"
                                }
                            }
                        },
                        individual: {
                            icon: "fa-file-image-o",
                            buttons: {
                            	buttonOne: {
                                    actions: ["window.fetchVariableThenRun('$ID$', window.setTermInfoCallback);"],
                                    icon: "fa-info-circle",
                                    label: "Show info",
                                    tooltip: "Show info"
                                },
                                buttonTwo: {
                                    actions: ["window.fetchVariableThenRun('$ID$', window.addToSceneCallback);"],
                                    icon: "fa-file-image-o",
                                    label: "Add to scene",
                                    tooltip: "Add to scene"
                                },
                                buttonThree: {
                                    actions: ["window.fetchVariableThenRun('$ID$', window.addToQueryCallback, '$LABEL$');"],
                                    icon: "fa-quora",
                                    label: "Add to query",
                                    tooltip: "Add to query"
                                }
                            }
                        }
                    },
                    bloodhoundConfig: {
                        datumTokenizer: function (d) {
                            return Bloodhound.tokenizers.nonword(d.label.replace('_', ' '));
                        },
                        queryTokenizer: function (q) {
                            return Bloodhound.tokenizers.nonword(q.replace('_', ' '));
                        },
                        sorter: function (a, b) {
                            var term = $('#typeahead').val();
                            return customSorter(a, b, term);
                        }
                    }
                }
            };
            GEPPETTO.Spotlight.addDataSource(spotlightDataSourceConfig);
        });

        //Foreground initialization
        GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {addToForegroundControls : false}, document.getElementById("foreground-toolbar"));
        
        //Query control initialization
        GEPPETTO.ComponentFactory.addComponent('QUERY', {enableInfiniteScroll: true}, document.getElementById("querybuilder"), function () {
            // QUERY configuration
            var queryResultsColMeta = [
                {
                    "columnName": "id",
                    "order": 1,
                    "locked": false,
                    "visible": true,
                    "displayName": "ID",
                },
                {
                    "columnName": "name",
                    "order": 2,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.QueryLinkComponent,
                    "actions": "window.fetchVariableThenRun('$entity$', function(){ var instance = Instances.getInstance('$entity$.$entity$_meta'); setTermInfo(instance, instance.getParent().getName());});",
                    "displayName": "Name",
                    "cssClassName": "query-results-name-column",
                },
                {
                    "columnName": "description",
                    "order": 3,
                    "locked": false,
                    "visible": true,
                    "displayName": "Definition",
                    "cssClassName": "query-results-description-column"
                },
                {
                    "columnName": "type",
                    "order": 4,
                    "locked": false,
                    "visible": true,
                    "displayName": "Type",
                    "cssClassName": "query-results-type-column"
                },
                {
                    "columnName": "controls",
                    "order": 5,
                    "locked": false,
                    "visible": false,
                    "customComponent": GEPPETTO.QueryResultsControlsComponent,
                    "displayName": "Controls",
                    "actions": "",
                    "cssClassName": "query-results-controls-column"
                },
                {
                    "columnName": "images",
                    "order": 6,
                    "locked": false,
                    "visible": true,
                    "customComponent": GEPPETTO.SlideshowImageComponent,
                    "displayName": "Images",
                    "actions": "window.fetchVariableThenRun('$entity$', function () { var meta = '$entity$' + '.' + '$entity$' + '_meta'; var inst = Instances.getInstance(meta); setTermInfo(inst, $entity$.getName()); resolve3D('$entity$'); });",
                    "cssClassName": "query-results-images-column"
                }
            ];
            GEPPETTO.QueryBuilder.setResultsColumnMeta(queryResultsColMeta);
            // which columns to display in the results
            GEPPETTO.QueryBuilder.setResultsColumns(['name', 'description', 'type', 'images']);

            var queryResultsControlConfig = {
                "Common": {
                    "info": {
                        "id": "info",
                        "actions": [
                            "window.fetchVariableThenRun('$ID$', window.setTermInfoCallback);"
                        ],
                        "icon": "fa-info-circle",
                        "label": "Info",
                        "tooltip": "Info"
                    },
                    "flybase": {
                        "showCondition": "'$ID$'.startsWith('FBbt')",
                        "id": "flybase",
                        "actions": [
                            "window.open('http://flybase.org/cgi-bin/cvreport.html?rel=is_a&id=' + '$ID$'.replace(/_/g, ':'), '_blank').focus()"
                        ],
                        "icon": "gpt-fly",
                        "label": "FlyBase",
                        "tooltip": "FlyBase Term"
                    },
                    "flybase": {
                        "showCondition": "('$ID$'.startsWith('FB') && !'$ID$'.startsWith('FBbt'))",
                        "id": "flybase",
                        "actions": [
                            "window.open('http://flybase.org/reports/' + '$ID$'.replace(/_/g, ':'), '_blank').focus()"
                        ],
                        "icon": "gpt-fly",
                        "label": "FlyBase",
                        "tooltip": "FlyBase Report"
                    }
                }
            };
            GEPPETTO.QueryBuilder.setResultsControlsConfig(queryResultsControlConfig);

            // add datasource config to query control
            var queryBuilderDatasourceConfig = {
                VFB: {
                    url: "https://www.virtualflybrain.org/search/select?fl=short_form,label,synonym,id,type,has_narrow_synonym_annotation,has_broad_synonym_annotation&start=0&fq=ontology_name:(fbbt)&fq=is_obsolete:false&fq=shortform_autosuggest:VFB_*%20OR%20shortform_autosuggest:FBbt_*&rows=250&bq=is_defining_ontology:true%5E100.0%20label_s:%22%22%5E2%20synonym_s:%22%22%20in_subset_annotation:BRAINNAME%5E3%20short_form:FBbt_00003982%5E2&q=*$SEARCH_TERM$*%20OR%20$SEARCH_TERM$&defType=edismax&qf=label%20synonym%20label_autosuggest_ws%20label_autosuggest_e%20label_autosuggest%20synonym_autosuggest_ws%20synonym_autosuggest_e%20synonym_autosuggest%20shortform_autosuggest%20has_narrow_synonym_annotation%20has_broad_synonym_annotation&wt=json&indent=true",
                    crossDomain: true,
                    id: "short_form",
                    label: {field: "label", formatting: "$VALUE$"},
                    explode_fields: [{field: "short_form", formatting: "$VALUE$ ($LABEL$)"}],
                    explode_arrays: [{field: "synonym", formatting: "$VALUE$ ($LABEL$)"}],
                    type: {
                        class: {
                            actions: ["window.fetchVariableThenRun('$ID$', function(){ GEPPETTO.QueryBuilder.addQueryItem({ term: '$LABEL$', id: '$ID$'}); });"],
                            icon: "fa-dot-circle-o"
                        },
                        individual: {
                            actions: ["window.fetchVariableThenRun('$ID$', function(){ GEPPETTO.QueryBuilder.addQueryItem({ term: '$LABEL$', id: '$ID$'}); });"],
                            icon: "fa-square-o"
                        }
                    },
                    queryNameToken: '$NAME',
                    resultsFilters: {
                        getId: function (record) {
                            return record[0]
                        },
                        getName: function (record) {
                            return record[1]
                        },
                        getDescription: function (record) {
                            return record[2]
                        },
                        getType: function (record) {
                            return record[3]
                        },
                        getImageData: function (record) {
                            return record[4]
                        },
                        getRecords: function (payload) {
                            return payload.results.map(function (item) {
                                return item.values
                            })
                        }
                    },
                    bloodhoundConfig: {
                        datumTokenizer: function (d) {
                            return Bloodhound.tokenizers.nonword(d.label.replace('_', ' '));
                        },
                        queryTokenizer: function (q) {
                            return Bloodhound.tokenizers.nonword(q.replace('_', ' '));
                        },
                        sorter: function (a, b) {
                            var term = $("#query-typeahead").val();
                            return customSorter(a, b, term);
                        }
                    }
                }
            };
            GEPPETTO.QueryBuilder.addDataSource(queryBuilderDatasourceConfig);
        });

        //Canvas initialisation
        window.vfbCanvas = undefined;
        GEPPETTO.ComponentFactory.addComponent('CANVAS', {}, document.getElementById("sim"), function () {
            this.flipCameraY();
            this.flipCameraZ();
            this.setWireframe(true);
            this.displayAllInstances();
            window.vfbCanvas = this;

            if(window.StackViewer1 != undefined){
                window.StackViewer1.setCanvasRef(this);
            }
        });

        //Loading spinner initialization
        GEPPETTO.Spinner.setLogo("gpt-fly");

        // VFB initialization routines
        window.initVFB = function () {

            window.templateID = undefined;
            window.redirectURL = '$PROTOCOL$//$HOST$/?i=$TEMPLATE$,$VFB_ID$&id=$VFB_ID$';

            // widgets default dimensions and positions
            var getStackViewerDefaultWidth = function() { return Math.ceil(window.innerWidth / 4); };
            var getStackViewerDefaultHeight = function() { return Math.ceil(window.innerHeight/4) - 10; };
            var getTermInfoDefaultWidth = function() { return Math.ceil(window.innerWidth / 4); };
            var getTermInfoDefaultHeight = function() { return ((window.innerHeight - Math.ceil(window.innerHeight/4))-20); };
            var getTermInfoDefaultX = function() { return (window.innerWidth - (Math.ceil(window.innerWidth / 4) + 10)); };
            var getStackViewerDefaultX = function() { return (window.innerWidth - (Math.ceil(window.innerWidth / 4) + 10)); };
            var getStackViewerDefaultY = function() { return (window.innerHeight - Math.ceil(window.innerHeight/4)); };
            var getTermInfoDefaultY = function() {return 10;};
            var getButtonBarDefaultX = function() { return (Math.ceil(window.innerWidth / 2) - 125); };
            var getButtonBarDefaultY = function() { return 10; };

            // logic to assign colours to elements in the scene
            window.colours = ["0x5b5b5b", "0x00ff00", "0xff0000", "0x0000ff", "0x0084f6", "0x008d46", "0xa7613e", "0x4f006a", "0x00fff6", "0x3e7b8d", "0xeda7ff", "0xd3ff95", "0xb94fff", "0xe51a58", "0x848400", "0x00ff95", "0x61002c", "0xf68412", "0xcaff00", "0x2c3e00", "0x0035c1", "0xffca84", "0x002c61", "0x9e728d", "0x4fb912", "0x9ec1ff", "0x959e7b", "0xff7bb0", "0x9e0900", "0xffb9b9", "0x8461ca", "0x9e0072", "0x84dca7", "0xff00f6", "0x00d3ff", "0xff7258", "0x583e35", "0x003e35", "0xdc61dc", "0x6172b0", "0xb9ca2c", "0x12b0a7", "0x611200", "0x2c002c", "0x5800ca", "0x95c1ca", "0xd39e23", "0x84b058", "0xe5edb9", "0xf6d3ff", "0xb94f61", "0x8d09a7", "0x6a4f00", "0x003e9e", "0x7b3e7b", "0x3e7b61", "0xa7ff61", "0x0095d3", "0x3e7200", "0xb05800", "0xdc007b", "0x9e9eff", "0x4f4661", "0xa7fff6", "0xe5002c", "0x72dc72", "0xffed7b", "0xb08d46", "0x6172ff", "0xdc4600", "0x000072", "0x090046", "0x35ed4f", "0x2c0000", "0xa700ff", "0x00f6c1", "0x9e002c", "0x003eff", "0xf69e7b", "0x6a7235", "0xffff46", "0xc1b0b0", "0x727272", "0xc16aa7", "0x005823", "0xff848d", "0xb08472", "0x004661", "0x8dff12", "0xb08dca", "0x724ff6", "0x729e00", "0xd309c1", "0x9e004f", "0xc17bff", "0x8d95b9", "0xf6a7d3", "0x232309", "0xff6aca", "0x008d12", "0xffa758", "0xe5c19e", "0x00122c", "0xc1b958", "0x00c17b", "0x462c00", "0x7b3e58", "0x9e46a7", "0x4f583e", "0x6a35b9", "0x72b095", "0xffb000", "0x4f3584", "0xb94635", "0x61a7ff", "0xd38495", "0x7b613e", "0x6a004f", "0xed58ff", "0x95d300", "0x35a7c1", "0x00009e", "0x7b3535", "0xdcff6a", "0x95d34f", "0x84ffb0", "0x843500", "0x4fdce5", "0x462335", "0x002c09", "0xb9dcc1", "0x588d4f", "0x9e7200", "0xca4684", "0x00c146", "0xca09ed", "0xcadcff", "0x0058a7", "0x2ca77b", "0x8ddcff", "0x232c35", "0xc1ffb9", "0x006a9e", "0x0058ff", "0xf65884", "0xdc7b46", "0xca35a7", "0xa7ca8d", "0x4fdcc1", "0x6172d3", "0x6a23ff", "0x8d09ca", "0xdcc12c", "0xc1b97b", "0x3e2358", "0x7b6195", "0xb97bdc", "0xffdcd3", "0xed5861", "0xcab9ff", "0x3e5858", "0x729595", "0x7bff7b", "0x95356a", "0xca9eb9", "0x723e1a", "0x95098d", "0xf68ddc", "0x61b03e", "0xffca61", "0xd37b72", "0xffed9e", "0xcaf6ff", "0x58c1ff", "0x8d61ed", "0x61b972", "0x8d6161", "0x46467b", "0x0058d3", "0x58dc09", "0x001a72", "0xd33e2c", "0x959546", "0xca7b00", "0x4f6a8d", "0x9584ff", "0x46238d", "0x008484", "0xf67235", "0x9edc84", "0xcadc6a", "0xb04fdc", "0x4f0912", "0xff1a7b", "0x7bb0d3", "0x1a001a", "0x8d35f6", "0x5800a7", "0xed8dff", "0x969696", "0xffd300"];
            window.coli = 0;
            window.setSepCol = function (entityPath) {
                var c = coli;
                coli++;
                if (coli > 199) {
                    coli = 0;
                }
                if (Instances.getInstance(entityPath).setColor != undefined){
                	Instances.getInstance(entityPath).setColor(colours[c], true).setOpacity(0.3, true);
                	try {
                        Instances.getInstance(entityPath)[entityPath + '_swc'].setOpacity(1.0);
                    } catch (ignore) {
                    }
                    if (c = 0) {
                        Instances.getInstance(entityPath).setOpacity(0.2, true);
                    }
                }else{
                	console.log('Issue setting colour for ' + entityPath);
                }
            };

            // custom handler for resolving 3d geometries
            window.resolve3D = function (path, callback) {
                var rootInstance = Instances.getInstance(path);
                window.updateHistory(rootInstance.getName());
                GEPPETTO.SceneController.deselectAll();

                // check if we can set templateID (first template loaded will be kept as templateID)
                if(window.templateID == undefined){
                    var superTypes = rootInstance.getType().getSuperType();
                    for(var i=0; i<superTypes.length; i++){
                        if(superTypes[i].getId() == 'Template'){
                            window.templateID = rootInstance.getId();
                        }
                    }
                } else {
                    // check if the user is adding to the scene something belonging to another template
                    var superTypes = rootInstance.getType().getSuperType();
                    var templateID = "unknown";
                    for(var i=0; i<superTypes.length; i++){
                        if(superTypes[i].getId() == window.templateID){
                            templateID = superTypes[i].getId()
                        }
                        if(superTypes[i].getId() == 'Class'){ 
                            templateID = window.templateID;
                            return; // Exit if Class - Class doesn't have image types.
                        }
                    }
                    
                    var meta = rootInstance[rootInstance.getId() + '_meta'];
                    if(meta != undefined){
                        if (typeof meta.getType().template != "undefined"){
                            var templateMarkup = meta.getType().template.getValue().wrappedObj.value.html;
                            var domObj = $(templateMarkup);
                            var anchorElement = domObj.filter('a');
                            // extract ID
                            var templateID = anchorElement.attr('instancepath');
                            if (window.EMBEDDED){
                            	var curHost = parent.document.location.host;
                            	var curProto = parent.document.location.protocol;
                            }else{
                            	var curHost = document.location.host;
                            	var curProto = document.location.protocol;
                            }
                            if(templateID != window.templateID){
                                // open new window with the new template and the instance ID
                                var targetWindow = '_blank';
                                var newUrl = window.redirectURL.replace(/\$VFB_ID\$/gi, rootInstance.getId()).replace(/\$TEMPLATE\$/gi, templateID).replace(/\$HOST\$/gi, curHost).replace(/\$PROTOCOL\$/gi, curProto);
                                window.open(newUrl, targetWindow);
                                // stop flow here, we don't want to add to scene something with a different template
                                return;
                            }
                        }
                    }
                }

                var instance = undefined;
                // check if we have swc
                try {
                    instance = Instances.getInstance(path + "." + path + "_swc");
                } catch (ignore) {
                }
                // if no swc check if we have obj
                if (instance == undefined) {
                    try {
                        instance = Instances.getInstance(path + "." + path + "_obj");
                    } catch (ignore) {
                    }
                }
                // if anything was found resolve type (will add to scene)
                if (instance != undefined) {
                    var postResolve = function () {
                        setSepCol(path);
                        if (callback != undefined) {
                            callback();
                        }
                    };

                    if(instance.getType() instanceof ImportType) {
                        instance.getType().resolve(postResolve);
                    } else {
                        // add instance to scene
                        vfbCanvas.display([instance]);
                        // trigger update for components that are listening
                        GEPPETTO.trigger(GEPPETTO.Events.Instances_created, [instance]);
                        postResolve();
                    }
                }

                // independently from the above, check if we have slices for the instance
                try {
                    instance = Instances.getInstance(path + "." + path + "_slices");
                    if(instance.getType() instanceof ImportType){
                        instance.getType().resolve();
                    }
                } catch (ignore) {
                    // any alternative handling goes here
                }
            };

            window.fetchVariableThenRun = function(variableId, callback, label){
                GEPPETTO.SceneController.deselectAll(); // signal something is happening!
                var variables = GEPPETTO.ModelFactory.getTopLevelVariablesById([variableId]);
                if (!variables.length>0) {
                    Model.getDatasources()[0].fetchVariable(variableId, function() {
                        callback(variableId, label);
                    });
                } else {
                    callback(variableId, label);
                }
            };

            window.addToSceneCallback = function(variableId){
                var instance = Instances.getInstance(variableId);
                var meta = Instances.getInstance(variableId + '.' + variableId + '_meta');
                resolve3D(variableId, function() {
                    GEPPETTO.SceneController.deselectAll();
                    instance.select();
                    //GEPPETTO.Spotlight.openToInstance(instance);
                    setTermInfo(meta, meta.getParent().getId());
                });
            };
            
            window.addToQueryCallback = function(variableId, label) {
            	window.clearQS();
            	GEPPETTO.QueryBuilder.clearAllQueryItems();
                GEPPETTO.QueryBuilder.switchView(false);
                GEPPETTO.QueryBuilder.addQueryItem({
                    term: (label != undefined) ? label :  eval(variableId).getName(),
                    id: variableId
                });
                GEPPETTO.QueryBuilder.open();
            };

            window.setTermInfoCallback = function(variableId){
                var instance = Instances.getInstance(variableId + '.' + variableId + '_meta');
                setTermInfo(instance, instance.getParent().getId());
            };

            // custom handler for term info clicks
            window.customHandler = function (node, path, widget) {
                var n;
                var otherId;
                var otherName;
                try {
                    n = eval(path);
                } catch (ex) {
                    node = undefined;
                }
                var meta = path + "." + path + "_meta";
                var target = widget;
                // if (GEPPETTO.isKeyPressed("meta")) {
                //  target = G.addWidget(1, {isStateless: true}).addCustomNodeHandler(customHandler, 'click');
                //}
                if (n != undefined) {
                    var metanode = Instances.getInstance(meta);
                    if (target.data == metanode){
                    	window.resolve3D(path);
                    }else{
                    	target.setData(metanode).setName(n.getName());
                    }
                } else {
                	// check for passed ID:
                	if (path.indexOf(',')>-1){
                		otherId = path.split(',')[1];
                		otherName = path.split(',')[2];
                		path = path.split(',')[0];
                	}
                    // try to evaluate as path in Model
                    var entity = Model[path];
                    if(entity instanceof Query){
                        GEPPETTO.trigger('spin_logo');
                        $("body").css("cursor", "progress");

                        // clear query builder
                        GEPPETTO.QueryBuilder.clearAllQueryItems();

                        var callback = function(){
                            // check if any results with count flag
                            if(GEPPETTO.QueryBuilder.props.model.count > 0){
                                // runQuery if any results
                                GEPPETTO.QueryBuilder.runQuery();
                            } else {
                                GEPPETTO.QueryBuilder.switchView(false);
                            }

                            // show query component
                            GEPPETTO.QueryBuilder.open();

                            $("body").css("cursor", "default");
                            GEPPETTO.trigger('stop_spin_logo');
                        };

                        // add query item + selection
                        if (otherId == undefined) {
                        	GEPPETTO.QueryBuilder.addQueryItem({ term: widget.name, id: widget.data.getParent().getId(), queryObj: entity}, callback);
                        }else{
                        	if (window[otherId] == undefined){
                        		window.fetchVariableThenRun(otherId, function(){GEPPETTO.QueryBuilder.addQueryItem({ term: otherName, id: otherId, queryObj: entity}, callback)});
                        	}else{
                        		GEPPETTO.QueryBuilder.addQueryItem({ term: otherName, id: otherId, queryObj: entity}, callback);
                        	}
                        }
                    } else {
                        Model.getDatasources()[0].fetchVariable(path, function () {
                            Instances.getInstance(meta);
                            target.setData(eval(meta)).setName(eval(path).getName());
                            resolve3D(path);
                        });
                    }
                }
          
            };
            
            // set term info on selection
            GEPPETTO.on(GEPPETTO.Events.Select, function (instance) {
                var selection = GEPPETTO.SceneController.getSelection();
                if (selection.length > 0 && instance.isSelected()) {
                    var latestSelection = instance;
                    var currentSelectionName = getTermInfoWidget().name;
                    if(latestSelection.getChildren().length > 0){
                        // it's a wrapper object - if name is different from current selection set term info
                        if(currentSelectionName != latestSelection.getName()) {
                            setTermInfo(latestSelection[latestSelection.getId() + "_meta"], latestSelection[latestSelection.getId() + "_meta"].getName());
                        }
                    } else {
                        // it's a leaf (no children) / grab parent if name is different from current selection set term info
                        var parent = latestSelection.getParent();
                        if(parent != null && currentSelectionName != parent.getName()){
                            setTermInfo(parent[parent.getId() + "_meta"], parent[parent.getId() + "_meta"].getName());
                        }
                    }
                }
                if (window.StackViewer1 != undefined){
                    updateStackWidget();
                }
            });

            // stack widget helper methods
            var getSliceInstances = function(){
                var potentialInstances = GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('_slices');
                var sliceInstances = [];
                var instance;
                for(var i=0; i<potentialInstances.length; i++){
                    instance = Instances.getInstance(potentialInstances[i],false);
                    if (instance){
                        sliceInstances.push(instance);
                    }
                }

                return sliceInstances;
            };

            var updateStackWidget = function(){
            	window.checkConnection();
            	console.log('Updating stack...');
                window.StackViewer1.setData({
                    instances: getSliceInstances()
                });
            };

            window.addStackWidget = function(){
                var sliceInstances = getSliceInstances();

                if (window.StackViewer1 == undefined){
                    var config;
                    var domainId = [];
                    var domainName = [];
                    if (typeof sliceInstances[0] !== "undefined"){
                        config = JSON.parse(sliceInstances[0].getValue().wrappedObj.value.data);
                    }
                    if (config == undefined || typeof config !== "undefined"){
                    	config = {
                                serverUrl: 'http://www.virtualflybrain.org/fcgi/wlziipsrv.fcgi',
                                templateId: 'NOTSET'
                            };
                    }
                    G.addWidget(8, {isStateless: true}).setConfig(config).setData({
                        instances: sliceInstances
                    });

                    // set canvas if it's already there
                    if(window.vfbCanvas != undefined){
                        window.StackViewer1.setCanvasRef(window.vfbCanvas);
                    }

                    // set initial position:
                    window.StackViewer1.setPosition(getStackViewerDefaultX(), getStackViewerDefaultY());
                    window.StackViewer1.setSize(getStackViewerDefaultHeight(), getStackViewerDefaultWidth());
                    window.StackViewer1.setName('Slice Viewer');
                    window.StackViewer1.setTrasparentBackground(true);
                    window.StackViewer1.showHistoryIcon(false);
                    window.StackViewer1.setHelpInfo(stackHelpInfo);

                   window.StackViewer1.$el.bind('restored', function(event,id) {
                        if(id == window.StackViewer1.getId()){
                            if(window.StackViewer1 != undefined) {
                                window.StackViewer1.setSize(getStackViewerDefaultHeight(), getStackViewerDefaultWidth());
                                window.StackViewer1.setPosition(getStackViewerDefaultX(), getStackViewerDefaultY());
                            }
                        }
                    });

                    // on change to instances reload stack:
                    GEPPETTO.on(GEPPETTO.Events.Instance_deleted, function(path){
                        console.log(path.split('.')[0] + ' deleted...');
                        if (window.StackViewer1 != undefined){
                            if(path!=undefined && path.length > 0){
                                    window.StackViewer1.removeSlice(path);
                            }else{
                                console.log('Removing instance issue: ' + path);
                            }
                        }		
                    });
                    GEPPETTO.on(GEPPETTO.Events.Instances_created, function(instances){
                        console.log('Instance created...');

                        if (window.StackViewer1 != undefined){
                            if(instances!=undefined && instances.length > 0){
                            	var config = {
                                    serverUrl: 'http://www.virtualflybrain.org/fcgi/wlziipsrv.fcgi',
                                    templateId: window.templateID
                            	};
                                instances.forEach(function (parentInstance){
                                    parentInstance.parent.getChildren().forEach(function (instance){
                                        if (instance.getName() == 'Stack Viewer Slices'){
                                            window.StackViewer1.addSlices(instance);
                                            if (instance.parent.getId() == window.templateID){
                                                try{
                                                    config=JSON.parse(instance.getValue().wrappedObj.value.data);
                                                    window.StackViewer1.setConfig(config);
                                                }catch (err){
                                                    console.log(err.message);
                                                    window.StackViewer1.setConfig(config);
                                                }
                                            }
                                            console.log('Passing instance: ' + instance.getId());
                                        }
                                    })
                                });
                            }
                        }	
                    });

                    // on colour change update:
                    GEPPETTO.on(GEPPETTO.Events.Color_set, function(instances){
                        console.log('Colour change...');

                        if (window.StackViewer1 != undefined){
                            if(instances!=undefined && instances.instance){
                                if (instances.instance.getType().getMetaType() == 'CompositeType'){
                                    instances.instance.getChildren().forEach(function (instance){if (instance.getName() == 'Stack Viewer Slices'){window.StackViewer1.addSlices(instance)}});
                                }else if (instances.instance.parent && instances.instance.parent.getType().getMetaType() == 'CompositeType'){
                                    instances.instance.parent.getChildren().forEach(function (instance){if (instance.getName() == 'Stack Viewer Slices'){window.StackViewer1.addSlices(instance)}});
                                }else{
                                    console.log('Colour setting issue: ' + instances);
                                }
                            }else{
                                console.log('Colour setting issue! ' + instances);
                            }
                        }
                    });
                    $('.ui-dialog-titlebar-minimize').hide(); //hide all minimize buttons
                } else {
                	window.vfbWindowResize();
                    $('#' + window.StackViewer1.getId()).parent().effect('shake', {distance:5, times: 3}, 500);
                }
            };

            // custom sorter for bloodhound
            window.customSorter = function (a, b, InputString) {
                //move exact matches to top
                if (InputString == a.label) {
                    return -1;
                }
                if (InputString == b.label) {
                    return 1;
                }
                //close match without case matching
                if (InputString.toLowerCase() == a.label.toLowerCase()) {
                    return -1;
                }
                if (InputString.toLowerCase() == b.label.toLowerCase()) {
                    return 1;
                }
                //match ignoring joinging nonwords
                Bloodhound.tokenizers.nonword("test thing-here12 34f").join(' ');
                if (Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ') == Bloodhound.tokenizers.nonword(a.label.toLowerCase()).join(' ')) {
                    return -1;
                }
                if (Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ') == Bloodhound.tokenizers.nonword(b.label.toLowerCase()).join(' ')) {
                    return 1;
                }
                //match against id
                if (InputString.toLowerCase() == a.id.toLowerCase()) {
                    return -1;
                }
                if (InputString.toLowerCase() == b.id.toLowerCase()) {
                    return 1;
                }
                //pick up any match without nonword join character match
                if (Bloodhound.tokenizers.nonword(a.label.toLowerCase()).join(' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ')) < 0 && Bloodhound.tokenizers.nonword(b.label.toLowerCase()).join(' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ')) > -1) {
                    return 1;
                }
                if (Bloodhound.tokenizers.nonword(b.label.toLowerCase()).join(' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ')) < 0 && Bloodhound.tokenizers.nonword(a.label.toLowerCase()).join(' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ')) > -1) {
                    return -1;
                }
                //also with underscores ignored
                if (Bloodhound.tokenizers.nonword(a.label.toLowerCase()).join(' ').replace('_', ' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ').replace('_', ' ')) < 0 && Bloodhound.tokenizers.nonword(b.label.toLowerCase()).join(' ').replace('_', ' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ').replace('_', ' ')) > -1) {
                    return 1;
                }
                if (Bloodhound.tokenizers.nonword(b.label.toLowerCase()).join(' ').replace('_', ' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ').replace('_', ' ')) < 0 && Bloodhound.tokenizers.nonword(a.label.toLowerCase()).join(' ').replace('_', ' ').indexOf(Bloodhound.tokenizers.nonword(InputString.toLowerCase()).join(' ').replace('_', ' ')) > -1) {
                    return -1;
                }
                //if not found in one then advance the other
                if (a.label.toLowerCase().indexOf(InputString.toLowerCase()) < 0 && b.label.toLowerCase().indexOf(InputString.toLowerCase()) > -1) {
                    return 1;
                }
                if (b.label.toLowerCase().indexOf(InputString.toLowerCase()) < 0 && a.label.toLowerCase().indexOf(InputString.toLowerCase()) > -1) {
                    return -1;
                }
                // if the match is closer to start than the other move up
                if (a.label.toLowerCase().indexOf(InputString.toLowerCase()) > -1 && a.label.toLowerCase().indexOf(InputString.toLowerCase()) < b.label.toLowerCase().indexOf(InputString.toLowerCase())) {
                    return -1;
                }
                if (b.label.toLowerCase().indexOf(InputString.toLowerCase()) > -1 && b.label.toLowerCase().indexOf(InputString.toLowerCase()) < a.label.toLowerCase().indexOf(InputString.toLowerCase())) {
                    return 1;
                }
                // if the match in the id is closer to start then move up
                if (a.id.toLowerCase().indexOf(InputString.toLowerCase()) > -1 && a.id.toLowerCase().indexOf(InputString.toLowerCase()) < b.id.toLowerCase().indexOf(InputString.toLowerCase())) {
                    return -1;
                }
                if (b.id.toLowerCase().indexOf(InputString.toLowerCase()) > -1 && b.id.toLowerCase().indexOf(InputString.toLowerCase()) < a.id.toLowerCase().indexOf(InputString.toLowerCase())) {
                    return 1;
                }
                // move the shorter synonyms to the top
                if (a.label < b.label) {
                    return -1;
                }
                else if (a.label > b.label) {
                    return 1;
                }
                else return 0; // if nothing found then do nothing.
            };

            // term info widget helper methods
            window.getTermInfoWidget = function () {
                return window.termInfoPopup;
            };

            window.setTermInfo = function (data, name) {
            	window.clearQS();
            	window.checkConnection();
            	//check if to level has been passed:
            	if (data.parent == null){
            		if (data[data.getId()+'_meta'] != undefined){
            			data = data[data.getId()+'_meta'];
            			console.log('meta passed to term info for ' + data.parent.getName());
            		}
            	}
                getTermInfoWidget().setData(data).setName(name);
                window.updateHistory(name);
                GEPPETTO.SceneController.deselectAll();
                if (typeof data.getParent().select === "function") 
                {
                    data.getParent().select(); // Select if visual type loaded.
                }
            };

            window.addTermInfo = function(){
                if(window.termInfoPopupId == undefined || (window.termInfoPopupId != undefined && window[window.termInfoPopupId] == undefined)) {
                    // init empty term info area
                    window.termInfoPopup = G.addWidget(1, {isStateless: true}).setName('Click on image to show info').addCustomNodeHandler(customHandler, 'click');
                    window.termInfoPopup.setPosition(getTermInfoDefaultX(), getTermInfoDefaultY());
                    window.termInfoPopup.setSize(getTermInfoDefaultHeight(), getTermInfoDefaultWidth());
                    window.termInfoPopupId = window.termInfoPopup.getId();
                    window.termInfoPopup.showHistoryNavigationBar(false);
                    window.termInfoPopup.setTrasparentBackground(true);
                    $('.ui-dialog-titlebar-minimize').hide(); //hide all minimize buttons

                    window[window.termInfoPopupId].$el.bind('restored', function(event,id) {
                        if(id == window.termInfoPopupId){
                            if(window[window.termInfoPopupId] != undefined) {
                                window.termInfoPopup.setSize(getTermInfoDefaultHeight(), getTermInfoDefaultWidth());
                                window.termInfoPopup.setPosition(getTermInfoDefaultX(), getTermInfoDefaultY());
                            }
                        }
                    });

                    var buttonBarConfiguration={
                        "Events" : ["color:set","experiment:selection_changed","experiment:visibility_changed"],
                        "filter" : function(instancePath){
                            return Instances.getInstance(instancePath).getParent()
                        },
                        "VisualCapability": {
                            "select": {
                                "id": "select",
                                "condition": "GEPPETTO.SceneController.isSelected($instance$.$instance$_obj != undefined ? [$instance$.$instance$_obj] : []) ||  GEPPETTO.SceneController.isSelected($instance$.$instance$_swc != undefined ? [$instance$.$instance$_swc] : [])",
                                "false": {
                                    "actions": ["$instance$.select()"],
                                    "icon": "fa-hand-stop-o",
                                    "label": "Unselected",
                                    "tooltip": "Select",
                                    "id": "select",
                                },
                                "true": {
                                    "actions": ["$instance$.deselect()"],
                                    "icon": "fa-hand-rock-o",
                                    "label": "Selected",
                                    "tooltip": "Deselect",
                                    "id": "deselect",
                                }
                            },
                            "color": {
                                "id": "color",
                                "actions": ["$instance$.setColor('$param$');"],
                                "icon": "fa-tint",
                                "label": "Color",
                                "tooltip": "Color"
                            },
                            "zoom": {
                                "id": "zoom",
                                "actions": ["GEPPETTO.SceneController.zoomTo($instances$)"],
                                "icon": "fa-search-plus",
                                "label": "Zoom",
                                "tooltip": "Zoom"
                            },
                            "visibility_obj": {
                                "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_obj')",
                                "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_obj != undefined && $instance$.getType().$instance$_obj.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_obj != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_obj]); } return visible; })()",
                                "false": {
                                    "id": "visibility_obj",
                                    "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_obj'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { var col = instance.getParent().getColor(); instance.getType().resolve(function() { instance.setColor(col); GEPPETTO.trigger('experiment:visibility_changed', instance); GEPPETTO.ControlPanel.refresh(); }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                                    "icon": "fa-eye-slash",
                                    "label": "Hidden",
                                    "tooltip": "Show 3D Volume"
                                },
                                "true": {
                                    "id": "visibility_obj",
                                    "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_obj])"],
                                    "icon": "fa-eye",
                                    "label": "Visible",
                                    "tooltip": "Hide 3D Volume"
                                }
                            },
                            "visibility_swc": {
                                "showCondition": "$instance$.getType().hasVariable($instance$.getId() + '_swc')",
                                "condition": "(function() { var visible = false; if ($instance$.getType().$instance$_swc != undefined && $instance$.getType().$instance$_swc.getType().getMetaType() != GEPPETTO.Resources.IMPORT_TYPE && $instance$.$instance$_swc != undefined) { visible = GEPPETTO.SceneController.isVisible([$instance$.$instance$_swc]); } return visible; })()",
                                "false": {
                                    "id": "visibility_swc",
                                    "actions": ["(function(){var instance = Instances.getInstance('$instance$.$instance$_swc'); if (instance.getType().getMetaType() == GEPPETTO.Resources.IMPORT_TYPE) { var col = instance.getParent().getColor(); instance.getType().resolve(function() { instance.setColor(col); GEPPETTO.trigger('experiment:visibility_changed', instance); GEPPETTO.ControlPanel.refresh(); }); } else { GEPPETTO.SceneController.show([instance]); }})()"],
                                    "icon": "fa-eye-slash",
                                    "label": "Hidden",
                                    "tooltip": "Show 3D Skeleton"
                                },
                                "true": {
                                    "id": "visibility_swc",
                                    "actions": ["GEPPETTO.SceneController.hide([$instance$.$instance$_swc])"],
                                    "icon": "fa-eye",
                                    "label": "Visible",
                                    "tooltip": "Hide 3D Skeleton"
                                }
                            },
                            "delete": {
                            	"showCondition": "$instance$.getId()!=window.templateID",
                                "id": "delete",
                                "actions": ["$instance$.deselect();$instance$.delete();setTermInfo(window[window.templateID][window.templateID+'_meta'], window[window.templateID][window.templateID+'_meta'].getParent().getId());"],
                                "icon": "fa-trash-o",
                                "label": "Delete",
                                "tooltip": "Delete"
                            }
                        }
                    };
                    window.termInfoPopup.setButtonBarControls({"VisualCapability": ['select', 'color', 'visibility_obj', 'visibility_swc', 'zoom', 'delete']});
                    window.termInfoPopup.setButtonBarConfiguration(buttonBarConfiguration);
                    window.termInfoPopup.setSize(getTermInfoDefaultHeight(), getTermInfoDefaultWidth());
                    window.termInfoPopup.setHelpInfo(termHelpInfo);
                } else {
                	window.vfbWindowResize();
                    $('#' + window.termInfoPopupId).parent().effect('shake', {distance:5, times: 3}, 500);
                }
            };

            // button bar helper method
            window.addButtonBar = function() {
                var buttonBarConfig = {
                    "": {
                        "": {
                        	"searchBtn": {
                                "actions": [
                                    "window.clearQS(); GEPPETTO.Spotlight.open();"
                                ],
                                "icon": "fa fa-search",
                                "label": "",
                                "tooltip": "Search"
                            },
                            "queryBtn": {
                                "actions": [
                                    "window.clearQS(); GEPPETTO.QueryBuilder.open();"
                                ],
                                "icon": "fa fa-quora",
                                "label": "",
                                "tooltip": "Query"
                            },
                            "infoBtn": {
                                "actions": [
                                    "window.addTermInfo();"
                                ],
                                "icon": "fa fa-info",
                                "label": "",
                                "tooltip": "Show term info"
                            },
                            "stackBtn": {
                                "actions": [
                                    "window.addStackWidget();"
                                ],
                                "icon": "gpt-stack",
                                "label": "",
                                "tooltip": "Show stack viewer"
                            },
                            "meshBtn": {
                            	"actions": [
                            		"Canvas1.setWireframe(!Canvas1.getWireframe());"
                            	],
                                "icon": "fa fa-object-ungroup",
                                "label": "",
                                "tooltip": "Toggle wireframe"
                            },
                            "tutorialBtn": {
                            	"actions": [
                            		'GEPPETTO.Console.executeImplicitCommand("G.toggleTutorial()");'
                            	],
                                "icon": "fa fa-leanpub",
                                "label": "",
                                "tooltip": "Toggle tutorial"
                            }
                        }
                    }
                };
                G.addWidget(Widgets.BUTTONBAR, {isStateless: true}).fromJSONObj(buttonBarConfig);
                ButtonBar1.setPosition(getButtonBarDefaultX(), getButtonBarDefaultY());
                ButtonBar1.showCloseButton(false);
                ButtonBar1.showTitleBar(false);
                ButtonBar1.setClass('transparent');
            };

            // add term info
            window.addTermInfo();
            window.addButtonBar();

            window.addEventListener('resize', function(event){
            	window.vfbWindowResize();
            });

            window.vfbWindowResize = function() 
            {
            	// reset size and position of term info widget, if any
                if(window[window.termInfoPopupId] != undefined && !window[window.termInfoPopupId].maximize) {
                    window.termInfoPopup.setPosition(getTermInfoDefaultX(), getTermInfoDefaultY());
                    window.termInfoPopup.setSize(getTermInfoDefaultHeight(), getTermInfoDefaultWidth());
                }

                // reset size and position of stack widget, if any
                if(window.StackViewer1 != undefined && !window.StackViewer1.maximize){
                    window.StackViewer1.setPosition(getStackViewerDefaultX(), getStackViewerDefaultY());
                    window.StackViewer1.setSize(getStackViewerDefaultHeight(), getStackViewerDefaultWidth());
                }

                // reset position of button bar widget (always there)
                ButtonBar1.setPosition(getButtonBarDefaultX(), getButtonBarDefaultY());
            };
            
            window.updateHistory = function(title) 
            {
                if (document.referrer.indexOf('org.geppetto.frontend')<0){
	            	// Update the parent windows history with current instances (i=) and popup selection (id=)
	            	var visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, Instances);
	                var visualParents = [];
	                for (var i = 0; i < visualInstances.length; i++) {
	                	if (visualInstances[i].getParent() != null){
	                		visualParents.push(visualInstances[i].getParent());
	                	}
	                }
	                visualInstances = visualInstances.concat(visualParents);
	                var compositeInstances = [];
	                for (var i = 0; i < visualInstances.length; i++) {
	                    if (visualInstances[i] != null && visualInstances[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
	                        compositeInstances.push(visualInstances[i]);
	                    }
	                }
	                
	            	var items='i=';
	            	if (window.templateID)
	            	{
	            		items = items + ',' + window.templateID;
	            	}
	            	compositeInstances.forEach(function(compositeInstances){ if (!items.includes(compositeInstances.getId())){items = items + ',' + compositeInstances.getId()}}); 
	                items = items.replace(',,',',').replace('i=,','i=');
	                if (window.getTermInfoWidget().data != null && window.getTermInfoWidget().data != '')
	                {
	                    items = 'id=' + Instances.getInstance(window.getTermInfoWidget().data).parent.id + '&' + items;
	                }
	                if (items != "i="){
	                	parent.history.pushState({}, title, parent.location.pathname + "?" + items);
	                }
                }
            };
            
            window.addIndCallback = function(variableId){
            	window.checkConnection();
                var instance = Instances.getInstance(variableId);
                var meta = Instances.getInstance(variableId + '.' + variableId + '_meta');
                resolve3D(variableId, function() {
                    GEPPETTO.SceneController.deselectAll();
                    instance.select();
                    setTermInfo(meta, meta.getParent().getId());
                });
            };
            
            window.addVfbId = function(variableId) 
            {
                if (variableId != null){
	            	if (window[variableId] == undefined){
	                	if (variableId.indexOf('VFB_') > -1){
	                		window.fetchVariableThenRun(variableId, window.addToSceneCallback);  
	                	}else{
	                		window.fetchVariableThenRun(variableId, window.setTermInfoCallback);
	                	}
	                }else{
	                	if (variableId.indexOf('VFB_') > -1){
	                		if (window[variableId][variableId+'_obj'] != undefined || window[variableId][variableId+'_swc'] != undefined){ 
	                			if (window[variableId][variableId+'_swc'] != undefined){
	                				if (!window[variableId][variableId+'_swc'].visible && typeof(window[variableId][variableId+'_swc'].show) == "function"){
	                					window[variableId][variableId+'_swc'].show();
	                				}
	                			}else{
	                				if (window[variableId][variableId+'_obj'] != undefined && !window[variableId][variableId+'_obj'].visible && typeof(window[variableId][variableId+'_obj'].show) == "function"){
	                					window[variableId][variableId+'_obj'].show();
	                				}
	                			}
	                			if (window[variableId][variableId+'_meta'] != undefined){
	                				window[variableId].select();
	                				var meta = Instances.getInstance(variableId + '.' + variableId + '_meta');
	                    			setTermInfo(meta, variableId);
	                			}else{
	                				window.fetchVariableThenRun(variableId, window.setTermInfoCallback);
	                			}
	                		}
	                	}else{
	                		var instance = Instances.getInstance(variableId);
	                		var meta = Instances.getInstance(variableId + '.' + variableId + '_meta');
	                		setTermInfo(meta, meta.getParent().getId());
	                		window.resolve3D(variableId);
	                	}
	                }
                }
            };
		
            window.stackViewerRequest = function(variableId) 
            {
	    		window.addVfbIds([variableId]);   
            };
            
            window.setToolTips = function()
            {
            $('#queryBuilderBtn').first().title="Query Builder";
            $('#controlPanelBtn').first().title="Control Panel";
            $('#spotlightBtn').first().title="Search";
            $('#panLeftBtn').first().title="Pan Left";
            $('#panUpBtn').first().title="Pan Up";
            $('#panRightBtn').first().title="Pan Right";
            $('#panDownBtn').first().title="Pan Down";
            $('#panHomeBtn').first().title="Reset to Home Position";
            $('#rotateLeftBtn').first().title="Rotate Left";
            $('#rotateUpBtn').first().title="Rotate Up";
            $('#rotateRightBtn').first().title="Rotate Right";
            $('#rotateDownBtn').first().title="Rotate Down";
            $('#rotateBtn').first().title="Rotate the scene";
            $('#zoomInBtn').first().title="Zoom In";
            $('#zoomOutBtn').first().title="Zoom Out";
            };
            
            window.clearQS = function() {
            	window.checkConnection();
            	if (GEPPETTO.Spotlight)
                {
                	GEPPETTO.Spotlight.close();
                	$('#spotlight #typeahead')[0].placeholder = "Search for the item you're interested in...";
                }
                if (GEPPETTO.QueryBuilder)
                {
                	GEPPETTO.QueryBuilder.close();
                }
            };
            
            window.checkConnection = function() {
            	try{
	            	if (GEPPETTO.MessageSocket.socket.readyState == WebSocket.CLOSED && window.vfbRelaodMessage)
	            	{
	            		window.vfbRelaodMessage = false;
	            		if (confirm("Sorry but your connection to our servers has timed out. \nClick OK to reconnect and reload your current items or click Cancel to do nothing."))
	            		{
	            			location.reload();
	            		}
	            	}
            	}
            	catch(err)
            	{
            		console.log(err.message);
            	}
            };
            
            window.vfbRelaodMessage = true;
            
            if (window.vfbLoadBuffer == undefined){
            	window.vfbLoadBuffer = [];
            	window.vfbLoading = "";
            }
            
            window.addVfbIds = function(variableIds)
            {
            	for (i in variableIds){
            		if ($.inArray(variableIds[i], window.vfbLoadBuffer) < 0 || i == 0){
            			window.vfbLoadBuffer.push(variableIds[i]);
            		}
            	}
            	if (window.vfbLoadBuffer.length > 0){
            		GEPPETTO.trigger('spin_logo');
            	}else{
            		GEPPETTO.trigger('stop_spin_logo');
            	}
            	if (window.vfbLoading == ""){
	            	for (i in window.vfbLoadBuffer){
	            		if (window[window.vfbLoadBuffer[0]] != undefined){
	            			window.vfbLoading=window.vfbLoadBuffer.splice(0,1)[0];
	            			window.addVfbId(window.vfbLoading);
	            			setTimeout(window.addVfbIds, 100);
	            			break;
	            		}else{
	            			window.vfbLoading = window.vfbLoadBuffer[i];
	            			window.vfbLoadBuffer.splice($.inArray(window.vfbLoading, window.vfbLoadBuffer),1);
	            			window.vfbLoadingTimeout = 60;
	            			window.addVfbId(window.vfbLoading);
	            			setTimeout(window.addVfbIds, 500);
	            			break;
	            		}
	            	}
	            	window.updateHistory("Loading...");
            	}else{
            		if (window[window.vfbLoading] != undefined){
            			window.vfbLoading = "";
            			setTimeout(window.addVfbIds, 100);
            		}else{
            			window.vfbLoadingTimeout--
            			if (window.vfbLoadingTimeout < 1){
            				console.log("Failed to load " + window.vfbLoading + " in time");
            				window.vfbLoading = "";
            				window.checkConnection();
            				if (window.vfbLoadBuffer.length > 0){
            					setTimeout(window.addVfbIds, 250);
            				}
            			}else{
            				setTimeout(window.addVfbIds, 500);
            			}
            		}            		
            	}
            }
        };

        GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, function(){
        	//Until the experiment is loaded we can't load any widgets (which the init function does)
        	window.initVFB();	
            // init stack viewer
            window.addStackWidget();

        });
        
        //In case the experiment was loaded before this extension was loaded
        if(window.Project!= undefined && window.Project.getActiveExperiment()!=null){
        	window.initVFB();	
            // init stack viewer
            window.addStackWidget();
        }
    };
});
