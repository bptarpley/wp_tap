import { ArtMenu } from './tap-art-menu.js'


export class ArtMap {
    constructor (tap_instance, artmap_div) {
        this.tap = tap_instance
        this.element = artmap_div
        this.criteria = {'page-size': 150, 'page': 1, 'f_location.country': 'United States'}
        this.metadata = {}
        this.locations = {}
        this.exhibits = {}
        this.artwork_exhibit_map = {}

        this.element.html(`
            <ul class="nav nav-tabs" id="tap-artmap-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="texas-tab" data-tab-name="texas" data-toggle="tab" data-target="#texas" type="button" role="tab" aria-controls="texas" aria-selected="true">Texas</button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="us-tab" data-toggle="tab" data-target="#us" type="button" role="tab" aria-controls="us" aria-selected="false">United States</button>
                </li>
                <li class="ml-auto">
                  <span class="mr-3">
                    <svg height="20" width="20">
                      <circle
                        class="tap-artmap-marker-circle"
                        cx="10"
                        cy="10"
                        r="8"
                        fill="white"
                        stroke="white"
                        stroke-width="1" />
                    </svg>
                    <span class="tap-artmap-marker-label legend">
                      Depicted Place
                    </span>
                  </span>
                  <span>
                    <img src="${this.tap.plugin_url}/img/museum.svg" style="height: 20px; width: 20px;">
                    <span class="tap-artmap-marker-label legend">
                      Exhibit
                    </span>
                  </span>
                </li>
                
            </ul>
            <div class="tab-content" id="tap-artmap-content">
                <div class="tab-pane fade show active" id="texas" role="tabpanel" aria-labelledby="texas-tab">Texas</div>
                <div class="tab-pane fade" id="us" role="tabpanel" aria-labelledby="us-tab">United States</div>
            </div>
        `)

        this.texas_tab = jQuery('#texas')
        this.texas_map = null

        this.marker_cluster = null
        this.exhibit_cluster = null

        this.us_tab = jQuery('#us')
        this.us_map = null
        this.us_map_drawn = false

        this.active_tab = 'texas'
        this.current_location = null

        this.marker_popup = null
        this.exhibit_popup = null

        this.texas_tab.html(`
            <div class="row">
              <div class="col-sm-4" id="tap-texas-artmenu-div">
                <div id="tap-artmenu"></div>
              </div>
              <div class="col-sm-8" id="tap-texas-artmap-div">
                <div id="tap-texas-artmap" class="w-100 mb-3" style="height: 600px;"></div>
                <tc-range-slider
                    id="tap-artslider"
                    class="time-slider"
                    slider-width="100%"
                    keyboard-disabled="true"
                    mousewheel-disabled="true"
                    min="1880"
                    max="1990"
                    value1="1880"
                    value2="1990"
                    step="10"
                    marks="true"
                    marks-count="${window.innerWidth <= 767 ? '6' : '12'}"
                    marks-values-count="${window.innerWidth <= 767 ? '6' : '12'}"
                    marks-values-color="#000000">
                </tc-range-slider>
                <div id="tap-artmap-attribution-div" style="margin-top: 65px;"></div>
              </div>
            </div>
        `)
        this.us_tab.html(`
            <div class="row">
              <div class="col-sm-4" id="tap-us-artmenu-div"></div>
              <div class="col-sm-8" id="tap-us-artmap-div">
                <div id="tap-us-artmap" class="w-100 mb-3" style="height: 600px;"></div>
              </div>
            </div>
        `)

        let sender = this

        // rig up our custom "zoom to home" button for use by both tx and us maps
        L.Control.ZoomHome = sender.add_map_home_button()

        this.artslider = jQuery('#tap-artslider')[0]
        this.artslider.addCSS(`
            .mark-value {
                font-size: 12px;
            }
        `)
        this.artslider_timer = null
        this.artslider.addEventListener('change', (evt) => {
            clearTimeout(sender.artslider_timer)
            sender.artslider_timer = setTimeout(() => {
                if (sender.artslider.value1 > 1880 || sender.artslider.value2 < 1990) {
                    sender.criteria['r_year'] = `${sender.artslider.value1}to${sender.artslider.value2}`
                    sender.artmenu.active_filters['Year'] = {
                        param: 'r_year',
                        value: `${sender.artslider.value1} - ${sender.artslider.value2}`
                    }
                } else {
                    delete sender.criteria['r_year']
                }
                sender.artmenu.show_active_filters()
                sender.load_images(false)
            }, 1000)
        })

        jQuery('button[data-toggle="tab"]').on('shown.bs.tab', function (event) {
            sender.active_tab = event.target.id.replace('-tab', '')

            let active_tab_menu_div = jQuery(`#tap-${sender.active_tab}-artmenu-div`)
            let active_tab_map_div = jQuery(`#tap-${sender.active_tab}-artmap-div`)
            let attribution_div = jQuery(`#tap-artmap-attribution-div`)

            sender.artmenu.element.detach().appendTo(active_tab_menu_div)
            jQuery(sender.artslider).detach().appendTo(active_tab_map_div)
            attribution_div.detach().appendTo(active_tab_map_div)

            if (sender.active_tab === 'us' && !sender.us_map_drawn) {
                setTimeout(function() {
                    sender.draw_us_map()
                }, 1000)
            } else {
                sender.load_images(false)
            }
        })

        setTimeout(function() {
            sender.draw_texas_map()
        }, 1000)
    }

