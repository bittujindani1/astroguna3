const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    
    // Validate and parse numbers
    const requestData = {
      day: parseInt(data.day, 10),
      month: parseInt(data.month, 10),
      year: parseInt(data.year, 10),
      hour: parseInt(data.hour, 10),
      min: parseInt(data.min, 10),
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      tzone: parseFloat(data.tzone)
    };

    const response = await axios.post('https://json.astrologyapi.com/v1/horo_chart_image/D1', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.ASTROLOGY_API_AUTH).toString('base64')
      }
    });

    return { statusCode: 200, body: JSON.stringify(response.data) };
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return { 
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate chart',
        details: error.response?.data || error.message 
      })
    };
  }
};