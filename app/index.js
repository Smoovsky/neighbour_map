/**
 * Application entry point
 */

// Load application styles
import 'styles/index.css';
import $ from 'jQuery';
import ko from 'knockout';
import {initMap, initMenu, toggleMenu} from './utils.js';

window.ko = ko;
// ================================
// START YOUR APP HERE
// ================================

let container = $('#container').addClass('container');
//container.css({width:'100%', height:'90vh',display:'flex'});

let {menu, filterBox} = initMenu();
let {mapContainer} = initMap();
filterBox.attr({'data-bind':'event: {keyup: setFilter}'});
// console.log(filterBox);

window.viewModel = new AppViewModel();
function AppViewModel(){
  let self = this;
  self.search = '';
  self.data = [...data];
  self.displayResult = ko.observableArray([...self.data]);
  self.setFilter = function(vm,e){
    // console.log(g.target.value);
    let dataArray = self.data;
    dataArray = dataArray.filter(x => x.title.search(new RegExp(e.target.value, 'i')) !== -1);
    self.data.forEach(
      (x) => {
        if(!dataArray.includes(x))
          x.marker.setMap(null);
        else {
          x.marker.setMap(map);
        }
      }
    );
    self.displayResult(dataArray);
  };
  self.removeEntry = function(item,e){
    e.stopPropagation();
    item.marker.setMap(null);
    self.data.splice(self.data.indexOf(item), 1);
    self.displayResult([...self.data]);
    let temp = self.data.map(({title, location, address}) => {return {title, location, address};});
    // console.log(data);
    // console.log(temp);
    localStorage.setItem('neighbourMap', JSON.stringify(temp));
  };
  self.addEntry = function(vm, e){
    if($(e.target).is('i')){
      let entry = JSON.parse($(e.target).parent().data('data-location'));
      console.log(entry);
      self.data.push(entry);
      self.displayResult([...self.data]);
      let marker = new google.maps.Marker({
        position: entry.location,
        title: entry.title,
        animation: google.maps.Animation.DROP,
        //icon: defaultIcon,
        id: entry.id
      });
      entry.marker = marker;
      let placeInfoWindow = new google.maps.InfoWindow();

      marker.openInfoWindow = function(){
        if (placeInfoWindow.marker == marker) {
          console.log('This infowindow already is on this marker!');
        } else {
          populatePlaceDetailsOffline(marker, entry, placeInfoWindow);
        }
      };

      marker.addListener('click', marker.openInfoWindow);
      markers.push(marker);
      let temp = self.data.map(({title, location, address, price4two, rating}) => {return {title, location, address, price4two, rating};});
      //console.log();
      localStorage.setItem('neighbourMap', JSON.stringify(temp));
      showListings(true);
      
    }
  };
  self.itemClick = function(item){
    window.map.setCenter(item.marker.getPosition());
    item.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){item.marker.setAnimation(null);}, 2000);
    item.marker.openInfoWindow();
    //console.log(item);
  };
}

ko.applyBindings(viewModel);
