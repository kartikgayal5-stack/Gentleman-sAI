// api/chat.js - Vercel Serverless Function
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Add emoji support function
function addEmojis(text) {
    const emojiMap = {
        'hello': '👋',
        'hi': '👋',
        'bye': '👋',
        'goodbye': '👋',
        'thanks': '🙏',
        'thank you': '🙏',
        'help': '🤝',
        'good': '👍',
        'great': '🌟',
        'excellent': '⭐',
        'love': '❤️',
        'happy': '😊',
        'sad': '😢',
        'code': '💻',
        'coding': '💻',
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
        'fire': '🔥',
        'computer': '💻',
        'phone': '📱',
        'email': '📧'
    };

    let result = text;
    const lowerText = text.toLowerCase();
    
    // Find matching emoji
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
        if (lowerText.includes(keyword)) {
            // Only add emoji if it's not already in the text
            if (!result.includes(emoji)) {
                result += ' ' + emoji;
            }
            break; // Only add one emoji per response
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

        // Check if API key is set
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
                error: 'API key not configured. Please add GEMINI_API_KEY to your environment variables.' 
            });
        }

        // Initialize Gemini AI with your API key from environment variable
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Build conversation history for context (keep last 10 messages)
        const relevantHistory = history ? history.slice(-10) : [];
        
        let conversationContext = relevantHistory
            .filter(msg => msg.role !== 'system')
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        // Create the prompt with context and personality
        const systemPrompt = "You are Gentleman's AI, a sophisticated and refined AI assistant. Respond with intelligence, clarity, and elegance. Be helpful, friendly, and professional.";
        
        const prompt = conversationContext 
            ? `${systemPrompt}\n\nConversation history:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`
            : `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

        // Generate response with error handling
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
        console.error('Error details:', error);
        
        // Better error messages
        let errorMessage = 'Failed to generate response';
        if (error.message.includes('API key')) {
            errorMessage = 'Invalid API key. Please check your GEMINI_API_KEY environment variable.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'API quota exceeded. Please check your Gemini API usage.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
        }
        
        return res.status(500).json({ 
            error: errorMessage,
            details: error.message 
        });
    }
};
