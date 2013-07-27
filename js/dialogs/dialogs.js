define([
	'dijit/registry',
	'rfe/dialogs/DialogFileProperties',
	'rfe/DialogConfirm'
], function(registry, DialogFileProperties, DialogConfirm) {

	return {

		/**
		 * Returns dialog identified by type and file object id.
		 * If dialog does not exist it will be created, but only if a dialog of same type is not already open.
		 * Otherwise dialog will be reused and just content set. This way the number of created dialogs is limited.
		 * @param {string} type
		 * @param {number} fileObj
		 */
		getByFileObj: function(type, fileObj) {
			var dialog, id = 'dialog' + this.ucfirst(type) + '_' + fileObj.id;

			// check if with same id exists
			dialog = registry.byId(id);
			if (!dialog) {
				dialog = this.create(type, id, { obj: fileObj });
			}
			return dialog;
		},

		create: function(type, id, args) {
			var dialog;

			switch (type) {
/*				case 'sameFolder':
					dialog = new DialogConfirm({
						id: id,
						hasOkButton: false,
						hasSkipCheckBox: false,
						title: args.copy ? 'Copy' : 'Move' + ' Folder',
						content: '<p>The destination folder is the same as the source folder.</p>' +
						'<p>' + args.obj.name + '<br>' + args.obj.mod + '</p>' +
						'<p>' + args.newParentObj.name + '<br>' + args.newParentObj.mod + '</p>'
					});
					break;
				case 'subFolder':
					dialog = new DialogConfirm({
						id: id,
						hasOkButton: false,
						hasSkipCheckBox: false,
						title: args.copy ? 'Copy' : 'Move' + ' Folder',
						content: '<p>The destination folder is a subfolder of the source folder.</p>' +
						'<p>' + args.obj.name + '<br>' + args.obj.mod + '</p>' +
						'<p>' + args.newParentObj.name + '<br>' + args.newParentObj.mod + '</p>'
					});
					break;*/
				case 'deleteFile':
					var str = (args.obj.dir ? 'folder' : 'file');
					dialog = new DialogConfirm({
						id: id,
						hasUnderlay: false,
						title: 'Delete ' + this.ucfirst(str),
						content: '<p>Do you really want to delete this ' + str + '?</p>' +
							'<img src="' + require.toUrl('rfe') + '/resources/images/icons-64/' + str + '.png' + '" alt="' + str + ' icon" class="dialogContentIconImg">' +
							'<div class="dialogContentTxt">' + args.obj.name + '<br>Modified: ' + args.obj.mod + '</div>'
					});
					break;
				case 'fileProperties':
					dialog = new DialogFileProperties({
						id: id,
						title: (args.obj.dir ? 'Folder' : 'File') + ' Properties',
						content: args.obj
					});
					break;
			}
			return dialog;
		},

		/**
		 * Capitalize first letter in string.
		 * @param {string} val
		 */
		ucfirst: function(val) {
			return val.substring(0, 1).toUpperCase() + val.substring(1);
		}

	};
});