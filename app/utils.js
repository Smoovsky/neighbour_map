import $ from 'jQuery';
import throttle from 'lodash/throttle';
import getZomatoApiInfo from './api.js';

let data = JSON.parse(localStorage.getItem('neighbourMap'));
if(data === null || data.length == 0){
  data = [
    {title:'St. George Fish and Chips', location: {lat:-37.779298,lng:144.987183}, address:'350 St Georges Rd, Fitzroy North VIC 3068', rating: 4.4, price4two: 20},
    {title:'Munsterhaus', location: {lat:-37.778893,lng:144.987367}, address:'371 St Georges Rd, Fitzroy North VIC 3068', rating: 4.3, price4two:24},
    {title:'Gler Thai Takeaway', location:{lat:-37.779313, lng:144.987378}, address:'354 St Georges Rd, Fitzroy North VIC 3068', rating: 4.6, price4two: 15},
  ];
  localStorage.setItem('neighbourMap', JSON.stringify(data));
}

window.data = data;

window.markers = [];
window.placeMarkers = [];
window.makeMarkerIcon = function(markerColor) {
  // console.log(google);
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
};
window.showListings = function(rescope) {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  if(rescope === undefined)
    map.fitBounds(bounds);
};

window.textSearchPlaces = function() {
  var bounds = map.getBounds();
  hideMarkers(placeMarkers);
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: document.getElementById('places-search').value,
    bounds: bounds
  }, function(results, status) {
    // window.tep = results;
    // console.log(results,status);
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createMarkersForPlaces(results);
    }
  });
};
window.hideMarkers = function(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
};
window.createMarkersForPlaces = function(places) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };
    // Create a marker for each place.
    var marker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id
    });
    // Create a single infowindow to be used with the place details information
    // so that only one is open at once.
    var placeInfoWindow = new google.maps.InfoWindow();
    // If a marker is clicked, do a place details search on it in the next function.

    marker.openInfoWindow = function() {
      var self = marker;
      if (placeInfoWindow.marker == self) {
        console.log('This infowindow already is on this marker!');
      } else {
        getPlacesDetails(this, placeInfoWindow);
      }
    };

    marker.addListener('click', marker.openInfoWindow);
    placeMarkers.push(marker);
    if (place.geometry.viewport) {
      // Only geocodes have viewport.
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  }
  map.fitBounds(bounds);
};
window.searchBoxPlaces = function(searchBox) {
  hideMarkers(placeMarkers);
  var places = searchBox.getPlaces();
  if (places.length == 0) {
    window.alert('We did not find any places matching that search!');
  } else {
    // For each place, get the icon, name and location.
    createMarkersForPlaces(places);
  }
};
window.getPlacesDetails = function(marker, infowindow) {
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      let placeInfo = {
        title:place.name,
        location:{
          lat:place.geometry.location.lat(),
          lng:place.geometry.location.lng(),
        },
        address:place.formatted_address,
        id:place.id,
      };
      //console.log(place);
      getZomatoApiInfo(place.name, {lat:place.geometry.location.lat(),
        lon:place.geometry.location.lng()})
        .then(
          (res) =>{
            //console.log(res);
            placeInfo.rating = res.user_rating.aggregate_rating;
            placeInfo.price4two = res.average_cost_for_two;
            placeInfo = JSON.stringify(placeInfo);
            infowindow.marker = marker;
            var innerHTML = `<div id="${marker.id}">`;
            if (place.name) {
              innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
              innerHTML += '<br>' + place.formatted_address;
            }
            if (res.average_cost_for_two) {
              innerHTML += '<br>' + 'Average Cost for Two: $' + res.average_cost_for_two;
            }
            if (res.user_rating) {
              innerHTML += '<br>' + 'Rating: ' + res.user_rating.aggregate_rating + '/5';
            }
            // if (place.formatted_phone_number) {
            //   innerHTML += '<br>' + place.formatted_phone_number;
            // }
            // if (place.opening_hours) {
            //   innerHTML += '<br><br><strong>Hours:</strong><br>' +
            //           place.opening_hours.weekday_text[0] + '<br>' +
            //           place.opening_hours.weekday_text[1] + '<br>' +
            //           place.opening_hours.weekday_text[2] + '<br>' +
            //           place.opening_hours.weekday_text[3] + '<br>' +
            //           place.opening_hours.weekday_text[4] + '<br>' +
            //           place.opening_hours.weekday_text[5] + '<br>' +
            //           place.opening_hours.weekday_text[6];
            // }
            // if (place.photos) {
            //   innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            //     {maxHeight: 100, maxWidth: 200}) + '">';
            // }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
              infowindow.marker = null;
            });
            
            let target = $('<div>').data('data-location',placeInfo).attr({'data-bind':'event: {click: addEntry}'}).append($('<i class="fas fa-plus"></i>')).appendTo($(`#${marker.id}`))[0];
            //ko.applyBindings();
            ko.applyBindings(viewModel, target);
          //$(`#${marker.id}`).click(addFav);
          // console.log($(`#${marker.id}`), addFav);
          }
        )
        .catch(()=>{
          //console.log(res);
          placeInfo.rating = null;
          placeInfo.price4two = null;
          placeInfo = JSON.stringify(placeInfo);
          infowindow.marker = marker;
          var innerHTML = `<div id="${marker.id}">`;
          if (place.name) {
            innerHTML += '<strong>' + place.name + '</strong>';
          }
          if (place.formatted_address) {
            innerHTML += '<br>' + place.formatted_address;
          }
          innerHTML += '<br>' + 'Average Price for Two: N/A';
          innerHTML += '<br>' + 'Rating: N/A';
          // if (place.formatted_phone_number) {
          //   innerHTML += '<br>' + place.formatted_phone_number;
          // }
          // if (place.opening_hours) {
          //   innerHTML += '<br><br><strong>Hours:</strong><br>' +
          //           place.opening_hours.weekday_text[0] + '<br>' +
          //           place.opening_hours.weekday_text[1] + '<br>' +
          //           place.opening_hours.weekday_text[2] + '<br>' +
          //           place.opening_hours.weekday_text[3] + '<br>' +
          //           place.opening_hours.weekday_text[4] + '<br>' +
          //           place.opening_hours.weekday_text[5] + '<br>' +
          //           place.opening_hours.weekday_text[6];
          // }
          // if (place.photos) {
          //   innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
          //     {maxHeight: 100, maxWidth: 200}) + '">';
          // }
          innerHTML += '</div>';
          infowindow.setContent(innerHTML);
          infowindow.open(map, marker);
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
          let target = $('<div>').data('data-location',placeInfo).attr({'data-bind':'event: {click: addEntry}'}).append($('<i class="fas fa-plus"></i>')).appendTo($(`#${marker.id}`))[0];
          //ko.applyBindings();
          ko.applyBindings(viewModel, target);
        //$(`#${marker.id}`).click(addFav);
        // console.log($(`#${marker.id}`), addFav);
        });
      //console.log(placeInfo);
      // Set the marker property on this infowindow so it isn't created again.
    }
  });
};
window.populatePlaceDetailsOffline = function(marker, place, infowindow){
  //console.log(place);
  infowindow.marker = marker;
  var innerHTML = `<div id="${marker.id}">`;
  if (place.title) {
    innerHTML += '<strong>' + place.title + '</strong>';
  }
  if (place.address) {
    innerHTML += '<br>' + place.address;
  }
  if (place.rating) {
    innerHTML += '<br>' + 'Rating:' + place.rating + '/5';
  }
  else {
    innerHTML += '<br>' + 'Rating:' + 'N/A';
  }

  if (place.price4two) {
    innerHTML += '<br>' + 'Price for two: $' + place.price4two;
  }
  else {
    innerHTML += '<br>' + 'Price for two: N/A';
  }

  innerHTML += '</div>';
  infowindow.setContent(innerHTML);
  infowindow.open(map, marker);
  // Make sure the marker property is cleared if the infowindow is closed.
  infowindow.addListener('closeclick', function() {
    infowindow.marker = null;
  });
};

