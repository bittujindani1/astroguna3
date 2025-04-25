const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Format all values as strings
    const requestData = {
      day: String(data.day).padStart(2, '0'),
      month: String(data.month).padStart(2, '0'),
      year: String(data.year),
      hour: String(data.hour).padStart(2, '0'),
      min: String(data.min).padStart(2, '0'),
      lat: String(data.lat),
      lon: String(data.lon),
      tzone: String(data.tzone)
    };

    const response = await axios.post('https://json.astrologyapi.com/v1/horo_chart_image/D1', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.ASTROLOGY_API_AUTH).toString('base64')
      }
    });

    return { statusCode: 200, body: JSON.stringify(response.data) };
  } catch (error) {
    console.error('Chart Error:', error.response?.data || error.message);
    return { 
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Chart generation failed',
        details: error.response?.data || error.message 
      })
    };
  }
};