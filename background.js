chrome.runtime.onInstalled.addListener(function () {

  // todo: add more domains to match the conditions
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'tieba.baidu.com' },
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });

  //let contexts = ["all", "page", "frame", "selection", "link", "editable",
  //  "image", "video", "audio", "launcher", "browser_action", "page_action"];
  // todo: maybe support other type later
  let contexts = ["link", "image"];
  for (let i = 0; i < contexts.length; i++) {
    let context = contexts[i];
    let title = "Add hot key for this " + context;
    let id = chrome.contextMenus.create({
      "id": context,
      "title": title,
      "contexts":[context]
    });
    console.log("'" + context + "' item:" + id);
  }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  console.log("info " + info.menuItemId + " was clicked");
  console.log("info: " + JSON.stringify(info));
  console.log("tab: " + JSON.stringify(tab));
  // todo: display popup and prepared to set hotkey
});