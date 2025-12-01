const artistGrid = document.querySelector('[data-role="artist-grid"]');
const ARTISTS_ENDPOINT = '/proxy/artists';

function titleCase(str) {
    if (!str) {
        return '';
    }
    const parts = str.split(' ');
    for (let i = 0; i < parts.length; i++) {
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
    const pieces = slug.split('-');
    const country = pieces.pop();
    const city = pieces.join(' ').replace(/_/g, ' ');
    let result = titleCase(city);
    if (country) {
        result += ', ' + country.toUpperCase();
    }
    return result.trim();
}

function cleanDate(date) {
    if (!date) {
        return '';
    }
    return date.replace(/^\*/, '');
}

function toHumanDate(str) {
    const value = cleanDate(str);
    const parts = value.split('-');
    if (parts.length !== 3) {
        return value;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);

    const d = new Date(Date.UTC(year, month, day));
    if (isNaN(d.getTime())) {
        return value;
    }

    return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function showRelationsError(listElement, message) {
    if (!listElement) {
        return;
    }
    listElement.innerHTML = '';

    const li = document.createElement('li');
    li.className = 'artist-data-error';
    li.textContent = message;

    listElement.appendChild(li);
}

function fillRelationsList(listElement, relationsMap) {
    if (!listElement) {
        return;
    }

    listElement.innerHTML = '';

    if (!relationsMap) {
        showRelationsError(listElement, 'No data available');
        return;
    }

    const locations = Object.keys(relationsMap);
    if (locations.length === 0) {
        showRelationsError(listElement, 'No data available');
        return;
    }

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        const dates = relationsMap[location] || [];

        const row = document.createElement('li');
        row.className = 'relation-row';

        const locationSpan = document.createElement('span');
        locationSpan.className = 'relation-location';
        locationSpan.textContent = formatPlace(location);

        const datesContainer = document.createElement('div');
        datesContainer.className = 'relation-dates';

        for (let j = 0; j < dates.length; j++) {
            const chip = document.createElement('span');
            chip.className = 'date-chip';
            chip.textContent = toHumanDate(dates[j]);
            datesContainer.appendChild(chip);
        }

        row.appendChild(locationSpan);
        row.appendChild(datesContainer);
        listElement.appendChild(row);
    }
}

function createArtistCard(artist) {
    const article = document.createElement('article');
    article.className = 'artist-card';
    article.dataset.artistId = artist.id;

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'artist-image-wrapper';

    const img = document.createElement('img');
    img.className = 'artist-image';
    img.src = artist.image;
    img.alt = artist.name;

    const badge = document.createElement('span');
    badge.className = 'artist-id-badge';
    badge.textContent = 'ID ' + artist.id;

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(badge);

    const body = document.createElement('div');
    body.className = 'artist-body';

    const name = document.createElement('h2');
    name.className = 'artist-name';
    name.textContent = artist.name;

    const meta = document.createElement('p');
    meta.className = 'artist-meta';

    const yearSpan = document.createElement('span');
    yearSpan.className = 'artist-year';
    yearSpan.textContent = 'Since ' + artist.creationDate;

    const albumLabel = document.createElement('span');
    albumLabel.className = 'artist-album-label';
    albumLabel.textContent = 'First Album';

    const albumDate = document.createElement('span');
    albumDate.className = 'artist-album-date';
    albumDate.textContent = toHumanDate(artist.firstAlbum);

    meta.appendChild(yearSpan);
    meta.appendChild(albumLabel);
    meta.appendChild(albumDate);

    const membersWrapper = document.createElement('div');
    membersWrapper.className = 'artist-members';

    const membersTitle = document.createElement('h3');
    membersTitle.textContent = 'Members';

    const membersList = document.createElement('ul');
    const members = artist.members || [];
    for (let i = 0; i < members.length; i++) {
        const li = document.createElement('li');
        li.textContent = members[i];
        membersList.appendChild(li);
    }

    membersWrapper.appendChild(membersTitle);
    membersWrapper.appendChild(membersList);

    const dataWrapper = document.createElement('div');
    dataWrapper.className = 'artist-data';

    const dataBlock = document.createElement('div');
    dataBlock.className = 'artist-data-block';

    const relationsTitle = document.createElement('h3');
    relationsTitle.textContent = 'Concert dates';

    const relationsList = document.createElement('ul');
    relationsList.className = 'artist-data-list';
    relationsList.dataset.role = 'relations';

    dataBlock.appendChild(relationsTitle);
    dataBlock.appendChild(relationsList);
    dataWrapper.appendChild(dataBlock);

    body.appendChild(name);
    body.appendChild(meta);
    body.appendChild(membersWrapper);
    body.appendChild(dataWrapper);

    article.appendChild(imageWrapper);
    article.appendChild(body);

    return article;
}

function loadRelations(card, artistId) {
    const relationsList = card.querySelector('[data-role="relations"]');
    if (!relationsList) {
        return;
    }

    fetch('/proxy/relation/' + artistId)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Failed to fetch relations');
            }
            return response.json();
        })
        .then(function (data) {
            fillRelationsList(relationsList, data.datesLocations || {});
        })
        .catch(function (err) {
            console.error(err);
            showRelationsError(relationsList, 'Could not load relations');
        });
}

function main() {
    fetch(ARTISTS_ENDPOINT)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Failed to fetch artists');
            }
            return response.json();
        })
        .then(function (artists) {
            if (!artists || artists.length === 0) {
                return;
            }

            artistGrid.innerHTML = '';

            for (let i = 0; i < artists.length; i++) {
                const artist = artists[i];
                const card = createArtistCard(artist);
                artistGrid.appendChild(card);
                loadRelations(card, artist.id);
            }
        })
        .catch(function (err) {
            console.error(err);
        });
}

main();