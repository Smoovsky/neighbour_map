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

let container = $('#container');
container.css({width:'100%', height:'90vh', padding:0, display:'flex'});

let {menu, filterBox} = initMenu();
let {mapContainer} = initMap();
filterBox.attr({'data-bind':'event: {keyup: setFilter}'});
// console.log(filterBox);

let result = $('<ul>').addClass('resultList').addClass('listItem').attr({'data-bind':'foreach: displayResult'}).appendTo(menu).append($('<li>').attr({'data-bind':'text: title'}));

ko.bindingHandlers.addFav = {
  init(element, valueAccessor, allBindings, viewModel, bindingContext) {
    console.log('bind!');
    // ko.applyBindingsToNode(element, {
    //   css: { red: valueAccessor() > 1 }, // doesn't work
    //   text: valueAccessor() // works
    // }, bindingContext);
  }
}

window.viewModel = new AppViewModel();
function AppViewModel(){
  let self = this;
  self.search = '';
  self.data = [...mockData];
  self.displayResult = ko.observableArray([...self.data]);
  self.setFilter = function(vm,e){
    // console.log(g.target.value);
    let dataArray = self.data;
    dataArray = dataArray.filter(x => x.title.search(new RegExp(e.target.value, 'i')) !== -1);
    self.displayResult(dataArray);
  };
  self.addEntry = function(vm, e){
    if($(e.target).is('i')){
      let entry = JSON.parse($(e.target).parent().data('data-location'));
      //console.log(entry);
      self.data.push(entry);
      self.displayResult([...self.data]);
    }
  };
}

ko.applyBindings(viewModel);
//let arrayDisplay = [...mockData];




// setTimeout(function(){
//   console.log(233);
//   toggleMenu(menu, mapContainer);
// }, 3000);

window.menu = menu;
//toggleMenu(menu, mapContainer);