let initMap = () => {
  let mapContainer = $('<div id="map"></div>').css({flex:'7', padding:0, height:'100%'}).addClass('transition-animation').appendTo(container);

  window.initMapInternal = function() {
    window.map = new window.google.maps.Map(document.getElementById('map'), {
      center: data[0].location,
      zoom: 14
    });
    let searchBox = new google.maps.places.SearchBox(document.getElementById('places-search'));
    searchBox.setBounds(map.getBounds());
    searchBox.addListener('places_changed', function() {
      searchBoxPlaces(this);
    });
    map.addListener('bounds_changed', function() {
      //console.log(searchBox);
      searchBox.setBounds(map.getBounds());
    });

    for(let i = 0; i < data.length; i++){
      let currentPlace = data[i];
      let position = currentPlace.location;
      let title = currentPlace.title;
      let marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        //icon: defaultIcon,
        id: i
      });
      currentPlace.marker = marker;
      markers.push(marker);
      let placeInfoWindow = new google.maps.InfoWindow();

      marker.openInfoWindow = function(){
        if (placeInfoWindow.marker == marker) {
          console.log('This infowindow already is on this marker!');
        } else {
          populatePlaceDetailsOffline(marker, currentPlace, placeInfoWindow);
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function(){marker.setAnimation(null);}, 2000);
        }
      }
      

      marker.addListener('click', marker.openInfoWindow);
    }
    showListings();
  };
  $.getScript(
    'https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=AIzaSyAcUtsavPhlJKS70a3_AKI_bOFDuiUIvyY&v=3&callback=initMapInternal');
  return {mapContainer};
};

