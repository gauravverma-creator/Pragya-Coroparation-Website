/**
 * trip-planner.js
 * Logic for Yatra Sahayak AI Trip Planner
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initializations
    lucide.createIcons();
    initApp();
});

// --- State Management ---
const state = {
    currentStep: 1,
    totalSteps: 11,
    answers: {
        origin: '',
        destination: '',
        days: '7',
        travelers: '1',
        budget: '',
        transport: '',
        accommodation: '',
        preferredHotels: '',
        tripType: '',
        mustVisitPlaces: '',
        preferences: ''
    },
    itineraryData: null,
    apiKey: localStorage.getItem('trip_planner_api_key') || '',
    apiProvider: localStorage.getItem('trip_planner_provider') || 'gemini',
    apiBaseUrl: localStorage.getItem('trip_planner_base_url') || ''
};

// --- DOM Elements ---
const DOM = {
    // Nav
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    generateBtn: document.getElementById('generateBtn'),
    stepCountDisplay: document.getElementById('stepCountDisplay'),
    progressPercentage: document.getElementById('progressPercentage'),
    progressBarFill: document.getElementById('progressBarFill'),
    
    // Sections
    plannerFormSection: document.getElementById('plannerFormSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultSection: document.getElementById('resultSection'),
    
    // API Modal
    apiKeyBtn: document.getElementById('apiKeyBtn'),
    apiKeyModal: document.getElementById('apiKeyModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiProvider: document.getElementById('apiProvider'),
    apiBaseUrl: document.getElementById('apiBaseUrl'),
    customUrlWrapper: document.getElementById('customUrlWrapper'),
    providerLink: document.getElementById('providerLink'),
    saveApiKey: document.getElementById('saveApiKey'),
    closeModal: document.getElementById('closeModal'),
    
    // Result Elements
    itineraryTitle: document.getElementById('itineraryTitle'),
    itinerarySub: document.getElementById('itinerarySub'),
    itineraryDays: document.getElementById('itineraryDays'),
    loadingDest: document.getElementById('loadingDest'),
    loadingMessage: document.getElementById('loadingMessage'),
    
    // Estimate Elements
    estStay: document.getElementById('est-stay'),
    estTransport: document.getElementById('est-transport'),
    estFood: document.getElementById('est-food'),
    estTotal: document.getElementById('est-total'),
    travelTips: document.getElementById('travelTips'),
    
    // Misc
    errorToast: document.getElementById('errorToast'),
    errorMsg: document.getElementById('errorMsg'),
    retryBtn: document.getElementById('retryBtn'),
    backToPlanner: document.getElementById('backToPlanner'),
    downloadPdf: document.getElementById('downloadPdf'),
    shareJourney: document.getElementById('shareJourney'),
    googleMapsBtn: document.getElementById('googleMapsBtn'),
    itineraryMapImg: document.getElementById('itineraryMapImg'),
    resultAdPlaceholder: document.getElementById('resultAdPlaceholder')
};

// --- App Initialization ---
function initApp() {
    setupNavigation();
    setupInputs();
    setupAPIKeyModal();
    setupResultActions();
    
    if (state.apiKey) {
        DOM.apiKeyBtn.innerHTML = `<i data-lucide="check-circle"></i> ${getProviderName(state.apiProvider)} Active`;
        lucide.createIcons();
    }
}

// --- Navigation Logic ---
function setupNavigation() {
    DOM.nextBtn.addEventListener('click', () => {
        if (validateStep(state.currentStep)) {
            goToStep(state.currentStep + 1);
        }
    });

    DOM.prevBtn.addEventListener('click', () => {
        goToStep(state.currentStep - 1);
    });

    DOM.generateBtn.addEventListener('click', () => {
        if (validateStep(8)) {
            startGeneration();
        }
    });

    DOM.backToPlanner.addEventListener('click', () => {
        DOM.resultSection.classList.add('hidden');
        DOM.resultAdPlaceholder.classList.add('hidden');
        DOM.plannerFormSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function goToStep(step) {
    if (step < 1 || step > state.totalSteps) return;

    // Transition effect
    const currentEl = document.querySelector(`.question-step[data-step="${state.currentStep}"]`);
    const nextEl = document.querySelector(`.question-step[data-step="${step}"]`);

    currentEl.classList.remove('active');
    setTimeout(() => {
        state.currentStep = step;
        nextEl.classList.add('active');
        updateUI();
    }, 200);
}

function updateUI() {
    // Update labels/progress
    DOM.stepCountDisplay.textContent = `Step ${state.currentStep} of ${state.totalSteps}`;
    const percentage = Math.round((state.currentStep / state.totalSteps) * 100);
    DOM.progressPercentage.textContent = `${percentage}%`;
    DOM.progressBarFill.style.width = `${percentage}%`;

    // Nav buttons
    DOM.prevBtn.className = state.currentStep === 1 ? 'btn btn-text invisible' : 'btn btn-text';
    
    if (state.currentStep === state.totalSteps) {
        DOM.nextBtn.classList.add('hidden');
        DOM.generateBtn.classList.remove('hidden');
    } else {
        DOM.nextBtn.classList.remove('hidden');
        DOM.generateBtn.classList.add('hidden');
    }

    // Validation check for current step to enable/disable next
    DOM.nextBtn.disabled = !validateStep(state.currentStep);
    
    // Auto-scroll to top of card on mobile
    if (window.innerWidth < 600) {
        DOM.plannerFormSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- Input Handling ---
function setupInputs() {
    const destInput = document.getElementById('q1-destination');
    destInput.addEventListener('input', (e) => {
        state.answers.destination = e.target.value;
        DOM.nextBtn.disabled = !validateStep(1);
    });

    const originInput = document.getElementById('q2-origin');
    if (originInput) {
        originInput.addEventListener('input', (e) => {
            state.answers.origin = e.target.value;
            DOM.nextBtn.disabled = !validateStep(2);
        });
    }

    setupOptionGrid('grid-days', (val) => {
        state.answers.days = val;
        document.getElementById('q3-days-custom').value = '';
        DOM.nextBtn.disabled = !validateStep(3);
    });
    
    document.getElementById('q3-days-custom').addEventListener('input', (e) => {
        state.answers.days = e.target.value;
        clearSelected('grid-days');
        DOM.nextBtn.disabled = !validateStep(3);
    });

    document.getElementById('q4-travelers').addEventListener('input', (e) => {
        state.answers.travelers = e.target.value;
        DOM.nextBtn.disabled = !validateStep(4);
    });

    setupOptionGrid('grid-4-cols', (val, container) => {
        if (!container.parentElement.closest('[data-step="5"]')) return;
        state.answers.budget = val;
        DOM.nextBtn.disabled = !validateStep(5);
    }, 5);

    setupOptionGrid('grid-4-cols', (val, container) => {
        if (!container.parentElement.closest('[data-step="6"]')) return;
        state.answers.transport = val;
        DOM.nextBtn.disabled = !validateStep(6);
    }, 6);

    setupOptionGrid('grid-3-cols', (val) => {
        state.answers.accommodation = val;
        DOM.nextBtn.disabled = !validateStep(7);
    });

    document.getElementById('q8-hotels').addEventListener('input', (e) => {
        state.answers.preferredHotels = e.target.value;
        DOM.nextBtn.disabled = !validateStep(8);
    });

    setupOptionGrid('grid-wrap', (val) => {
        state.answers.tripType = val;
        DOM.nextBtn.disabled = !validateStep(9);
    });

    document.getElementById('q10-places').addEventListener('input', (e) => {
        state.answers.mustVisitPlaces = e.target.value;
        DOM.nextBtn.disabled = !validateStep(10);
    });

    const q11Prefs = document.getElementById('q11-preferences');
    if (q11Prefs) {
        q11Prefs.addEventListener('input', (e) => {
            state.answers.preferences = e.target.value;
            DOM.generateBtn.disabled = false;
        });
    }
}

function setupOptionGrid(className, callback, stepFilter = null) {
    const containers = document.querySelectorAll(`.${className}`);
    containers.forEach(container => {
        const btns = container.querySelectorAll('.option-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                callback(btn.dataset.value, container);
            });
        });
    });
}

function clearSelected(className) {
    const containers = document.querySelectorAll(`.${className}`);
    containers.forEach(c => {
        c.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    });
}

function validateStep(step) {
    switch(step) {
        case 1: return state.answers.destination.trim().length > 2;
        case 2: return state.answers.origin.trim().length > 2;
        case 3: return parseInt(state.answers.days) > 0;
        case 4: return parseInt(state.answers.travelers) > 0;
        case 5: return state.answers.budget !== '';
        case 6: return state.answers.transport !== '';
        case 7: return state.answers.accommodation !== '';
        case 8: return true; 
        case 9: return state.answers.tripType !== '';
        case 10: return true; 
        case 11: return true; 
        default: return false;
    }
}

// --- API Key Modal Logic ---
function setupAPIKeyModal() {
    DOM.apiKeyBtn.addEventListener('click', () => {
        DOM.apiKeyModal.classList.add('active');
        DOM.apiKeyInput.value = state.apiKey;
        DOM.apiProvider.value = state.apiProvider;
        DOM.apiBaseUrl.value = state.apiBaseUrl;
        
        // Initial visibility check
        if (state.apiProvider === 'custom') {
            DOM.customUrlWrapper.classList.remove('hidden');
        } else {
            DOM.customUrlWrapper.classList.add('hidden');
        }
    });

    DOM.apiProvider.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'gemini') {
            DOM.providerLink.innerHTML = 'Get a Gemini key at <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.';
            DOM.customUrlWrapper.classList.add('hidden');
        } else if (val === 'openai') {
            DOM.providerLink.innerHTML = 'Get an OpenAI key at <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Dashboard</a>.';
            DOM.customUrlWrapper.classList.add('hidden');
        } else if (val === 'openrouter') {
            DOM.providerLink.innerHTML = 'Get an OpenRouter key at <a href="https://openrouter.ai/keys" target="_blank">OpenRouter.ai Dashboard</a>.';
            DOM.customUrlWrapper.classList.add('hidden');
        } else {
            DOM.providerLink.innerHTML = 'Set a custom OpenAI-compatible endpoint (e.g., Ollama, LM Studio, or a proxy).';
            DOM.customUrlWrapper.classList.remove('hidden');
        }
    });

    DOM.closeModal.addEventListener('click', () => {
        DOM.apiKeyModal.classList.remove('active');
    });

    DOM.saveApiKey.addEventListener('click', () => {
        const key = DOM.apiKeyInput.value.trim();
        const provider = DOM.apiProvider.value;
        const baseUrl = DOM.apiBaseUrl.value.trim();
        
        if (key.length < 5) {
            alert('Please enter a valid API key.');
            return;
        }

        if (provider === 'custom' && !baseUrl) {
            alert('Please enter an API Base URL for the custom provider.');
            return;
        }
        
        state.apiKey = key;
        state.apiProvider = provider;
        state.apiBaseUrl = baseUrl;
        
        localStorage.setItem('trip_planner_api_key', key);
        localStorage.setItem('trip_planner_provider', provider);
        localStorage.setItem('trip_planner_base_url', baseUrl);
        
        DOM.apiKeyModal.classList.remove('active');
        DOM.apiKeyBtn.innerHTML = `<i data-lucide="check-circle"></i> ${getProviderName(provider)} Active`;
        lucide.createIcons();
    });

    DOM.apiKeyModal.addEventListener('click', (e) => {
        if (e.target === DOM.apiKeyModal) DOM.apiKeyModal.classList.remove('active');
    });
}

function getProviderName(provider) {
    if (provider === 'gemini') return 'Gemini';
    if (provider === 'openai') return 'OpenAI';
    if (provider === 'openrouter') return 'OpenRouter';
    return 'Custom';
}

// --- AI Integration ---
async function startGeneration() {
    if (!state.apiKey) {
        DOM.apiKeyModal.classList.add('active');
        showToast('Please add an API key to continue.');
        return;
    }

    // Show loading
    DOM.plannerFormSection.classList.add('hidden');
    DOM.loadingSection.classList.remove('hidden');
    DOM.loadingDest.textContent = state.answers.destination;
    
    // Animate loading steps
    let loaderIdx = 1;
    const loaderInterval = setInterval(() => {
        if (loaderIdx < 4) {
            document.getElementById(`lStep${loaderIdx}`).classList.remove('active');
            loaderIdx++;
            document.getElementById(`lStep${loaderIdx}`).classList.add('active');
        }
    }, 4000);

    try {
        const prompt = `
            Create a detailed travel itinerary with:

            TRIP DETAILS:
            - From: ${state.answers.origin}
            - To: ${state.answers.destination}  
            - Duration: ${state.answers.days} days
            - Travelers: ${state.answers.travelers} people
            - Budget: ${state.answers.budget} per person

            PREFERENCES:
            - Transport: ${state.answers.transport}
            - Accommodation: ${state.answers.accommodation}
            - Preferred hotels/areas: ${state.answers.preferredHotels || "AI suggestion"}
            - Must-visit places: ${state.answers.mustVisitPlaces || "AI recommendation"}
            - Trip style: ${state.answers.tripType}
            - Other preferences: ${state.answers.preferences || "None"}

            IMPORTANT: Return ONLY a valid JSON object. Do not include markdown like \`\`\`json.
            The JSON structure MUST exactly match this format:
            {
                "title": "String - e.g. Trip to Paris",
                "subtitle": "String - e.g. An unforgettable 5-day adventure from [Origin]",
                "transport": {
                    "route": "How to reach from origin to destination",
                    "options": ["Train at 8 AM", "Flight at 10 AM"],
                    "local": "Local transport options at destination",
                    "cost": "₹XXXX"
                },
                "accommodation": {
                    "recommendations": ["Hotel A", "Hotel B"],
                    "areas": ["Area 1", "Area 2"],
                    "costPerNight": "₹XXXX",
                    "tips": "Booking tips string"
                },
                "places": [
                    {"name": "Place 1", "hours": "8 AM - 5 PM", "fee": "₹XX", "time": "2 hours", "bestTime": "Morning"}
                ],
                "food": {
                    "dishes": ["Dish 1", "Dish 2"],
                    "places": ["Restaurant 1", "Street Food Area"],
                    "cost": "₹XXXX"
                },
                "days": [
                    {
                        "day": 1,
                        "dateLabel": "Day 1",
                        "items": [
                            {"time": "Morning", "title": "Title", "desc": "Description", "location": "Location Name"}
                        ],
                        "cost": "₹XXXX"
                    }
                ],
                "budget": {
                    "transport": "15000",
                    "accommodation": "20000",
                    "food": "10000",
                    "activities": "5000",
                    "misc": "2000",
                    "total": "52000"
                },
                "tips": ["Tip 1", "Tip 2", "Tip 3"]
            }
        `;

        const responseText = await callAI(prompt);
        clearInterval(loaderInterval);
        
        if (responseText) {
            state.itineraryData = parseItinerary(responseText);
            renderItinerary(state.itineraryData);
            
            DOM.loadingSection.classList.add('hidden');
            DOM.resultSection.classList.remove('hidden');
            DOM.resultAdPlaceholder.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        clearInterval(loaderInterval);
        console.error('Full error:', error);
        console.log('Error details:', error.message);
        showError(error.message || 'Failed to generate itinerary. Please check your API key or network.');
    }
}

async function callAI(prompt) {
    if (state.apiProvider === 'gemini') {
        return callGemini(prompt);
    } else if (state.apiProvider === 'openai') {
        return callOpenAI(prompt);
    } else {
        return callCustomAI(prompt);
    }
}

async function callGemini(prompt) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`;
    
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        
        console.log('Full API Response:', data);
        
        if (data.error) throw new Error(data.error.message);
        
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('AI Generated Text:', aiResponse);
        
        return aiResponse;
    } catch (error) {
        console.error('Full error:', error);
        console.log('Error details:', error.message);
        throw error;
    }
}

async function callOpenAI(prompt) {
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const requestOptions = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini", // Cost-effective and fast
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    };

    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
}

async function callOpenRouter(prompt) {
    const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    
    const requestOptions = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`,
            'X-Title': 'Yatra Sahayak Trip Planner'
        },
        body: JSON.stringify({
            model: "google/gemini-flash-1.5-8b", 
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    };

    const response = await fetch(API_URL, requestOptions);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
}

async function callCustomAI(prompt) {
    // Ensure the URL ends correctly for chat completions
    let url = state.apiBaseUrl;
    if (!url.endsWith('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions';
    }
    
    const requestOptions = {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: "default", // Most custom providers ignore this or have a default
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7
        })
    };

    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message || 'Custom API Error');
    return data.choices[0].message.content;
}

function parseItinerary(text) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON object found in response");
        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Parsing failed:', e);
        console.log('Falling back to raw text rendering. Original Text:', text);
        return { isRaw: true, rawText: text };
    }
}

// --- Rendering ---
function formatRs(numStr) {
    if (!numStr) return '---';
    if (typeof numStr === 'string' && numStr.includes('₹')) return numStr;
    const rawNum = String(numStr).replace(/[^\d]/g, '');
    if (!rawNum) return numStr;
    return '₹' + new Intl.NumberFormat('en-IN').format(parseInt(rawNum, 10));
}

function renderItinerary(data) {
    if (data.isRaw) {
        document.getElementById('itineraryTitle').textContent = `Trip to ${state.answers.destination}`;
        document.getElementById('itinerarySub').textContent = "Custom curated itinerary by Prayan AI";
        
        // Hide standard grid sections
        const hideIfExist = (id) => { const el = document.getElementById(id); if (el) el.innerHTML = ''; };
        hideIfExist('transportSection');
        hideIfExist('accommodationSection');
        hideIfExist('placesSection');
        hideIfExist('foodSection');
        
        const daysContainer = document.getElementById('itineraryDays');
        
        // Simple Markdown to HTML formatter
        let formattedText = data.rawText
            .replace(/### (.*)/g, '<h4>$1</h4>')
            .replace(/## (.*)/g, '<h3 style="color: var(--primary-color); margin-top: 20px;">$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n- /g, '<br>• ')
            .replace(/\n/g, '<br>');

        daysContainer.innerHTML = `
            <div class="day-card" style="padding: 30px;">
                <div class="ai-response" style="line-height: 1.8; font-size: 1.05rem;">
                    ${formattedText}
                </div>
            </div>
        `;

        document.getElementById('est-transport').textContent = '---';
        document.getElementById('est-stay').textContent = '---';
        document.getElementById('est-food').textContent = '---';
        const elActivities = document.getElementById('est-activities'); if(elActivities) elActivities.textContent = '---';
        const elMisc = document.getElementById('est-misc'); if(elMisc) elMisc.textContent = '---';
        document.getElementById('est-total').textContent = '---';
        
        document.getElementById('googleMapsBtn').onclick = () => {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(state.answers.destination + ' tourist attractions')}`, '_blank');
        };
        document.getElementById('itineraryMapImg').src = `https://images.unsplash.com/photo-1524492459413-529e078b1f48?q=80&w=800&auto=format&fit=crop&q=${state.answers.destination}`;

        lucide.createIcons();
        return;
    }

    document.getElementById('itineraryTitle').textContent = data.title || `Trip to ${state.answers.destination}`;
    document.getElementById('itinerarySub').textContent = data.subtitle || '';
    
    // Budget breakdown
    const b = data.budget || {};
    document.getElementById('est-transport').textContent = formatRs(b.transport || '0');
    document.getElementById('est-stay').textContent = formatRs(b.accommodation || '0');
    document.getElementById('est-food').textContent = formatRs(b.food || '0');
    
    const elActivities = document.getElementById('est-activities');
    if(elActivities) elActivities.textContent = formatRs(b.activities || '0');
    const elMisc = document.getElementById('est-misc');
    if(elMisc) elMisc.textContent = formatRs(b.misc || '0');

    document.getElementById('est-total').textContent = formatRs(b.total || '0');

    // Travel Tips
    const tipsContainer = document.getElementById('travelTips');
    if (data.tips && Array.isArray(data.tips)) {
        tipsContainer.innerHTML = data.tips.map(tip => `<li>${tip}</li>`).join('');
    }

    // Transport Section
    const tSection = document.getElementById('transportSection');
    if (data.transport) {
        tSection.innerHTML = `
            <div class="category-header category-header-light">
                <span class="icon-emoji">🚂</span> <h3 class="serif" style="margin:0;">Transport Details</h3>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <label>Route Guide</label>
                    <p>${data.transport.route || 'N/A'}</p>
                </div>
                <div class="info-item">
                    <label>Intercity Options</label>
                    <ul class="list-styled">
                        ${(data.transport.options || []).map(o => `<li>${o}</li>`).join('')}
                    </ul>
                </div>
                <div class="info-item">
                    <label>Local Commute</label>
                    <p>${data.transport.local || 'N/A'}</p>
                </div>
            </div>
            <div style="margin-top: 15px; font-weight:700;">Est. Commute Cost: <span style="color:var(--primary-color);">${formatRs(data.transport.cost)}</span></div>
        `;
    }

    // Accommodation Section
    const aSection = document.getElementById('accommodationSection');
    if (data.accommodation) {
        aSection.innerHTML = `
            <div class="category-header category-header-light">
                <span class="icon-emoji">🏨</span> <h3 class="serif" style="margin:0;">Accommodation</h3>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <label>Best Areas to Stay</label>
                    <ul class="list-styled">
                        ${(data.accommodation.areas || []).map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
                <div class="info-item">
                    <label>Recommended Stays</label>
                    <ul class="list-styled">
                        ${(data.accommodation.recommendations || []).map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                <div class="info-item">
                    <label>Booking Tips</label>
                    <p>${data.accommodation.tips || 'N/A'}</p>
                </div>
            </div>
            <div style="margin-top: 15px; font-weight:700;">Est. Cost per Night: <span style="color:var(--primary-color);">${formatRs(data.accommodation.costPerNight)}</span></div>
        `;
    }

    // Places to Visit
    const pSection = document.getElementById('placesSection');
    if (data.places && data.places.length > 0) {
        pSection.innerHTML = `
            <div class="category-header category-header-light">
                <span class="icon-emoji">🗺️</span> <h3 class="serif" style="margin:0;">Places to Visit</h3>
            </div>
            <div class="places-grid">
                ${data.places.map(p => `
                    <div class="place-card">
                        <div class="place-info">
                            <h4>${p.name || ''}</h4>
                            <div class="place-meta">
                                <span><i data-lucide="clock" style="width:14px; height:14px;"></i> ${p.hours || ''}</span>
                                <span><i data-lucide="timer" style="width:14px; height:14px;"></i> ${p.time || ''}</span>
                                <span><i data-lucide="sun" style="width:14px; height:14px;"></i> ${p.bestTime || ''}</span>
                            </div>
                        </div>
                        <div class="place-cost">${p.fee && p.fee !== '0' && String(p.fee).toLowerCase() !== 'free' ? formatRs(p.fee) : 'Free Entry'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Food Guide
    const fSection = document.getElementById('foodSection');
    if (data.food) {
        fSection.innerHTML = `
            <div class="category-header category-header-light">
                <span class="icon-emoji">🍽️</span> <h3 class="serif" style="margin:0;">Food Guide</h3>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <label>Must-Try Local Dishes</label>
                    <ul class="list-styled">
                        ${(data.food.dishes || []).map(d => `<li>${d}</li>`).join('')}
                    </ul>
                </div>
                <div class="info-item">
                    <label>Good Restaurants / Areas</label>
                    <ul class="list-styled">
                        ${(data.food.places || []).map(p => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            </div>
            <div style="margin-top: 15px; font-weight:700;">Average Meal Cost: <span style="color:var(--primary-color);">${formatRs(data.food.cost)}</span></div>
        `;
    }

    // Day-wise Itinerary
    const daysContainer = document.getElementById('itineraryDays');
    daysContainer.innerHTML = '';
    if (data.days && Array.isArray(data.days)) {
        data.days.forEach(day => {
            const dayCard = document.createElement('div');
            dayCard.className = 'day-card';
            
            const timelineItems = (day.items || []).map(item => `
                <div class="item">
                    <span class="item-time">${item.time}</span>
                    <p class="item-title">${item.title} ${item.location ? `<span style="font-size:0.8rem; color:var(--primary-color); font-weight:normal; margin-left: 8px;"><i data-lucide="map-pin" style="width:12px; height:12px; display:inline;"></i> ${item.location}</span>` : ''}</p>
                    <p class="item-desc">${item.desc}</p>
                </div>
            `).join('');

            dayCard.innerHTML = `
                <div class="day-header">
                    <div>
                        <span class="day-label">${day.dateLabel || `Day ${day.day}`}</span>
                        <h3 class="day-title serif">Explore</h3>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.8rem; color: var(--text-light); text-transform: uppercase; font-weight: bold;">Daily Budget</span>
                        <br>
                        <strong style="color: var(--primary-color); font-size: 1.2rem;">${formatRs(day.cost)}</strong>
                    </div>
                </div>
                <div class="timeline">
                    ${timelineItems}
                </div>
            `;
            daysContainer.appendChild(dayCard);
        });
    }

    // Map Link
    document.getElementById('googleMapsBtn').onclick = () => {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(state.answers.destination + ' tourist attractions')}`, '_blank');
    };
    
    document.getElementById('itineraryMapImg').src = `https://images.unsplash.com/photo-1524492459413-529e078b1f48?q=80&w=800&auto=format&fit=crop&q=${state.answers.destination}`;

    lucide.createIcons();
}

// --- Result Actions ---
function setupResultActions() {
    DOM.downloadPdf.addEventListener('click', () => {
        const element = document.getElementById('pdf-content');
        const opt = {
            margin:       [0.5, 0.5],
            filename:     `Itinerary-${state.answers.destination.replace(/\s+/g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        // Temporarily hide parts for PDF
        document.body.classList.add('printing-mode');
        html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('printing-mode');
        });
    });

    DOM.shareJourney.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `My ${state.answers.destination} Itinerary`,
                    text: `Check out my custom AI-planned trip to ${state.answers.destination} using Yatra Sahayak!`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!');
        }
    });

    DOM.retryBtn.addEventListener('click', () => {
        DOM.errorToast.classList.add('hidden');
        startGeneration();
    });
}

// --- Utilities ---
function showToast(msg) {
    DOM.errorMsg.textContent = msg;
    DOM.errorToast.classList.remove('hidden');
    DOM.retryBtn.classList.add('hidden');
    setTimeout(() => {
        DOM.errorToast.classList.add('hidden');
    }, 4000);
}

function showError(msg) {
    DOM.errorMsg.textContent = msg;
    DOM.errorToast.classList.remove('hidden');
    DOM.retryBtn.classList.remove('hidden');
}
