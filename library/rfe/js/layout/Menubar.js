define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/topic',
	'dijit/MenuBar',
	'dijit/PopupMenuBarItem',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem',
	'dijit/CheckedMenuItem'

], function(lang, declare, topic, MenuBar, PopupMenuBarItem, DropDownMenu, MenuItem, MenuSeparator, PopupMenuItem, CheckedMenuItem) {

	/**
	 * @class
	 * @name rfe.layout.Menubar
	 * @extends {dijit.MenuBar}
	 * @property {rfe} rfe reference to remoteFileExplorer
	 */
	return declare([MenuBar], /** @lends rfe.layout.Menubar.prototype */ {

		rfe: null,
		menuItems: null,

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var panes = this.rfe.panes,
				submenuView = {},
				menuFile, menuView, menuHelp, menuTools, menuItemV, subMenuFile;

			this.menuItems = {};

			// ********** menu file **************
			menuFile = new DropDownMenu({
				id: 'rfeMenuFile'
			});
			subMenuFile = new DropDownMenu();
			menuFile.addChild(new PopupMenuItem({
				label: 'New',
				popup: subMenuFile,
				iconClass: 'dijitEditorIcon dijitEditorIconNewPage'
			}));
			subMenuFile.addChild(new MenuItem({
				label: 'File',
				onClick: lang.hitch(this.rfe, this.rfe.createRename)
			}));
			subMenuFile.addChild(new MenuItem({
				label: 'Directory',
				onClick: lang.hitch(this.rfe, function() {
					this.createRename({
						dir: true
					});
				})
			}));

			this.menuItems.rename = new MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this.rfe, this.rfe.rename),
				disabled: true
			});
			menuFile.addChild(this.menuItems.rename);
			this.menuItems.del = new MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this.rfe, this.rfe.del),
				disabled: true
			});
			menuFile.addChild(this.menuItems.del);
			menuFile.addChild(new MenuSeparator());
			this.menuItems.properties = new MenuItem({
				label: 'Properties',
				onClick: lang.hitch(this.rfe, this.rfe.showFileDetails),
				disabled: true
			});
			menuFile.addChild(this.menuItems.properties);
			menuFile.onOpen = lang.hitch(this, this.onMenuFileOpen);

			// ******* menu layout ********
			menuView = new DropDownMenu();
			submenuView.icons = new CheckedMenuItem({
				label: 'Icons',
				checked: false,
				onClick: lang.hitch(this, function() {
					topic.publish('grid/views/state', 'icons');
				})
			});
			menuView.addChild(submenuView.icons);
			submenuView.list = new CheckedMenuItem({
				label: 'List',
				checked: false,
				onClick: lang.hitch(this, function() {
					topic.publish('grid/views/state', 'list');
				})
			});
			menuView.addChild(submenuView.list);
			submenuView.details = new CheckedMenuItem({
				label: 'Details',
				checked: false,
				onClick: lang.hitch(this, function() {
					topic.publish('grid/views/state', 'details');
				})
			});
			menuView.addChild(submenuView.details);
			menuView.addChild(new MenuSeparator());
			topic.subscribe('grid/views/state', lang.hitch(this, function(view) {
				submenuView[view].set('checked', true);
				this.rfe.grid.refresh();
			}));

			menuItemV = new CheckedMenuItem({
				label: 'Layout vertical',
				checked: panes.get('view') !== 'horizontal',
				onClick: function() {
					panes.set('view', menuItemV.get('checked') === true ? 'vertical' : 'horizontal');
				}
			});
			menuView.addChild(menuItemV);
			menuView.addChild(new CheckedMenuItem({
				id: 'rfeMenuItemFolders',
				label: 'Navigation pane',
				checked: panes.get('treePaneVisible') === true,
				onChange: function() {
					panes.set('treePaneVisible', this.checked);
				}
			}));

			// ********** menu tools ***************
			menuTools = new DropDownMenu({ id: 'rfeMenuTools' });
			menuTools.addChild(new MenuItem({
				label: 'Settings',
				onClick: this.rfe.showDialogSettings
			}));


			// ********** menu help ***************
			menuHelp = new DropDownMenu({ id: 'rfeMenuHelp' });
			menuHelp.addChild(new MenuItem({
				label: 'About rfe',
				onClick: this.rfe.showDialogAbout
			}));


			this.addChild(new PopupMenuBarItem({
				label: 'File',
				popup: menuFile
			}));
			this.addChild(new PopupMenuBarItem({
				label: 'View',
				popup: menuView
			}));
			this.addChild(new PopupMenuBarItem({
				label: 'Tools',
				popup: menuTools
			}));
			this.addChild(new PopupMenuBarItem({
				label: 'Help',
				popup: menuHelp
			}));
		},

		onMenuFileOpen: function() {
			// note: handle enabling of contextmenu items after selecting and not on mousedown since we need to now if an item is selected or deselected
			this.enableMenuItems(this.rfe.context);
			this.inherited('_openMyself', arguments);
		},

		/**
		 * Enables or disables context menu items depending on the context.
		 * @param {object} context
		 */
		enableMenuItems: function(context) {
			// Note: to prevent ambiguity, delete, rename and properties is only available for grid contextmenu
			var id, selected = false, selection = this.rfe.grid.selection;

			for (id in selection) {
				if (selection.hasOwnProperty(id) && selection[id] === true) {
					selected = true;
					break;
				}
			}

			this.menuItems.rename.set('disabled', !selected); // not implemented for tree yet
			this.menuItems.del.set('disabled', !selected);
			this.menuItems.properties.set('disabled', !selected);
		}

	});
});