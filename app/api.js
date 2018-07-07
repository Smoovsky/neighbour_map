// zoomato api:
// b0cecfc8b16688dc4455161ac8117173
const apiKey = 'b0cecfc8b16688dc4455161ac8117173';
const apiAddr = 'https://developers.zomato.com/api/v2.1/';
const headers = {
  'user-key': apiKey,
};

//let geocode = {lat:-37.779298,lon:144.987183};

const getLocationFromGeocode = function(geocode){
  return fetch(`${apiAddr}geocode?lat=${geocode.lat}&lon=${geocode.lon}`,
    {
      method:'GET',
      headers:{
        'user-key': apiKey,
      },
    })
    .then((res)=>{
      return res.json();
    });
  // .then((res)=>{
  //   console.log(res);
  // })
};

const getPriceAndRate = function(location, name, geocode){
  //console.log(location);
  return location.then(
    (location) => {
      return fetch(`${apiAddr}search?entity_id=${location.entity_id}&entity_type=${location.entity_type}&lat=${geocode.lat}&lon=${geocode.lon}&count=1&radius=100&q=${name}`,{
        method:'GET',
        headers:{
          'user-key': apiKey,
        },
      })
        .then(res => res.json())
        .then((res) => {
          if(res.results_found == 0){
            throw Error('Restaurant not found.');
          }
          return res.restaurants[0].restaurant;
        });
    }
  );
};

const getZomatoApiInfo = function(name, geocode){
  //console.log(name);
  return getPriceAndRate(getLocationFromGeocode(geocode), name, geocode);
};

export default getZomatoApiInfo;
//getPriceAndRate(getLocationFromGeocode(geocode), 'St. George Fish and Chips', geocode);
