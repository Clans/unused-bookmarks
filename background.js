'use strict';

chrome.browserAction.onClicked.addListener(function(activeTab) {
	chrome.tabs.create({'url': chrome.extension.getURL('popup.html')});
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
	chrome.bookmarks.search(details.url, function(bookmarkNodes) {
		for (var i = 0; i < bookmarkNodes.length; i++) {
			var bookmarkNode = bookmarkNodes.find(bookmark => bookmark.url === details.url);
			if (bookmarkNode) {
				var options = {};
				options[bookmarkNode.url] = + new Date();
				chrome.storage.sync.set(options);
			}
		}
	})
});