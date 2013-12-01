define([
	'dojo/_base/declare',
	'dojo/_base/lang',
	'dijit/_WidgetBase',
	'dojo/request/notify',
	'dojo/dom-construct',
	'dojo/json',
	'dojo/date/locale'
], function(declare, lang, _WidgetBase, notify, domConstruct, json, locale) {

	var autoId = 0;

	return declare([_WidgetBase], {

		baseClass: 'rfeConsole',

		logOwnMessagesOnly: true,

		constructor: function(/* Object */args, /* DOMNode */ node) {
			this.domNode = node;
			notify('done', lang.hitch(this, this.log));
		},

		buildRendering: function() {
			this.inherited('buildRendering', arguments);

			// create the DOM for this widget
			var div, menu, id = 'rfeButtReset_' + (autoId++);
			menu = domConstruct.create('menu', {
				'class': 'dijitToolbar',
				type: 'toolbar'
			}, this.domNode);

			domConstruct.create('button', {
				id: id,
				'class': 'buttIcon',
				title: 'clear log',	// TODO: use i18n
				onclick: lang.hitch(this, function(evt) {
					evt.preventDefault();
					this.clear();
					return false;
				}),
				innerHTML: '<img src="' + require.toUrl('rfe') + '/resources/images/icon_reset.png' + '" alt="reset icon" title="reset">'
			}, menu);

			div = domConstruct.create('div', {
				'class': this.baseClass + ' containerNode'
			}, this.domNode);

			this.containerNode = domConstruct.create('ul', null, div);

		},


		/**
		 * Write own message or io error message to log container.
		 * @param {String} response message
		 * @param {Boolean} [isErr] is message an error message
		 */
		log: function(response, isErr) {
			var msg, responseObj;

			isErr = isErr || false;

			if (typeof response === 'string') {
				// direct log message
				this.print(response);
				return;
			}

			// request has failed
			if (response instanceof Error) {
				responseObj = response.response;
				isErr = true;
			}
			// request has succeeded
			else {
				responseObj = response;
			}

			msg = responseObj.xhr.statusText + ': ' + responseObj.options.method + ' ' + decodeURI(responseObj.url);
			msg += this.extractMsg(responseObj.text);

			this.print(msg, isErr, responseObj.options.method);
		},

		/**
		 * Extract own messages from response body.
		 * @param {String} response as json
		 * @return {String}
		 */
		extractMsg: function(response) {
			var i, len, msg = '', result;

			try {
				result = json.parse(response);
			}
			catch(err) {
				msg += '<br>' + err.message || err;
			}

			if (result instanceof Array) {
				len = result.length;
				for (i = 0; i < len; i++) {
					if (result[i].msg) {
						msg += '<br>' + result[i].msg;
					}
				}
			}
			return msg;
		},

		/**
		 * Print message to HTMLDivElement.
		 * If isErr is set to true, message is printed in red.
		 * If request method is not GET and not an error, message is printed in green.
		 * @param {String} msg message to print
		 * @param {Boolean} isErr is message an error?
		 * @param {String} reqMethod request method
		 */
		print: function(msg, isErr, reqMethod) {
			var date, cl = 'logMsg';

			date = locale.format(new Date(), {
				selector: 'time',
				timePattern: 'HH:mm:ss'
			});
			if (isErr) {
				cl += ' logErrMsg';
			}
			else if (reqMethod !== 'GET') {
				cl += ' logSuccessMsg';			}

			domConstruct.create('li', {
				'class': cl,
				innerHTML: date + ' ' + msg + '<br/>'
			}, this.containerNode, 'first');
		},

		/**
		 * Clear all logged messages.
		 */
		clear: function() {
			this.containerNode.innerHTML = '';
		}

	});
});