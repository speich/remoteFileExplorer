define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/dom',
	'dojo/dom-construct',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dojo/text!rfe/layout/Layout.html'
], function(lang, declare, dom, domConstruct, BorderContainer, ContentPane, _WidgetBase, _TemplatedMixin, template) {

		return declare([BorderContainer, _WidgetBase, _TemplatedMixin], {

			widgetsInTemplate: true,
			templateString: template,
			baseClass: 'rfeLayout',
			liveSplitters: true,
			gutters: false,

			currentView: 'horizontal',

			menuPane: null,
			treePane: null,
			gridPane: null,

			constructor: function(props) {
				lang.mixin(this, props || {});
			},

			postCreate: function() {
				this.menuPane = new ContentPane({
					region: 'top'	// menu is always on top
				}, this.rfeMenuPaneNode);

				this.treePane = new ContentPane({
				}, this.rfeTreePaneNode);

				this.gridPane = new ContentPane({
					region: 'center'
				}, this.rfeGridPaneNode);
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
			toggleTreePane: function() {
				// to keep it simple for the moment we switch to vertical view where the remaining pane is the center pane
				// -> automatically expands to fill the remaining space
				var treePane = this.treePane;
				if (treePane.domNode.parentNode) {  // hide pane
					if (this.layout.view == 'vertical') {
						this.setView('horizontal');
					}
					this.borderContainer.removeChild(treePane);
				}
				else {	// show pane
					this.borderContainer.addChild(treePane);
				}
			}

		})
});
