define(['dojo/_base/declare'], function(declare) {

	/**
	 * Mixin for dnd sources.
	 */
	return declare(null, {

		/**
		 * Checks whether the dragged node is a parent of the grid row we are currently over.
		 * @param {String} id object (item) id of dragged node
		 * @param {Object} parentObj file object to check against
		 * @return {Boolean}
		 * @private
		 */
		_isParentChild: function(id, parentObj) {
			var rfe = this.rfe,
				store = rfe.store,
				memoryStore = store.storeMemory;

			if (parentObj.id === id) {
				return true;
			}

			while (parentObj[store.parentAttr]) {
				parentObj = memoryStore.get(parentObj[store.parentAttr]);
				if (parentObj.id === id) {
					return true;
				}
			}
			return false;
		}
	});
});
