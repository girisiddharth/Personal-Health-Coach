# 🚀 LinkedIn Project Journey Post

**Headline:** Building a Personalized AI Health Coach from Scratch in 2 Hours 🧬🤖

I just wrapped up building **Pulse AI**, a personalized health monitoring agent that doesn't just track your steps—it analyzes your day and tells you exactly what to do next.

Here’s the journey of how I built it using **Google Gemini** + **Vanilla JS**.

---

### 💡 The Spark
I wanted to solve a specific problem: Health apps give you data ("You walked 2000 steps"), but they don't give you **advice** ("You're sedentary today, so eat a light dinner and sleep early"). I wanted an agent that *knows* my context.

### 🛠️ The Tech Stack
Instead of over-engineering with heavy frameworks, I went for a **Zero-Dependency Architecture**:
*   **Frontend**: Pure HTML5/CSS3 with a custom Glassmorphism design system. 🎨
*   **Intelligence**: **Google Gemini Pro** via direct REST API integration. 🧠
*   **State**: LocalStorage for persistent user profiling (No backend costs!). 💾

### 🧗 The Challenges & Breakthroughs

**1. The "Model Not Found" Nightmare 🐛**
Early on, hardcoding the API model (`gemini-1.5-flash`) caused crashes depending on the API key type.
*   *Solution*: I built a **Dynamic Model Discovery** system. The app now pings the API first, asks "What models can this key use?", and automatically selects the best available brain (falling back from Flash -> Pro).

**2. Giving the AI "Memory" 🧠**
Chatbots usually forget you after a refresh.
*   *Solution*: I implemented a "Context Injection" system. Every time you chat, the app silently bundles your Profile (Weight/Height) + Today's Logs (Steps/Food) into the system prompt. The result? The AI feels like a real coach who has known you for months.

### 🏆 The Result
**Pulse AI** is alive.
*   ✅ It asks for your body stats on the first run.
*   ✅ You log your day in 5 seconds.
*   ✅ It instantly generates a **custom schedule** for your evening (Nutrition + Sleep).
*   ✅ It tracks your weight transformation over time.

It’s amazing what you can build when you combine modern Web APIs with the power of Generative AI.

Check out the screenshots below! 👇

#WebDevelopment #AI #GeminiAPI #Javascript #HealthTech #CodingJourney #BuildInPublic #Frontend
