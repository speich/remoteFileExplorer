define(['dojo/_base/declare', 'dojo/Stateful'], function(declare, Stateful) {
	'use strict';

	// note: getter/setter taken from dgrid::List

	return declare([Stateful], {

		get: function(/*String*/ name /*, ... */) {
			// summary:
			//		Get a property on a List instance.
			//	name:
			//		The property to get.
			//	returns:
			//		The property value on this List instance.
			// description:
			//		Get a named property. The property may potentially be retrieved via a getter method in subclasses.

			var fn = "_get" + name.charAt(0).toUpperCase() + name.slice(1);

			if (typeof this[fn] === "function") {
				return this[fn].apply(this, [].slice.call(arguments, 1));
			}

			return this[name];
		},

		set: function(/*String*/ name, /*Object*/ value /*, ... */) {
			//	summary:
			//		Set a property on a List instance
			//	name:
			//		The property to set.
			//	value:
			//		The value to set in the property.
			//	returns:
			//		The function returns this List instance.
			//	description:
			//		Sets named properties on a List object.
			//		A programmatic setter may be defined in subclasses.
			//
			//	set() may also be called with a hash of name/value pairs, ex:
			//	|	myObj.set({
			//	|		foo: "Howdy",
			//	|		bar: 3
			//	|	})
			//	This is equivalent to calling set(foo, "Howdy") and set(bar, 3)
			var oldValue = this[name];

			if (typeof name === "object") {
				for (var k in name) {
					if (this.hasOwnProperty(name)) {
						this.set(k, name[k]);
					}
				}
			}
			else {
				var fn = "_set" + name.charAt(0).toUpperCase() + name.slice(1);

				if (typeof this[fn] === "function") {
					this[fn].apply(this, [].slice.call(arguments, 1));
				}
			}

			if(this._watchCallbacks){
				this._watchCallbacks(name, oldValue, value);
			}
			return this;
		}
	});
});