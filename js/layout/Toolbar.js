define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/when',
	'dojo/aspect',
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/query',
	'dijit/registry',
	'dijit/Toolbar',
	'dijit/ToolbarSeparator',
	'dijit/form/Button',
	'dijit/form/Select',
	'rfe/SearchBox'
], function(lang, declare, array, on, when, aspect, domConstruct, domClass, query, registry, Toolbar, ToolbarSeparator, Button, Select, SearchBox) {

	/**
	 * @class rfe.layout.Toolbar
	 * @extends dijit.Toolbar
	 * @property {rfe} rfe reference to remoteFileExplorer
	 */
	return declare([Toolbar], /** @lends rfe.layout.Toolbar.prototype */ {

		rfe: null,

		constructor: function(props) {
			lang.mixin(this, props || {});
		},

		/**
		 * Adds the buttons to the toolbar buttons and defines their actions.
		 */
		postCreate: function() {
			this.inherited('postCreate', arguments);	// in case we've overriden something

			var rfe = this.rfe, bt1, bt2, bt3, bt4, div, selSort;

			bt1 = new Button({
				label: 'up',
				showLabel: true,
				iconClass: 'rfeIcon rfeToolbarIconDirUp',
				disabled: true,
				onClick: function() {
					var def = rfe.goDirUp();
					def.then(function(object) {
						if (object) {
							rfe.setHistory(rfe.currentTreeObject.id);
						}
					});
				}
			});
			rfe.currentTreeObject.watch('id', function(prop, oldVal, newVal) {
				bt1.set('disabled', newVal === rfe.tree.rootNode.item.id);
			});
			this.addChild(bt1);

			bt2 = new Button({
				label: 'history back',
				showLabel: false,
				iconClass: 'rfeIcon rfeToolbarIconHistoryBack',
				disabled: true,
				onClick: function() {
					rfe.goHistory('back');
				}
			});
			aspect.after(rfe, 'setHistory', function() {
				bt2.set('disabled', rfe.history.steps.length < 2);
			});
			aspect.after(rfe, 'goHistory', function() {
				bt2.set('disabled', rfe.history.curIdx < 1);
			});
			this.addChild(bt2);

			bt3 = new Button({
				label: 'history forward',
				showLabel: false,
				iconClass: 'rfeIcon rfeToolbarIconHistoryForward',
				disabled: true,
				onClick: function() {
					rfe.goHistory('forward');
				}
			});
			aspect.after(rfe, 'goHistory', function() {
				bt3.set('disabled', rfe.history.curIdx > rfe.history.steps.length - 2);
			});
			this.addChild(bt3);

			this.addChild(new Button({
				label: 'reload',
				showLabel: true,
				iconClass: 'rfeIcon rfeToolbarIconReload',
				disabled: false,
				onClick: function() {
					rfe.reload();
				}
			}));
			this.addChild(new ToolbarSeparator({ id: 'rfeTbSeparatorSearch'}));

			this.addChild(new SearchBox({
				target: require.toUrl('rfe-php') + '/filesystem.php/search',
				rfe: rfe
			}));

			// TODO: do not hardcode sortable (file) properties
			div = domConstruct.create('div', {
				'class': 'rfeToolbarSort'
			}, this.domNode);
			domConstruct.create('label', {
				innerHTML: 'sort by'
			}, div);
			selSort = new Select({
				options: [
					// value shoud be name of store object property to be sorted
					{ label: 'file name', value: 'name', selected: true },
					{ label: 'size', value: 'size' },
					{ label: 'modification date', value: 'mod' },
					{ label: 'type', value: 'mime' }
				]
			}).placeAt(div);
			bt4 = new Button({
				label: 'sort',
				showLabel: false,
				iconClass: 'rfeIcon rfeToolbarIconSortAsc',
				onClick: function () {
					if (rfe.grid.view === 'icons') {
						rfe.grid.set('multisort', selSort.get('value'), rfe.grid._sort);
					}
					else {
						// simulate clicking on grid column
						var field = selSort.get('value'),
							node = query('th.field-' + field)[0];
						on.emit(node, 'click', {
							cancelable: true,
							bubbles: true
						});
					}
					domClass.remove(bt4, 'rfeToolbarIconSortAsc');
					domClass.add(bt4, 'rfeToolbarIconSortDesc');
				}
			}).placeAt(div);
		},

		_onContainerKeydown: function(evt) {
			var widget = registry.getEnclosingWidget(evt.target);
			if (!widget.textbox) {
				this.inherited('_onContainerKeydown', arguments);
			}
		},

		_onContainerKeypress: function(evt) {
			var widget = registry.getEnclosingWidget(evt.target);
			if (!widget.textbox) {
				this.inherited('_onContainerKeydown', arguments);
			}
		}
	});
});