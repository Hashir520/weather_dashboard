
const API_KEY = 'b8fb87a3577f326ecef60e7fe9231d0c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const unitToggle = document.getElementById('unit-toggle');
const refreshBtn = document.getElementById('refresh-btn');
const currentCity = document.getElementById('current-city');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const feelsLike = document.getElementById('feels-like');
const forecastContainer = document.getElementById('forecast-container');

let currentUnit = 'metric';
let currentLocation = 'Toronto';

document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherData(currentLocation);
    
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    unitToggle.addEventListener('click', toggleUnit);
    refreshBtn.addEventListener('click', () => fetchWeatherData(currentLocation));
});

function handleSearch() {
    const location = searchInput.value.trim();
    if (location) {
        currentLocation = location;
        fetchWeatherData(location);
        searchInput.value = '';
    }
}

function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    unitToggle.textContent = currentUnit === 'metric' ? 'Switch to °F' : 'Switch to °C';
    fetchWeatherData(currentLocation);
}

async function fetchWeatherData(location) {
    try {
        showLoadingState();
        
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${location}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('Location not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${location}&units=${currentUnit}&appid=${API_KEY}`
        );
        const forecastData = await forecastResponse.json();
        
        updateCurrentWeather(currentWeatherData);
        updateForecast(forecastData);
        animateWeatherCards();
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showErrorState(error.message);
    }
}

function showLoadingState() {
    currentCity.textContent = 'Loading...';
    currentDate.textContent = '--';
    currentTemp.textContent = '--°';
    weatherIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    weatherDesc.textContent = '--';
    humidity.textContent = '--%';
    windSpeed.textContent = '-- m/s';
    feelsLike.textContent = '--°';
    
    forecastContainer.innerHTML = `
        <div class="forecast-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading forecast...</p>
        </div>
    `;
}

function showErrorState(message) {
    currentCity.textContent = 'Error';
    currentDate.textContent = '--';
    currentTemp.textContent = '--°';
    weatherIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    weatherDesc.textContent = message;
    humidity.textContent = '--%';
    windSpeed.textContent = '-- m/s';
    feelsLike.textContent = '--°';
    
    forecastContainer.innerHTML = `
        <div class="forecast-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

function updateCurrentWeather(data) {
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    const speedUnit = currentUnit === 'metric' ? 'm/s' : 'mph';
    const date = new Date(data.dt * 1000);
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    currentCity.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = formattedDate;
    currentTemp.textContent = `${Math.round(data.main.temp)}${tempUnit}`;
    weatherIcon.innerHTML = getWeatherIcon(data.weather[0].id, data.weather[0].icon);
    weatherDesc.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} ${speedUnit}`;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}${tempUnit}`;
    
    updateBackground(data.weather[0].main);
}

function updateForecast(data) {
    const tempUnit = currentUnit === 'metric' ? '°C' : '°F';
    
    const dailyForecast = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecast[date]) {
            dailyForecast[date] = {
                temps: [],
                weather: []
            };
        }
        dailyForecast[date].temps.push(item.main.temp);
        dailyForecast[date].weather.push(item.weather[0]);
    });
    
    const forecastDates = Object.keys(dailyForecast).slice(1, 6);
    
    let forecastHTML = '';
    forecastDates.forEach(date => {
        const dayData = dailyForecast[date];
        const maxTemp = Math.max(...dayData.temps);
        const minTemp = Math.min(...dayData.temps);
        
        const mostCommonWeather = mode(dayData.weather.map(w => w.id));
        const weatherIcon = getWeatherIcon(mostCommonWeather, dayData.weather[0].icon);
        const weatherDescription = mode(dayData.weather.map(w => w.description));
        
        const displayDate = new Date(date).toLocaleDateString('en-US', { 
            weekday: 'short' 
        });
        
        forecastHTML += `
            <div class="forecast-item">
                <div class="forecast-day">${displayDate}</div>
                <div class="forecast-icon">${weatherIcon}</div>
                <div class="forecast-temp">${Math.round(maxTemp)}${tempUnit} / ${Math.round(minTemp)}${tempUnit}</div>
                <div class="forecast-desc">${weatherDescription}</div>
            </div>
        `;
    });
    
    forecastContainer.innerHTML = forecastHTML;
}

function updateBackground(weatherCondition) {
    const body = document.body;
    
    body.classList.remove(
        'weather-sunny',
        'weather-cloudy',
        'weather-rainy',
        'weather-snowy',
        'weather-thunderstorm'
    );
    
    switch (weatherCondition.toLowerCase()) {
        case 'clear':
            body.classList.add('weather-sunny');
            break;
        case 'clouds':
            body.classList.add('weather-cloudy');
            break;
        case 'rain':
        case 'drizzle':
            body.classList.add('weather-rainy');
            break;
        case 'snow':
            body.classList.add('weather-snowy');
            break;
        case 'thunderstorm':
            body.classList.add('weather-thunderstorm');
            break;
        default:
            break;
    }
}

function animateWeatherCards() {
    const cards = document.querySelectorAll('.forecast-item');
    
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
}

function mode(array) {
    const count = {};
    array.forEach(item => {
        count[item] = (count[item] || 0) + 1;
    });
    return Object.keys(count).reduce((a, b) => count[a] > count[b] ? a : b);
}

function getWeatherIcon(weatherCode, iconCode = null) {
    if (iconCode) {
        return `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather icon" class="weather-icon-img">`;
    }
    
    if (weatherCode >= 200 && weatherCode < 300) {
        return '<i class="fas fa-bolt thunder-icon"></i>';
    } else if (weatherCode >= 300 && weatherCode < 400) {
        return '<i class="fas fa-cloud-rain rain-icon"></i>';
    } else if (weatherCode >= 500 && weatherCode < 600) {
        return '<i class="fas fa-umbrella rain-icon"></i>';
    } else if (weatherCode >= 600 && weatherCode < 700) {
        return '<i class="far fa-snowflake snow-icon"></i>';
    } else if (weatherCode >= 700 && weatherCode < 800) {
        return '<i class="fas fa-smog fog-icon"></i>';
    } else if (weatherCode === 800) {
        return '<i class="fas fa-sun sun-icon"></i>';
    } else if (weatherCode > 800) {
        return '<i class="fas fa-cloud cloud-icon"></i>';
    } else {
        return '<i class="fas fa-question"></i>';
    }
}
   