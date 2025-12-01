const ARTISTS_ENDPOINT = '/proxy/artists';

let artists = [];
let suggestionValues = [];
let activeSuggestionIndex = -1;
let lastFilterResult = [];

const searchInput = document.getElementById('globalSearch');
const suggestionsEl = document.getElementById('suggestions');
const filterForm = document.getElementById('filterForm');
const resultsEl = document.getElementById('results');

function normalize(value) {
    if (value === undefined || value === null) {
        value = '';
    }
    value = value + '';
    value = value.toString();
    value = value.trim();
    value = value.toLowerCase();
    return value;
}

function cleanDate(date) {
    if (!date) {
        return '';
    }
    return date.replace(/^\*/, '');
}

function toHumanDate(str) {
    var value = cleanDate(str);
    var parts = value.split('-');

    if (parts.length !== 3) {
        return value;
    }

    var day = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var year = Number(parts[2]);

    var d = new Date(Date.UTC(year, month, day));
    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function titleCase(str) {
    if (!str) {
        return '';
    }
    var parts = str.split(' ');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            parts[i] = parts[i][0].toUpperCase() + parts[i].slice(1);
        }
    }
    return parts.join(' ');
}

function formatPlace(slug) {
    if (typeof slug !== 'string') {
        return slug;
    }

    var pieces = slug.split('-');
    var country = pieces.pop();
    var city = pieces.join(' ').replace(/_/g, ' ');
    var result = titleCase(city);

    if (country) {
        result += ', ' + country.toUpperCase();
    }
    return result.trim();
}


function buildResultCard(artist) {
    var card = document.createElement('article');
    card.className = 'result-card';

    var imageSrc = artist.image || '/static/img/a.png';
    var membersLabel;
    if (artist.membersCount === 1) {
        membersLabel = '1 member';
    } else {
        membersLabel = (artist.membersCount || 0) + ' members';
    }

    card.innerHTML =
        '<div class="result-card-header">' +
        '<img class="result-card-image" src="' + imageSrc + '" alt="' + artist.name + '">' +
        '</div>' +
        '<div class="result-card-body">' +
        '<h3>' + artist.name + '</h3>' +
        '<p class="meta"><strong>Members:</strong> ' + membersLabel + '</p>' +
        '<p class="meta"><strong>Location:</strong> ' + (artist.location || 'N/A') + '</p>' +
        '<p class="meta"><strong>First album:</strong> ' + (artist.firstAlbumHuman || artist.firstAlbum) + '</p>' +
        '<p class="meta"><strong>Creation date:</strong> ' + artist.creationDate + '</p>' +
        '</div>';

    return card;
}

function renderResults(list) {
    if (!list || list.length === 0) {
        resultsEl.innerHTML =
            '<p class="empty-state">No results. Try different keywords or filter values.</p>';
        return;
    }

    var wrapper = document.createElement('div');
    wrapper.className = 'result-grid';

    for (var i = 0; i < list.length; i++) {
        wrapper.appendChild(buildResultCard(list[i]));
    }

    resultsEl.replaceChildren(wrapper);
}


