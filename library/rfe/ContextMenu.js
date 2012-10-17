define([
	'dojo/_base/lang',
	'dojo/_base/declare',
	'dojo/topic',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/MenuSeparator',
	'dijit/PopupMenuItem'
], function(lang, declare, topic, Menu, MenuItem, MenuSeparator, PopupMenuItem) {

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

		constructor: function() {
			topic.subscribe('rfe/context/set', lang.hitch(this, function(context) {
				this.enableMenuItems(context);
			}));
		},

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
				onClick: lang.hitch(this.rfe, this.rfe.createRename)
			}));
		},

		/**
		 * Enables or disables context menu items depending on the context.
		 * @param {object} context
		 */
		enableMenuItems: function(context) {
			var id, selected = false,
				widget = context.isOnGrid || context.isOnGridPane ? this.rfe.grid : this.rfe.tree,
				selection = context.isOnGrid || context.isOnGridPane ? widget.selection : widget.selectedItems;

			// set file properties menu depending on if a file object is selected
			// TODO: unify tree and grid selection object
			// grid
			if (selection && (context.isOnGrid || context.isOnGridPane)) {
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
			else if (selection && selection.length > 0 && (context.isOnTree || context.isOnTreePane)) {
				// if id = root do not allow rename?
				selected = true;
				this.menuItems.rename.set('disabled', true); // not implemented for tree yet
			}

			this.menuItems.del.set('disabled', !selected);
			this.menuItems.properties.set('disabled', !selected);
		}

	});
});