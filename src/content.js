// Content script: injects chatbot and handles AI logic

// Utility: Check if on a LeetCode problem page
function isLeetCodeProblemPage() {
  return /^https:\/\/leetcode\.com\/problems\//.test(window.location.href);
}

// Utility: Extract problem title and description from DOM
function getLeetCodeProblemData() {
  // Try multiple selectors for the title (robust fallback)
  let title = '';
  const selectors = [
    'div[data-cy="question-title"]',
    '.mr-2.text-label-1',
    'h1',
    '.text-body.text-sd-foreground.max-w-full.font-medium .ellipsis.line-clamp-1'
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) {
      title = el.innerText.trim();
      break;
    }
  }
  // Use the new description selector you provided
  let description = '';
  const descBlock = document.querySelector('div.elfjS[data-track-load="description_content"]');
  if (descBlock) description = descBlock.innerText;
  // Debug: log what is being sent to Gemini
  console.log('LeetCode AI extracted:', { title, description });
  return { title, description };
}

// Stages for problem-solving
const STAGES = [
  { key: 'brute', label: 'Brute Force' },
  { key: 'better', label: 'Better Approach' },
  { key: 'optimal', label: 'Optimal Approach' }
];
let currentStageIdx = 0;

function injectChatbotButton() {
  if (document.getElementById('leetcode-ai-chatbot-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'leetcode-ai-chatbot-btn';
  btn.innerText = '💬 AI Mentor';
  btn.style.position = 'fixed';
  btn.style.right = '32px';
  btn.style.bottom = '32px';
  btn.style.zIndex = 9999;
  btn.style.background = '#f7b500';
  btn.style.color = '#222';
  btn.style.border = 'none';
  btn.style.borderRadius = '50px';
  btn.style.padding = '14px 22px';
  btn.style.fontSize = '18px';
  btn.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'background 0.2s';
  btn.onmouseenter = () => btn.style.background = '#ffd84d';
  btn.onmouseleave = () => btn.style.background = '#f7b500';
  btn.onclick = () => {
    if (!document.getElementById('leetcode-ai-chatbot')) {
      injectChatbotUI();
    } else {
      document.getElementById('leetcode-ai-chatbot').style.display = 'block';
    }
    btn.style.display = 'none';
  };
  document.body.appendChild(btn);
}

function injectChatbotUI() {
  if (document.getElementById('leetcode-ai-chatbot')) return;
  const chatbot = document.createElement('div');
  chatbot.id = 'leetcode-ai-chatbot';
  chatbot.innerHTML = `
    <style>
      #leetcode-ai-chatbot {
        position: fixed;
        right: 32px;
        bottom: 32px;
        width: 370px;
        height: 600px;
        max-height: 600px;
        background: #fff;
        border: 1.5px solid #f7b500;
        border-radius: 18px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        display: flex;
        flex-direction: column;
        z-index: 10000;
        overflow: hidden;
        animation: fadeIn .25s;
      }
      #leetcode-ai-chatbot-header {
        background: #181a20;
        color: #f7b500;
        font-size: 20px;
        font-weight: bold;
        padding: 14px 18px 10px 18px;
        border-bottom: 1.5px solid #f7b500;
        border-radius: 18px 18px 0 0;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #leetcode-ai-chatbot-stages {
        display: flex;
        gap: 10px;
        padding: 12px 18px 0 18px !important;
        margin-bottom: 2px;
      }
      #leetcode-ai-chatbot-stages span {
        background: #f7b500;
        color: #23272f;
        border-radius: 16px;
        padding: 4px 14px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        transition: background 0.2s, color 0.2s;
        cursor: default;
      }
      #leetcode-ai-chatbot-stages span[style*='font-weight:bold'] {
        background: #23272f;
        color: #f7b500;
        border: 1.5px solid #f7b500;
      }
      #leetcode-ai-chatbot-messages {
        flex: 1 1 0%;
        min-height: 0;
        max-height: 100%;
        padding: 18px 18px 8px 18px;
        overflow-y: auto;
        background: #f9f9fa;
        border-bottom: 1px solid #eee;
      }
      .chatbot-msg {
        margin-bottom: 10px;
        padding: 12px 16px;
        border-radius: 12px;
        max-width: 85%;
        word-break: break-word;
        font-size: 15px;
        line-height: 1.6;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      }
      .chatbot-msg-ai {
        background: #fffbe6;
        color: #23272f;
        align-self: flex-start;
      }
      .chatbot-msg-user {
        background: #23272f;
        color: #f7b500;
        align-self: flex-end;
        margin-left: auto;
      }
      #leetcode-ai-chatbot-input {
        display: flex;
        gap: 8px;
        padding: 14px 18px 14px 18px;
        background: #f9f9fa;
        border-radius: 0 0 18px 18px;
        border-top: 1px solid #eee;
      }
      #leetcode-ai-chatbot-input input {
        flex: 1;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1.5px solid #e0e0e0;
        font-size: 15px;
        outline: none;
        background: #fff;
        transition: border 0.2s;
      }
      #leetcode-ai-chatbot-input input:focus {
        border: 1.5px solid #f7b500;
      }
      #leetcode-ai-chatbot-input button {
        background: #f7b500;
        color: #23272f;
        border: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 18px;
        cursor: pointer;
        transition: background 0.2s;
      }
      #leetcode-ai-chatbot-input button:hover {
        background: #ffd84d;
      }
      #leetcode-ai-evaluate-btn {
        margin: 10px 18px 14px 18px !important;
        padding: 10px 0;
        background: linear-gradient(90deg,#f7b500 60%,#ffd84d 100%);
        color: #23272f;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        cursor: pointer;
        width: calc(100% - 36px);
        transition: background 0.2s;
      }
      #leetcode-ai-evaluate-btn:hover {
        background: linear-gradient(90deg,#ffd84d 60%,#f7b500 100%);
      }
      .chatbot-msg code {
        background: #f4f4f4;
        color: #c7254e;
        padding: 2px 5px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 14px;
      }
      .chatbot-msg strong { font-weight: bold; }
      .chatbot-msg em { font-style: italic; }
      .chatbot-msg ul { margin: 8px 0 8px 18px; padding: 0; }
      .chatbot-msg li { margin-bottom: 4px; }
    </style>
    <div id="leetcode-ai-chatbot-header">
      <span>LeetMentor AI</span>
      <span id="leetcode-ai-close" style="float:right;cursor:pointer;font-size:22px;">×</span>
    </div>
    <div id="leetcode-ai-chatbot-stages"></div>
    <div id="leetcode-ai-chatbot-messages"></div>
    <form id="leetcode-ai-chatbot-input">
      <input type="text" placeholder="Ask for a hint..." autocomplete="off" />
      <button type="submit">Send</button>
    </form>
    <button id="leetcode-ai-evaluate-btn">Evaluate & Visualize Approach</button>
  `;
  document.body.appendChild(chatbot);

  // Style for popup effect
  chatbot.style.position = 'fixed';
  chatbot.style.right = '32px';
  chatbot.style.bottom = '32px';
  chatbot.style.width = '370px';
  chatbot.style.maxHeight = '600px';
  chatbot.style.background = '#fff';
  chatbot.style.border = '1.5px solid #f7b500';
  chatbot.style.borderRadius = '18px';
  chatbot.style.boxShadow = '0 8px 32px rgba(0,0,0,0.22)';
  chatbot.style.display = 'flex';
  chatbot.style.flexDirection = 'column';
  chatbot.style.zIndex = 10000;
  chatbot.style.overflow = 'hidden';
  chatbot.style.animation = 'fadeIn .25s';

  // Make popup draggable
  let isDragging = false, offsetX = 0, offsetY = 0;
  const header = chatbot.querySelector('#leetcode-ai-chatbot-header');
  header.style.cursor = 'move';
  header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - chatbot.getBoundingClientRect().left;
    offsetY = e.clientY - chatbot.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      chatbot.style.left = (e.clientX - offsetX) + 'px';
      chatbot.style.top = (e.clientY - offsetY) + 'px';
      chatbot.style.right = 'auto';
      chatbot.style.bottom = 'auto';
    }
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = '';
  });

  // Close button
  chatbot.querySelector('#leetcode-ai-close').onclick = () => {
    chatbot.style.display = 'none';
    userCodeByStage = {};
    const btn = document.getElementById('leetcode-ai-chatbot-btn');
    if (btn) btn.style.display = 'block';
  };

  // Stage UI
  const stagesDiv = chatbot.querySelector('#leetcode-ai-chatbot-stages');
  const messagesDiv = chatbot.querySelector('#leetcode-ai-chatbot-messages');
  let localStages = [{ key: 'brute', label: 'Brute Force' }];
  let localStageIdx = 0;
  let userCodeByStage = {}; // Store code for each approach
  // Dynamically get stages from Gemini
  (async () => {
    const settings = await getSettings();
    const problem = getLeetCodeProblemData();
    let stagesRaw = await getRelevantStages(settings.apiKey, problem);
    // Always order as Brute Force, Better Approach, Optimal Approach if present
    const order = ['brute', 'better', 'optimal'];
    localStages = order
      .map(key => stagesRaw.find(s => s.key === key))
      .filter(Boolean);
    localStageIdx = 0;
    function renderStages() {
      stagesDiv.innerHTML = localStages.map((s, i) =>
        `<span style=\"margin-right:8px;${i===localStageIdx?'font-weight:bold;text-decoration:underline;':''}\">${s.label}</span>`
      ).join('');
      stagesDiv.style.padding = '8px 10px 0 10px';
      stagesDiv.style.fontSize = '14px';
    }
    renderStages();
    // Initial greeting
    addMessage(`Let's start with the ${localStages[localStageIdx].label} approach. Ask for a hint or guidance at any time.`);
  })();

  function addMessage(text, from = 'ai') {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg chatbot-msg-${from}`;
    if (from === 'ai') {
      msg.innerHTML = markdownToHtml(text);
    } else {
      msg.innerText = text;
    }
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Minimal Markdown to HTML parser for bold, italics, lists, code, and links
  function markdownToHtml(md) {
    let html = md
      .replace(/\n/g, '<br>')
      // Bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italics: *text* (not part of **bold**), only if surrounded by whitespace, start/end, or punctuation
      .replace(/(^|[\s.,;:!?\-])\*([^*]+)\*(?=[\s.,;:!?\-]|$)/g, '$1<em>$2</em>')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links: [text](url)
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Lists (unordered)
    html = html.replace(/(?:^|<br>)[ \t]*\* (.+?)(?=<br>|$)/g, '<li>$1</li>');
    // Wrap <li> in <ul> if any <li> present
    if (/<li>/.test(html)) html = '<ul style="margin:8px 0 8px 18px;padding:0;">' + html + '</ul>';
    return html;
  }

  // Handle user input (always use localStages/localStageIdx)
  chatbot.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = chatbot.querySelector('input');
    const userMsg = input.value.trim();
    if (!userMsg) return;
    addMessage(userMsg, 'user');
    input.value = '';
    addMessage('Thinking...', 'ai');
    const settings = await getSettings();
    if (!settings.apiKey) {
      messagesDiv.lastChild.innerText = 'Please set your Gemini API key in the extension settings.';
      return;
    }
    const problem = getLeetCodeProblemData();
    // Add all previous code for context
    let codeContext = '';
    for (const s of localStages) {
      if (userCodeByStage[s.key]) {
        codeContext += `\n\nUser's code for ${s.label}:\n${userCodeByStage[s.key]}`;
      }
    }
    const prompt = buildPrompt(problem, userMsg, settings.guidanceLevel, localStages[localStageIdx].label) + codeContext;
    // After Gemini response, always use addMessage to render markdown
    const aiResponse = await getGeminiResponse(settings.apiKey, prompt);
    // Remove the 'Thinking...' message
    messagesDiv.removeChild(messagesDiv.lastChild);
    addMessage(aiResponse, 'ai');
  });

  // Evaluate & Visualize button: open side panel for code input
  chatbot.querySelector('#leetcode-ai-evaluate-btn').addEventListener('click', async () => {
    // Create side panel if not exists
    let sidePanel = document.getElementById('leetcode-ai-sidepanel');
    if (!sidePanel) {
      sidePanel = document.createElement('div');
      sidePanel.id = 'leetcode-ai-sidepanel';
      sidePanel.style.position = 'fixed';
      sidePanel.style.top = '0';
      sidePanel.style.right = '0';
      sidePanel.style.width = '500px';
      sidePanel.style.height = '100vh';
      sidePanel.style.background = '#23272f';
      sidePanel.style.borderLeft = '2px solid #f7b500';
      sidePanel.style.zIndex = 10001;
      sidePanel.style.boxShadow = '-4px 0 32px rgba(0,0,0,0.22)';
      sidePanel.innerHTML = `
        <div style="padding:18px 24px 10px 24px;display:flex;justify-content:space-between;align-items:center;background:#181a20;border-bottom:1px solid #333;">
          <span style="font-size:19px;font-weight:bold;color:#f7b500;letter-spacing:0.5px;">Code Evaluation (${localStages[localStageIdx].label})</span>
          <span id="leetcode-ai-sidepanel-close" style="cursor:pointer;font-size:24px;color:#fff;">×</span>
        </div>
        <div style="padding:22px 24px 0 24px;">
          <label style='color:#fff;font-size:15px;font-weight:500;margin-bottom:8px;display:block;'>Paste your code below:</label>
          <textarea id="leetcode-ai-code-input" style="width:100%;height:200px;font-family:monospace;font-size:15px;padding:14px 12px;background:#181a20;color:#f7f7f7;border-radius:10px;border:1.5px solid #444;resize:vertical;box-shadow:0 2px 8px rgba(0,0,0,0.10);margin-bottom:10px;outline:none;transition:border 0.2s;" placeholder="Paste your code here..."></textarea>
          <button id="leetcode-ai-code-submit" style="margin-top:10px;padding:10px 22px;background:#f7b500;color:#23272f;border:none;border-radius:7px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.10);transition:background 0.2s;">Submit Code</button>
          <div id="leetcode-ai-code-feedback" style="margin-top:22px;padding:16px 14px;background:#181a20;border-radius:8px;border:1.5px solid #333;min-height:48px;color:#f7b500;font-size:15px;box-shadow:0 2px 8px rgba(0,0,0,0.10);"></div>
        </div>
      `;
      document.body.appendChild(sidePanel);
      document.getElementById('leetcode-ai-sidepanel-close').onclick = () => sidePanel.remove();
      document.getElementById('leetcode-ai-code-submit').onclick = async () => {
        const code = document.getElementById('leetcode-ai-code-input').value.trim();
        if (!code) {
          document.getElementById('leetcode-ai-code-feedback').innerText = 'Please enter your code.';
          return;
        }
        document.getElementById('leetcode-ai-code-feedback').innerText = 'Evaluating your code...';
        const settings = await getSettings();
        const problem = getLeetCodeProblemData();
        // Save code for this stage
        userCodeByStage[localStages[localStageIdx].key] = code;
        // Add all previous code for context
        let codeContext = '';
        for (const s of localStages) {
          if (userCodeByStage[s.key]) {
            codeContext += `\n\nUser's code for ${s.label}:\n${userCodeByStage[s.key]}`;
          }
        }
        const prompt = `You are a LeetCode coding mentor. The user has submitted the following code for the ${localStages[localStageIdx].label} approach. Please review the code, provide constructive feedback, and if the code is correct and satisfies the approach, say so clearly. If it is correct, also say: NEXT_STAGE_READY.\n\nTitle: ${problem.title}\nDescription: ${problem.description}${codeContext}\n\nUser Code for ${localStages[localStageIdx].label}:\n${code}`;
        const aiResponse = await getGeminiResponse(settings.apiKey, prompt);
        document.getElementById('leetcode-ai-code-feedback').innerText = aiResponse;
        // If AI says NEXT_STAGE_READY, mark this stage as done and move to next
        if (/NEXT_STAGE_READY/i.test(aiResponse) && localStageIdx < localStages.length - 1) {
          localStageIdx++;
          // Update stages UI and chatbot
          stagesDiv.innerHTML = localStages.map((s, i) =>
            `<span style=\"margin-right:8px;${i===localStageIdx?'font-weight:bold;text-decoration:underline;':''}\">${s.label}</span>`
          ).join('');
          addMessage(`Great! Now let's discuss the ${localStages[localStageIdx].label} approach. Ask for a hint or guidance.`);
          sidePanel.remove();
        } else if (/NEXT_STAGE_READY/i.test(aiResponse)) {
          addMessage('You have completed all approaches! Now, try to write your code on LeetCode. Good luck!');
          sidePanel.remove();
        }
      };
    } else {
      sidePanel.style.display = 'block';
    }
  });

  // Replace deprecated DOMNodeInserted with MutationObserver
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.className.includes('chatbot-msg-user')) {
          const txt = node.innerText.toLowerCase();
          if ((txt.includes('done') || txt.includes('next')) && currentStageIdx < STAGES.length - 1) {
            currentStageIdx++;
            renderStages();
            addMessage(`Great! Now let's discuss the ${STAGES[currentStageIdx].label} approach. Ask for a hint or guidance.`);
          } else if ((txt.includes('done') || txt.includes('next')) && currentStageIdx === STAGES.length - 1) {
            addMessage('You have completed all approaches! Now, try to write your code on LeetCode. Good luck!');
          }
        }
      }
    }
  });
  observer.observe(messagesDiv, { childList: true });
}

