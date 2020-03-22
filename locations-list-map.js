function toDataByLocation(data) {
  const headers = data.values[0];
  const approvedIndex = headers.findIndex( e => e === 'Approved' );
  const stateIndex = headers.findIndex( e => e === 'State?' );
  const cityIndex = headers.findIndex( e => e === 'City' );
  const data_by_location = {};

  const published_entries = data.values.slice(1).filter((entry) => entry[approvedIndex] === "x");

  published_entries.forEach( entry => {
    const state = entry[stateIndex];
    const city = entry[cityIndex];
    let entry_array;
    if (!(state in data_by_location) || !(city in data_by_location[state])) {
      entry_array = [];
      if (state in data_by_location) {
        data_by_location[state][city] = entry_array;
      } else {
        data_by_location[state] = { [city]: entry_array };
      }
    } else {
      entry_array = data_by_location[state][city];
    }
    const entry_obj = {};
    headers.forEach( (value, index) => {
      if (entry[index] !== undefined) {
        entry_obj[value] = entry[index]
      } else {
        entry_obj[value] = ""
      }
    });
    entry_array.push(entry_obj);
  });

  return data_by_location;
}

function createFiltersListHTML() {
  // We use objects here as a quick approach to removing duplicates.

  const states = {};
  const acceptOpenFilters = {};

  for (const state of Object.keys(data_by_location).sort()) {
    states[state] = true;

    const cities = data_by_location[state];
    for (const city of Object.keys(cities).sort()) {
      for (const entry of cities[city]) {
        const v = entry["Will they accept open boxes/bags?"];
        acceptOpenFilters[toHTMLID(v)] = v;
      }
    }
  }

  const filters = [];
  filters.push(`<h4>States</h4>`);
  for (const state of Object.keys(states)) {
    filters.push(`
      <div>
        <input
          id="state-${state}"
          type="checkbox"
          name="states"
          value="${state}"
          onchange="onFilterChange(this)"
          />
        <label
          id="state-${state}-label"
          for="state-${state}"
          >
          ${state}
        </label>
      </div>
    `);
  }

//  filters.push(`<h3>Accepts Open Boxes/bags</h3>`);
//  for (const id of Object.keys(acceptOpenFilters)) {
//    const val = acceptOpenFilters[id];
//    filters.push(`
//      <div>
//        <input
//          id="accept-open-${id}"
//          type="checkbox"
//          name="accept-open"
//          value="${id}"
//          onchange="onFilterChange(this)"
//          />
//        <label
//          id="accept-open-${id}-label"
//          for="accept-open-${id}"
//          >
//          ${val}
//        </label>
//      </div>
//    `);
//  }

  const acceptedItemsFilter = [
    'n95s',
    'masks',
    'face shields',
    'booties',
    'goggles',
    'gloves',
    'kleenex',
    'sanitizer',
    'overalls',
    'gowns',
    'respirators',
  ];
  filters.push(`<h4>Accepted Items</h4>`);
  for (const val of acceptedItemsFilter) {
    const id = toHTMLID(val);
    filters.push(`
      <div>
        <input
          id="accept-item-${id}"
          type="checkbox"
          name="accept-item"
          value="${val}"
          onchange="onFilterChange(this)"
          />
        <label
          id="accept-item-${id}-label"
          for="accept-item-${id}"
          >
          ${val}
        </label>
      </div>
    `);
  }

  return filters;
}

function toHTMLID(name) {
  let s = '';
  for (let i = 0; i < name.length; i++) {
    let c = name.charAt(i);
    // We remove `.` from IDs because selection using jQuery failed when they
    // appeared in IDs. TODO This should be investigated further.
    if (c.match(/^[a-z0-9_:]+$/i)) {
      s += c;
    } else {
      s += '-';
    }
  }
  return s.toLowerCase();
}

function toHtmlSnippets(data_by_location, filters) {
  const lines = [];

  for (const state of Object.keys(data_by_location).sort()) {
    if (filters && filters.states && !filters.states[state]) {
      continue;
    }

    const cityLines = [];

    const cities = data_by_location[state];
    for (const city of Object.keys(cities).sort()) {
      const entryLines = [];
      for (const entry of cities[city]) {
        const name = entry["What is the name of the hospital or clinic?"];
        const address = entry["Street address for dropoffs?"];
        const instructions = entry["Drop off instructions, eg curbside procedure or mailing address ATTN: instructions:"];
        const accepting = entry["What are they accepting?"];
        const will_they_accept = entry["Will they accept open boxes/bags?"];

        if (filters) {
//          if (filters.acceptOpens && !filters.acceptOpens[toHTMLID(will_they_accept)]) {
//            continue;
//          }
          if (filters.acceptItems) {
            let acc = accepting.toLowerCase();
            if (!Object.keys(filters.acceptItems).some(s => acc.includes(s))) {
              continue;
            }
          }
        }

        entryLines.push(`<div class=location>`)
        entryLines.push(`<h4 class="marginBottomZero">${name}</h4>`);

        entryLines.push(`<label>Address</label>`)
        entryLines.push(`<p class="marginTopZero medEmph">${address.replace(/\n/g,'<br>')}</p>`);

        if (instructions !== "") {
          entryLines.push(`<label>Instructions</label>`)
          entryLines.push(`<p>${instructions}</p>`);
        }
        if (accepting !== "") {
          entryLines.push(`<label>Accepting</label>`)
          entryLines.push(`<p>${accepting}</p>`);
        }
        if (will_they_accept !== "") {
          entryLines.push(`<label>Open packages?</label>`)
          entryLines.push(`<p>${will_they_accept}</p>`);
        }
        entryLines.push('</div>');
      }

      if (entryLines.length > 0) {
        cityLines.push(`<div class=city>`)
        cityLines.push(`<h3>${city}</h3>`);
        cityLines.push(entryLines.join('\n'));
        cityLines.push('</div>');
      }

    }

    if (cityLines.length > 0) {
      lines.push(`<div class=state>`);
      lines.push(`<h2>${state}</h2>`);
      lines.push(cityLines.join('\n'));
      lines.push('</div>');
    }
  }

  return lines;
}

