define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/aspect',
	'dijit/registry',
	'dijit/Toolbar',
	'dijit/form/Button'
], function(lang, declare, aspect, registry, Toolbar, Button) {

	/**
	 * @class
	 * @name rfe.layout.Toolbar
	 * @extends dijit.Toolbar
	 * @property {rfe} rfe reference to remoteFileExplorer
	 */
	return declare([Toolbar], /** @lends rfe.layout.Toolbar.prototype */ {

		rfe: null,

		/** #constructor */
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
				iconClass: 'rfeToolbarIcon rfeToolbarIconDirUp',
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
				iconClass: 'dijitEditorIcon dijitEditorIconUndo',
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
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
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
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
				disabled: false,
				onClick: function() {
					rfe.reload();
				}
			}));
		}

	});
});