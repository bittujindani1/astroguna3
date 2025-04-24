$(document).ready(function() {
  // Initialize autocomplete
  $("#place").autocomplete({
    source: function(request, response) {
      $.ajax({
        url: "https://nominatim.openstreetmap.org/search",
        dataType: "json",
        data: {
          q: request.term,
          format: "json",
          addressdetails: 1,
          limit: 5,
          "accept-language": "en"
        },
        success: function(data) {
          response($.map(data, function(item) {
            var isIndianCity = item.address && 
                             (item.address.country === "India" || 
                              item.address.country_code === "in");
            
            return {
              label: item.display_name,
              value: item.display_name,
              lat: item.lat,
              lon: item.lon,
              tzone: isIndianCity ? 5.5 : (parseFloat(item.lon) / 15).toFixed(1),
              isIndian: isIndianCity
            };
          }));
        },
        error: function() {
          response([]);
        }
      });
    },
    minLength: 3,
    select: function(event, ui) {
      $(this).val(ui.item.label);
      $("#lat").val(ui.item.lat);
      $("#lon").val(ui.item.lon);
      $("#tzone").val(ui.item.tzone);
      
      $("#coordinates").text("Lat/Lon: " + ui.item.lat + ", " + ui.item.lon);
      $("#timezone").text("Timezone: " + (ui.item.isIndian ? "IST (GMT+5:30)" : "GMT" + (ui.item.tzone >= 0 ? "+" : "") + ui.item.tzone));
      
      return false;
    }
  });

  // Form submission handler
  $('#birthChartForm').submit(async function(e) {
  e.preventDefault();
  if (!$('#lat').val() || !$('#lon').val()) {
    $('#errorMessage').text('Please select a valid location from the suggestions').show();
    return;
  }

  $('#loadingIndicator').show();
  $('#reportContainer').hide();
  $('#errorMessage').hide();

  try {
    const formData = {
      day: $('input[name="day"]').val(),
      month: $('input[name="month"]').val(),
      year: $('input[name="year"]').val(),
      hour: $('input[name="hour"]').val(),
      min: $('input[name="min"]').val(),
      lat: $('#lat').val(),
      lon: $('#lon').val(),
      tzone: $('#tzone').val()
    };

    const [chartResponse, planetsResponse, dashaResponse] = await Promise.all([
      fetch('/.netlify/functions/generateChart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }),
      fetch('/.netlify/functions/getPlanets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }),
      fetch('/.netlify/functions/getDasha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
    ]);

    if (!chartResponse.ok || !planetsResponse.ok || !dashaResponse.ok) {
      throw new Error('Failed to fetch astrology data');
    }

    const [chartData, planetsData, dashaData] = await Promise.all([
      chartResponse.json(),
      planetsResponse.json(),
      dashaResponse.json()
    ]);

    // Process responses
    $('#d1Chart').html(chartData.svg || '<p>No chart available</p>');
    generatePlanetaryHealthAnalysis(planetsData);
    generateHouseHealthAnalysis(planetsData);
    generateDashaHealthAnalysis(dashaData);

    $('#loadingIndicator').hide();
    $('#reportContainer').show();
  } catch (error) {
    console.error('Error:', error);
    $('#errorMessage').text(`Error generating report: ${error.message}`).show();
    $('#loadingIndicator').hide();
  }
});
  // AI Chat functionality
  $('#askAIButton').click(function() {
    const question = $('#aiQuestion').val().trim();
    if (question) {
      generateAIAnalysis(question);
      $('#aiQuestion').val('');
    }
  });

  $('#aiQuestion').keypress(function(e) {
    if (e.which === 13) { // Enter key
      $('#askAIButton').click();
    }
  });

  $('#generateFullAnalysis').click(function() {
    generateAIAnalysis();
  });

  // Quick question click handler
  $('.quick-question').click(function() {
    const question = $(this).data('question');
    $('#aiQuestion').val(question);
    $('#askAIButton').click();
  });

  // Collapsible functionality
  $(document).on('click', '.collapsible', function() {
    $(this).toggleClass('active');
    $(this).find('.collapsible-content').toggleClass('show');
  });
});

// Helper function to check if planet is in current dasha
function isPlanetInDasha(planetName) {
  const majorDasha = $('#dashaAnalysisBody tr:eq(0) td:eq(1)').text();
  const minorDasha = $('#dashaAnalysisBody tr:eq(1) td:eq(1)').text();
  
  return planetName === majorDasha || planetName === minorDasha;
}

// Generate planetary health analysis
function generatePlanetaryHealthAnalysis(planetsData) {
  const tbody = $('#planetPositionsBody');
  tbody.empty();
  
  // Medical astrology data (simplified version)
  const medicalData = {
    planetBodyParts: {
      'Sun': ['Heart', 'Eyes', 'Head'],
      'Moon': ['Mind', 'Fluids', 'Chest'],
      'Mars': ['Blood', 'Muscles'],
      'Mercury': ['Skin', 'Nerves'],
      'Jupiter': ['Liver', 'Thighs'],
      'Venus': ['Reproductive', 'Kidneys'],
      'Saturn': ['Bones', 'Joints'],
      'Rahu': ['Lungs', 'Skin'],
      'Ketu': ['Nerves', 'Immunity']
    },
    remedies: {
      'Sun': ['Ruby gemstone', 'Surya Namaskar'],
      'Moon': ['Pearl', 'Meditation'],
      'Mars': ['Red coral', 'Exercise'],
      'Mercury': ['Emerald', 'Breathing exercises'],
      'Jupiter': ['Yellow sapphire', 'Charity'],
      'Venus': ['Diamond', 'Arts'],
      'Saturn': ['Blue sapphire', 'Service'],
      'Rahu': ['Gomedh', 'Detox'],
      'Ketu': ['Cats eye', 'Spiritual practices']
    }
  };

  planetsData.forEach(planet => {
    const bodyParts = medicalData.planetBodyParts[planet.name] || ['Various systems'];
    const remedies = medicalData.remedies[planet.name] || ['Consult astrologer'];
    
    const row = `
      <tr>
        <td>${planet.name}</td>
        <td>${planet.sign}</td>
        <td>${planet.normDegree?.toFixed(2) || '0.00'}°</td>
        <td>${planet.house}</td>
        <td>${planet.isRetro === "true" ? 'Retrograde' : 'Direct'}</td>
        <td>${bodyParts.join(', ')}</td>
        <td>Analyzing planetary influence...</td>
        <td>${remedies.join(', ')}</td>
      </tr>
    `;
    
    tbody.append(row);
  });
}

// Generate house health analysis
function generateHouseHealthAnalysis(planetsData) {
  const tbody = $('#houseAnalysisBody');
  tbody.empty();

  // Sample house data
  const houseData = {
    1: { sanskrit: 'Lagna', bodyParts: ['Head'], diseases: ['Headaches'] },
    2: { sanskrit: 'Dhana', bodyParts: ['Face'], diseases: ['Eye issues'] },
    // ... add all 12 houses
  };

  for (let house = 1; house <= 12; house++) {
    const houseInfo = houseData[house] || {
      sanskrit: 'Unknown',
      bodyParts: ['Unknown'],
      diseases: ['Unknown']
    };

    const row = `
      <tr>
        <td>${house}</td>
        <td>${houseInfo.sanskrit}</td>
        <td>Sign ${house}</td>
        <td>${houseInfo.bodyParts.join(', ')}</td>
        <td>Planets in house ${house}</td>
        <td>Neutral</td>
        <td>${houseInfo.diseases.join(', ')}</td>
        <td>Regular checkups recommended</td>
      </tr>
    `;
    
    tbody.append(row);
  }
}

// Generate dasha health analysis
function generateDashaHealthAnalysis(dashaData) {
  const tbody = $('#dashaAnalysisBody');
  tbody.empty();

  // Process major period
  const majorPlanet = dashaData.major?.planet?.replace('Major Period: ', '') || 'Unknown';
  tbody.append(`
    <tr>
      <td>Major</td>
      <td>${majorPlanet}</td>
      <td>General health focus for ${majorPlanet}</td>
      <td>Body parts governed by ${majorPlanet}</td>
      <td>Standard remedies for ${majorPlanet}</td>
    </tr>
  `);
  
  // Process minor period if available
  if (dashaData.minor) {
    const minorPlanet = dashaData.minor.planet.replace('Minor Period: ', '');
    tbody.append(`
      <tr>
        <td>Minor</td>
        <td>${minorPlanet}</td>
        <td>Secondary influences from ${minorPlanet}</td>
        <td>Body parts governed by ${minorPlanet}</td>
        <td>Standard remedies for ${minorPlanet}</td>
      </tr>
    `);
  }
}

// Generate AI analysis
async function generateAIAnalysis(userQuestion = '') {
  $('#aiLoading').show();
  
  try {
    const chartData = prepareChartDataForAI();
    
    if (!chartData.planetaryHealth || chartData.planetaryHealth.length === 0) {
      throw new Error('Please generate your birth chart first');
    }

    const response = await fetch('/.netlify/functions/getAIAnalysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chartData,
        userQuestion: userQuestion || 'Provide a general health analysis'
      })
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }

    const analysis = await response.json();
    
    $('.collapsible').removeClass('active');
    $('.collapsible-content').removeClass('show');
    
    if (userQuestion) {
      $('#aiResponse').append(`
        <div class="ai-message ai-question collapsible active">
          <strong>You:</strong> ${userQuestion}
          <div class="collapsible-content show">${analysis.html || analysis.message || 'No analysis available'}</div>
        </div>
      `);
    } else {
      $('#aiResponse').append(analysis.html || analysis.message || '<div class="ai-message">No analysis available</div>');
    }
    
    const responseDiv = document.getElementById('aiResponse');
    responseDiv.scrollTop = responseDiv.scrollHeight;
  } catch (error) {
    console.error('AI Error:', error);
    $('#aiResponse').append(`
      <div class="ai-message ai-error">
        Error generating health analysis: ${error.message}
      </div>
    `);
  } finally {
    $('#aiLoading').hide();
  }
}

function prepareChartDataForAI() {
  const planetaryHealth = [];
  $('#planetPositionsBody tr').each(function() {
    planetaryHealth.push({
      planet: $(this).find('td:eq(0)').text(),
      sign: $(this).find('td:eq(1)').text(),
      house: $(this).find('td:eq(3)').text(),
      status: $(this).find('td:eq(4)').text(),
      bodyParts: $(this).find('td:eq(5)').text()
    });
  });

  const dashaPeriod = {
    major: {
      planet: $('#dashaAnalysisBody tr:eq(0) td:eq(1)').text()
    },
    minor: {
      planet: $('#dashaAnalysisBody tr:eq(1) td:eq(1)').text()
    }
  };

  const houseAnalysis = [];
  $('#houseAnalysisBody tr').each(function() {
    houseAnalysis.push({
      house: $(this).find('td:eq(0)').text(),
      bodyParts: $(this).find('td:eq(3)').text(),
      planets: $(this).find('td:eq(4)').text()
    });
  });

  return { planetaryHealth, dashaPeriod, houseAnalysis };
}