    draw_texas_map() {
        let sender = this
        fetch(`${sender.tap.plugin_url}/texas_fixed.json`)
            .then(response => response.json())
            .then(texas_shape => {
                    let texas_bounds = [
                        [36.48314061639213, -106.5234375],
                        [25.90864446329127, -93.603515625]
                    ]
                    sender.texas_map = L.map('tap-texas-artmap', {zoomSnap: 0.3})
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                    }).addTo(sender.texas_map)
                    sender.texas_map.fitBounds(texas_bounds, {padding: [20, 20]})

                    let texas_poly = L.polygon(texas_shape, {
                        color: '#d5b09d',
                        fill: true,
                        fillOpacity: 1,
                        interactive: false
                    })
                    texas_poly.addTo(sender.texas_map)
                    texas_poly.bringToFront()

                    new L.Control.ZoomHome({homeBounds: texas_bounds}).addTo(sender.texas_map)

                    jQuery('.leaflet-control-attribution').detach().appendTo(jQuery('#tap-artmap-attribution-div'))

                    sender.artmenu = new ArtMenu(sender.tap, jQuery('#tap-artmenu'), sender, 'Search', false, false)

                    sender.marker_popup = L.popup({maxHeight: 300})
                    sender.exhibit_popup = L.popup({maxHeight: 300})
                    sender.texas_map.on('popupclose', e => {
                        sender.texas_map.flyTo(sender.locations[sender.current_location].coordinates)
                    })

                    sender.tap.make_request(
                        `/api/corpus/${sender.tap.corpus_id}/Exhibit/`,
                        'GET',
                        {'page-size': 500, 'f_agents.id': this.tap.buck_agent_id},
                        function(exhibits) {
                            if (exhibits.records) {
                                exhibits.records.forEach(exhibit => {
                                    if (exhibit.location && exhibit.location.coordinates) {
                                        sender.exhibits[exhibit.id] = Object.assign({artworks: []}, exhibit)
                                        sender.exhibits[exhibit.id].location.coordinates = [sender.exhibits[exhibit.id].location.coordinates[1], sender.exhibits[exhibit.id].location.coordinates[0]]
                                        sender.locations[sender.exhibits[exhibit.id].location.id] = Object.assign({artworks: []}, sender.exhibits[exhibit.id].location)
                                    }
                                })

                                sender.tap.make_request(
                                    `/api/corpus/${sender.tap.corpus_id}/Exhibition/`,
                                    'GET',
                                    {'page-size': 1000, 'only': 'exhibit.id,artwork.id', content_view: 'corpus_6328b1338170d921f63fc09d_buck_exhibitions'},
                                    function(exhibitions) {
                                        if (exhibitions.records) {
                                            exhibitions.records.forEach(exhibition => {
                                                if (!(exhibition.artwork.id in sender.artwork_exhibit_map)) {
                                                    sender.artwork_exhibit_map[exhibition.artwork.id] = []
                                                }
                                                sender.artwork_exhibit_map[exhibition.artwork.id].push(exhibition.exhibit.id)
                                            })
                                        }

                                        sender.load_images(false)
                                    }
                                )
                            }
                        }
                    )
                }
            )
    }

    draw_us_map() {
        let sender = this
        fetch(`${sender.tap.plugin_url}/usa.json`)
            .then(response => response.json())
            .then(usa_shapes => {
                    let us_bounds = [
                        [49.12081854517537,-125.84908980237064],
                        [24.581804314541866,-65.87274522302415]
                    ]
                    sender.us_map = L.map('tap-us-artmap', { zoomSnap: 0.3, attributionControl: false })
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19
                    }).addTo(sender.us_map)

                    sender.us_map.fitBounds(us_bounds, { padding: [20,20] })

                    new L.Control.ZoomHome({homeBounds: us_bounds}).addTo(sender.us_map)

                    let state_markers = new L.FeatureGroup()

                    usa_shapes.forEach(state_shape => {
                        let state_poly = L.geoJSON(state_shape, {
                            fillColor: '#A5B9C4',
                            fill: true,
                            fillOpacity: 1,
                            color: '#FFFFFF',
                            weight: 1,
                            interactive: false
                        })
                        state_poly.addTo(sender.us_map)
                        state_poly.bringToFront()

                        if (state_shape.properties.abbreviation) {
                            let state_center = state_poly.getBounds().getCenter()
                            if (state_shape.properties.label_coords) state_center = state_shape.properties.label_coords

                            let marker = new L.Marker(
                                state_center,
                                {
                                    icon: new L.DivIcon({
                                        className: 'tap-artmap-marker',
                                        iconSize: [20, 20],
                                        iconAnchor: [10, 10],
                                        html: `
                                    <span class="tap-artmap-state-abbreviation">
                                      ${state_shape.properties.abbreviation}
                                    </span>
                                `
                                    })
                                }
                            )
                            state_markers.addLayer(marker)
                        }
                    })



                    sender.us_map.on('popupclose', e => {
                        sender.us_map.flyTo(sender.locations[sender.current_location].coordinates)
                    })
                    sender.us_map_drawn = true

                    sender.us_map.on('zoomend', function(e) {
                        if (sender.us_map.getZoom() < 5) sender.us_map.removeLayer(state_markers)
                        else sender.us_map.addLayer(state_markers)
                    })
                }
            )
    }

    add_map_home_button(opts) {
        return L.Control.extend({
            options: {
                position: 'topleft',
                homeBounds: null
            },

            onAdd: function(map) {
                let home_button = L.DomUtil.create('button', 'leaflet-control-zoom-home')
                home_button.type = 'button'
                home_button.title = 'Zoom to Home'
                home_button.setAttribute('aria-label', 'Zoom to Home')
                home_button.innerHTML = '<span class="dashicons dashicons-admin-home"></span>'

                L.DomEvent.on(home_button, 'click', () => {
                    this.zoomHome()
                })
                L.DomEvent.on(home_button, 'mousedown click dblclick', L.DomEvent.stopPropagation)

                return home_button
            },

            zoomHome: function() {
                this._map.fitBounds(this.options.homeBounds, {padding: [20,20]})
            }

        })
    }

    load_images(reset=true) {
        let sender = this
        let relevant_locations = []
        Object.keys(sender.locations).forEach(loc_id => {
            sender.locations[loc_id].artworks = []
        })
        Object.keys(sender.exhibits).forEach(exhibit_id => {
            sender.exhibits[exhibit_id].artworks = []
        })
        if (sender.marker_cluster) sender.marker_cluster.remove()
        if (sender.exhibit_cluster) sender.exhibit_cluster.remove()

        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/ArtWork/`,
            'GET',
            Object.assign(sender.criteria, {'f_artists.id': sender.tap.buck_agent_id}),
            function (artworks) {
                if (artworks.records) {
                    artworks.records.forEach(artwork => {
                        if (!(artwork.id in sender.metadata)) sender.metadata[artwork.id] = Object.assign({}, artwork)

                        if (artwork.location && artwork.location.coordinates.length) {
                            if (!(artwork.location.id in sender.locations)) {
                                sender.locations[artwork.location.id] = Object.assign({}, artwork.location)
                                sender.locations[artwork.location.id].coordinates = [sender.locations[artwork.location.id].coordinates[1], sender.locations[artwork.location.id].coordinates[0]]
                                sender.locations[artwork.location.id].artworks = []
                            }
                            if (sender.active_tab === 'us' || (sender.active_tab === 'texas' && artwork.location.state === 'Texas')) {
                                if (!relevant_locations.includes(artwork.location.id)) relevant_locations.push(artwork.location.id)
                                sender.locations[artwork.location.id].artworks.push(artwork.id)
                            }
                        }
                    })

                    sender.marker_cluster = L.markerClusterGroup({
                        iconCreateFunction: cluster => {
                            let size = cluster.getChildCount()
                            return L.divIcon({
                                className: 'tap-artmap-cluster',
                                html: `
                                    <svg height="50" width="50">
                                      <circle
                                        class="tap-artmap-marker-circle"
                                        cx="25"
                                        cy="25"
                                        r="24"
                                        fill="#e3dfdb"
                                        stroke="white"
                                        stroke-width="1" />
                                      <text
                                        x="${size > 9 ? 17 : 22}"
                                        y="25"
                                        stroke="black"
                                        stroke-width="1"
                                        dy=".3em">
                                        ${size}  
                                      </text>
                                    </svg>
                                `
                            })
                        },
                        maxClusterRadius: 60
                    })

                    relevant_locations.forEach(location_id => {
                        let loc = sender.locations[location_id]
                        if (loc.coordinates) {
                            let marker = new L.Marker(
                                loc.coordinates,
                                {
                                    icon: new L.DivIcon({
                                        className: 'tap-artmap-marker',
                                        iconSize: [100, 20],
                                        iconAnchor: [0, 0],
                                        html: `
                                        <svg height="20" width="20">
                                          <circle
                                            class="tap-artmap-marker-circle"
                                            cx="10"
                                            cy="10"
                                            r="8"
                                            fill="white"
                                            stroke="white"
                                            stroke-width="1" />
                                        </svg>
                                        <span class="tap-artmap-marker-label">
                                          ${loc.name}
                                        </span>
                                    `
                                    })
                                }
                            )
                            marker.on('click', function (e) {
                                sender.display_metadata(location_id)
                            })
                            sender.marker_cluster.addLayer(marker)

                            loc.artworks.forEach(artwork_id => {
                                if (artwork_id in sender.artwork_exhibit_map) {
                                    sender.artwork_exhibit_map[artwork_id].forEach(exhibit_id => {
                                        if (exhibit_id in sender.exhibits) {
                                            sender.exhibits[exhibit_id].artworks.push(artwork_id)

                                            if (sender.exhibits[exhibit_id].artworks.length === 1) {
                                                let marker = new L.Marker(
                                                    sender.exhibits[exhibit_id].location.coordinates,
                                                    {
                                                        icon: new L.DivIcon({
                                                            className: 'tap-artmap-marker',
                                                            iconSize: [30, 44],
                                                            iconAnchor: [10, 30],
                                                            html: `
                                                                <img src="${sender.tap.plugin_url}/img/museum-marker.svg" class="tap-artmap-exhibit-marker">
                                                            `
                                                        })
                                                    }
                                                )
                                                marker.bindTooltip(sender.exhibits[exhibit_id].label).openTooltip()
                                                marker.on('click', function (e) {
                                                    sender.display_exhibit(exhibit_id)
                                                })
                                                sender.marker_cluster.addLayer(marker)
                                            }
                                        }
                                    })
                                }
                            })
                        }
                    })
                    if (sender.active_tab === 'texas') {
                        sender.texas_map.addLayer(sender.marker_cluster)
                    } else {
                        sender.us_map.addLayer(sender.marker_cluster)
                    }

                    sender.element.trigger('images_loaded', {num_images: artworks.records.length})
                }
            }
        )
    }

    display_metadata(location_id) {
        let sender = this
        let meta = `<div class="accordion" id="tap-artmap-metadata-popup">`
        sender.current_location = location_id

        sender.locations[location_id].artworks.forEach((artwork_id, i) => {
            let artwork = sender.metadata[artwork_id]
            let art_region = null
            if (artwork.hasOwnProperty('featured_region_x') && artwork.featured_region_x) {
                art_region = `${artwork.featured_region_x},${artwork.featured_region_y},${artwork.featured_region_width},${artwork.featured_region_width}`;
            }

            let tags = []
            artwork.tags.forEach(tag => {
                let [key, value] = tag.label.split(': ')
                tags.push(`<dt>${key}:</dt><dd>${value}</dd>`)
            })

            meta += `
                <div class="card">
                  <div class="tap-card-header" id="heading${i}">
                      <button class="btn btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse${i}" aria-expanded="${i === 0 ? 'true': 'false'}" aria-controls="collapse${i}">
                        ${i + 1}. ${artwork.title}
                      </button>
                  </div>
                
                  <div id="collapse${i}" class="collapse${i === 0 ? ' show' : ''}" aria-labelledby="heading${i}" data-parent="#tap-artmap-metadata-popup">
                    <div class="card-body">
                      <img
                        id="tap-artgrid-img-${artwork.id}"
                        src="${sender.tap.plugin_url + '/img/image-loading.svg'}"
                        class="tap-artgrid-img img-responsive mb-2"
                        data-artwork-id="${artwork.id}"
                        data-iiif-identifier="${artwork.iiif_uri}" 
                        data-display-restriction="${artwork.display_restriction ? artwork.display_restriction.label : 'none'}"
                        ${art_region ? `data-region="${art_region}"` : ''}
                      />
                      ${sender.tap.render_metadata(artwork, 'vertical')}
                    </div>
                  </div>
                </div>
            `
        })

        meta += `</div>`

        let active_map = sender.texas_map
        if (sender.active_tab === 'us') active_map = sender.us_map

        sender.marker_popup
            .setLatLng(sender.locations[location_id].coordinates)
            .setContent(meta)
            .openOn(active_map)

        let popup_metadata_pane = jQuery(`#tap-artmap-metadata-popup`)
        sender.locations[location_id].artworks.forEach(artwork_id => {
            let img = jQuery(`#tap-artgrid-img-${artwork_id}`)
            sender.tap.inject_iiif_info(img, function() {
                sender.tap.render_image(img, popup_metadata_pane.width() - 20, false)
            })
        })
    }

    display_exhibit(exhibit_id) {
        let sender = this

        if (exhibit_id in sender.exhibits) {
            let ex = sender.exhibits[exhibit_id]
            let location_id = ex.location.id
            let meta = `
                <h2>${ex.title}</h2>
                <dl>
                  ${ex.year ? `<dt>Year:</dt><dd>${ex.year}</dd>`: ''}
                  <dt>Location:</dt><dd>${ex.location.label}</dd>
                </dl>
            `

            meta += `<div class="accordion" id="tap-artmap-metadata-popup">`
            sender.current_location = location_id

            ex.artworks.forEach((artwork_id, i) => {
                let artwork = sender.metadata[artwork_id]
                let art_region = null
                if (artwork.hasOwnProperty('featured_region_x') && artwork.featured_region_x) {
                    art_region = `${artwork.featured_region_x},${artwork.featured_region_y},${artwork.featured_region_width},${artwork.featured_region_width}`;
                }

                let tags = []
                artwork.tags.forEach(tag => {
                    let [key, value] = tag.label.split(': ')
                    tags.push(`<dt>${key}:</dt><dd>${value}</dd>`)
                })

                meta += `
                    <div class="card">
                      <div class="tap-card-header" id="heading${i}">
                          <button class="btn btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse${i}" aria-expanded="${i === 0 ? 'true' : 'false'}" aria-controls="collapse${i}">
                            ${i + 1}. ${artwork.title}
                          </button>
                      </div>
                    
                      <div id="collapse${i}" class="collapse${i === 0 ? ' show' : ''}" aria-labelledby="heading${i}" data-parent="#tap-artmap-metadata-popup">
                        <div class="card-body">
                          <img
                            id="tap-artgrid-img-${artwork.id}"
                            src="${sender.tap.plugin_url + '/img/image-loading.svg'}"
                            class="tap-artgrid-img img-responsive mb-2"
                            data-artwork-id="${artwork.id}"
                            data-iiif-identifier="${artwork.iiif_uri}" 
                            data-display-restriction="${artwork.display_restriction ? artwork.display_restriction.label : 'none'}"
                            ${art_region ? `data-region="${art_region}"` : ''}
                          />
                          ${sender.tap.render_metadata(artwork, 'vertical')}
                        </div>
                      </div>
                    </div>
                `
            })

            meta += `</div>`

            let active_map = sender.texas_map
            if (sender.active_tab === 'us') active_map = sender.us_map

            sender.exhibit_popup
                .setLatLng(ex.location.coordinates)
                .setContent(meta)
                .openOn(active_map)

            let popup_metadata_pane = jQuery(`#tap-artmap-metadata-popup`)
            ex.artworks.forEach(artwork_id => {
                let img = jQuery(`#tap-artgrid-img-${artwork_id}`)
                sender.tap.inject_iiif_info(img, function () {
                    sender.tap.render_image(img, popup_metadata_pane.width() - 20, false)
                })
            })
        }
    }
}
