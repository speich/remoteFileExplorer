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
	"dijit/MenuBar",
	"dijit/MenuBarItem",
	"dijit/PopupMenuBarItem",
	"dijit/Menu",
	"dijit/MenuItem",
	'dijit/MenuSeparator',
	"dijit/PopupMenuItem",
	'dijit/CheckedMenuItem',
	"dijit/Toolbar",
	"dijit/form/Button",
	"dijit/form/CheckBox",
	"dijit/Dialog"
], function(array, lang, declare, event, aspect, on, cookie, construct, query, Tree, TreeSource,
				Grid, registry,
				BorderContainer, ContentPane, MenuBar, MenuBarItem, PopupMenuBarItem, Menu, MenuItem, MenuSeparator,
				PopupMenuItem, CheckedMenuItem, Toolbar, Button, CheckBox, Dialog) {

		return declare('rfe.Layout', null, {
			store: null,
			grid: null,
			tree: null,
			layout: {				// contains references to all layout elements
				view: 'horizontal',
				panes: null
			},

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
				}, this.layout.panes.treePane.domNode);

				return new Tree(props, div);
			},

			initGrid: function(id) {
				construct.create('div', {
					id: id
				}, this.layout.panes.gridPane.domNode);
				return new Grid({}, id)
			},

			/**
			 * Create the layout containers for the tree and grid.
			 * @param {Number} id
			 * @return {Object} layout
			 */
			createLayout: function(id) {
				var panes = this.createPanes(id);
				var menuBar = this.createMenus();
				var toolbar = this.createToolbar();

				construct.create('div', {
					'id': 'rfeTreeMenuBar',
					'class': 'dojoxGridHeader',// 'dijitMenuBar',
					innerHTML: '<div class="dojoxGridCell"><div class="dojoxGridSortNode">folders</div></div>'  // imitating dojox grid header to use same style and size as grid headers
				}, panes.treePane.domNode, 'first');

				menuBar.placeAt(panes.menuPane.domNode);
				toolbar.placeAt(panes.menuPane.domNode);
				panes.menuPane.placeAt(panes.borderContainer);
				panes.treePane.placeAt(panes.borderContainer);
				panes.gridPane.placeAt(panes.borderContainer);

				this.setView(panes, this.layout.view);
				this.layout.menu = menuBar;
				this.layout.panes = panes;
				panes.borderContainer.startup();
			},

			/**
			 * Toggle display of the tree pane.
			 */
			toggleTreePane: function() {
				// to keep it simple for the moment we switch to vertical view where the remaining pane is the center pane
				// -> automatically expands to fill the remaining space
				var panes = this.layout.panes;
				var treePane = panes.treePane;
				if (treePane.domNode.parentNode) {  // hide pane
					if (this.layout.view == 'vertical') {
						this.setView(panes, 'horizontal');
					}
					panes.borderContainer.removeChild(treePane);
				}
				else {	// show pane
					panes.borderContainer.addChild(treePane);
				}
			},

			/**
			 * Sets the layout view of the explorer.
			 * @param {object} panes dijit.BorderContainer
			 * @param {string} view
			 */
			setView: function(panes, view) {
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

				this.layout.view = view;
			},

			/**
			 * Creates the main menu.
			 * @return dijit.MenuBar
			 */
			createMenus: function() {
				// TODO: reuse menu from edit.js?
				var menuBar, menuFile, menuView, menuHelp, menuTools;
				var subMenuFile;

				menuBar = new MenuBar({ id: 'rfeMenuBar' });

				// ********** menu file **************
				menuFile = new Menu({
					id: 'rfeMenuFile',
					onOpen: lang.hitch(this, function() {
						if (this.grid.selection.getSelected().length === 0) {
							array.filter(menuFile.getChildren(), function(item) {
								if (item.get('label') != 'New' && item.get('label') != 'Upload') {
									item.set('disabled', true);
								}
							});
						}
						else {
							array.forEach(menuFile.getChildren(), function(item) {
								item.set('disabled', false);
							});
						}
					})
				});
				subMenuFile = new Menu();
				menuFile.addChild(new PopupMenuItem({
					label: 'New',
					popup: subMenuFile,
					iconClass: "dijitEditorIcon dijitEditorIconNewPage"
				}));
				subMenuFile.addChild(new MenuItem({
					label: 'File',
					onClick: lang.hitch(this, function() {
						this.createRenameItem();
					})
				}));
				subMenuFile.addChild(new MenuItem({
					label: 'Directory',
					onClick: lang.hitch(this, function() {
						this.createRenameItem({
							dir: true
						});
					})
				}));
				menuFile.addChild(new MenuItem({
					label: 'Rename',
					onClick: lang.hitch(this, this.edit)
				}));
				menuFile.addChild(new MenuItem({
					label: 'Delete',
					onClick: lang.hitch(this, this.deleteItems)
				}));


				// ******* menu layout ********
				menuView = new Menu({ id: 'rfeMenuView' });
				menuView.addChild(new CheckedMenuItem({
					id: 'rfeMenuItemHorizontal',
					label: 'Layout horizontal',
					checked: true,
					onClick: lang.hitch(this, function() {
						this.setView(this.layout.panes, 'horizontal');
						on.emit('rfe/menuView/setView');   // notify menuView/folders to set checked = true
						registry.byId('rfeMenuItemVertical').set('checked', false);
					})
				}));
				menuView.addChild(new CheckedMenuItem({
					id: 'rfeMenuItemVertical',
					label: 'Layout vertical',
					checked: false,
					onClick: lang.hitch(this, function() {
						this.setView(this.layout.panes, 'vertical');
						on.emit('rfe/menuView/setView');   // notify menuView/folders to set checked = true
						registry.byId('rfeMenuItemHorizontal').set('checked', false);
					})
				}));
				menuView.addChild(new MenuSeparator());
				menuView.addChild(new CheckedMenuItem({
					id: 'rfeMenuItemFolders',
					label: 'Show folders',
					checked: true,
					onClick: lang.hitch(this, this.toggleTreePane)
				}));
				on('rfe/menuView/setView', function() {
					var el = registry.byId('rfeMenuItemFolders');
					el.set('checked', true);
				});

				// ********** menu tools ***************
				menuTools = new Menu({ id: 'rfeMenuTools' });
				menuTools.addChild(new MenuItem({
					label: 'Settings',
					onClick: lang.hitch(this, function() {
						this.showDialogTools();
					})
				}));


				// ********** menu help ***************
				menuHelp = new Menu({ id: 'rfeMenuHelp' });
				menuHelp.addChild(new MenuItem({
					label: 'About rfe',
					onClick: lang.hitch(this, function() {
						this.showDialogAbout();
					})
				}));


				menuBar.addChild(new PopupMenuBarItem({
					label: 'File',
					popup: menuFile
				}));
				menuBar.addChild(new PopupMenuBarItem({
					label: 'View',
					popup: menuView
				}));
				menuBar.addChild(new PopupMenuBarItem({
					label: 'Tools',
					popup: menuTools
				}));
				menuBar.addChild(new PopupMenuBarItem({
					label: 'Help',
					popup: menuHelp
				}));

				return menuBar;
			},

			/**
			 * Creates the layout panes.
			 * @param {String} id id of HTMLDivElement layout should be appended to
			 * @return {Object} dijit.BorderContainer and dijit.ContentPane
			 */
			createPanes: function(id) {
				var panes = {};
				panes.borderContainer = new BorderContainer({
					liveSplitters: true,
					gutters: false
				}, id);
				on(panes.borderContainer.domNode, 'contextmenu', function(evt) {
					event.stop(evt);
				});
				panes.menuPane = new ContentPane({
					id: 'rfeContentPaneMenu',
					region: 'top'
				}, document.createElement('div'));
				panes.treePane = new ContentPane({
					id: 'rfeContentPaneTree'
				}, document.createElement('div'));
				panes.gridPane = new ContentPane({
					id: 'rfeContentPaneGrid'
				}, document.createElement('div'));
				panes.loggingPane = new ContentPane({
					id: 'rfeContentPaneLogging',
					region: 'bottom'
				}, document.createElement('div'));
				return panes;
			},

			/**
			 * Creates the toolbar.
			 * @return {Object} dijit.Toolbar
			 */
			createToolbar: function() {
				var tree = this.tree;
				var toolbar = new Toolbar({id: 'rfeToolbar'});
				toolbar.addChild(new Button({
					id: 'rfeButtonDirectoryUp',
					label: 'up',
					showLabel: true,
					iconClass: 'rfeToolbarIcon rfeToolbarIconDirUp',
					disabled: true,
					onClick: lang.hitch(this, function() {
						var def = this.goDirUp();
						def.then(lang.hitch(this, function(item) {
							if (item) {
								this.setHistory(this.currentTreeItem.id);
							}
						}));
					})
				}));
				aspect.after(this, 'displayChildrenInGrid', function(item) {
					var button = registry.byId('rfeButtonDirectoryUp');
					button.set('disabled', item == tree.rootNode.item);
				}, true);
				/*
				this.grid.on('RowDblClick', function(item) {
					var button = registry.byId('rfeButtonDirectoryUp');
					button.set('disabled', item == tree.rootNode.item);
				});
				*/

				toolbar.addChild(new Button({
					id: 'rfeButtonHistoryBack',
					label: 'history back',
					showLabel: false,
					iconClass: 'dijitEditorIcon dijitEditorIconUndo',
					disabled: true,
					onClick: lang.hitch(this, function() {
						this.goHistory('back');
					})
				}));
				aspect.after(this, 'setHistory', dojo.hitch(this, function() {
					registry.byId('rfeButtonHistoryBack').set('disabled', this.history.steps.length < 2);
				}));
				aspect.after(this, 'goHistory', dojo.hitch(this, function() {
					registry.byId('rfeButtonHistoryBack').set('disabled', this.history.curIdx < 1);
				}));

				toolbar.addChild(new dijit.form.Button({
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
				toolbar.addChild(new Button({
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

			showDialogAbout: function() {
				var dialog = registry.byId('rfeDialogAbout');
				if (!dialog) {
					dialog = new Dialog({
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
				}
				dialog.show();
			},

			showDialogTools: function() {
				// TODO: use external html for this
				var self = this;
				var input, label;
				var dialog = registry.byId('rfeDialogSettings');
				if (!dialog) {
					dialog = new Dialog({
						id: 'rfeDialogSettings',
						title: "Settings",
						content: '<div>' +
						'<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
						'</div>'
					});

					label = construct.create('label', {
						innerHTML: 'Remember folders state'
					}, query('fieldset', dialog.domNode)[0], 'last');
					construct.create('br', null, label);
					input = construct.create('input', null, label, 'first');
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
				}
				dialog.show();
			}

		});
});