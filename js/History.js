define([
	'dojo/_base/declare',
	'dojo/_base/array',
	'dojo/Deferred',
	'dojo/when'
],
function(declare, array, Deferred, when) {
	'use strict';

	return declare(null, {

		history: null,

		constructor: function() {
			this.history = {
				steps: [],
				curIdx: null,
				numSteps: 10
			};
		},

		/**
		 * Adds current object id to history.
		 * @param {string} itemId id of JsonRestStore object
		 */
		_setHistory: function(itemId) {
			var hist = this.history;

			// first use: initialize history array
			if (hist.curIdx === null) {
				hist.curIdx = 0;
			}
			// move index since we have not used up all available steps yet
			else if (hist.curIdx < hist.numSteps) {
				hist.curIdx++;
			}
			// back button used: reset hist array
			if (hist.curIdx < hist.steps.length - 1) {
				hist.steps = hist.steps.slice(0, hist.curIdx);
			}
			// keep hist array at constant length of number of steps
			if (hist.steps.length === hist.numSteps + 1) {
				hist.steps.shift();
			}
			hist.steps.push(itemId);
			window.history.pushState('', '', this.origPageUrl + itemId + window.location.search);
		},

		/**
		 * Remove object form history.
		 * @param {string} itemId
		 */
		removeHistory: function(itemId) {
			var hist = this.history, self = this;

			hist.steps = array.filter(hist.steps, function(id) {
				return id !== itemId;
			});
			hist.curIdx--;
		},

		/**
		 * Go back or forward in history.
		 * @param {string} direction
		 * @return {object} dojo.Deferred
		 */
		goHistory: function(direction) {
			var def = new Deferred(),
			hist = this.history,
			id = null,
			self = this;

			if (direction === 'back' && hist.curIdx > 0) {
				id = hist.steps[--hist.curIdx];
			}
			else if (direction === 'forward' && hist.curIdx < hist.steps.length) {
				id = hist.steps[++hist.curIdx];
			}
			if (id !== null) {
				return when(this.store.get(id), function(object) {
					return self.display(object).then(function() {
						window.history.pushState('', '', self.origPageUrl + id + window.location.search);
					})
				});
			}
			else {
				return def;
			}
		}

	});
});