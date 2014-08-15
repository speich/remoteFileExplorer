define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/cookie',
	'dojo/dom-construct',
	'dojo/query',
	'rfe/Tree',
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
], function(lang, declare, cookie, domConstruct, query, Tree, Grid, GridSource,
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
			this.initDialogs();
		},

		/**
		 * Initializes the tree and tree dnd.
		 */
		initTree: function() {
			this.tree = new Tree({
				rfe: this,
				model: this.store,
				childrenAttrs: [this.store.childrenAttr],
				persist: cookie(this._cnDialogSettingsFolderState) || true
			});
			this.tree.placeAt(this.panes.treePane);
		},

		initGrid: function() {
			var div = domConstruct.create('div', null, this.panes.gridPane.domNode);
			this.grid = new Grid({
				rfe: this,
				tabIndex: 31,
				view: 'icons',
				store: null, // store is set in FileExplorer.initState()
				dndConstructor: GridSource,	// dgrid/extension/dnd can't be overridden directly
				dndParams: {
					accept: ['treeNode'],
					rfe: this
				}
			}, div);
		},

		initDialogs: function() {
			// TODO: move to dialog.js
			new Dialog({
				id: 'rfeDialogAbout',
				title: "About Remote File Explorer (rfe)",
				content: '<div id="rfeDialogAboutLogo"><img src="' + require.toUrl('rfe') + '/resources/images/logo-speich.net.png' +
					'" alt="speich.net logo" title="Created by Simon Speich, www.speich.net"/></div>' +
					'<div id="rfeDialogAboutText">' +
					'<h2>Remote File Explorer (rfe)</h2>' +
					'<p>version ' + this.version + ' - ' + this.versionDate + '</p>' +
					'<p>Created by <a href="http://www.speich.net" target="_blank">Simon Speich</a>, www.speich.net using the ' +
					'<a href="http://www.dojotoolkit.org" target="_blank">dojotoolkit</a> and <a href="http://www.php.net" target="_blank">PHP</a>. ' +
					'The code is available on <a href="https://github.com/speich/remoteFileExplorer" target="_blank">github</a></p>' +
					'<p>Available under the same <a href="http://dojotoolkit.org/license" target="_blank">dual BSD/AFL license</a> as the Dojo Toolkit.</p>' +
					'</div>'
			});

			// TODO: move to dialogs.js
			var self = this;
			var dialog = new Dialog({
				id: 'rfeDialogSettings',
				title: "Settings",
				content: '<div>Not implmented yet' +
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
				disabled: 'disabled',
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
				disabled: 'disabled',
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