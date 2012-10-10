define([
	'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/_base/declare',
	'dojo/_base/Deferred',
	'dojo/on',
	'dojo/aspect',
	'dojo/mouse',
	'dojo/dom',
	'dojo/dom-class',
	'dijit/_WidgetBase',
	'dijit/registry',
	'dijit/Menu',
	'dijit/MenuItem',
	'dijit/PopupMenuItem',
    "dojo/query!css2"
], function(lang, array, declare, Deferred, on, aspect, mouse, dom, domClass, _WidgetBase, registry, Menu, MenuItem, PopupMenuItem) {

	/**
	 * @class
	 * @name rfe.EditContextMenu
	 * @extends {dijit.Menu}
	 * @property {rfe} rfe reference to remoteFileExplorer
	 * @property {number} popUpDelay
	 */
	return declare([Menu], /** @lends rfe.EditContextMenu.prototype */ {

		rfe: null,
        popUpDelay: 10,

		postCreate: function() {
            this.inherited('postCreate', arguments);

			var subMenu, context;

			subMenu = new Menu();
			this.addChild(new PopupMenuItem({
				label: 'New',
				popup: subMenu,
				iconClass: "dijitEditorIcon dijitEditorIconNewPage"
			}));
			this.addChild(new MenuItem({
				label: 'Rename',
				onClick: lang.hitch(this.rfe, this.rfe.rename)
			}));
            this.addChild(new MenuItem({
				label: 'Delete',
				onClick: lang.hitch(this.rfe, this.rfe.del)
			}));

			// subMenu New
			subMenu.addChild(new MenuItem({
				label: 'Directory',
				onClick: lang.hitch(this.rfe, function() {
					this.createRename({
						dir: true
					});
				})
			}));
			subMenu.addChild(new MenuItem({
				label: 'File',
				onClick: lang.hitch(this.rfe, this.rfe.createRename)
			}));

            this.startup();

			context = this.rfe.context;
			context.watch(lang.hitch(this, function() {
				this.enableMenuItems(this, context);
			}));
		},

		/**
		 * Enables or disables context menu items depending on the clicked context.
		 * @param {dijit.Menu} menu
		 * @param {dojo.Stateful} context
		 */
		enableMenuItems: function(menu, context) {
			// TODO: this does not work with i18n since it uses the labels...
			// If not clicked on a item (tree.node or grid.row), but below widget and nothing is selected,
			// then set all menuItems to disabled except create/upload
			var label = ''//,
                    //context = this.rfe.context;

			if (context.isOnTree || context.isOnTreePane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label !== 'New' && label !== 'Upload') {
						item.set('disabled', true);
					}
				});
			}
			else if (context.isOnGridPane) {
				array.filter(menu.getChildren(), function(item) {
					label = item.get('label');
					if (label === 'Rename' || label === 'Delete') {
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