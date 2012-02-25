define([
	'dojo/_base/array',
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/event',
	'dojo/aspect',
	'dojo/on',
	'dojo/cookie',
	'dojo/dom-construct',
	'dojo/query',
	'dijit/Tree',
	'dijit/tree/dndSource',
	'rfe/Grid',
	'dijit/registry',
	'dijit/form/CheckBox',
	"dijit/Dialog",
	'rfe/layout/Toolbar',
	'rfe/layout/Menubar',
	'rfe/layout/Panes',
	'rfe/EditContextMenu'
], function(array, lang, declare, event, aspect, on, cookie, domConstruct, query, Tree, TreeSource,
				Grid, registry, CheckBox, Dialog, Toolbar, Menubar, Panes, EditContextMenu) {

		return declare(null, {

			panes: null,
			toolbar: null,
			menubar: null,

			tree: null,
			grid: null,

			constructor: function(props) {
				lang.mixin(this, props || {});
			},

			init: function() {
				console.log('Layout postCreate', this.store)
				this.panes = new Panes({}, this.id);

				this.toolbar = new Toolbar({
					rfe: this
				}, domConstruct.create('div'));

				this.menubar = new Menubar({
					rfe: this
				}, domConstruct.create('div'));

				this.editContextMenu = new EditContextMenu({
					rfe: this
				});

				this.menubar.placeAt(this.panes.menuPane.domNode);
				this.toolbar.placeAt(this.panes.menuPane.domNode);

				this.panes.setView('horizontal');

				this.initGrid();
				this.initTree();
				this.panes.startup();
			},

			/**
			 * Initializes the tree and tree dnd.
			 */
			initTree: function(){
				var div = domConstruct.create('div', {}, this.panes.treePane.domNode);
				this.tree = new Tree({
					model: this.store,
					childrenAttrs: [this.store.childrenAttr],
					openOnClick: false,
					openOnDblClick: true,	// note: tree.on('dblclick') only fires when this is set to false
					showRoot: true,
					persist: true,
					dndController: function(arg, params){
						return new TreeSource(arg, lang.mixin(params || {}, {
							accept: ['treeNode', 'gridNode'],
							store: this.store,
							singular: true
						}))
					}
				}, div);
			},

			initGrid: function() {
				var div = domConstruct.create('div', {}, this.panes.gridPane.domNode);
				this.grid = new Grid({}, div)
			},

			showDialogAbout: function() {
				var dialog = registry.byId('rfeDialogAbout') || new Dialog({
					id: 'rfeDialogAbout',
					title: "About Remote File Explorer (rfe)",
					content: '<div id="rfeDialogAboutLogo"><img src="library/rfe/resources/images/logo-speich.net.png" alt="speich.net logo" title="Created by Simon Speich, www.speich.net"/></div>' +
					'<div id="rfeDialogAboutText">' +
					'<h2>Remote File Explorer (rfe)</h2>' +
					'<p>version ' + this.version + ' - ' + this.versionDate + '</p>' +
					'<p>Created by <a href="http://www.speich.net">Simon Speich</a>, www.speich.net using the ' +
					'<a href="http://www.dojotoolkit.org">dojotoolkit</a> and <a href="http://www.php.net">PHP</a>.</p>' +
					'<p>Can be used and altered freely as long as this dialog with logo and link is included.</p>' +
					'</div>'
				});
				dialog.show();
			},

			showDialogTools: function() {
				// TODO: use dijit template for all dialogs
				var self = this;
				var isCreated = registry.byId('rfeDialogSettings');
				var dialog = isCreated || new Dialog({
					id: 'rfeDialogSettings',
					title: "Settings",
					content: '<div>' +
					'<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
					'</div>'
				});

				if (!isCreated) {
					var label = domConstruct.create('label', {
						innerHTML: 'Remember folders state'
					}, query('fieldset', dialog.domNode)[0], 'last');
					domConstruct.create('br', null, label);
					var input = domConstruct.create('input', null, label, 'first');
					new CheckBox({
						checked: true,
						onClick: function() {
							self.tree.set('persist', this.checked);
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
				}
				dialog.show();
			}

		});
});