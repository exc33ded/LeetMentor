// Handles popup actions

document.getElementById('open-options')?.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('public/options.html'));
  }
});
