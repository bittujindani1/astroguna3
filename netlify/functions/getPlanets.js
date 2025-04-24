const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Validate input data
    if (!data.day || !data.month || !data.year || !data.hour || !data.min || !data.lat || !data.lon || !data.tzone) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields in request body' })
      };
    }

    const response = await axios.post('https://json.astrologyapi.com/v1/planets', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(process.env.ASTROLOGY_API_AUTH).toString('base64')
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error in getPlanets:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};