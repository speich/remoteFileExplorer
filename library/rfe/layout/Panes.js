define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/dom',
	'dojo/dom-construct',
	'dojo/dom-style',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane'
], function(lang, declare, dom, construct, style, BorderContainer, ContentPane) {

return declare([BorderContainer], {

	liveSplitters: true,
	gutters: false,
	view: 'horizontal',
	treePaneVisible: true,

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
		// TODO: add and respect this.persist

		// TODO loop through children and set width
		var w = style.get(this.menuPane.domNode, 'width');
		style.set(this.contentPane.domNode, 'width', w + 'px');	// hiding treePane can put out of sync
		style.set(this.contentPaneBc.domNode, 'width', w + 'px');	// hiding treePane can put out of sync
		style.set(this.treePane.domNode, 'width', w + 'px');	// hiding treePane can put out of sync
		style.set(this.gridPane.domNode, 'width', w + 'px');	// hiding treePane can put out of sync

		//this.contentPaneBc.resize();	// propagate changes to children
		if (this.treePaneVisible) {
			this.contentPaneBc.removeChild(this.treePane);
			if (view == 'vertical') {
				this.treePane.set({
					region: 'top',
					style: 'width: 100%; height: 25%;'
				});
			}
			else if (view == 'horizontal') {
				this.treePane.set({
					region: 'left',
					style: 'width: 25%; height: 100%'
				});
			}
			this.contentPaneBc.addChild(this.treePane);
		}
		this._set('view', view);
	},

	/**
	 * Show or hide the tree pane.
	 * @param {Boolean} visible
	 */
	_setTreePaneVisibleAttr: function(visible) {
		var treePane = this.treePane;
		if (visible === false) {
			this.removeChild(treePane);
		}
		else {
			this.addChild(treePane);
		}
		this._set('treePaneVisible', visible);
	}
})
});
