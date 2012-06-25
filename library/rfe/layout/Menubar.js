define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/aspect',
	'dijit/registry',
	'dijit/MenuBar',
	'dijit/PopupMenuBarItem',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem',
	'dijit/CheckedMenuItem'

], function(lang, declare, array, on, aspect, registry,
				MenuBar, PopupMenuBarItem, DropDownMenu, MenuItem, MenuSeparator, PopupMenuItem, CheckedMenuItem) {

	return declare([MenuBar], {

		rfe: null,

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var panes = this.rfe.panes;
			var menuFile, menuView, menuHelp, menuTools;
			var menuItemV, subMenuFile;

			// ********** menu file **************
			menuFile = new DropDownMenu({	id: 'rfeMenuFile'	});
			subMenuFile = new DropDownMenu();
			menuFile.addChild(new PopupMenuItem({
				label: 'New',
				popup: subMenuFile,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage"
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
			menuFile.addChild(new MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this.rfe, this.rfe.rename)
			}));
			menuFile.addChild(new MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this.rfe, this.rfe.del)
			}));


			// ******* menu layout ********
			menuView = new DropDownMenu({ id: 'rfeMenuView' });
			menuItemV = new CheckedMenuItem({
				label: 'Layout vertical',
				checked: panes.get('view') != 'horizontal',
				onClick: lang.hitch(this, function() {
					if (menuItemV.get('checked') === true) {
						panes.set('view', 'vertical');
					}
					else {
						panes.set('view', 'horizontal');
					}
				})
			});
			menuView.addChild(menuItemV);
			//menuView.addChild(new MenuSeparator());
			menuView.addChild(new CheckedMenuItem({
				id: 'rfeMenuItemFolders',
				label: 'Navigation pane',
				checked: panes.get('treePaneVisible') === true,
				onChange: function() {
					panes.set('treePaneVisible', this.checked)
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

			var context = this.rfe.context;
			context.watch(lang.hitch(this, function() {
				this.enableMenuItems(menuFile, context);
			}));

		},

		/**
		 * Enable/disable menu items depending on the context
		 * @param {dijit/DropDownMenu} menu
		 * @param {dojo/Stateful} context
		 */
		enableMenuItems: function(menu, context) {
			// TODO: this does not work with i18n since it uses the labels...
			// If not clicked on a item (tree.node or grid.row), but below widget and nothing is selected,
			// then set all menuItems to disabled except create/upload
			var label = '';
			if (context.isOnTree || context.isOnTreePane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label != 'New' && label != 'Upload') {
						item.set('disabled', true);
					}
				});
			}
			else if (context.isOnGridPane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label == 'Rename' || label == 'Delete') {
						item.set('disabled', true);
					}
				});
			}
			else if (context.isOnGrid) {
				array.forEach(menu.getChildren(), function(item) {
					item.set('disabled', false);
				});
			}
		}

	});
});