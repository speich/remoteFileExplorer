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
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	"dijit/form/CheckBox",
	"dijit/Dialog",
	'rfe/layout/Toolbar',
	'rfe/layout/Menubar'
], function(array, lang, declare, event, aspect, on, cookie, construct, query, Tree, TreeSource,
				Grid, registry,
				BorderContainer, ContentPane, CheckBox, Dialog, Toolbar, Menubar) {

		return declare('rfe.Layout', null, {
//			store: null,
//			grid: null,
//			tree: null,

			toolbar: null,
			menubar: null,

			constructor: function(args) {
				lang.mixin(this, args);
			},

			/**
			 * Initializes the tree and tree dnd.
			 * @param id
			 * @param {rfe/StoreFileCache} store
			 */
			initTree: function(props) {
				props = lang.mixin({
					model: props.store,
					childrenAttrs: [props.store.childrenAttr],
					openOnClick: false,
					openOnDblClick: true,
					showRoot: true,
					persist: true,
					dndController: function(arg, params) {
						return new TreeSource(arg, lang.mixin(params || {}, {
							accept: ['treeNode', 'gridNode'],
							store: props.store,
							singular: true
						}))
					}
				}, props);

				var div = construct.create('div', {
					id: props.id
				}, this.panes.treePane.domNode);

				return new Tree(props, div);
			},

			initGrid: function(id) {
				construct.create('div', {
					id: id
				}, this.panes.gridPane.domNode);
				return new Grid({}, id)
			},

			/**
			 * Create the layout containers for the tree and grid.
			 * @param {Number} id
			 * @return {Object} layout
			 */
			create: function(id) {
				var panes = this.panes;
				panes.create(id);


				this.menubar = new Menubar({
					id: 'rfeMenuBar'
				});
				this.menubar = this.menubar.create();

				this.toolbar = new Toolbar({
					id: 'rfeToolbar',
					rfe: this
				}, panes.menuPane.domNode);
				this.toolbar.create();

				construct.create('div', {
					'id': 'rfeTreeMenuBar',
					'class': 'dojoxGridHeader',// 'dijitMenuBar',
					innerHTML: '<div class="dojoxGridCell"><div class="dojoxGridSortNode">folders</div></div>'  // imitating dojox grid header to use same style and size as grid headers
				}, panes.treePane.domNode, 'first');

				this.menuBar.placeAt(panes.menuPane.domNode);


				panes.menuPane.placeAt(panes.borderContainer);
				panes.treePane.placeAt(panes.borderContainer);
				panes.gridPane.placeAt(panes.borderContainer);

				this.view.set(this.view.current, this.panes);

				panes.borderContainer.startup();
			},

			view: {
				current: 'horizontal',

				/**
				 * Sets the layout view of the explorer.
				 * @param {object} panes dijit.BorderContainer
				 * @param {string} view
				 */
				set: function(view, panes) {
					var treePane = panes.treePane;
					var gridPane = panes.gridPane;

					panes.borderContainer.removeChild(treePane);
					panes.borderContainer.removeChild(gridPane);
					if (view == 'vertical') {
						panes.treePane.set({
							region: 'center',
							style: 'width: 100%;',
							minSize: null,
							splitter: false
						});
						panes.gridPane.set({
							region: 'bottom',
							style: 'top: auto; width: 100%; height: 60%',	// top is not removed when changing from center to bottom
							splitter: true
						});
					}
					else if (view == 'horizontal') {
						panes.treePane.set({
							region: 'left',
							style: 'top: 0; bottom: auto; width: 25%; height: 100%;',
							minSize: 180,
							splitter: true
						});
						panes.gridPane.set({
							region: 'center',
							style: 'top: 0; height: 100%'
						});
					}
					panes.borderContainer.addChild(treePane);
					panes.borderContainer.addChild(gridPane);

					this.current = view;
				}
			},

			/**
			 * Creates the main menu.
			 * @return dijit.MenuBar
			 */


			panes: {
				/**
				 * Creates the layout panes.
				 * @param {String} id id of HTMLDivElement layout should be appended to
				 * @return {Object} dijit.BorderContainer and dijit.ContentPane
				 */
				create: function(id) {
					this.borderContainer = new BorderContainer({
						liveSplitters: true,
						gutters: false
					}, id);
					on(this.borderContainer.domNode, 'contextmenu', function(evt) {
						event.stop(evt);
					});
					this.menuPane = new ContentPane({
						id: 'rfeContentPaneMenu',
						region: 'top'
					}, document.createElement('div'));
					this.treePane = new ContentPane({
						id: 'rfeContentPaneTree'
					}, document.createElement('div'));
					this.gridPane = new ContentPane({
						id: 'rfeContentPaneGrid'
					}, document.createElement('div'));
					this.loggingPane = new ContentPane({
						id: 'rfeContentPaneLogging',
						region: 'bottom'
					}, document.createElement('div'));
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
				var dialog = registry.byId('rfeDialogSettings') || new Dialog({
					id: 'rfeDialogSettings',
					title: "Settings",
					content: '<div>' +
					'<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
					'</div>'
				});

				var label = construct.create('label', {
					innerHTML: 'Remember folders state'
				}, query('fieldset', dialog.domNode)[0], 'last');
				construct.create('br', null, label);

				var input = construct.create('input', null, label, 'first');
				new CheckBox({
					checked: true,
					onClick: function() {
						self.grid.persist = this.checked;
					}
				}, input);

				label = construct.create('label', {
					innerHTML: 'Show folders only'
				}, query('fieldset', dialog.domNode)[0], 'last');
				input = construct.create('input', null, label, 'first');
				new CheckBox({
					checked: true,
					onClick: function() {
						self.store.skipWithNoChildren = this.checked;
					}
				}, input);

				dialog.show();
			}

		});
});