function applyFilters() {
    var rawQuery = searchInput.value;
    var query = normalize(rawQuery);

    var formData = new FormData(filterForm);
    var rawName = formData.get('name');
    var rawLocation = formData.get('location');
    var rawFirstAlbum = formData.get('firstAlbum');
    var rawCreationDate = formData.get('creationDate');

    // Members range (from the double slider)
    var minMembers = 0;
    var maxMembers = Infinity;

    if (typeof sliderOne !== 'undefined' && sliderOne && typeof sliderTwo !== 'undefined' && sliderTwo) {
        minMembers = parseInt(sliderOne.value, 10);
        maxMembers = parseInt(sliderTwo.value, 10);

        if (isNaN(minMembers)) {
            minMembers = 0;
        }
        if (isNaN(maxMembers)) {
            maxMembers = Infinity;
        }
    }

    var filters = {
        name: normalize(rawName),
        location: normalize(rawLocation),
        firstAlbum: normalize(rawFirstAlbum),
        creationDate: normalize(rawCreationDate)
    };

    var filtered = [];

    for (var i = 0; i < artists.length; i++) {
        var artist = artists[i];

        var membersNames = artist.membersNames || [];

        var nName = normalize(artist.name);
        var nLocation = normalize(artist.location);
        var nFirstAlbum = normalize(artist.firstAlbumHuman || artist.firstAlbum);
        var nCreationDate = normalize(artist.creationDate);
        var nMembersJoined = normalize(membersNames.join(' '));
        var membersCount = artist.membersCount || 0;

        var haystack = nName + ' ' + nLocation + ' ' + nFirstAlbum + ' ' + nCreationDate + ' ' + nMembersJoined;

        var queryMatch;
        if (query) {
            queryMatch = haystack.indexOf(query) !== -1;
        } else {
            queryMatch = true;
        }

        var nameMatch;
        if (filters.name) {
            nameMatch = nName.indexOf(filters.name) !== -1;
        } else {
            nameMatch = true;
        }

        var membersMatch;
        // Filter by numeric members count using the slider range
        membersMatch = membersCount >= minMembers && membersCount <= maxMembers;

        var locationMatch;
        if (filters.location) {
            locationMatch = nLocation.indexOf(filters.location) !== -1;
        } else {
            locationMatch = true;
        }

        var albumMatch;
        if (filters.firstAlbum) {
            albumMatch = nFirstAlbum.indexOf(filters.firstAlbum) !== -1;
        } else {
            albumMatch = true;
        }

        var creationMatch;
        if (filters.creationDate) {
            creationMatch = nCreationDate.indexOf(filters.creationDate) !== -1;
        } else {
            creationMatch = true;
        }

        if (queryMatch && nameMatch && membersMatch && locationMatch && albumMatch && creationMatch) {
            filtered.push(artist);
        }
    }

    lastFilterResult = filtered;
    renderResults(lastFilterResult);
}


function clearSuggestions() {
    suggestionsEl.innerHTML = '';
    activeSuggestionIndex = -1;
}

function updateSuggestions() {
    var valueFromInput = searchInput.value;
    var value = normalize(valueFromInput);
    clearSuggestions();

    if (!value) {
        suggestionsEl.classList.remove('visible');
        return;
    }

    var matches = [];
    for (var i = 0; i < suggestionValues.length; i++) {
        if (matches.length >= 6) {
            break;
        }
        var text = suggestionValues[i];
        var normalizedSuggestion = normalize(text);
        if (normalizedSuggestion.indexOf(value) !== -1) {
            matches.push(text);
        }
    }

    if (matches.length === 0) {
        suggestionsEl.classList.remove('visible');
        return;
    }

    for (var j = 0; j < matches.length; j++) {
        var singleMatch = matches[j];
        var li = document.createElement('li');
        li.textContent = singleMatch;
        li.dataset.index = j;
        li.addEventListener('mousedown', function (event) {
            event.preventDefault();
            var chosenText = this.textContent;
            selectSuggestion(chosenText);
        });
        suggestionsEl.appendChild(li);
    }

    suggestionsEl.classList.add('visible');
}

function highlightSuggestion(index) {
    var items = suggestionsEl.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
        if (i === index) {
            items[i].classList.add('active');
        } else {
            items[i].classList.remove('active');
        }
    }
}

function selectSuggestion(text) {
    searchInput.value = text;
    suggestionsEl.classList.remove('visible');
    applyFilters();
}

function enrichArtistsWithDerivedFields(rawArtists) {
    var result = [];

    for (var i = 0; i < rawArtists.length; i++) {
        var artist = rawArtists[i];
        var membersArray;

        if (Array.isArray(artist.members)) {
            membersArray = artist.members;
        } else {
            membersArray = [];
        }

        result.push({
            id: artist.id,
            name: artist.name,
            image: artist.image,
            creationDate: artist.creationDate,
            firstAlbum: artist.firstAlbum,
            members: artist.members,
            membersNames: membersArray,
            membersCount: membersArray.length,
            firstAlbumHuman: artist.firstAlbum ? toHumanDate(artist.firstAlbum) : ''
        });
    }

    return result;
}

