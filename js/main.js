let html
let detailHTML
let realtime
let hours
let et
let mins
let date_obj
let str
let next = 0
let locale
let caller
let activeFunction
let defaultLocale = 'New York'

const selection = document.getElementById('location')
const forecastForSpan = document.querySelector('.forecast-for')
const today = '#today'

const getForecast = async() =>{
    if(!locale){
        locale=defaultLocale
    }
    let response = await axios.get(`http://api.weatherapi.com/v1/forecast.json?key=1437c50ccc304fb797554155231609&q=${locale}&days=3&alerts=yes$aqi=yes`)
    console.log(response)
    return response.data
}

const getCurrent = async() =>{
    if(!locale){
        locale=defaultLocale
    }
    let response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=1437c50ccc304fb797554155231609&q=${locale}`)
    console.log(response.data)
    return response.data
}

const getTomorrow = async() =>{
    if(!locale){
        locale=defaultLocale
    }
    let response = await axios.get(`http://api.weatherapi.com/v1/forecast.json?key=1437c50ccc304fb797554155231609&q=${locale}&days=2`)
    console.log(response.data)
    return response.data
}

const defaultView = async() =>{
    if(!locale){
        locale=defaultLocale
    }
    let response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=1437c50ccc304fb797554155231609&q=${locale}`)
    console.log(response.data)
    return response.data
}

const defaultForecast = async() =>{
    if(!locale){
        locale=defaultLocale
    }
    let response = await axios.get(`http://api.weatherapi.com/v1/forecast.json?key=1437c50ccc304fb797554155231609&days=2&q=${locale}`)
    //console.log(response)
    return response.data
}

let currentConditionsHTML
const currentConditions = (skyCond,temp,feelsLike,sunrise,sunset,currIcon,maxTemp,minTemp) =>{
    currentConditionsHTML = `<div class="clouds">${skyCond}<div class="temp">${Math.trunc(temp)}&degF</div></div>
    <div class="icon"><img src="${currIcon}" alt=""></div>
    <div class="feels-like">Feels like ${Math.trunc(feelsLike)}&degF</div>
    <div class="sun-rise-set"><span class="sunrise"><i class="bi bi-sunrise">${sunrise}</i></span><span class="sunset"><i class="bi bi-sunset">${sunset}</i></span></div>
     <div class="hi-low-temp"><span>Hi ${Math.trunc(maxTemp)}&degF</span><span>Low ${Math.trunc(minTemp)}&degF</span></div>`

document.querySelector('.current-weather').insertAdjacentHTML('beforeend',currentConditionsHTML)

}

const hourlyForcast = (time,condition,icon,rainChance,wind,temp) =>{
    let html2,html3
    if(condition.length > 17){
        html2 = `<div class="condition-text text-center" style="font-size:.75em">${condition}</div>`
        html3 = `<div class="temp mb-3 pb-2" style="margin-top:12px">${temp}&deg</div>`
    }else{
        html2 = `<div class="condition-text text-center">${condition}</div>`
        html3 = `<div class="temp mt-4 mb-3 pb-2">${Math.ceil(temp)}&deg</div>`
    }
    
    html= `<div class="col-lg m-1 hr-dt">
    <div class="time text-center mt-2">${time}</div>
    <div class="weather-icon text-center mb-2"><img src="${icon}" width=100 alt=""></div>
    ${html2}
    <div class="rain-icon mt-2"><img src="images/raindrops.png" alt=""><span class="rain-chance">${rainChance}%</span></div>
    <div class="wind-icon mt-2"><img src="images/wind.png" alt=""><span class="wind">${Math.ceil(wind)} mph</span></div>
    ${html3}
</div>`

document.querySelector(today).insertAdjacentHTML('beforeend',html)

}

let locationData = document.getElementById('location-data')

