define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/aspect',
	'dijit/registry',
	'dijit/MenuBar',
	'dijit/MenuBarItem',
	'dijit/PopupMenuBarItem',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem',
	'dijit/CheckedMenuItem'

], function(lang, declare, array, on, aspect, registry,
				MenuBar, MenuBarItem, PopupMenuBarItem, DropDownMenu, MenuItem, MenuSeparator, PopupMenuItem, CheckedMenuItem) {

	return declare([MenuBar], {

		rfe: null,

		constructor: function(props) {
			lang.mixin(this, props || {});
		},

		postCreate: function() {
			// TODO: reuse menu from edit.js?
			var menuBar, menuFile, menuView, menuHelp, menuTools;
			var subMenuFile;

			// ********** menu file **************
			menuFile = new DropDownMenu({
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
			subMenuFile = new DropDownMenu();
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
			menuView = new DropDownMenu({ id: 'rfeMenuView' });
			menuView.addChild(new CheckedMenuItem({
				id: 'rfeMenuItemHorizontal',
				label: 'Layout horizontal',
				checked: true,
				onClick: lang.hitch(this, function() {
					this.rfe.panes.setView('horizontal');
					on.emit('rfe/menuView/setView');   // notify menuView/folders to set checked = true
					registry.byId('rfeMenuItemVertical').set('checked', false);
				})
			}));
			menuView.addChild(new CheckedMenuItem({
				id: 'rfeMenuItemVertical',
				label: 'Layout vertical',
				checked: false,
				onClick: lang.hitch(this, function() {
					this.rfe.panes.setView('vertical');
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
			menuTools = new DropDownMenu({ id: 'rfeMenuTools' });
			menuTools.addChild(new MenuItem({
				label: 'Settings',
				onClick: lang.hitch(this, function() {
					this.showDialogTools();
				})
			}));


			// ********** menu help ***************
			menuHelp = new DropDownMenu({ id: 'rfeMenuHelp' });
			menuHelp.addChild(new MenuItem({
				label: 'About rfe',
				onClick: lang.hitch(this, function() {
					this.showDialogAbout();
				})
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

			return menuBar;
		}


	});
});