document.addEventListener("DOMContentLoaded", function() {
  $.getJSON("https://findthemasks.com/data.json", function(result){
    // may end up using this for search / filtering...
    window.locations = result;
    window.data_by_location = toDataByLocation(locations);
    initMap();

    $(".filters-list").html(createFiltersListHTML(data_by_location).join(" "));

    const htmlSnippets = toHtmlSnippets(data_by_location, null);
    $(".locations-list").html(htmlSnippets.join(" "));
  });
});

function onFilterChange(elem) {
  // This is a hacky approach to programatically highlighting selected items as
  // it uses hard-coded ID references. We use this approach for now for
  // simplicity, speed of implementation and performance, but it should ideally
  // be replaced with a more robust solution if time allows and performance
  // isn't affected.
  let label = $("#" + elem.id + "-label");
  if (elem.checked) {
    label.addClass("selected");
  } else {
    label.removeClass("selected");
  }

  let states = null;
  document.filters['states'].forEach((state) => {
    if (state.checked) {
      if (states === null) {
        states = {};
      }
      states[state.value] = true;
    }
  });

//  let acceptOpens = null;
//  document.filters['accept-open'].forEach((acceptOpen) => {
//    if (acceptOpen.checked) {
//      if (acceptOpens === null) {
//        acceptOpens = {};
//      }
//      acceptOpens[acceptOpen.value] = true;
//    }
//  });

  let acceptItems = null;
  document.filters['accept-item'].forEach((acceptItem) => {
    if (acceptItem.checked) {
      if (acceptItems === null) {
        acceptItems = {};
      }
      acceptItems[acceptItem.value] = true;
    }
  });

  const filters = {states, acceptItems};
  const htmlSnippets = toHtmlSnippets(window.data_by_location, filters);
  $(".locations-list").html(htmlSnippets.join(" "));
}


 function initMap() {
     var data_by_location = window.data_by_location;
     var geocoder = new google.maps.Geocoder();
     var middle_of_us = { lat: 39.0567939, lng: -94.6065124};

     var element = document.getElementById('map');
     
     if (element == null) {
         alert('could not find map div');
     } 
         
     // The map, roughly zoomed to show the entire US.
     var map = new google.maps.Map( element, {zoom: 4, center: middle_of_us});

     // Uncomment block below if you want map to default to centering at user's location.
     /*  if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(function(position) {
             var cur_location = {
                 lat: position.coords.latitude,
                 lng: position.coords.longitude
             };

             map.setCenter(cur_location);
             map.setZoom(10);
         }, function() {
             alert('Could not get user location');
         });
     } else {
         // Browser doesn't support Geolocation
         alert('Could not get user location');
     }*/
     
     var i = 0;
     for (const state of Object.keys(data_by_location).sort()) {
         const cities = data_by_location[state];
         for (const city of Object.keys(cities).sort()) {
             const entryLines = [];
             for (const entry of cities[city]) {
                 const name = entry["What is the name of the hospital or clinic?"];
                 const address = entry["Street address for dropoffs?"];
                 const instructions = entry["Drop off instructions, eg curbside procedure or mailing address ATTN: instructions:"];
                 const accepting = entry["What are they accepting?"];
                 const open_accepted = entry["Will they accept open boxes/bags?"];

                 if (address != "N/A") {
                     addMarkerToMap(map, geocoder, address, name, instructions, accepting, open_accepted);
                     i++;
                     if (i > 3) {  
                        return;
                     }
                 }
             }
         }
     }
 }

function addMarkerToMap(map, geocoder, address, name, instructions, accepting, open_accepted) {      
    geocoder.geocode( { 'address': address}, function(results, status) {        
        if (status == 'OK') {
            // Text to go into InfoWindow
            var contentString =
                '<h4>' + name + '</h4><br>' +
                '<b>Address:</b> ' + address + '<br>' +
                '<b>Instructions:</b> ' + instructions + '<br>' +
                '<b>Accepting:</b> ' + accepting + '<br>' +
                '<b>Open Packages?:</b> ' + open_accepted + '<br>';            
            
            // InfoWindow will pop up when user clicks on marker
            var infowindow = new google.maps.InfoWindow({
              content: contentString
            });
            var marker = new google.maps.Marker({
                position: results[0].geometry.location,
                title: name,
                map: map
            });
            marker.addListener('click', function() {
                infowindow.open(map, marker);
            });
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}