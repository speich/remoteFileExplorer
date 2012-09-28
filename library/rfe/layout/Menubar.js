define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/on',
	'dojo/topic',
	'dijit/registry',
	'dijit/MenuBar',
	'dijit/PopupMenuBarItem',
	'dijit/DropDownMenu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem',
	'dijit/CheckedMenuItem'

], function(lang, declare, array, on, topic, registry, MenuBar, PopupMenuBarItem, DropDownMenu, MenuItem, MenuSeparator, PopupMenuItem, CheckedMenuItem) {

	/**
	 * @class
	 * @name rfe.layout.Menubar
	 * @extends dijit.MenuBar
	 * @property {rfe} rfe reference to remoteFileExplorer
	 */
	return declare([MenuBar], /** @lends rfe.layout.Menubar.prototype */ {

		rfe: null,

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var context = this.rfe.context,
				panes = this.rfe.panes,
				menuItemDetails, menuItemIcons, menuFile, menuView, menuHelp, menuTools, menuItemV, subMenuFile;

			// ********** menu file **************
			menuFile = new DropDownMenu({   id: 'rfeMenuFile'   });
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
			menuFile.addChild(new MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this.rfe, this.rfe.rename)
			}));

			menuFile.addChild(new MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this.rfe, this.rfe.del)
			}));

			// ******* menu layout ********
			menuView = new DropDownMenu();
			menuItemDetails = new CheckedMenuItem({
				label: 'As Details',
				checked: false,
				onClick: lang.hitch(this, function() {
					topic.publish('grid/views/state', 'details');
				})
			});
			// TODO: is this the best way ?
			topic.subscribe('grid/views/state', function(state) {
				menuItemDetails.set('checked', state === 'details');
			});
			menuView.addChild(menuItemDetails);
			menuItemIcons = new CheckedMenuItem({
				label: 'As Icons',
				checked: false,
				onClick: lang.hitch(this, function() {
					topic.publish('grid/views/state', 'icons');
				})
			});
			topic.subscribe('grid/views/state', function(state) {
				menuItemIcons.set('checked', state === 'icons');
			});
			menuView.addChild(menuItemIcons);
			menuView.addChild(new MenuSeparator());
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

			context.watch(lang.hitch(this, function() {
				console.log('watching context', context)
				this.enableMenuItems(menuFile, context);
			}));
		},

		/**
		 * Enable/disable menu items depending on the context
		 * @param {dijit.DropDownMenu} menu
		 * @param {dojo.Stateful} context
		 */
		enableMenuItems: function(menu, context) {
			// TODO: this does not work with i18n since it uses the labels...
			// If not clicked on a item (tree.node or grid.row), but below widget and nothing is selected,
			// then set all menuItems to disabled except create/upload
			var label = '';
			array.filter(menu.getChildren(), function(item) {
				label = item.get('label');
				item.set('disabled', true);
				if (context.isOnTree) {
					if (label === 'New' || label === 'Upload') {
						item.set('disabled', false);
					}
				}
				else if (context.isOnGridPane) {
					if (label === 'New') {
						item.set('disabled', false);
					}
				}
				else if (context.isOnGrid) {
					item.set('disabled', false);
				}
			});
		}

	});
});