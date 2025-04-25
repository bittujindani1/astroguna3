const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const data = JSON.parse(event.body);
    
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

    const authHeader = 'Basic ' + Buffer.from(process.env.ASTROLOGY_API_AUTH).toString('base64');
    
    const response = await axios.post('https://json.astrologyapi.com/v1/current_vdasha', requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    return { statusCode: 200, body: JSON.stringify(response.data) };
  } catch (error) {
    console.error('Dasha Error:', error.response?.data || error.message);
    return { 
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to get dasha',
        details: error.response?.data || error.stack 
      })
    };
  }
};