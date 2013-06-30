define([
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/on',
	'dojo/topic',
	'dojo/cookie',
	'dojo/dom-construct',
	'dojo/query',
	'dojo/Stateful',
	'dijit/Tree',
	'rfe/dnd/TreeSource',	// set path to load dnd/TreeSource in dojoConfig
	'rfe/Grid',
	'rfe/dnd/GridSource',
	'dijit/registry',
	'dijit/form/CheckBox',
	'dijit/Dialog',
	'rfe/layout/Toolbar',
	'rfe/layout/Menubar',
	'rfe/layout/Panes',
	'rfe/Console',
	'rfe/ContextMenu'
], function(array, lang, declare, on, topic, cookie, domConstruct, query, Stateful, Tree, TreeSource, Grid, GridSource,
				registry, CheckBox, Dialog, Toolbar, Menubar, Panes, Console, ContextMenu) {

	/**
	 * @class
	 * @name rfe.Layout
	 * @property {rfe.layout.Panes} panes
	 * @property {rfe.layout.Toolbar} toolbar
	 * @property {rfe.layout.Menubar} menubar
	 * @property {rfe.Console} console
	 * @property {rfe.Grid} tree
	 * @property {dijit.Tree} grid
	 */
	return declare(null, /** @lends rfe.Layout.prototype */ {

		_cnDialogSettingsFolderState: 'DialogSettingsFolderState', // name of cookie

		panes: null,
		toolbar: null,
		menubar: null,
		console: null,

		tree: null,
		grid: null,

		/** @constructor */
		constructor: function(props) {
			lang.mixin(this, props || {});
		},

		init: function() {
			this.panes = new Panes({
				view: 'horizontal'
			}, this.id);

			this.menubar = new Menubar({
				rfe: this,
				tabIndex: 1
			}, domConstruct.create('div'));

			this.toolbar = new Toolbar({
				rfe: this,
				tabIndex: 10
			}, domConstruct.create('div'));

			this.panes.treePane.set('tabIndex', 20);
			this.panes.gridPane.set('tabIndex', 30);
			this.menubar.placeAt(this.panes.menuPane.domNode);
			this.toolbar.placeAt(this.panes.menuPane.domNode);
			this.panes.startup();

			this.console = new Console(null, domConstruct.create('div', null, this.panes.logPane.domNode));

			this.editContextMenu = new ContextMenu({
				rfe: this,
				targetNodeIds: [this.panes.treePane.id, this.panes.gridPane.id]
			});
			this.initTree();
			this.initGrid();
			// TODO: fix initEvents() will also call FileExplorer::initEvents()
			//this.initEvents();
			this.initTopics();
			this.initDialogs();
		},

		initEvents: function() {
/*			focusUtil.focus(this.tree.domNode);
			focusUtil.on("widget-blur", function() {
				console.log(arguments)
			});*/

		},

		initTopics: function() {
			topic.publish('grid/views/state', this.grid.view);
		},

		/**
		 * Initializes the tree and tree dnd.
		 */
		initTree: function() {
			var self = this;
			this.tree = new Tree({
				rfe: this,
				model: this.store,
				childrenAttrs: [this.store.childrenAttr],
				openOnClick: false, //	If true, clicking a folder node's label will open it, rather than calling onClick()
				openOnDblClick: true, // If true, double-clicking a folder node's label will open it, rather than calling onDblClick()
				showRoot: true,
				tabIndex: 21,
				persist: cookie(this._cnDialogSettingsFolderState) || true,
				dndController: function(arg, params) {
					return new TreeSource(arg, lang.mixin(params || {}, {
						accept: ['dgrid-row'],
						fileStore: self.store,
						singular: true
					}));
				}
			});
			this.tree.placeAt(this.panes.treePane)
		},

		initGrid: function() {
			var div = domConstruct.create('div', null, this.panes.gridPane.domNode);
			this.grid = new Grid({
				rfe: this,
				tabIndex: 31,
				store: null, // store is set in FileExplorer.initState()
				dndConstructor: GridSource,	// dgrid/extension/dnd can't be overridden directly
				dndParams: {
					accept: ['treeNode'],
					fileStore: this.store
				}
			}, div);
		},

		initDialogs: function() {
			// TODO: move to dialog.js
			new Dialog({
				id: 'rfeDialogAbout',
				title: "About Remote File Explorer (rfe)",
				content: '<div id="rfeDialogAboutLogo"><img src="' + require.toUrl('rfe/resources/images/logo-speich.net.png') +
					'" alt="speich.net logo" title="Created by Simon Speich, www.speich.net"/></div>' +
					'<div id="rfeDialogAboutText">' +
					'<h2>Remote File Explorer (rfe)</h2>' +
					'<p>version ' + this.version + ' - ' + this.versionDate + '</p>' +
					'<p>Created by <a href="http://www.speich.net">Simon Speich</a>, www.speich.net using the ' +
					'<a href="http://www.dojotoolkit.org">dojotoolkit</a> and <a href="http://www.php.net">PHP</a>.</p>' +
					'<p>Can be used and altered freely as long as this dialog with logo and link is included.</p>' +
					'</div>'
			});

			var self = this;
			var dialog = new Dialog({
				id: 'rfeDialogSettings',
				title: "Settings",
				content: '<div>' +
				'<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
				'</div>'
			});


			// TODO: move dialog creation to constructor/init so we can use cookie also to set store on first display
			var label = domConstruct.create('label', {
				innerHTML: 'Remember folders state'
			}, query('fieldset', dialog.domNode)[0], 'last');
			domConstruct.create('br', null, label);
			var input = domConstruct.create('input', null, label, 'first');
			new CheckBox({
				checked: cookie(this._cnDialogSettingsFolderState) || true,
				onChange: function() {
					self.tree.set('persist', this.checked);
					cookie(this._cnDialogSettingsFolderState, this.checked);
				}
			}, input);

			label = domConstruct.create('label', {
				innerHTML: 'Show folders only'
			}, query('fieldset', dialog.domNode)[0], 'last');
			input = domConstruct.create('input', null, label, 'first');
			new CheckBox({
				checked: true,
				onClick: function() {
					self.store.skipWithNoChildren = this.checked;
					self.reload();
				}
			}, input);
		},

		showDialogAbout: function() {
			registry.byId('rfeDialogAbout').show();
		},

		showDialogSettings: function() {
			registry.byId('rfeDialogSettings').show();
		}

	});
});