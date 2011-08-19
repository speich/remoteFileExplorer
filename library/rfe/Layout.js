define('rfe/Layout', [
	'dojo',
	'dijit',
	'dojo/store/Memory',
	'dojo/store/JsonRest',
	'rfe/StoreFileCache',
	'dijit/Tree',
	'rfe/dnd/Tree',
	'rfe/dnd/TreeSource',
	'rfe/Grid',
	'dijit/layout/BorderContainer',
	'dijit/layout/ContentPane',
	"dijit/MenuBar",
	"dijit/MenuBarItem",
	"dijit/PopupMenuBarItem",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/PopupMenuItem",
	"dijit/Toolbar",
	"dijit/form/Button",
	"dijit/form/CheckBox",
	"dijit/Dialog"], function(dojo, dijit) {

	dojo.declare('rfe.Layout', null, {
		store: null,
		grid: null,
		tree: null,
		layout: {				// contains references to all layout elements
			view: 'horizontal',
			panes: null
		},

		constructor: function(args) {
			var storeMaster, storeMemory;
			dojo.safeMixin(this, args);

			storeMaster = new dojo.store.JsonRest({target: '/library/rfe/controller.php/'});
			storeMemory = new dojo.store.Memory({});

			this.store = new rfe.StoreFileCache(storeMaster, storeMemory);
			this.grid = this.initGrid('rfeGrid', this.store);
			this.tree = this.initTree('rfeTree', this.store);
		},

		/**
		 * Initializes the tree and tree dnd.
		 * @param id
		 * @param store
		 */
		initTree: function(id, store) {
			var tree, dnd;

			// TODO. don't make this a class, only a function to extend the tree?
			new rfe.dnd.Tree(); 	// setups the dnd for the tree

			tree = new dijit.Tree({
				id: id,
				model: store,
				childrenAttrs: [store.childrenAttr],
				isEdited: false,
				openOnClick: false,
				openOnDblClick: true,
				persist: true,
				showRoot: true
			});

			new rfe.dnd.TreeSource(tree, {
				store: store,
				singular: true
			});

			return tree;
		},

		/**
		 * Initializes the grid and grid dnd.
		 * @param {string} id
		 * @param {dojo.store.Memory} store
		 */
		initGrid: function(id, store) {
			var grid, structure;

			grid = new rfe.Grid({
				id: id,
				store: null
			});

			structure = [
				/*{
				 name:  null,
				 field: '_item', 	// there is a bug in 1.5 that prevents sorting on _item
				 formatter: this.formatImg,
				 width: '5%'
				 }, */
				{
					name: "name",
					field: 'name',
					width: '35%',
					formatter: function(value, idx) {
						var item = this.grid.getItem(idx);
						return this.grid.formatImg(item);
					}
				},{
					name: "size",
					field: "size",
					formatter: function(value) {
						return this.grid.formatFileSize(value);
					},
					width: '20%'
				},{
					name: 'type',
					field: 'dir',
					formatter: function(value) {
						return this.grid.formatType(value);
					},
					width: '20%'
				},{
					name: 'last modified',
					field: 'mod',
					width: '20%'
			}];
			grid.set('structure', structure);

			// add drag and drop to the grid
			grid.dndController = new rfe.dnd.GridSource(grid, {
				store: store
			});

			return grid;
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

			dojo.create('div', {
				'id': 'rfeTreeMenuBar',
				'class': 'dojoxGridHeader',// 'dijitMenuBar',
				innerHTML: '<div class="dojoxGridCell"><div class="dojoxGridSortNode">folders</div></div>'  // imitating dojox grid header to use same style and size as grid headers
			}, panes.treePane.domNode, 'first');

			menuBar.placeAt(panes.menuPane.domNode);
			toolbar.placeAt(panes.menuPane.domNode);
			this.tree.placeAt(panes.treePane.domNode);
			this.grid.placeAt(panes.gridPane.domNode);
			panes.menuPane.placeAt(panes.borderContainer);
			panes.treePane.placeAt(panes.borderContainer);
			panes.gridPane.placeAt(panes.borderContainer);

			this.setView(panes, this.layout.view);
			this.layout.menu = menuBar;
			this.layout.panes = panes;
			panes.borderContainer.startup();
			this.grid.startup(); // call startup here, otherwise store data is loaded twice (no idea why though)
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
					style: 'top: auto; width: 100%; height: 50%',	// top is not removed when changing from center to bottom
					splitter: true
				});
			}
			else if (view == 'horizontal') {
				panes.treePane.set({
					region: 'left',
					style: 'top: 0; bottom: auto; width: 20%; height: 100%;',
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
			var menuBar, menuFile, menuView, menuHelp;
			var subMenuFile;

			menuBar = new dijit.MenuBar({ id: 'rfeMenuBar' });

			// ********** menu file **************
			menuFile = new dijit.Menu({
				id: 'rfeMenuFile',
				onOpen: dojo.hitch(this, function() {
					if (this.grid.selection.getSelected().length === 0) {
						dojo.filter(menuFile.getChildren(), function(item) {
							if (item.get('label') != 'New' && item.get('label') != 'Upload') {
								item.set('disabled', true);
							}
						});
					}
					else {
						dojo.forEach(menuFile.getChildren(), function(item) {
							item.set('disabled', false);
						});
					}
				})
			});
			subMenuFile = new dijit.Menu();
			menuFile.addChild(new dijit.PopupMenuItem({
				label: 'New',
				popup: subMenuFile,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage"
			}));
			subMenuFile.addChild(new dijit.MenuItem({
				label: 'File',
				onClick: dojo.hitch(this, function() {
					this.createRenameItem();
				})
			}));
			subMenuFile.addChild(new dijit.MenuItem({
				label: 'Directory',
				onClick: dojo.hitch(this, function() {
					this.createRenameItem({
						dir: true
					});
				})
			}));
			menuFile.addChild(new dijit.MenuItem({
				label: 'Rename',
				onClick: dojo.hitch(this, function() {
					var item = this.getSelectedItem();
					if (item) {
						this.renameItem(item);
					}
				})
			}));
			menuFile.addChild(new dijit.MenuItem({
				label: 'Delete',
				onClick: dojo.hitch(this, function() {
					var item = this.getSelectedItem();
					if (item) {
						this.deleteItems(item)
					}
				})
			}));


			// ******* menu layout ********
			menuView = new dijit.Menu({ id: 'rfeMenuView' });
			menuView.addChild(new dijit.CheckedMenuItem({
				id: 'rfeMenuItemHorizontal',
				label: 'Layout horizontal',
				checked: true,
				onClick: dojo.hitch(this, function() {
					this.setView(this.layout.panes, 'horizontal');
					dojo.publish('rfe/menuView/setView');   // notify menuView/folders to set checked = true
					dijit.byId('rfeMenuItemVertical').set('checked', false);
				})
			}));
			menuView.addChild(new dijit.CheckedMenuItem({
				id: 'rfeMenuItemVertical',
				label: 'Layout vertical',
				checked: false,
				onClick: dojo.hitch(this, function() {
					this.setView(this.layout.panes, 'vertical');
					dojo.publish('rfe/menuView/setView');   // notify menuView/folders to set checked = true
					dijit.byId('rfeMenuItemHorizontal').set('checked', false);
				})
			}));
			menuView.addChild(new dijit.MenuSeparator());
			menuView.addChild(new dijit.CheckedMenuItem({
				id: 'rfeMenuItemFolders',
				label: 'Show folders',
				checked: true,
				onClick: dojo.hitch(this, this.toggleTreePane)
			}));
			dojo.subscribe('rfe/menuView/setView', dijit.byId('rfeMenuItemFolders'), function() {
				this.set('checked', true);
			});

			// ********** menu tools ***************
			menuTools = new dijit.Menu({ id: 'rfeMenuTools' });
			menuTools.addChild(new dijit.MenuItem({
				label: 'Settings',
				onClick: dojo.hitch(this, function() {
					this.showDialogTools();
				})
			}));


			// ********** menu help ***************
			menuHelp = new dijit.Menu({ id: 'rfeMenuHelp' });
			menuHelp.addChild(new dijit.MenuItem({
				label: 'About rfe',
				onClick: dojo.hitch(this, function() {
					this.showDialogAbout();
				})
			}));


			menuBar.addChild(new dijit.PopupMenuBarItem({
				label: 'File',
				popup: menuFile
			}));
			menuBar.addChild(new dijit.PopupMenuBarItem({
				label: 'View',
				popup: menuView
			}));
			menuBar.addChild(new dijit.PopupMenuBarItem({
				label: 'Tools',
				popup: menuTools
			}));
			menuBar.addChild(new dijit.PopupMenuBarItem({
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
			panes.borderContainer = new dijit.layout.BorderContainer({
				liveSplitters: true,
				gutters: false

			}, id);
			dojo.connect(panes.borderContainer.domNode, 'oncontextmenu', function(evt) {
				dojo.stopEvent(evt);
			});
			panes.menuPane = new dijit.layout.ContentPane({
				id: 'rfeContentPaneMenu',
				region: 'top'
			}, document.createElement('div'));
			panes.treePane = new dijit.layout.ContentPane({
				id: 'rfeContentPaneTree'
			}, document.createElement('div'));
			panes.gridPane = new dijit.layout.ContentPane({
				id: 'rfeContentPaneGrid'
			}, document.createElement('div'));
			panes.loggingPane = new dijit.layout.ContentPane({
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
			var toolbar = new dijit.Toolbar({id: 'rfeToolbar'});
			toolbar.addChild(new dijit.form.Button({
				id: 'rfeButtonDirectoryUp',
				label: 'up',
				showLabel: true,
				iconClass: 'rfeToolbarIcon rfeToolbarIconDirUp',
				disabled: true,
				onClick: dojo.hitch(this, function() {
					var def = this.goDirUp();
					def.then(dojo.hitch(this, function(item) {
						if (item) {
							this.setHistory(this.currentTreeItem.id);
						}
					}));
				})
			}));
			dojo.connect(this, 'showItemChildrenInGrid', dijit.byId('rfeButtonDirectoryUp'), function(item) {
				this.set('disabled', item == tree.rootNode.item);
			});
			dojo.connect(this.grid, 'onRowDblClick', dijit.byId('rfeButtonDirectoryUp'), function(item) {
				this.set('disabled', item == tree.rootNode.item);
			});

			toolbar.addChild(new dijit.form.Button({
				id: 'rfeButtonHistoryBack',
				label: 'history back',
				showLabel: false,
				iconClass: 'dijitEditorIcon dijitEditorIconUndo',
				disabled: true,
				onClick: dojo.hitch(this, function() {
					this.goHistory('back');
				})
			}));
			dojo.connect(this, 'setHistory', this, function() {
				dijit.byId('rfeButtonHistoryBack').set('disabled', this.history.steps.length < 2);
			});
			dojo.connect(this, 'goHistory', this, function() {
				dijit.byId('rfeButtonHistoryBack').set('disabled', this.history.curIdx < 1);
			});

			toolbar.addChild(new dijit.form.Button({
				id: 'rfeButtonHistoryForward',
				label: 'history forward',
				showLabel: false,
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
				disabled: true,
				onClick: dojo.hitch(this, function() {
					this.goHistory('forward');
				})
			}));
			dojo.connect(this, 'goHistory', this, function() {
				dijit.byId('rfeButtonHistoryForward').set('disabled', this.history.curIdx > this.history.steps.length - 2);
			});
			toolbar.addChild(new dijit.form.Button({
				id: 'rfeButtonReload',
				label: 'reload',
				showLabel: true,
				iconClass: 'dijitEditorIcon dijitEditorIconRedo',
				disabled: false,
				onClick: dojo.hitch(this, function() {
					this.reload();
				})
			}));

			return toolbar;
		},

		showDialogAbout: function() {
			var dialog = dijit.byId('rfeDialogAbout');
			if (!dialog) {
				dialog = new dijit.Dialog({
					id: 'rfeDialogAbout',
					title: "About Remote File Explorer (rfe)",
					content: '<div id="rfeDialogAboutLogo"><img src="library/rfe/resources/images/logo-speich.net.png" alt="speich.net logo" title="Created by Simon Speich, www.speich.net"/></div>' +
					'<div id="rfeDialogAboutText">' +
					'<h2>Remote File Explorer (rfe)</h2>' +
					'<p>version ' + this.version + ' - ' + this.versionDate + '</p>' +
					'<p>Created by <a href="http://www.speich.net">Simon Speich</a>, www.speich.net</p>' +
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
			var dialog = dijit.byId('rfeDialogSettings');
			if (!dialog) {
				dialog = new dijit.Dialog({
					id: 'rfeDialogSettings',
					title: "Settings",
					content: '<div>' +
					'<fieldset><legend>Navigation Pane (Folders)</legend></fieldset>' +
					'</div>'
				});

				label = dojo.create('label', {
					innerHTML: 'Remember folders state'
				}, dojo.query('fieldset', dialog.domNode)[0], 'last');
				dojo.create('br', null, label);
				input = dojo.create('input', null, label, 'first');
				new dijit.form.CheckBox({
					checked: true,
					onClick: function() {
						self.grid.persist = this.checked;
					}
				}, input);

				label = dojo.create('label', {
					innerHTML: 'Show folders only'
				}, dojo.query('fieldset', dialog.domNode)[0], 'last');
				input = dojo.create('input', null, label, 'first');
				new dijit.form.CheckBox({
					checked: true,
					onClick: function() {
						self.store.skipWithNoChildren = this.checked;
					}
				}, input);
			}
			dialog.show();
		}

	});
	return rfe.Layout;
});