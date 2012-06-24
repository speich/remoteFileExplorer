define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/dom',
	'dojo/dom-construct',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane'
], function(lang, declare, dom, construct, BorderContainer, ContentPane) {

		return declare([BorderContainer], {

			liveSplitters: true,
			gutters: false,
			view: 'horizontal',

			contentPane: null,
			contentPaneBc: null,
			menuPane: null,
			logPane: null,
			treePane: null,
			gridPane: null,

			buildRendering: function() {
				this.inherited('buildRendering', arguments);

				this.menuPane = new ContentPane({
					region: 'top',
					'class': 'rfeMenuPane'
				});
				this.contentPane = new ContentPane({
					region: 'center',
					'class': 'rfeContentPane'
				});
				this.logPane = new ContentPane({
					region: 'bottom',
					'class': 'rfeLogPane',
					splitter: true
				});

				this.contentPaneBc = new BorderContainer({
					gutters: false
				}, construct.create('div'));
				this.treePane = new ContentPane({
					region: 'left',
					splitter: true,
					minSize: 180,
					'class': 'rfeTreePane'
				});
				this.gridPane = new ContentPane({
					region: 'center',
					'class': 'rfeGridPane'
				});
				this.contentPaneBc.addChild(this.treePane);
				this.contentPaneBc.addChild(this.gridPane);
				this.contentPane.addChild(this.contentPaneBc);
			},

			postCreate: function() {
				this.inherited('postCreate', arguments);

				this.addChild(this.menuPane);
				this.addChild(this.contentPane);
				this.addChild(this.logPane);
			},

			/**
			 * Sets the layout view of the explorer.
			 * @param {string} view
			 */
			_setViewAttr: function(view) {
				this._set('view', view);
				this.contentPaneBc.removeChild(this.treePane);
				if (this.get('view') == 'vertical') {
					this.treePane.set({
						region: 'top',
						style: 'width: 100%; height: 25%;'
					});
				}
				else if (this.get('view') == 'horizontal') {
					this.treePane.set({
						region: 'left',
						style: 'width: 25%; height: 100%'
					});
				}
				this.contentPaneBc.addChild(this.treePane);

			},

			/**
			 * Toggle display of the tree pane.
			 * @param {Boolean} toggle
			 */
			toggleTreePane: function(toggle) {
				var treePane = this.treePane;
				toggle ? this.addChild(treePane) : this.removeChild(treePane);
			}
		})
});