let initMenu = () =>{
  let menu = $('<div id="menu"></div>');
  let utilBox = $('<div id ="util" class="utils"></div>').appendTo(menu);

  menu.css({flex:'3', padding:0, height:'100%',maxWidth:'500px'}).addClass('transition-animation').appendTo(container);

  let filterBox = $('<input />');
  $('<div>').html('<label>Filter:</label>').append(filterBox).appendTo(utilBox);

  let icon = $('<div>').addClass('switch-icon-container');
  $('<i id="bars" >').addClass('fas fa-bars').css({'font-size':'50px'}).appendTo(icon);
  icon.click(function(){toggleMenu(menu,$('#map'));});
  icon.appendTo(menu);

  let searchBox = $('<div>').html('<label>Search:</label>');
  $('<input id="places-search" type="text" placeholder="Ex: Fish and Chips" style="margin:10px auto">' ).appendTo(searchBox);
  $('<input id="go-places" type="button" class="searchButton" value="Go">').click(textSearchPlaces).appendTo(searchBox);
  searchBox.appendTo(utilBox);

  let result = $('<ul>').addClass('resultList').attr({'data-bind':'foreach: displayResult'}).appendTo(menu).append($('<li class="listItem">').attr({'data-bind':'click:$parent.itemClick'}).append($('<div class="listItemRemoveButton"><i class="fas fa-minus listItemRemoveButtonContent "></i></div>').attr({'data-bind':'click:$parent.removeEntry'}),$('<span>').attr({'data-bind':'text: title'})));

  return {menu, filterBox};
};

let toggleMenu = (menu) => {
  let toggle = () => {
    if (menu.css('max-width') == '500px'){
      menu.css({'max-width':'0px'});
      $('#bars').css({'transform':'rotate(90deg)'});
    }else{
      menu.css({'max-width':'500px'});
      $('#bars').css({'transform':'rotate(0deg)'});
    }
  };
  toggle = throttle(toggle, 1000);
  toggle();
};

export  {
  initMap,
  initMenu,
  toggleMenu,
};