const displayDetailView = (humidity,pressure,windspeed,windDirection,visibility,uvIndex) =>{
    detailHTML = `<form method="POST" action="javascript:getFormInput()">
    <input id="location-input" type="text" value="" placeholder="City and State or Zip Code"></form>
    <table class="mt-2">
    <tr>
    <td>Humidity:</td>
    <td> ${humidity}%</td>
    </tr>
    <tr>
    <td>Pressure:</td>
    <td> ${pressure}</td>
    </tr>
    <tr>
    <td>Wind:</td>
    <td>${windspeed} mph ${windDirection}</td>
    </tr>
    <tr>
    <td>Visibility:</td>
    <td>${visibility} mile(s)</td>
    </tr>
    <tr><td>UV Index:</td><td>${uvIndex}</td></tr>
    </table>`
    
    
    
    
    
    locationData.insertAdjacentHTML('beforeend',detailHTML)

}

/**
 * 
 * @getCurrentTimeCount
 * takes in time_epoch from response and evaluates against
 * current time until epoch is > current time
 * @returns the current time posistion in the .hour object
 * ...used to target the current time so the forecast starts from
 * now +1 hour
 * 
 */
function getCurrentTimeCount(epochTime){
    let hourLength = epochTime.length
    let count
    for(let i=0;i<hourLength;i++){
        let thisTime = Date.now()
        if(thisTime <= epochTime[i].time_epoch*1000){
            count = i
            break;   
        }
    }
    console.log("returning count: "+count)
    return count
}

/**
 * 
 * @getRealTime
 * takes in time_epoch from response (*1000) and
 * @returns a formatted time-only string to display
 * in the hourly forecast blocks
 * 
 */

function getRealTime(epochOlips){
    date_obj = new Date(epochOlips);
    hours = date_obj.getHours();
    mins = date_obj.getMinutes();
    if( hours == 0){
        realtime =  "12:" + (mins < 10 ? "0" + mins : mins)+"AM";
    }else if(hours < 12){
        realtime = hours + ":" + (mins < 10 ? "0" + mins : mins)+"AM";
    }else{
        hours == 12 ? "12" : hours = hours - 12
        realtime = hours + ":" + (mins < 10 ? "0" + mins : mins)+"PM";
    }
    return realtime
}

/**
 * 
 * @getHourlyForecastStartCurrentTime
 * takes in api response object and displays the
 * hourly forecast in one hour increments starting
 * at the current hour +1
 * 
 * @returns nothing
 * 
 * opted to break this to a function as it gets used in several places and
 * is a chunky monkey
 *  
 */
function getHourlyForecastStartCurrentTime(day,caller){
    document.querySelector(today).innerHTML=""
    let forecastDay = 0
    let count
    let displayCounter = 0
    let thisEpoch = day.forecast.forecastday[0].hour
    if(caller=='loadTomorrow' || caller=='navigation'){
        console.log("next "+next)
        count=next*7 
    }else{
        count = getCurrentTimeCount(thisEpoch) // else we are looking at a normal forecast (start current)
    }
    console.log("count: "+count)
    for(let i=count;i<=count+6;i++){
        getHourly = day.forecast.forecastday[forecastDay].hour[i]
        if(!getHourly){
            forecastDay++
            for(i=0;i<7-displayCounter;i++){              // display forecast details from next day to total 7 displays
                getHourly = day.forecast.forecastday[forecastDay].hour[i]
                time = getRealTime(getHourly.time_epoch*1000)
                hourlyForcast(
                    time,
                    getHourly.condition.text,
                    getHourly.condition.icon,
                    getHourly.chance_of_rain,
                    getHourly.wind_mph,
                    getHourly.temp_f
                    )
            }
            break
        }else{
            time = getRealTime(getHourly.time_epoch*1000)
            hourlyForcast(
                time,
                getHourly.condition.text,
                getHourly.condition.icon,
                getHourly.chance_of_rain,
                getHourly.wind_mph,
                getHourly.temp_f
                )
        }
        displayCounter++ //keeps track of how many boxes are displayed in the forecast area
    }
}

