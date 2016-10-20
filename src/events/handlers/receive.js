/**
* (C) Copyright IBM Corp. 2016. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

var state = require('../../state');
var events = require('../../events');
var utils = require('../../utils');
var assign = require('lodash/assign');
var templates = require('../../templates');

function _actions(debug, data) {
	if (data.message && data.message.action && data.message.action.name) {
		var action = 'action:' + data.message.action.name;
		if (events.hasSubscription(action)) {
			events.publish(action, data, events.completeEvent);
			if (debug)
				console.log('Call to ' + action);
		} else if (debug) {
			console.warn('Nothing is subscribed to ' + action);
		}
	}
	setTimeout(function() {
		events.publish('disable-loading');
		events.publish('scroll-to-bottom');
		events.publish('focus-input');
	}, 20);
}

function _layouts(debug, data, container) {
	if (data.message && data.message.layout && data.message.layout.name) {
		var layout = 'layout:' + data.message.layout.name;
		var el = document.createElement('div');
		el.classList.add('IBMChat-watson-layout');
		container.appendChild(el);
		data.element = container;
		data.layoutElement = data.element.querySelector('.IBMChat-watson-layout');
		data.msgElement = data.element.querySelector('.IBMChat-watson-message');
		if (events.hasSubscription(layout)) {
			setTimeout(function() {
				events.publish(layout, data);
				if (debug)
					console.log('Call to ' + layout);
			}, 10);
		} else if (debug) {
			console.warn('Nothing is subscribed to ' + layout);
		}
	}
}

function receive(data) {
	var checkData = (typeof data === 'string') ? { message: { text: data } } : data;
	var current = state.getState();
	data = assign({}, checkData, { uuid: utils.getUUID() });
	state.setState({
		messages: [].concat(current.messages || [], data),
		hasError: false
	});
	var msg = (data.message && data.message.text) ? ((Array.isArray(data.message.text)) ? data.message.text : [data.message.text]) : [''];
	if (msg.length === 0)
		msg = [''];
	for (var i = 0; i < msg.length; i++) {
		var holder = document.createElement('div');
		var container;
		holder.classList.add(data.uuid);
		holder.innerHTML = templates.receive;
		container = holder.querySelector('.IBMChat-watson-message-container');
		if (msg[i] || (data.message && data.message.layout && data.message.layout.name && i === (msg.length - 1))) {
			var item = document.createElement('div');
			item.classList.add('IBMChat-watson-message');
			item.classList.add('IBMChat-watson-message-theme');
			container.appendChild(item);
			utils.writeMessage(item, msg[i]);
			current.chatHolder.appendChild(holder);
		}
		if (i === (msg.length - 1))
			_actions(current.DEBUG, data);
		if (data.message.layout && (data.message.layout.index !== undefined && data.message.layout.index == i) || (data.message.layout.index === undefined && i == (msg.length - 1)))
			_layouts(current.DEBUG, data, container);
	}
}

module.exports = receive;