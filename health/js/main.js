// --- State Management ---
let userProfile = JSON.parse(localStorage.getItem('user_profile')) || null;
const logs = JSON.parse(localStorage.getItem('daily_logs')) || [];

// --- Config ---
// Auto-set the key if missing, so user doesn't have to type it.
if (!localStorage.getItem('gemini_api_key')) {
    window.geminiService.setApiKey('AIzaSyCaaL20tcvUtasUE8J-9Y3JzxCjykAqweM');
}

// --- Initialization ---
window.onload = () => {
    updateUI();

    // Show onboarding if no profile exists
    if (!userProfile) {
        document.getElementById('onboarding-modal').style.display = 'flex';
    }
};

// --- Onboarding Logic ---
document.getElementById('onboarding-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const height = document.getElementById('input-height').value;
    const weight = document.getElementById('input-weight').value;
    const activity = document.getElementById('input-activity-level').value;
    const time = document.getElementById('input-time').value;

    userProfile = {
        height,
        startWeight: weight,
        currentWeight: weight,
        activityLevel: activity,
        timeCommitment: time,
        startDate: new Date().toISOString()
    };

    localStorage.setItem('user_profile', JSON.stringify(userProfile));
    document.getElementById('onboarding-modal').style.display = 'none';

    // Trigger initial AI plan
    generateInitialPlan();
    updateUI();
});

// --- Daily Log Logic ---
function showLogModal() {
    document.getElementById('log-modal').style.display = 'flex';
}

document.getElementById('daily-log-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const steps = document.getElementById('log-steps').value;
    const mins = document.getElementById('log-mins').value;
    const food = document.getElementById('log-food').value;

    // Calculate Calories (Simple Formula)
    // 0.04 cal per step approx for average person
    const calBurned = Math.round(steps * 0.04);

    const logEntry = {
        date: new Date().toISOString(),
        steps: steps,
        activeMins: mins,
        food: food,
        caloriesBurned: calBurned
    };

    logs.push(logEntry);
    localStorage.setItem('daily_logs', JSON.stringify(logs));

    document.getElementById('log-modal').style.display = 'none';
    updateUI();

    // Ask AI for schedule/advice based on this log
    await generateDailyAdvice(logEntry);
});


// --- UI Updates ---
function updateUI() {
    // 1. Dashboard
    if (userProfile) {
        document.getElementById('disp-weight').innerText = `${userProfile.currentWeight} kg`;

        // Show latest log data
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            document.getElementById('disp-steps').innerText = lastLog.steps;
            document.getElementById('disp-cal text-danger').innerText = lastLog.caloriesBurned; // Note: ID selector match
            // Fix ID selector in HTML or here. In HTML I used 'disp-cal text-danger' which is class-like but user set as ID.
            // Let's fix the selector logic:
            const calEl = document.getElementById('disp-cal text-danger');
            if (calEl) calEl.innerText = lastLog.caloriesBurned;
        }
    }

    // 2. Profile / Transformation
    if (userProfile) {
        document.getElementById('profile-start-weight').innerText = `${userProfile.startWeight} kg`;
        document.getElementById('profile-curr-weight').innerText = `${userProfile.currentWeight} kg`;

        const diff = (userProfile.startWeight - userProfile.currentWeight).toFixed(1);
        const lossEl = document.getElementById('profile-loss');
        if (diff > 0) {
            lossEl.innerText = `-${diff} kg (Lost)`;
            lossEl.className = 'stat-value text-success';
        } else if (diff < 0) {
            lossEl.innerText = `+${Math.abs(diff)} kg (Gained)`;
            lossEl.className = 'stat-value text-danger';
        } else {
            lossEl.innerText = `0 kg`;
            lossEl.className = 'stat-value';
        }

        // Render History
        const list = document.getElementById('history-list');
        list.innerHTML = logs.map(log => `
            <div class="timeline-item">
                <div style="font-weight:600;">${new Date(log.date).toLocaleDateString()}</div>
                <div style="font-size:0.9rem; color:var(--text-secondary);">
                    Steps: ${log.steps} | Burned: ${log.caloriesBurned} kcal
                </div>
            </div>
        `).join('');
    }
}


// --- AI Interactions ---

async function generateInitialPlan() {
    appendMessage("Analyzing your profile to create a master plan...", 'ai');

    const prompt = `
        New User Profile Created:
        Height: ${userProfile.height}cm
        Weight: ${userProfile.startWeight}kg
        Activity Level: ${userProfile.activityLevel}
        Daily Time Available: ${userProfile.timeCommitment}
        
        Please provide a welcome message and a high-level weekly strategy.
        formatting: use bullet points and clear instructions.
    `;

    try {
        const response = await window.geminiService.generateResponse(prompt);
        appendMessage(response, 'ai');
    } catch (e) {
        appendMessage("Error generating plan.", 'ai');
    }
}

async function generateDailyAdvice(log) {
    const aiScheduleDiv = document.getElementById('ai-schedule');
    aiScheduleDiv.innerText = "Generating updated schedule based on your activity...";

    // Auto-switch to coach tab
    switchTab('coach');
    appendMessage(`Daily Log Recieved: ${log.steps} steps, ${log.activeMins} mins active. Food: ${log.food}.`, 'user');

    const prompt = `
        User Daily Log Update:
        Steps Walked: ${log.steps}
        Calories Burned (Est): ${log.caloriesBurned}
        Food Eaten: ${log.food}
        User Profile: ${userProfile.height}cm, ${userProfile.currentWeight}kg, Goal: Fitness
        
        Task:
        1. Calculate net status (Deficit/Surplus).
        2. Create a specific SCHEDULE for the rest of the day/evening.
        3. Tell exactly what to eat for the next meal.
        4. Tell when to sleep.
        
        Output format: Clear instructions with time slots.
    `;

    try {
        const response = await window.geminiService.generateResponse(prompt);

        // Show in Chat
        appendMessage(response, 'ai');

        // Also update the dashboard widget
        aiScheduleDiv.innerHTML = response.substring(0, 300) + "... (See Coach for full plan)";

    } catch (e) {
        aiScheduleDiv.innerText = "Connection failed.";
    }
}


// --- Standard Nav ---
function switchTab(tabId) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(tabId)) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    const titles = {
        'dashboard': 'Health Overview',
        'coach': 'AI Health Coach',
        'profile': 'My Transformation',
        'integrations': 'Settings'
    };
    document.getElementById('page-title').innerText = titles[tabId];
}

// Chat UI Helper
function appendMessage(text, type) {
    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    msgDiv.innerText = text; // textContent handles raw text, CSS handles white-space
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Chat Input Handler
document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    input.value = '';

    const prompt = `Context: User is ${userProfile ? userProfile.currentWeight + 'kg' : 'unknown'}. \nQuestion: ${text}`;

    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('message', 'ai');
    loadingDiv.innerText = '...';
    document.getElementById('chat-messages').appendChild(loadingDiv);

    const response = await window.geminiService.generateResponse(prompt);
    loadingDiv.remove();
    appendMessage(response, 'ai');
});
