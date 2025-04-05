// Configuration
// API key should be moved to a separate config file that is gitignored
// Load configuration from config.js
const config = {
    API_KEY: process.env.API_KEY,
    API_BASE_URL: 'https://v6.exchangerate-api.com/v6/'
};
const API_KEY = config.API_KEY || ''; // Use empty string as fallback
const API_BASE_URL = config.API_BASE_URL || 'https://v6.exchangerate-api.com/v6/';
const BASE_CURRENCY = 'USD';
const TARGET_CURRENCY = 'IDR';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// DOM Elements
const chartElement = document.getElementById('exchange-rate-chart');
const currentRateElement = document.getElementById('current-rate');
const rateDirectionElement = document.getElementById('rate-direction');
const lastUpdatedElement = document.getElementById('last-updated-time');
const timeRangeSelector = document.getElementById('time-range-selector');
const refreshButton = document.getElementById('refresh-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const usdToIdrRadio = document.getElementById('usd-to-idr');
const idrToUsdRadio = document.getElementById('idr-to-usd');

// State variables
let exchangeRateChart;
let historicalData = [];
let currentViewMode = 'usd-to-idr';
let previousRate = null;
let cachedData = {
    latest: null,
    historical: {},
    lastFetched: {
        latest: null,
        historical: {}
    }
};

// Initialize the application
async function initApp() {
    showLoading();
    setupEventListeners();
    await fetchLatestRate();
    await updateChartData();
    hideLoading();
}

// Setup event listeners
function setupEventListeners() {
    timeRangeSelector.addEventListener('change', updateChartData);
    refreshButton.addEventListener('click', handleRefresh);
    
    // View mode toggle
    usdToIdrRadio.addEventListener('change', () => {
        if (usdToIdrRadio.checked) {
            currentViewMode = 'usd-to-idr';
            updateChartDisplay();
            updateCurrentRateDisplay();
        }
    });
    
    idrToUsdRadio.addEventListener('change', () => {
        if (idrToUsdRadio.checked) {
            currentViewMode = 'idr-to-usd';
            updateChartDisplay();
            updateCurrentRateDisplay();
        }
    });
}

// Handle refresh button click
async function handleRefresh() {
    showLoading();
    // Clear cache for latest rate
    cachedData.lastFetched.latest = null;
    await fetchLatestRate();
    await updateChartData(true); // Force refresh
    hideLoading();
}

// Fetch the latest exchange rate
async function fetchLatestRate() {
    try {
        // Check if we have cached data that's still valid
        const now = new Date().getTime();
        if (cachedData.latest && cachedData.lastFetched.latest && 
            (now - cachedData.lastFetched.latest) < CACHE_DURATION) {
            console.log('Using cached latest rate data');
            return cachedData.latest;
        }
        
        console.log(`Fetching latest rate from: ${API_BASE_URL}${API_KEY}/latest/${BASE_CURRENCY}`);
        const response = await fetch(`${API_BASE_URL}${API_KEY}/latest/${BASE_CURRENCY}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API HTTP error: ${response.status} ${response.statusText}`);
            console.error(`Response body: ${errorText}`);
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        if (data.result !== 'success') {
            console.error('API returned error result:', data);
            throw new Error(`API returned error: ${data.error || 'Unknown error'}`);
        }
        
        // Cache the data
        cachedData.latest = data;
        cachedData.lastFetched.latest = now;
        
        // Update the UI with the latest rate
        updateCurrentRateDisplay();
        updateLastUpdatedTime();
        
        return data;
    } catch (error) {
        console.error('Error fetching latest rate:', error);
        showError(`Failed to fetch latest exchange rate data: ${error.message}. Please try again later.`);
    }
}

// Update the current rate display
function updateCurrentRateDisplay() {
    if (!cachedData.latest) return;
    
    const rate = cachedData.latest.conversion_rates[TARGET_CURRENCY];
    let displayRate;
    
    if (currentViewMode === 'usd-to-idr') {
        displayRate = rate.toFixed(2);
        currentRateElement.textContent = `1 USD = ${displayRate} IDR`;
    } else {
        displayRate = (1 / rate).toFixed(8);
        currentRateElement.textContent = `1 IDR = ${displayRate} USD`;
    }
    
    // Show rate direction indicator if we have a previous rate
    if (previousRate !== null) {
        const direction = rate > previousRate ? 'up' : rate < previousRate ? 'down' : 'same';
        rateDirectionElement.innerHTML = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '';
        rateDirectionElement.style.color = direction === 'up' ? '#27ae60' : direction === 'down' ? '#e74c3c' : 'inherit';
    }
    
    previousRate = rate;
}

// Update the last updated time display
function updateLastUpdatedTime() {
    if (cachedData.lastFetched.latest) {
        const lastUpdated = new Date(cachedData.lastFetched.latest);
        lastUpdatedElement.textContent = lastUpdated.toLocaleString();
    } else {
        lastUpdatedElement.textContent = 'Not available';
    }
}

// Fetch historical exchange rate data
async function fetchHistoricalData(timeRange) {
    try {
        // Reset simulated data flag
        window.usingSimulatedData = false;
        
        // Check if we have cached data for this time range that's still valid
        const now = new Date().getTime();
        if (cachedData.historical[timeRange] && cachedData.lastFetched.historical[timeRange] && 
            (now - cachedData.lastFetched.historical[timeRange]) < CACHE_DURATION) {
            console.log(`Using cached historical data for ${timeRange}`);
            return cachedData.historical[timeRange];
        }
        
        const endDate = new Date();
        let startDate = new Date();
        
        // Calculate start date based on selected time range
        switch (timeRange) {
            case '24h':
                startDate.setDate(endDate.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '1m':
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case '3m':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case '1y':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case '5y':
                startDate.setFullYear(endDate.getFullYear() - 5);
                break;
            case '10y':
                startDate.setFullYear(endDate.getFullYear() - 10);
                break;
            case 'max':
                // For max, we'll go back 20 years as an example
                startDate.setFullYear(endDate.getFullYear() - 20);
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1); // Default to 1 year
        }
        
        // Create an array to store historical data points
        const historicalDataPoints = [];
        
        // For longer time ranges, we need to fetch data for multiple dates
        // We'll sample dates based on the time range to avoid too many API calls
        const sampleDates = getSampleDates(startDate, endDate, timeRange);
        
        console.log(`Fetching historical data for ${timeRange} with ${sampleDates.length} sample points`);
        
        // Fetch data for each sample date
        for (const date of sampleDates) {
            try {
                const year = date.getFullYear();
                const month = date.getMonth() + 1; // JavaScript months are 0-indexed
                const day = date.getDate();
                
                console.log(`Fetching historical rate for ${year}-${month}-${day}`);
                const url = `${API_BASE_URL}${API_KEY}/history/${BASE_CURRENCY}/${year}/${month}/${day}`;
                console.log(`API URL: ${url}`);
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`API HTTP error: ${response.status} ${response.statusText}`);
                    console.error(`Response body: ${errorText}`);
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.result === 'success') {
                    // Extract the exchange rate for the target currency
                    const rate = data.conversion_rates[TARGET_CURRENCY];
                    
                    if (rate) {
                        historicalDataPoints.push({
                            date: new Date(year, month - 1, day), // Convert back to 0-indexed month
                            rate: rate
                        });
                    }
                } else if (data.result === 'error' && data['error-type'] === 'plan-upgrade-required') {
                    console.warn('Historical data requires a paid plan. Falling back to simulated data.');
                    // If we get a plan-upgrade-required error, break the loop and use simulated data
                    break;
                } else if (data.result === 'error' && data['error-type'] === 'no-data-available') {
                    console.warn(`No data available for ${year}-${month}-${day}`);
                    // Continue to the next date
                    continue;
                } else {
                    console.error('API returned error result:', data);
                    throw new Error(`API returned error: ${data['error-type'] || 'Unknown error'}`);
                }
                
                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Error fetching data for date ${date.toISOString().split('T')[0]}:`, error);
                // Continue with the next date instead of failing completely
                continue;
            }
        }
        
        // If we couldn't get any historical data points from the API, fall back to simulated data
        if (historicalDataPoints.length === 0) {
            console.warn('No historical data points retrieved from API. Using simulated data.');
            const simulatedData = generateSimulatedHistoricalData(startDate, endDate, timeRange);
            
            // Cache the simulated data
            cachedData.historical[timeRange] = simulatedData;
            cachedData.lastFetched.historical[timeRange] = now;
            
            return simulatedData;
        }
        
        // Sort the data points by date
        historicalDataPoints.sort((a, b) => a.date - b.date);
        
        // Cache the data
        cachedData.historical[timeRange] = historicalDataPoints;
        cachedData.lastFetched.historical[timeRange] = now;
        
        return historicalDataPoints;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        showError('Failed to fetch historical exchange rate data. Please try again later.');
        return [];
    }
}

// Generate sample dates for historical data fetching
function getSampleDates(startDate, endDate, timeRange) {
    const sampleDates = [];
    const totalDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    // Determine the sampling interval based on the time range
    let samplingInterval;
    switch (timeRange) {
        case '24h':
            // For 24h, get hourly data (but API only supports daily, so we'll just get today)
            sampleDates.push(new Date(endDate));
            return sampleDates;
        case '7d':
            // For 7 days, get daily data
            samplingInterval = 1;
            break;
        case '1m':
            // For 1 month, get data every 3-4 days
            samplingInterval = 3;
            break;
        case '3m':
            // For 3 months, get weekly data
            samplingInterval = 7;
            break;
        case '1y':
            // For 1 year, get bi-weekly data
            samplingInterval = 14;
            break;
        case '5y':
            // For 5 years, get monthly data
            samplingInterval = 30;
            break;
        case '10y':
            // For 10 years, get data every 2 months
            samplingInterval = 60;
            break;
        case 'max':
            // For max range, get data every 6 months
            samplingInterval = 180;
            break;
        default:
            samplingInterval = 30; // Default to monthly
    }
    
    // Calculate the number of samples we want
    // Limit to a reasonable number to avoid too many API calls
    const maxSamples = 20;
    let actualInterval = Math.max(samplingInterval, Math.ceil(totalDays / maxSamples));
    
    // Generate sample dates
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        sampleDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + actualInterval);
    }
    
    // Always include the end date if it's not already included
    if (sampleDates.length > 0 && 
        sampleDates[sampleDates.length - 1].getTime() !== endDate.getTime()) {
        sampleDates.push(new Date(endDate));
    }
    
    return sampleDates;
}

// Generate simulated historical data for demonstration
function generateSimulatedHistoricalData(startDate, endDate, timeRange) {
    // Flag that we're using simulated data
    window.usingSimulatedData = true;
    
    const data = [];
    const baseRate = cachedData.latest ? cachedData.latest.conversion_rates[TARGET_CURRENCY] : 15000; // Approximate USD/IDR rate
    const volatility = 0.02; // 2% volatility
    
    // Determine the interval between data points based on time range
    let interval;
    let totalPoints;
    
    switch (timeRange) {
        case '24h':
            interval = 60 * 60 * 1000; // 1 hour in milliseconds
            totalPoints = 24;
            break;
        case '7d':
            interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            totalPoints = 7;
            break;
        case '1m':
            interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
            totalPoints = 30;
            break;
        case '3m':
            interval = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
            totalPoints = 30;
            break;
        case '1y':
            interval = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
            totalPoints = 52;
            break;
        case '5y':
            interval = 30 * 24 * 60 * 60 * 1000; // 1 month in milliseconds
            totalPoints = 60;
            break;
        case '10y':
            interval = 60 * 24 * 60 * 60 * 1000; // 2 months in milliseconds
            totalPoints = 60;
            break;
        case 'max':
            interval = 120 * 24 * 60 * 60 * 1000; // 4 months in milliseconds
            totalPoints = 60;
            break;
        default:
            interval = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
            totalPoints = 52;
    }
    
    // Generate data points with a realistic trend
    let currentRate = baseRate * 0.7; // Start lower than current rate
    let currentDate = new Date(startDate.getTime());
    
    for (let i = 0; i < totalPoints; i++) {
        // Add some randomness to the rate
        const randomFactor = 1 + (Math.random() * volatility * 2 - volatility);
        
        // For a realistic trend, gradually move towards the current rate
        const trendFactor = i / totalPoints;
        currentRate = currentRate * (1 - trendFactor) + baseRate * trendFactor * randomFactor;
        
        data.push({
            date: new Date(currentDate.getTime()),
            rate: currentRate
        });
        
        currentDate = new Date(currentDate.getTime() + interval);
    }
    
    // Ensure the last point is close to the current rate
    data.push({
        date: new Date(endDate.getTime()),
        rate: baseRate * (1 + (Math.random() * volatility * 0.5 - volatility * 0.25))
    });
    
    // Return empty array to hide chart
    return [];
}

// Update chart data based on selected time range
async function updateChartData(forceRefresh = false) {
    showLoading();
    
    try {
        const timeRange = timeRangeSelector.value;
        
        // Clear cache if force refresh is requested
        if (forceRefresh) {
            cachedData.lastFetched.historical[timeRange] = null;
        }
        
        historicalData = await fetchHistoricalData(timeRange);
        
        // Show or hide chart container based on data availability and whether we're using simulated data
        const chartContainer = document.querySelector('.chart-container');
        const chartControls = document.querySelector('.chart-controls');
        
        if (historicalData.length === 0 || window.usingSimulatedData) {
            // Hide chart and show message if no historical data or using simulated data
            if (chartContainer) {
                chartContainer.style.display = 'none';
                
                // Create message element if it doesn't exist
                let messageElement = document.getElementById('historical-data-message');
                if (!messageElement) {
                    messageElement = document.createElement('div');
                    messageElement.id = 'historical-data-message';
                    messageElement.className = 'historical-data-message';
                    messageElement.innerHTML = `
                        <p><strong>Historical Data Unavailable</strong></p>
                        <p>The historical exchange rate chart is currently unavailable.</p>
                        <p>This feature requires a paid API plan with historical data access.</p>
                        <p>Please check back later when API access has been upgraded.</p>
                    `;
                    chartContainer.parentNode.insertBefore(messageElement, chartContainer.nextSibling);
                } else {
                    messageElement.style.display = 'block';
                }
            }
        } else {
            // Show chart and hide message if historical data exists and not using simulated data
            if (chartContainer) {
                chartContainer.style.display = 'block';
                
                // Hide message if it exists
                const messageElement = document.getElementById('historical-data-message');
                if (messageElement) {
                    messageElement.style.display = 'none';
                }
                
                // Update chart display
                updateChartDisplay();
            }
        }
    } catch (error) {
        console.error('Error updating chart data:', error);
        showError('Failed to update chart data. Please try again later.');
    } finally {
        hideLoading();
    }
}

// Update the chart display with the current data
function updateChartDisplay() {
    // If no historical data is available, don't try to update the chart
    if (historicalData.length === 0) return;
    
    const chartData = historicalData.map(item => {
        let rate = item.rate;
        if (currentViewMode === 'idr-to-usd') {
            rate = 1 / rate;
        }
        return {
            x: item.date,
            y: rate
        };
    });
    
    const yAxisLabel = currentViewMode === 'usd-to-idr' ? 'USD to IDR Rate' : 'IDR to USD Rate';
    
    // Destroy existing chart if it exists
    if (exchangeRateChart) {
        exchangeRateChart.destroy();
    }
    
    // Create new chart
    exchangeRateChart = new Chart(chartElement, {
        type: 'line',
        data: {
            datasets: [{
                label: yAxisLabel,
                data: chartData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: getTimeUnit(timeRangeSelector.value),
                        displayFormats: {
                            hour: 'HH:mm',
                            day: 'MMM d',
                            week: 'MMM d',
                            month: 'MMM yyyy',
                            quarter: 'MMM yyyy',
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel
                    },
                    ticks: {
                        callback: function(value) {
                            if (currentViewMode === 'usd-to-idr') {
                                return value.toLocaleString();
                            } else {
                                return value.toFixed(8);
                            }
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (currentViewMode === 'usd-to-idr') {
                                label += context.parsed.y.toFixed(2);
                            } else {
                                label += context.parsed.y.toFixed(8);
                            }
                            return label;
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// Get appropriate time unit based on selected time range
function getTimeUnit(timeRange) {
    switch (timeRange) {
        case '24h': return 'hour';
        case '7d': return 'day';
        case '1m': return 'day';
        case '3m': return 'week';
        case '1y': return 'month';
        case '5y': return 'quarter';
        case '10y': return 'year';
        case 'max': return 'year';
        default: return 'month';
    }
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show error message
function showError(message) {
    // Create a custom error dialog
    const errorDialog = document.createElement('div');
    errorDialog.className = 'error-dialog';
    errorDialog.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button id="error-ok-btn">OK</button>
        </div>
    `;
    
    document.body.appendChild(errorDialog);
    
    // Add event listener to close the dialog
    document.getElementById('error-ok-btn').addEventListener('click', () => {
        errorDialog.remove();
    });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);