define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem'
], function(lang, declare, Menu, MenuItem, MenuSeparator, PopupMenuItem) {

	/**
	 * Provides a context menu with items to edit files and folders.
	 * @class
	 * @name rfe.ContextMenu
	 * @extends {dijit.Menu}
	 * @property {rfe} rfe reference to remoteFileExplorer
	 * @property {number} popUpDelay
	 */
	return declare([Menu], /** @lends rfe.ContextMenu.prototype */ {

		rfe: null,
		popUpDelay: 10,
		menuItems: null,

		postCreate: function() {
			this.inherited('postCreate', arguments);

			var menu, menuItems = this.menuItems = {};

			menu = new Menu();
			this.addChild(new PopupMenuItem({
				label: 'New',
				popup: menu,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage",
				disabled: false
			}));
			menuItems.rename = new MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this.rfe, this.rfe.rename),
				disabled: true
			});
			this.addChild(menuItems.rename);
			menuItems.del = new MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this.rfe, this.rfe.del),
				disabled: true
			});
			this.addChild(menuItems.del);

			this.addChild(new MenuSeparator());
			menuItems.properties = new MenuItem({
				label: 'Properties',
				onClick: lang.hitch(this.rfe, this.rfe.showFileDetails),
				disabled: true
			});
			this.addChild(menuItems.properties);

			// subMenu New
			menu.addChild(new MenuItem({
				label: 'Directory',
				onClick: lang.hitch(this.rfe, function() {
					this.createRename({
						dir: true
					});
				})
			}));
			menu.addChild(new MenuItem({
				label: 'File',
				onClick: lang.hitch(this.rfe, function() {
					this.createRename(null);	// do not call directly from onclick, otherwise event object would be passed
				})
			}));
		},

		_openMyself: function() {
			// note: handle enabling of contextmenu items after selecting and not on mousedown since we need to now if an item is selected or deselected
			this.enableMenuItems(this.rfe.context);
			this.inherited('_openMyself', arguments);
		},

		/**
		 * Enables or disables context menu items depending on the context.
		 * @param {object} context
		 */
		enableMenuItems: function(context) {
			var id, selected = false,
				widget = context.isOnGridRow || context.isOnGridContainer ? this.rfe.grid : this.rfe.tree,
				selection = context.isOnGridRow || context.isOnGridContainer ? widget.selection : widget.selectedItems;

			// set file properties menu depending on if a file object is selected
			// TODO: unify tree and grid selection object
			// grid
			if (selection && (context.isOnGridRow || context.isOnGridContainer)) {
				// note: disable here if not in selection
				for (id in selection) {
					if (selection.hasOwnProperty(id) && selection[id] === true) {
						selected = true;
						break;
					}
				}
				this.menuItems.rename.set('disabled', !selected);
			}
			// tree
			else if (selection && selection.length > 0 && (context.isOnTreeRow || context.isOnTreeContainer)) {
				// if id = root do not allow rename?
				selected = true;
				this.menuItems.rename.set('disabled', true); // not implemented for tree yet
			}

			this.menuItems.del.set('disabled', !selected);
			this.menuItems.properties.set('disabled', !selected);
		}

	});
});