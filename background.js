// domainMap is like this:
// domainMap = (['www.bilibili.com': map([name1, hotkeyInfo1], [name2, hotkeyInfo2], ...)],
//              ['tieba.baidu.com': map([name5, hotkeyInfo5], [name6, hotkeyInfo6], ...)], ...)
let domainMap = new Map();

chrome.storage.sync.get(null, function(result) {
  console.log('get all hotkey info :');
  console.log(result);
  // we ues for...in cz we need key to filter the selectedObject
  for (let key in result) {
    if (key == 'selectedObject'){
      continue;
    }
    let hotkeyInfo = result[key];
    if (domainMap.has(hotkeyInfo.domain)) {
      let sameOriginMap = domainMap.get(hotkeyInfo.domain);
      sameOriginMap.set(hotkeyInfo.name, hotkeyInfo);
      domainMap.set(hotkeyInfo.domain, sameOriginMap);
    } else {
      console.log("create new domain key");
      let map = new Map();
      map.set(hotkeyInfo.name, hotkeyInfo);
      domainMap.set(hotkeyInfo.domain, map);  // save as map
    }
  }
  console.log(domainMap);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log("onUpdated tab.url : " + tab.url);
  for (let domain of domainMap.keys()) {
    if (tab.url.includes(domain)) {
      console.log(domainMap.get(domain));
      let map = domainMap.get(domain);
      // send the corresponding hotkeyInfo map to this tab
      chrome.tabs.sendMessage(
        tabId, {action: 'prepare to listen', objects:Object.fromEntries(map)});
      console.log("send hotkey");
      break;
    }
  }
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  for (let key in changes) {
    if (key == 'selectedObject'){
      console.log("ignore the temporary change");
      continue;
    }

    let storageChange = changes[key];

    if (storageChange.oldValue === undefined) {
      console.log("add new hotkey");
      let change = storageChange.newValue;
      if (domainMap.has(change.domain)) {
        let sameOriginMap = domainMap.get(change.domain);
        sameOriginMap.set(change.name, change);
        domainMap.set(change.domain, sameOriginMap);
      } else {
        console.log("create new domain key");
        let map = new Map();
        map.set(change.name, change);
        domainMap.set(change.domain, map);  // save as map
      }
    } else if (storageChange.newValue === undefined) {
      console.log("remove hotkey");
      let change = storageChange.oldValue;
      let sameOriginMap = domainMap.get(change.domain);
      sameOriginMap.delete(change.name);
      domainMap.set(change.domain, sameOriginMap);
    } else {
      console.log("modify hotkey");
      let change = storageChange.newValue;
      let sameOriginMap = domainMap.get(change.domain);
      sameOriginMap.set(change.name, change);
      domainMap.set(change.domain, sameOriginMap);
    }
    console.log(domainMap);
  }
  //setRules();
});

chrome.runtime.onInstalled.addListener(function () {

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      //  conditions: [new chrome.declarativeContent.PageStateMatcher({
      //    pageUrl: { hostEquals: 'tieba.baidu.com' }
      //  })],
      conditions: getConditions(),
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

  //let contexts = ["all", "page", "frame", "selection", "link", "editable",
  //  "image", "video", "audio", "launcher", "browser_action", "page_action"];
  // todo: maybe support other type later
  //let contexts = ["link", "image"];
  //for (let i = 0; i < contexts.length; i++) {
  //  let context = contexts[i];
  let title = "Add hot key for this element";
  let id = chrome.contextMenus.create({
    "id": 'all',
    "title": title,
    "contexts": ['all']
  });
  //  console.log("'" + context + "' item:" + id);
  //}
});

// Note: The simplest possible rule consists of one or more conditions and one
//       or more actions, if any of the conditions is fulfilled, all actions
//       are executed. Each condition is sufficient to trigger all specified
//       actions.
function getConditions() {
  // todo: get conditions from permanent data structure
  let conditions = [new chrome.declarativeContent.PageStateMatcher({
    pageUrl: { hostEquals: 'tieba.baidu.com' }
  }),new chrome.declarativeContent.PageStateMatcher({
    pageUrl: { hostEquals: 't.bilibili.com' }
  }), new chrome.declarativeContent.PageStateMatcher({
    pageUrl: { hostEquals: 'www.bilibili.com' }
  })];
  return conditions;
}

// todo: update conditions when add hotkeys for new website, try
//       chrome.runtime.onMessage.addListener(function(){
//         chrome.declarativeContent.onPageChanged.addRules(rules);
//       });

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  console.log("info " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));

  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }

  //setTimeout(() => {
  //  chrome.runtime.sendMessage({'tabId': tab.id});
  //  console.log("send current selected object tab.id : " + tab.id);
  //}, 200);
});