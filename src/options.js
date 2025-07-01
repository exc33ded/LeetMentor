// Handles saving/loading settings for Gemini API key and guidance level

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const guidanceRadios = document.querySelectorAll('input[name="guidance-level"]');
  const guidanceDesc = document.getElementById('guidance-desc');
  const saveBtn = document.getElementById('save');
  const saveStatus = document.getElementById('save-status');

  const descMap = {
    beginner: 'Detailed, step-by-step hints and simple questions. Best for learning new concepts.',
    intermediate: 'Moderate guidance with helpful hints and nudges. For some experience.',
    advanced: 'Minimal guidance, high-level questions only. For independent problem-solving.'
  };

  // Load existing settings
  chrome.storage.sync.get(['geminiApiKey', 'guidanceLevel'], (result) => {
    apiKeyInput.value = result.geminiApiKey || '';
    const level = result.guidanceLevel || 'beginner';
    (document.querySelector(`input[name='guidance-level'][value='${level}']`) || guidanceRadios[0]).checked = true;
    guidanceDesc.textContent = descMap[level];
  });

  // Show/hide API key
  toggleApiKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '🙈';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '👁️';
    }
  });

  // Update guidance description on change
  guidanceRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      guidanceDesc.textContent = descMap[radio.value];
    });
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const selectedLevel = (document.querySelector('input[name="guidance-level"]:checked') || {}).value || 'beginner';
    chrome.storage.sync.set({
      geminiApiKey: apiKeyInput.value,
      guidanceLevel: selectedLevel
    }, () => {
      saveStatus.textContent = 'Saved!';
      setTimeout(() => saveStatus.textContent = '', 1500);
    });
  });
});
