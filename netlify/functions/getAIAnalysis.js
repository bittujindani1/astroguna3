const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { chartData, userQuestion } = JSON.parse(event.body);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are an expert medical astrologer...`; // Your full prompt here
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ html: formatAIResponse(text) })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatAIResponse(text) {
  // Format the response with HTML
  const sections = text.split('\n\n');
  let htmlResponse = "<div class='ai-message ai-response collapsible'><h3>AI Analysis</h3><div class='collapsible-content'>";
  
  sections.forEach(section => {
    if (section.startsWith('1. Key Health Characteristics')) {
      htmlResponse += `<h4>Key Health Characteristics</h4><ul>`;
      const points = section.split('\n').slice(1);
      points.forEach(point => {
        if (point.trim()) {
          htmlResponse += `<li>${point.replace(/^- /, '').trim()}</li>`;
        }
      });
      htmlResponse += `</ul>`;
    } 
    // ... rest of your formatting logic ...
  });
  
  htmlResponse += "</div></div>";
  return htmlResponse;
}