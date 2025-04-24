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
  },
  open: function() {
    $(this).autocomplete("widget").css({
      "z-index": 999999,
      "width": $(this).outerWidth() + "px"
    });
  }
});

// Form submission handler
$('#birthChartForm').submit(function(e) {
  e.preventDefault();
  
  if(!$('#lat').val() || !$('#lon').val()) {
    $('#errorMessage').text('Please select a valid location from the suggestions').show();
    return;
  }
  
  $('#loadingIndicator').show();
  $('#reportContainer').hide();
  $('#errorMessage').hide();
  
  // Prepare form data
  var formData = {
    day: $('input[name="day"]').val(),
    month: $('input[name="month"]').val(),
    year: $('input[name="year"]').val(),
    hour: $('input[name="hour"]').val(),
    min: $('input[name="min"]').val(),
    lat: $('#lat').val(),
    lon: $('#lon').val(),
    tzone: $('#tzone').val()
  };
  
  // Make API calls through Netlify functions
  Promise.all([
    fetch('/.netlify/functions/generateChart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }),
    fetch('/.netlify/functions/getPlanets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }),
    fetch('/.netlify/functions/getDasha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
  ])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([chartData, planetsData, dashaData]) => {
    // Process responses
    $('#d1Chart').html(chartData.svg);
    generatePlanetaryHealthAnalysis(planetsData);
    generateHouseHealthAnalysis(planetsData);
    generateDashaHealthAnalysis(dashaData);
    
    $('#loadingIndicator').hide();
    $('#reportContainer').show();
  })
  .catch(error => {
    console.error('Error:', error);
    $('#errorMessage').text('Error generating report. Please try again.').show();
    $('#loadingIndicator').hide();
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
  
  planetsData.forEach(planet => {
    // ... same planetary health analysis logic as before ...
    // (but now using data from our serverless function)
  });
}

// Generate house health analysis
function generateHouseHealthAnalysis(planetsData) {
  const tbody = $('#houseAnalysisBody');
  tbody.empty();
  
  // ... same house analysis logic as before ...
  // (but now using data from our serverless function)
}

// Generate dasha health analysis
function generateDashaHealthAnalysis(dashaData) {
  const tbody = $('#dashaAnalysisBody');
  tbody.empty();
  
  // ... same dasha analysis logic as before ...
  // (but now using data from our serverless function)
}

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

// Generate AI analysis
async function generateAIAnalysis(userQuestion = '') {
  $('#aiLoading').show();
  
  try {
    const chartData = prepareChartDataForAI();
    const response = await fetch('/.netlify/functions/getAIAnalysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chartData,
        userQuestion
      })
    });
    
    const analysis = await response.json();
    
    $('.collapsible').removeClass('active');
    $('.collapsible-content').removeClass('show');
    
    if (userQuestion) {
      $('#aiResponse').append(`<div class="ai-message ai-question collapsible active"><strong>You:</strong> ${userQuestion}<div class="collapsible-content show">${analysis.html}</div></div>`);
    } else {
      $('#aiResponse').append(analysis.html);
    }
    
    const responseDiv = document.getElementById('aiResponse');
    responseDiv.scrollTop = responseDiv.scrollHeight;
  } catch (error) {
    $('#aiResponse').append(`<div class="ai-message ai-error">Error generating health analysis: ${error.message}</div>`);
  } finally {
    $('#aiLoading').hide();
  }
}

function prepareChartDataForAI() {
  // Gather data from the current chart display
  return {
    planetaryHealth: getCurrentPlanetaryHealth(),
    dashaPeriod: getCurrentDashaPeriod(),
    houseAnalysis: getCurrentHouseAnalysis()
  };
  
  function getCurrentPlanetaryHealth() {
    const positions = [];
    $('#planetPositionsBody tr').each(function() {
      positions.push({
        planet: $(this).find('td:eq(0)').text(),
        sign: $(this).find('td:eq(1)').text(),
        house: $(this).find('td:eq(3)').text(),
        status: $(this).find('td:eq(4)').text(),
        bodyParts: $(this).find('td:eq(5)').text(),
        healthImpact: $(this).find('td:eq(6)').text()
      });
    });
    return positions;
  }
  
  function getCurrentDashaPeriod() {
    return {
      major: {
        planet: $('#dashaAnalysisBody tr:eq(0) td:eq(1)').text(),
        healthInfluence: $('#dashaAnalysisBody tr:eq(0) td:eq(2)').text(),
        vulnerableAreas: $('#dashaAnalysisBody tr:eq(0) td:eq(3)').text()
      },
      minor: {
        planet: $('#dashaAnalysisBody tr:eq(1) td:eq(1)').text(),
        healthInfluence: $('#dashaAnalysisBody tr:eq(1) td:eq(2)').text(),
        vulnerableAreas: $('#dashaAnalysisBody tr:eq(1) td:eq(3)').text()
      }
    };
  }
  
  function getCurrentHouseAnalysis() {
    const analysis = [];
    $('#houseAnalysisBody tr').each(function() {
      analysis.push({
        house: $(this).find('td:eq(0)').text(),
        sanskritName: $(this).find('td:eq(1)').text(),
        rashi: $(this).find('td:eq(2)').text(),
        bodyParts: $(this).find('td:eq(3)').text(),
        planets: $(this).find('td:eq(4)').text(),
        healthStatus: $(this).find('td:eq(5)').text(),
        potentialDiseases: $(this).find('td:eq(6)').text()
      });
    });
    return analysis;
  }
}