define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/dom',
	'dojo/dom-construct',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane'
], function(lang, declare, dom, domConstruct, BorderContainer, ContentPane) {

		return declare([BorderContainer], {

			liveSplitters: true,
			gutters: false,

			currentView: 'horizontal',

			menuPane: null,
			treePane: null,
			gridPane: null,

			postCreate: function() {
				this.inherited('postCreate', arguments);

				this.menuPane = new ContentPane({
					region: 'top',
					'class': 'rfeMenuPane'
				});
				this.treePane = new ContentPane({
					region: 'left',
					'class': 'rfeTreePane'
				});
				this.gridPane = new ContentPane({
					region: 'center',
					'class': 'rfeGridPane'
				});

				this.addChild(this.menuPane);
				this.addChild(this.treePane);
				this.addChild(this.gridPane);
			},

			/**
			 * Sets the layout view of the explorer.
			 * @param {string} view
			 */
			setView: function(view) {
				if (view == 'vertical') {
					this.treePane.set({
						region: 'center',
						style: 'width: 100%;',
						minSize: null,
						splitter: false
					});
					this.gridPane.set({
						region: 'bottom',
						style: 'width: 100%; height: 60%',	// top is not removed when changing from center to bottom
						splitter: true
					});
				}
				else if (view == 'horizontal') {
					this.treePane.set({
						region: 'left',
						style: 'width: 25%; height: 100%;',
						minSize: 180,
						splitter: true
					});
					this.gridPane.set({
						region: 'center',
						style: 'height: 100%'
					});
				}
				this.currentView = view;
			},

			/**
			 * Toggle display of the tree pane.
			 */
			toggleTreePane: function(checked) {
				// to keep it simple for the moment we switch to vertical view where the remaining pane is the center pane
				// -> automatically expands to fill the remaining space
				var treePane = this.treePane;
				if (checked) {
					this.addChild(treePane);
				}
				else {
					if (this.currentView == 'vertical') {
						this.setView('horizontal');
					}
					this.removeChild(treePane);
				}
			}

		})
});