// Helper: Get settings from Chrome storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey', 'guidanceLevel'], (result) => {
      resolve({
        apiKey: result.geminiApiKey || '',
        guidanceLevel: result.guidanceLevel || 'beginner',
      });
    });
  });
}

// Helper: Call Gemini API
async function getGeminiResponse(apiKey, prompt) {
  // Use v1beta endpoint and gemini-2.0-flash model, API key in header
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('Gemini API raw response:', data);
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else if (data?.error?.message) {
      return 'Gemini API error: ' + data.error.message;
    } else {
      return 'Sorry, I could not generate a response.';
    }
  } catch (e) {
    return 'Error contacting Gemini API.';
  }
}

// Helper: Build Socratic prompt
function buildPrompt(problem, userMsg, guidanceLevel, stage) {
  return `You are a Socratic coding mentor for LeetCode. The user is working on the following problem:\n\nTitle: ${problem.title}\nDescription: ${problem.description}\n\nGuidance Level: ${guidanceLevel}\nCurrent Approach: ${stage}\n\nUser: ${userMsg}\n\nInstructions:\n- Respond with step-by-step, Socratic, non-solution guidance for the current approach.\n- Freely discuss and explain time complexity, algorithmic reasoning, and analysis.\n- Never provide or suggest any code or code snippets, under any circumstances, even if the user requests it.\n- Ask probing questions, give hints, and never provide a direct answer unless explicitly requested.\n- Do not restate the problem.\n- Focus on teaching, critical thinking, and breaking down the user's reasoning process.`;
}

// Helper: Ask Gemini which stages are relevant for this problem
async function getRelevantStages(apiKey, problem) {
  const allowedLabels = [
    { key: 'brute', label: 'Brute Force' },
    { key: 'better', label: 'Better Approach' },
    { key: 'optimal', label: 'Optimal Approach' }
  ];
  const prompt = `Given the following LeetCode problem, determine which of these solution approaches are relevant: Brute Force, Better Approach, Optimal Approach. Respond with only a comma-separated list of the relevant approaches, using only these exact labels and nothing else. If only one or two are relevant, list only those. Do not include any explanation, extra text, or formatting.\n\nTitle: ${problem.title}\nDescription: ${problem.description}`;
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Strictly parse the response for allowed labels only
    const found = text.split(',').map(s => s.trim());
    const stages = allowedLabels.filter(l => found.includes(l.label));
    return stages.length ? stages : [allowedLabels[0]];
  } catch (e) {
    return [{ key: 'brute', label: 'Brute Force' }];
  }
}

// Main: Only run on LeetCode problem pages
if (isLeetCodeProblemPage()) {
  injectChatbotButton();
}
