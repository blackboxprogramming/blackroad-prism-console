// MV3 service worker (Chrome)
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({
      id: 'ask-blackroad',
      title: 'Ask BlackRoad about selection…',
      contexts: ['selection'],
    });
  } catch (e) {}
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ask-blackroad' && info.selectionText) {
    await chrome.storage.local.set({ pendingQuestion: info.selectionText });
    // Chrome can't open the popup programmatically; open the page instead.
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }
});

// (Optional) defensive block
chrome.declarativeNetRequest.updateDynamicRules({
  addRules: [
    {
      id: 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '||openai.com',
        resourceTypes: ['main_frame', 'xmlhttprequest'],
      },
    },
  ],
  removeRuleIds: [1],
});
