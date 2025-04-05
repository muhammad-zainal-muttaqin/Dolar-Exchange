# USD/IDR Exchange Rate Charting Website

A web application that visualizes the exchange rate between the US Dollar (USD) and the Indonesian Rupiah (IDR) using interactive charts. The application displays both historical and near real-time exchange rate data.

## Features

- Interactive line chart displaying USD/IDR exchange rate data
- Toggle between USD to IDR and IDR to USD views
- Multiple time range selections (24 hours to maximum available history)
- Current exchange rate display with trend indicator
- Responsive design that works on desktop, tablet, and mobile devices
- Data caching to minimize API calls and stay within free tier limits
- 30-minute data refresh interval

## Technology Stack

- **HTML5**: For structure and content
- **CSS3**: For styling and responsive design
- **JavaScript**: For application logic and API integration
- **Chart.js**: For rendering interactive charts
- **Moment.js**: For date handling and formatting
- **ExchangeRate-API**: For exchange rate data

## Setup Instructions

1. Clone or download this repository
2. Open the project folder
3. Open `index.html` in your web browser

## API Usage

This application uses the [ExchangeRate-API](https://www.exchangerate-api.com/) to fetch exchange rate data. The free tier of this API is used with the following considerations:

- Data is cached for 30 minutes to minimize API calls
- The application now attempts to fetch historical data using the ExchangeRate-API's historical endpoint
- If historical data is not available (due to free tier limitations), it falls back to simulated data
- For full historical data access, a paid plan (Pro, Business, or Volume) is required

## Deployment

This application can be deployed on Vercel or any static site hosting service.

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

Muhammad Zainal M198