function addLocationsToArtists(baseArtists) {
    var promises = [];

    for (var i = 0; i < baseArtists.length; i++) {
        // wrap in an IIFE so each async callback gets its own artist variable
        (function (artist) {
            var p = fetch('/proxy/relation/' + artist.id)
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Failed to fetch relations for artist ' + artist.id);
                    }
                    return response.json();
                })
                .then(function (data) {
                    var datesLocations = (data && data.datesLocations) ? data.datesLocations : {};
                    var rawLocations = Object.keys(datesLocations);

                    if (rawLocations.length === 0) {
                        artist.location = 'No tour locations yet';
                        return artist;
                    }

                    var formatted = [];
                    for (var j = 0; j < rawLocations.length; j++) {
                        formatted.push(formatPlace(rawLocations[j]));
                    }

                    var seen = {};
                    var unique = [];
                    for (var k = 0; k < formatted.length; k++) {
                        var f = formatted[k];
                        if (!seen[f]) {
                            seen[f] = true;
                            unique.push(f);
                        }
                    }

                    var summary;
                    if (unique.length <= 3) {
                        summary = unique.join(' • ');
                    } else {
                        summary = unique.slice(0, 3).join(' • ') + ' +' + (unique.length - 3) + ' more';
                    }

                    artist.location = summary;
                    return artist;
                })
                .catch(function () {
                    artist.location = 'No tour locations yet';
                    return artist;
                });

            promises.push(p);
        })(baseArtists[i]);
    }

    return Promise.all(promises);
}

function loadArtists() {
    fetch(ARTISTS_ENDPOINT)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Failed to fetch artists for search');
            }
            return response.json();
        })
        .then(function (data) {
            return enrichArtistsWithDerivedFields(data || []);
        })
        .then(function (enriched) {
            return addLocationsToArtists(enriched);
        })
        .then(function (withLocations) {
            artists = withLocations;

            var pool = [];
            for (var i = 0; i < artists.length; i++) {
                var a = artists[i];
                if (a.name) {
                    pool.push(a.name);
                }
                var members = a.membersNames || [];
                for (var j = 0; j < members.length; j++) {
                    if (members[j]) {
                        pool.push(members[j]);
                    }
                }
            }

            var seen = {};
            var finalValues = [];
            for (var k = 0; k < pool.length; k++) {
                var label = pool[k];
                var key = normalize(label);
                if (!key || seen[key]) {
                    continue;
                }
                seen[key] = true;
                finalValues.push(label);
            }
            suggestionValues = finalValues;

            renderResults(artists);
        })
        .catch(function (err) {
            console.error(err);
            resultsEl.innerHTML = '<p class="empty-state">Could not load artists. Please refresh and try again.</p>';
        });
}

searchInput.addEventListener('input', function () {
    updateSuggestions();
    applyFilters();
});

searchInput.addEventListener('keydown', function (event) {
    var items = suggestionsEl.querySelectorAll('li');
    if (!items.length) {
        return;
    }

    if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
        highlightSuggestion(activeSuggestionIndex);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
        highlightSuggestion(activeSuggestionIndex);
    } else if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
        event.preventDefault();
        selectSuggestion(items[activeSuggestionIndex].textContent);
    }
});

filterForm.addEventListener('input', function () {
    applyFilters();
});

filterForm.addEventListener('reset', function () {
    applyFilters();
});

loadArtists();

window.onload = function () {
    slideOne();
    slideTwo();
  };
  
  let sliderOne = document.getElementById("slider-1");
  let sliderTwo = document.getElementById("slider-2");
  let displayValOne = document.getElementById("range1");
  let displayValTwo = document.getElementById("range2");
  let minGap = 0;
  let sliderTrack = document.querySelector(".slider-track");
  let sliderMaxValue = document.getElementById("slider-1").max;
  
  function slideOne() {
    if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
      sliderOne.value = parseInt(sliderTwo.value) - minGap;
    }
    displayValOne.textContent = sliderOne.value;
    fillColor();
  }
  function slideTwo() {
    if (parseInt(sliderTwo.value) - parseInt(sliderOne.value) <= minGap) {
      sliderTwo.value = parseInt(sliderOne.value) + minGap;
    }
    displayValTwo.textContent = sliderTwo.value;
    fillColor();
  }
  function fillColor() {
    percent1 = (sliderOne.value / sliderMaxValue) * 100;
    percent2 = (sliderTwo.value / sliderMaxValue) * 100;
    sliderTrack.style.background = `linear-gradient(to right, #dadae5 ${percent1}% , #3264fe ${percent1}% , #3264fe ${percent2}%, #dadae5 ${percent2}%)`;
  }
  