/**
 * @loadNext
 * function tied to the tomorrow button currently (needs a next button)
 * evaluates <next> variable (basically a page counter) and resets if
 * we are above 3 (7days displayed at a time x3 = 21), rotating the display
 * back to the beginning (12:00AM) 
 * ...clears the display area as it calls the next...
 * 
 * may need to add a param for the calling function so we are reloading the 
 * correct view?
 *
 */
function loadNext(){
    console.log("click")
    next >= 3 ? next=0 : next++ 
    console.log("next: "+next)
    switch (caller){
    case 'loadTomorrow':
        caller = 'navigation'
        loadTomorrow()
        break
    case 'loadForecast':
        caller='navigation'
        loadForecast()
        break
    }
}
 function loadPrevious(){
    next == 0 ? next : next--
    document.querySelector(today).innerHTML=""
    switch (caller){
    case 'loadTomorrow':
        caller='navigation'
        loadTomorrow()
        break
    case 'loadForecast':
        caller='navigation'
        loadForecast()
        break
    }
 }


const  loadDefaultForecast = async() => {
    const defForecast = await defaultForecast()
    console.log(defForecast)

    forecastForSpan.innerHTML=`Today for ${defForecast.location.name}, ${defForecast.location.region}`
    let getHourly
    let count
    let thisEpoch = defForecast.forecast.forecastday[0].hour

    count = getCurrentTimeCount(thisEpoch)

    let x=0
    let counter = 0
    for(let i=count;i<=23;i++){    
        counter++
        if(counter > 7){
            break
        }
        getHourly = defForecast.forecast.forecastday[x].hour[i]
        time = getRealTime(getHourly.time_epoch*1000)
        hourlyForcast(
            time,
            getHourly.condition.text,
            getHourly.condition.icon,
            getHourly.chance_of_rain,
            getHourly.wind_mph,
            getHourly.temp_f
            )
    }

}

const loadDetailView = async () => {
    const detailView = await getForecast()
    document.querySelector('#location-data').innerHTML=""
    displayDetailView(
        detailView.current.humidity,
        detailView.current.pressure_in,
        detailView.current.wind_mph,
        detailView.current.wind_dir,
        detailView.current.vis_miles,
        detailView.current.uv

    )


}

const loadForecast = async() => {
    console.log("caller: "+caller)
    const forecast = await getForecast()
    if(caller != 'navigation'){
        caller = 'loadForecast'
        next = 0
    }
    forecastForSpan.innerHTML=`Forecast for ${forecast.location.name}, ${forecast.location.region}`
    getHourlyForecastStartCurrentTime(forecast,caller)
}

const loadCurrent = async() => {
    document.querySelector('.current-weather').innerHTML=""
    const current = await getForecast()
    currentConditions(
        current.current.condition['text'],
        current.current.temp_f,
        current.current.feelslike_f,
        current.forecast.forecastday[0].astro.sunrise,
        current.forecast.forecastday[0].astro.sunset,
        current.current.condition['icon'],
        current.forecast.forecastday[0].day.maxtemp_f,
        current.forecast.forecastday[0].day.mintemp_f
    )

}
//loadCurrent()

const loadTomorrow = async() => {
    const tomorrow = await getTomorrow()
    if(caller == 'navigation'){
        caller = 'loadTomorrow'
    }else{
        caller = 'loadTomorrow'
        next = 0
    }
    forecastForSpan.innerHTML=`Tomorrow for ${tomorrow.location.name}, ${tomorrow.location.region}`
    getHourlyForecastStartCurrentTime(tomorrow,caller)
}

function getFormInput(){
    locale = document.getElementById('location-input').value
    loadViews()
}

const loadViews = () =>{
    loadForecast()
    loadCurrent()
    loadDetailView()
}

loadViews()
    
