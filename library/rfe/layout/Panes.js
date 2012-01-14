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

		return declare('rfe.Panes', [BorderContainer, _WidgetBase, _TemplatedMixin], {

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
//					id: 'rfeContentPaneMenu',
					region: 'top'	// menu is always on top
				}, this.rfeMenuPaneNode);

				this.treePane = new ContentPane({
//					id: 'rfeContentPaneTree'
				}, this.rfeTreePaneNode);

				this.gridPane = new ContentPane({
//					id: 'rfeContentPaneGrid',
					region: 'center'
				}, this.rfeGridPaneNode);
			},

			/**
			 * Sets the layout view of the explorer.
			 * @param {string} view
			 */
			setView: function(view) {

//							panes.borderContainer.removeChild(treePane);
//							panes.borderContainer.removeChild(gridPane);
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
//							panes.borderContainer.addChild(treePane);
//							panes.borderContainer.addChild(gridPane);

				this.currentView = view;
			}


		})
});
