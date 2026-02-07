class GeminiService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key') || 'provide api key here'; //user have to write api key here inside ' ' 
        this.model = 'gemini-1.5-flash';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.validModelFound = null; // Cache the valid model
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        this.validModelFound = null; // Reset cache on key change
    }

    hasKey() {
        return !!this.apiKey;
    }

    async findBestModel() {
        if (this.validModelFound) return this.validModelFound;

        try {
            console.log("Discovering available models...");
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`);
            const data = await response.json();

            if (data.models) {
                // strict priority list
                const priority = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-pro'];

                // Find first priority model that exists in available models
                const bestMatch = priority.find(p => data.models.some(m => m.name.endsWith(p)));

                if (bestMatch) {
                    this.validModelFound = bestMatch;
                    console.log("Selected optimized model:", bestMatch);
                    return bestMatch;
                }

                // Fallback: any model that supports generateContent
                const anyGenModel = data.models.find(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'));
                if (anyGenModel) {
                    const name = anyGenModel.name.split('/').pop(); // remove 'models/' prefix
                    this.validModelFound = name;
                    console.log("Selected fallback model:", name);
                    return name;
                }
            }
        } catch (e) {
            console.error("Model discovery failed", e);
        }

        return 'gemini-1.5-flash'; // Ultimate fallback
    }

    async generateResponse(userMessage, contextData) {
        if (!this.apiKey) {
            return "Please configure your Gemini API Key in the Integrations tab to use the Health Coach.";
        }

        // Ensure we are using a valid model for this key
        this.model = await this.findBestModel();

        // Simulating ScaleDown context injection
        const systemPrompt = `
            You are an advanced Health Coach Agent. 
            You have access to the user's compressed health history (ScaleDown context).
            
            Current Health Context:
            - Daily Steps: 8,432 (Goal: 10,000)
            - Sleep Score: 84 (Optimal)
            - Calories: 2,140
            - Recent anomaly: Decrease in deep sleep by 15% this week.
            
            Provide personalized, actionable advice. Be encouraging but scientific.
            Keep responses concise (under 100 words) as if chatting in a mobile app.
        `;

        const payload = {
            contents: [{
                parts: [{
                    text: systemPrompt + "\n\nUser: " + userMessage
                }]
            }]
        };

        try {
            const response = await fetch(`${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || 'API Error');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            // Enhanced error message for user
            return `Error: ${error.message}. \n\nTip: Check if your API Key has access to model '${this.model}'.`;
        }
    }
}

window.geminiService = new GeminiService();

