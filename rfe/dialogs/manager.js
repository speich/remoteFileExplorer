define(['dojo/_base/array'], function(array) {

	var hash = {};

	/**
	 * @property {number} length number of registered dialogs
	 */
	return {
		length: 0,

		byId: function(id) {
			return hash[id];
		},

		/**
		 * Find and return dialogs of a certain type.
		 * @param {string} type
		 * @return {Array}
		 */
		findTypes: function(type) {
			var dialog, arr = [];
			for (dialog in hash) {
				if (hash.hasOwnProperty(dialog) && hash[dialog].type === type) {
					arr.push(dialog);
				}
			}
			return arr;
		},

		/**
		 * Find and return dialogs of a certain type that are not used at the moment, e.g. closed.
		 * @param {string} type
		 * @param {boolean} open
		 * @return {Array}
		 */
		findTypesOpen: function(type, open) {
			var id, arr = [];
			for (id in hash) {
				if (hash.hasOwnProperty(id) && hash[id].type === type && hash[id].open === open) {
					arr.push(id);
				}
			}
			return arr;
		},

		/**
		 * Add a dialog to the registry. If a duplicate id is detected, an error is thrown.
		 * @param {DialogConfirm} dialog
		 */
		add: function(dialog) {
			if (hash[dialog.id]) {
				throw new Error("Tried to register dialog with id==" + dialog.id + " but that id is already registered");
			}
			hash[dialog.id] = dialog;
			this.length++;
		},

		/**
		 * Remove a widget from the registry. Does not destroy the widget; simply removes the reference.
		 * @param {string} id
		 */
		remove: function(id) {
			if (hash[id]) {
				delete hash[id];
				this.length--;
			}
		},

		_destroyAll: function(type) {
			var id, arr;
			if (type) {
				arr = this.findTypes(type);
				array.forEach(arr, function(dialog) {
					this.remove(dialog.id);
					dialog.distroy();
				}, this);
			}
			else {
				for (id in hash) {
					if (hash.hasOwnProperty(id)) {

						arr.push(id);
					}
				}
			}
		}

	};

});