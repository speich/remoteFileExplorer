/**
 * @module stringUtil
 * A Module providing helper methods to work with strings.
 */
define(function() {
	'use strict';

	return {

		/**
		 * Make first character uppercase.
		 * @param {String} str
		 * @return {String}
		 */
		ucFirst: function(str) {
			return str.slice(0, 1).toUpperCase() + str.slice(1);
		}
	};
});