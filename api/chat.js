// api/chat.js - Vercel Serverless Function
// This handles the backend API calls to Gemini

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Add emoji support function
function addEmojis(text) {
    const emojiMap = {
        'hello': '👋',
        'hi': '👋',
        'bye': '👋',
        'thanks': '🙏',
        'thank you': '🙏',
        'help': '🤝',
        'good': '👍',
        'great': '🌟',
        'love': '❤️',
        'happy': '😊',
        'sad': '😢',
        'code': '💻',
        'programming': '💻',
        'python': '🐍',
        'javascript': '⚡',
        'data': '📊',
        'science': '🔬',
        'math': '🔢',
        'music': '🎵',
        'food': '🍕',
        'weather': '🌤️',
        'time': '⏰',
        'question': '❓',
        'answer': '✅',
        'important': '⚠️',
        'success': '✨',
        'error': '❌',
        'money': '💰',
        'business': '💼',
        'book': '📚',
        'learn': '📖',
        'idea': '💡',
        'world': '🌍',
        'star': '⭐',
        'rocket': '🚀',
        'fire': '🔥'
    };

    let result = text;
    const lowerText = text.toLowerCase();
    
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
        if (lowerText.includes(keyword)) {
            result += ' ' + emoji;
            break;
        }
    }

    return result;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Initialize Gemini AI with your API key from environment variable
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build conversation history for context
        let conversationContext = history
            .slice(-10) // Keep last 10 messages for context
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        // Create the prompt with context
        const prompt = conversationContext 
            ? `${conversationContext}\n\nUser: ${message}\n\nAssistant:`
            : `User: ${message}\n\nAssistant:`;

        // Generate response
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let aiResponse = response.text();

        // Add relevant emojis
        aiResponse = addEmojis(aiResponse);

        return res.status(200).json({ 
            response: aiResponse,
            success: true 
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate response',
            details: error.message 
        });
    }
};
