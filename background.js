// domainMap is like this:
// domainMap = (['www.bilibili.com': [hotkeyInfo1, hotkeyInfo2, ...]],
//              ['tieba.baidu.com': [hotkeyInfo5, hotkeyInfo6, ...]], ...)
let domainMap = new Map();

chrome.storage.sync.get(null, function(result) {
  console.log('get all hotkey info :');
  console.log(result);
  //for (let key in result) {
  //  console.log("key = " + key + " value = " + JSON.stringify(result[key]));
  //}
  for (let hotkeyInfo of Object.values(result)) {
    //console.log(hotkeyInfo);
    if (domainMap.has(hotkeyInfo.domain)) {
      let sameOriginArray = domainMap.get(hotkeyInfo.domain);
      sameOriginArray.push(hotkeyInfo);
      domainMap.set(hotkeyInfo.domain, sameOriginArray);
    } else {
      console.log("create new domain key");
      domainMap.set(hotkeyInfo.domain, [hotkeyInfo,]);  // save as array
    }
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log("onUpdated tab.url : " + tab.url);
  for (let domain of domainMap.keys()) {
    if (tab.url.includes(domain)) {
      console.log(domainMap.get(domain));
      // send the corresponding hotkeyInfo array to this tab
      chrome.tabs.sendMessage(
        tabId, {action: 'prepare to listen', objects:domainMap.get(domain)});
      console.log("send hotkey");
    }
  }
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