define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/aspect',
	'dijit/registry',
	'dijit/Toolbar',
	'dijit/form/Button'
], function(lang, declare, aspect, registry, Toolbar, Button) {

	return declare([Toolbar], {

		rfe: null,

		constructor: function(props) {
			lang.mixin(this, props || {});
		},

		/**
		 * Creates the toolbar.
		 * @return {Object} dijit.Toolbar
		 */
		create: function() {
			//var node = registry.byId(this.id);
			this.domNode.addChild(new Button({
				id: 'rfeButtonDirectoryUp',
				label: 'up',
				showLabel: true,
				iconClass: 'rfeToolbarIcon rfeToolbarIconDirUp',
				disabled: false,
				onClick: lang.hitch(this, function() {
					var def = this.goDirUp();
					def.then(lang.hitch(this, function(item) {
						if (item) {
							this.setHistory(this.currentTreeItem.id);
						}
					}));
				})
			}));

			/*
			 aspect.after(this, 'displayChildrenInGrid', function(item) {
			 var button = registry.byId('rfeButtonDirectoryUp');
			 button.set('disabled', item == tree.rootNode.item);
			 }, true);
			 */
			/*
			 this.grid.on('RowDblClick', function(item) {
			 var button = registry.byId('rfeButtonDirectoryUp');
			 button.set('disabled', item == tree.rootNode.item);
			 });
			 */

			this.domNode.addChild(new Button({
				id: 'rfeButtonHistoryBack',
				label: 'history back',
				showLabel: false,
				iconClass: 'dijitEditorIcon dijitEditorIconUndo',
				disabled: true,
				onClick: lang.hitch(this, function() {
					this.goHistory('back');
				})
			}));
			aspect.after(this, 'setHistory', lang.hitch(this, function() {
				registry.byId('rfeButtonHistoryBack').set('disabled', this.history.steps.length < 2);
			}));
			aspect.after(this, 'goHistory', lang.hitch(this, function() {
				registry.byId('rfeButtonHistoryBack').set('disabled', this.history.curIdx < 1);
			}));

			this.domNode.addChild(new Button({
				id: 'rfeButtonHistoryForward',
				label: 'history forward',
				showLabel: false,
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
				disabled: true,
				onClick: lang.hitch(this, function() {
					this.goHistory('forward');
				})
			}));
			aspect.after(this, 'goHistory', function() {
				registry.byId('rfeButtonHistoryForward').set('disabled', this.history.curIdx > this.history.steps.length - 2);
			});
			this.domNode.addChild(new Button({
				id: 'rfeButtonReload',
				label: 'reload',
				showLabel: true,
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
				disabled: false,
				onClick: lang.hitch(this, function() {
					this.reload();
				})
			}));

			return toolbar;
		},

		updateButtons: function() {
			console.log(this);
			console.log('toolbar', toolbar)
			var button = registry.byId('rfeButtonDirectoryUp');
			button.set('disabled', this.id == this.tree.rootNode.item);	// TODO: do not hardcode 'root'

		}

	});
});