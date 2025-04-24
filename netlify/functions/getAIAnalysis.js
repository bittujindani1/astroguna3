const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { chartData, userQuestion } = JSON.parse(event.body);
    
    if (!chartData || !chartData.planetaryHealth) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid chart data provided' })
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      You are an expert medical astrologer analyzing this birth chart:
      
      Planetary Positions:
      ${JSON.stringify(chartData.planetaryHealth, null, 2)}
      
      Current Dasha Period:
      ${JSON.stringify(chartData.dashaPeriod, null, 2)}
      
      House Analysis:
      ${JSON.stringify(chartData.houseAnalysis, null, 2)}
      
      User Question: ${userQuestion || 'Provide a general health analysis'}
      
      Please provide a detailed health analysis focusing on:
      - Vulnerable body systems
      - Potential health risks
      - Preventive measures
      - Astrological remedies
      - Lifestyle suggestions
      
      Format your response in HTML with proper headings and bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        html: `<div class="ai-message ai-response">${text}</div>`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Failed to generate analysis',
        details: error.message 
      })
    };
  }
};