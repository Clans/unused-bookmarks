var bookmarks = [];
var folders = [];

function dumpBookmarks() {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      dumpTreeNodes(bookmarkTreeNodes[0].children);
      var ul = $('<ul>');
      for (var i = 0; i < bookmarks.length; i++) {
        var bookmark = bookmarks[i];
        setTags(bookmark);
        setLastVisitedDate(bookmark, i === bookmarks.length - 1);
      }
      $('#bookmarks').append(ul);
    });
  
  $('#header-last-visited').attr('class', 'up');
  setTitleClickListener();
  setCreatedDateClickListener();
  setLastVisitedClickListener();
}

function dumpTreeNodes(bookmarkNodes) {
  for (var i = 0; i < bookmarkNodes.length; i++) {
    var bookmarkNode = bookmarkNodes[i];
    if (bookmarkNode.children && bookmarkNode.children.length > 0) {
      folders.push({
        id: bookmarkNode.id,
        title: bookmarkNode.title,
        parentId: bookmarkNode.parentId
      });
      dumpTreeNodes(bookmarkNode.children);
    } else {
      bookmarks.push({
        id: bookmarkNode.id,
        title: bookmarkNode.title,
        url: bookmarkNode.url,
        parentId: bookmarkNode.parentId,
        createdDate: bookmarkNode.dateAdded,
        lastVisited: '',
        tags: []
      });
    }
  }
}

function setTags(bookmark) {
  var parentFolder = folders.find(folder => folder.id === bookmark.parentId);
  if (parentFolder) {
    bookmark.tags.unshift(parentFolder.title);
    if (parentFolder.parentId) {
      setTagsByFolder(bookmark, parentFolder);
    }
  }
}

function setTagsByFolder(bookmark, parentFolder) {
  var folder = folders.find(folder => folder.id === parentFolder.parentId);
  if (folder) {
    bookmark.tags.unshift(folder.title);
    if (folder.parentId) {
      setTagsByFolder(bookmark, folder);
    }
  }
}

function setLastVisitedDate(bookmark, showBookmarks) {
  chrome.storage.sync.get(bookmark.url, function(result) {
    if (result[bookmark.url]) {
      bookmark.lastVisited = result[bookmark.url];
    }

    if (showBookmarks) {
      bookmarks.sort(function (b1, b2) {
        if (b1.lastVisited > b2.lastVisited) { return 1; }
        if (b1.lastVisited < b2.lastVisited) { return -1; }
        if (b1.title > b2.title) { return 1; }
        if (b1.title < b2.title) { return -1; }
      });
      outputBookmarks();
    }
  })
}

function getFormattedDateTime(timestamp) {
  var language = window.navigator.userLanguage || window.navigator.language;
  var options = { year: 'numeric', month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit'};
  return new Date(timestamp).toLocaleDateString(language, options);
}

function setLastVisitedClickListener() {
  $('#header-last-visited').click(function(event) {
    $('#header-created-date').attr('class', 'regular');
    $('#header-title-container').attr('class', 'regular');
    doSort(this, 'lastVisited');
  });
}

function setCreatedDateClickListener() {
  $('#header-created-date').click(function(event) {
    $('#header-last-visited').attr('class', 'regular');
    $('#header-title-container').attr('class', 'regular');
    doSort(this, 'createdDate');
  });
}

function setTitleClickListener() {
  $('#header-title-container').click(function(event) {
    $('#header-created-date').attr('class', 'regular');
    $('#header-last-visited').attr('class', 'regular');
    doSort(this, 'title');
  });
}

function doSort(header, param) {
  $(header).each(function () {
    var classes = ['up','down'];
    header.className = classes[($.inArray(header.className, classes) + 1) % classes.length];
  });

  if ($(header).hasClass('up')) {
    bookmarks.sort(function (b1, b2) {
      if (b1[param] > b2[param]) { return 1; }
      if (b1[param] < b2[param]) { return -1; }
      if (b1.title > b2.title) { return 1; }
      if (b1.title < b2.title) { return -1; }
    });
  } else {
    bookmarks.sort((b1, b2) => b1[param] - b2[param]).reverse();
  }
  outputBookmarks();
}

function outputBookmarks() {
  $('#bookmarks').empty();
  var ul = $('<ul>');
  for (var i = 0; i < bookmarks.length; i++) {
    var bookmark = bookmarks[i];
    ul.append(outputBookmark(i + 1, bookmark));
  }
  $('#bookmarks').append(ul);
}

function outputBookmark(number, bookmark) {
  var li = $('<li>');
  li.attr('class', 'item-container');
  
  var titleContainer = $('<div>');
  titleContainer.attr('class', 'title-container');

  var numberDiv = $('<div>');
  numberDiv.attr('class', 'number');
  numberDiv.append(number);

  var titleDiv = $('<div>');
  titleDiv.attr('class', 'bookmark-title');
  titleDiv.append(bookmark.title);
  
  var urlDiv = $('<div>');
  urlDiv.attr('class', 'url');
  urlDiv.append(bookmark.url);

  titleContainer.append(titleDiv);
  titleContainer.append(urlDiv);
  titleContainer.append(appendBookmarkTags(bookmark))

  var createdDiv = $('<div>');
  createdDiv.attr('class', 'created-date');
  createdDiv.append(getFormattedDateTime(bookmark.createdDate));

  var lastVisitedDiv = $('<div>');
  lastVisitedDiv.attr('class', 'created-date');
  lastVisitedDiv.append(bookmark.lastVisited ? getFormattedDateTime(bookmark.lastVisited) : 'N/A');

  var deleteBookmarkDiv = $('<div>');
  deleteBookmarkDiv.attr('class', 'delete-icon material-icons');
  var a = $('<a>');
  a.attr('href', 'javascript:void(0)');
  a.click(function () {
    deleteConfirmation(bookmark);
  });
  a.append('delete_forever');
  deleteBookmarkDiv.append(a);

  li.append(numberDiv);
  li.append(titleContainer);
  li.append(createdDiv);
  li.append(lastVisitedDiv);
  li.append(deleteBookmarkDiv);
  return li;
}

function appendBookmarkTags(bookmark) {
  var tags = bookmark.tags;
  var div = $('<div>');
  div.attr('class', 'bookmark-tags');
  div.append(tags[0]);
  for (var i = 1; i < tags.length; i++) {
    div.append(' > ');
    div.append(tags[i]);
  }
  return div;
}

function sortByLastVisited() {
  bookmarks.sort((b1, b2) => b1.lastVisited - b2.lastVisited);
  processBookmarks();
}

  function deleteConfirmation(bookmark) {
    if (confirm("Are you sure you want to delete this bookmark?\n\n" + bookmark.title)) {
      chrome.bookmarks.remove(bookmark.id, function () {
        removeFromBookmarks(bookmark);
        outputBookmarks();
      });
    }
  }

  function removeFromBookmarks(element) {
    const index = bookmarks.indexOf(element);

    if (index !== -1) {
      bookmarks.splice(index, 1);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    dumpBookmarks();
  });