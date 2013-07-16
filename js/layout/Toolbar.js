define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/when',
	'dojo/aspect',
	'dijit/registry',
	'dijit/Toolbar',
	'dijit/ToolbarSeparator',
	'dijit/form/Button',
	'rfe/SearchBox'
], function(lang, declare, when, aspect, registry, Toolbar, ToolbarSeparator, Button, SearchBox) {

	/**
	 * @class
	 * @name rfe.layout.Toolbar
	 * @extends dijit.Toolbar
	 * @property {rfe} rfe reference to remoteFileExplorer
	 */
	return declare([Toolbar], /** @lends rfe.layout.Toolbar.prototype */ {

		rfe: null,

		/** @constructor */
		constructor: function(props) {
			lang.mixin(this, props || {});
		},

		/**
		 * Adds the buttons to the toolbar buttons and defines their actions.
		 */
		postCreate: function() {
			this.inherited('postCreate', arguments);	// in case we've overriden something

			var rfe = this.rfe, bt1, bt2, bt3;

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
				target: require.toUrl('rfe-php/controller.php/search'),
				rfe: rfe
			}));
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