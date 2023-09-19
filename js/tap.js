class TexasArtProject {
    constructor(corpora_host, corpora_token, clo_corpus_id, plugin_url) {
        this.host = corpora_host
        this.token = corpora_token
        this.corpus_id = clo_corpus_id
        this.path = window.location.pathname
        this.plugin_url = plugin_url
        this.site_header = null
        this.header_image = null
        this.site_footer = null
        this.artgrid = null
        this.artmenu = null
        this.artmap = null

        // SITE HEADER
        //let tap_site_header = jQuery('#tap-header-div>.elementor-container>.elementor-column>.elementor-widget-wrap')
        let tap_site_header = jQuery('#tap-header-div')
        if (tap_site_header.length) {
            this.site_header = new SiteHeader(this, tap_site_header)
        }

        // HEADER IMAGE
        //let tap_header_image = jQuery('#tap-header-image>.elementor-container>.elementor-column>.elementor-widget-wrap')
        let tap_header_image = jQuery('#tap-header-image')
        if (tap_header_image.length) {
            this.header_image = new HeaderImage(this, tap_header_image)
        }

        // ARTGRID
        let tap_artgrid = jQuery('#tap-artgrid')
        if (tap_artgrid.length) {
            this.artgrid = new ArtGrid(this, tap_artgrid)
        }

        // ARTMENU
        let tap_artmenu = jQuery('#tap-artmenu')
        if (tap_artmenu.length) {
            this.artmenu = new ArtMenu(this, tap_artmenu, this.artgrid, "Search Schiwetz Artworks")
        }

        // ARTMAP
        let tap_maptitles = jQuery('.elementor-tab-title')
        let tap_maptabs = jQuery('.elementor-tab-content')
        if (tap_maptitles.length === 4 && tap_maptabs.length === 2) {
            this.artmap = new ArtMap(
                this,
                jQuery(tap_maptitles[0]),
                jQuery(tap_maptabs[0]),
                jQuery(tap_maptitles[1]),
                jQuery(tap_maptabs[1])
            )
        }

        // rig up the site footer
        let tap_site_footer_div = jQuery('#tap-footer-div')
        if (tap_site_footer_div.length) {
            this.site_footer = new SiteFooter(this, tap_site_footer_div)
        }

        // rig up homepage widget
        let tap_homepage_widget_div = jQuery('#tap-homepage-widget-div')
        if (tap_homepage_widget_div.length) {
            this.homepage_widget = new HomePageWidget(this, tap_homepage_widget_div)
        }

        // rig up album viewer
        let tap_artwork_div = jQuery('#tap-artwork-div')
        if (tap_artwork_div.length) {
            this.artwork_widget = new ArtworkViewer(this, tap_artwork_div)
        }
        
    }

    make_request(path, type, params={}, callback, inject_host=true) {
        let url = path
        if (inject_host) url = `${this.host}${path}`

        let req = {
            type: type,
            url: url,
            dataType: 'json',
            crossDomain: true,
            data: params,
            success: callback
        }

        if (this.token) {
            let sender = this
            req['beforeSend'] = function(xhr) { xhr.setRequestHeader("Authorization", `Token ${sender.token}`) }
        }

        return jQuery.ajax(req)
    }

    random_index(length) {
        return Math.floor(Math.random() * length)
    }

    count_instances(a_string, instance) {
        return a_string.split(instance).length
    }

    inject_iiif_info(img, callback) {
        jQuery.getJSON(`${img.data('iiif-identifier')}/info.json`, {}, function(info) {
            img.data('fullwidth', info.width)
            img.data('fullheight', info.height)
            callback()
        })
    }

    render_image(img, size, region_only=true) {
        let iiif_src
        let width = size
        let height = size

        if (region_only) {
            iiif_src = `${img.data('iiif-identifier')}/${img.data('region')}/${size},${size}/0/default.png`
        } else {
            if (width > img.data('fullwidth')) width = img.data('fullwidth')
            iiif_src = `${img.data('iiif-identifier')}/full/${width},/0/default.png`
            let ratio = width / img.data('fullwidth')
            height = parseInt(ratio * img.data('fullheight'))
            img.css('filter', 'brightness(2)')
            img.on('load', function() {
                img.css('filter', 'brightness(1.1)')
            })
        }

        img.attr('src', iiif_src)
        img.css('width', `${width}px`)
        img.css('height', `${height}px`)
        img.data('loaded', true)
    }
}

class SiteHeader {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element

        jQuery('head').append(`<link rel="stylesheet" href="https://use.typekit.net/qbi7knm.css">`)

        const top_navs = [
            {path: '/', name: "Home"},
            {path: '/about/', name: "About Us"},
            {path: '/artists/', name: "Featured Artists"},
            {path: '/contact/', name: "Contact Us"}
        ]
        let nav_links = top_navs.map(nav => `<a href="${nav.path}"${nav.path === this.clo.path ? ' class="active"' : ''}>${nav.name}</a>`)

        this.element.append(`
            <div id="tap-nav-div" class="d-flex flex-grow-1 justify-content-end">
                ${nav_links.join("\n\t")}
            </div>
        `)

        //jQuery('.dropdown-toggle').dropdown()
        let search_bar = jQuery('.clo-search-bar')
        search_bar.keyup(function(e) {
            if (e.key === "Enter") {
                console.log('enter event fired')
                let query = search_bar.val().trim()
                if (query) {
                    window.location.href = `/search-results/${query}`
                }
            }
        })
    }
}

class HeaderImage {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element
        this.headers = {
            '/': {
                src: `${this.clo.plugin_url}/img/home-collage.png`,
                alt: "The Texas Art Project"
            },
            '/about/': {
                src: `${this.clo.plugin_url}/img/about-heading.png`,
                alt: "About the Texas Art Project"
            },
            '/map/': {
                src: `${this.clo.plugin_url}/img/map-timeline.png`,
                alt: "Map and Timeline"
            }
        }

        if (this.clo.path in this.headers) {
            this.element.append(`
                <img class="tap-header-image" src="${this.headers[this.clo.path].src}" alt="${this.headers[this.clo.path].alt}" loading="lazy" border="0" />
            `)
        }
    }
}


class ArtGrid {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element
        this.criteria = {'page-size': 50, 'page': 1}
        this.grid_width = 600
        this.cell_width = 200
        this.metadata = {}

        let sender = this
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry && entry.isIntersecting && entry.intersectionRatio >= 1.0) {
                    let img = jQuery(entry.target)

                    if (!img.data('loaded')) {
                        let img_rect = entry.target.getBoundingClientRect()
                        let img_width = parseInt(img_rect.width)

                        if (img.data('region')) {
                            sender.clo.render_image(img, img_width)
                        } else {
                            sender.clo.inject_iiif_info(img, function() {
                                img.data('region', `${parseInt(img.data('fullwidth') / 2) - 100},${parseInt(img.data('fullheight') / 2) - 100},200,200`)
                                sender.clo.render_image(img, img_width)
                            })
                        }

                        let next_page = img.data('next-page')
                        if (next_page) {
                            sender.criteria['page'] = parseInt(next_page)
                            sender.load_images()
                        }
                    }
                }
            })
        }, {threshold: 1.0})

        //this.element.addClass('d-flex')
        //this.element.addClass('flex-wrap')
        this.load_images(true)

        jQuery(document).on('click', 'div.tap-artgrid-cell', function() {
            let cell = jQuery(this)
            let featured_img = jQuery('.tap-artgrid-img.featured')
            let featured_cell = jQuery('.tap-artgrid-cell.featured')
            if (featured_img.length) {
                featured_cell.removeClass('col-md-12')
                featured_cell.addClass('col-md-4')
                sender.clo.render_image(featured_img, parseInt(cell.width()))
                jQuery('.tap-artgrid-metadata').remove()
                featured_cell.removeClass('featured')
                featured_img.removeClass('featured')
            }

            let artwork_id = cell.data('artwork-id')
            let img = jQuery(`#tap-artgrid-img-${artwork_id}`)
            let grid_width = parseInt(sender.element.width())
            if (img.data('fullwidth'))
                sender.clo.render_image(img, grid_width - 10, false)
            else
                sender.clo.inject_iiif_info(img, function() {
                    sender.clo.render_image(img, grid_width - 10, false)
                })

            let meta = sender.metadata[artwork_id]
            let tags = []
            meta.tags.forEach(tag => {
                let [key, value] = tag.label.split(': ')
                tags.push(`<dt>${key}:</dt><dd>${value}</dd>`)
            })

            cell.append(`
              <div class="tap-artgrid-metadata">
                <h1>${meta.title}</h1>
                <div class="row">
                  <div class="col-md-4">
                    <dl>
                      <dt>Year:</dt><dd>${meta.year}</dd>
                      ${meta.location ? `<dt>Origin:</dt><dd>${meta.location.label}</dd>` : ''}
                      ${tags.join('\n')}
                      <dt>Surface:</dt><dd>${meta.surface}</dd>
                      <dt>Medium:</dt><dd>${meta.medium}</dd>
                      <dt>Size:</dt><dd>${meta.size_inches}</dd>
                      ${meta.collection ? `<dt>Collection:</dt><dd>${meta.collection.label}</dd>` : ''}
                    </dl>
                  </div>
                  <div class="col-md-8">
                    <dl>
                      <dt>Caption:</dt><dd>${meta.caption ? meta.caption : 'None'}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            `)

            console.log(meta)

            cell.removeClass('col-md-4')
            cell.addClass('col-sm-12')
            cell.addClass('featured')
            img.addClass('featured')
            setTimeout(function() {
                cell[0].scrollIntoView({behavior: "smooth"})
            }, 1500)

        })
    }

    load_images(reset=false) {
        let sender = this

        if (reset) sender.element.empty()

        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/ArtWork/`,
            'GET',
            sender.criteria,
            function(artworks) {
                if (artworks.records) {

                    artworks.records.forEach((artwork, index) => {
                        let art_region = null
                        if (artwork.hasOwnProperty('featured_region_x') && artwork.featured_region_x) {
                            art_region = `${artwork.featured_region_x},${artwork.featured_region_y},${artwork.featured_region_width},${artwork.featured_region_width}`;
                        }

                        sender.element.append(`
                            <div id="tap-artgrid-cell-${artwork.id}" class="col-md-4 tap-artgrid-cell" data-artwork-id="${artwork.id}">
                              <img
                                id="tap-artgrid-img-${artwork.id}"
                                src="${sender.clo.plugin_url + '/img/image-loading.svg'}"
                                class="tap-artgrid-img img-responsive"
                                data-artwork-id="${artwork.id}"
                                data-iiif-identifier="${artwork.iiif_uri}"
                                ${(index + 1 === artworks.records.length && artworks.meta.has_next_page) ? `data-next-page="${artworks.meta.page + 1}"` : ''}
                                ${art_region ? `data-region="${art_region}"` : ''} 
                              />
                            </div>
                        `)

                        sender.metadata[artwork.id] = Object.assign({}, artwork)
                    })

                    jQuery(`img.tap-artgrid-img:not([data-observed])`).each(function() {
                        jQuery(this).on('load', function() {
                            sender.observer.observe(this)
                            jQuery(this).data('observed', true)
                        })
                    })
                }
            }
        )
    }
}


class ArtMenu {
    constructor(clo_instance, element, grid, search_label='Search') {
        this.clo = clo_instance
        this.element = element
        this.grid = grid

        this.element.html(`
            <h2 class="tap-menu-heading">${search_label}</h2>
            <div class="form-group">
                <label for="tap-artmenu-search-box" class="sr-only">Search</label>
                <input id="tap-artmenu-search-box" type="text" class="form-control form-control-sm" placeholder="Type here" />
            </div>
            
            <h2 class="tap-menu-heading mt-2">Filter</h2>
            
            <details class="tap-artmenu-list">
              <summary>Year</summary>
              <ul id="tap-artmenu-decade-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Origin</summary>
              <ul id="tap-artmenu-origin-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Collection</summary>
              <ul id="tap-artmenu-collection-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Exhibition</summary>
              <ul id="tap-artmenu-exhibition-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Prize</summary>
              <ul id="tap-artmenu-prize-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Surface</summary>
              <ul id="tap-artmenu-surface-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Medium</summary>
              <ul id="tap-artmenu-medium-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Color Palette</summary>
              <ul id="tap-artmenu-color-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Theme</summary>
              <ul id="tap-artmenu-theme-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Setting</summary>
              <ul id="tap-artmenu-setting-list"></ul>
            </details>
            
            <details class="tap-artmenu-list">
              <summary>Subject</summary>
              <ul id="tap-artmenu-subject-list"></ul>
            </details>
        `)

        // perform aggregations where ArtWork field values correspond to list items
        const generic_xref_parser = (key, field_name) => {
            let [id, label] = key.split('|||')
            return {
                label: label,
                search_param: `f_${field_name}.id`,
                search_value: id
            }
        }

        const generic_keyword_parser = (key, field_name) => {
            return {
                label: key,
                search_param: `f_${field_name}`,
                search_value: key
            }
        }

        const queries = {
            decade: {
                params: { a_histogram_decade: "year__10" },
                field_name: "year",
                parser: function(key, field_name) {
                    return {
                        label: parseInt(key),
                        search_param: `r_year`,
                        search_value: `${parseInt(key)}to${parseInt(key) + 9}`
                    }
                }
            },
            origin: {
                params: { a_terms_origin: "location.id,location.label.raw" },
                field_name: "location",
                parser: generic_xref_parser
            },
            collection: {
                params: { a_terms_collection: "collection.id,collection.label.raw" },
                field_name: "collection",
                parser: generic_xref_parser
            },
            surface: {
                params: { a_terms_surface: "surface" },
                field_name: "surface",
                parser: generic_keyword_parser
            },
            medium: {
                params: { a_terms_medium: "medium" },
                field_name: "medium",
                parser: generic_keyword_parser
            },
        }

        let sender = this
        for (let query in queries) {
            this.clo.make_request(
                `/api/corpus/${sender.clo.corpus_id}/ArtWork/`,
                'GET',
                Object.assign({'page-size': 0}, queries[query].params),
                function(data) {
                    if (data.meta && data.meta.aggregations && query in data.meta.aggregations) {
                        let list = jQuery(`#tap-artmenu-${query}-list`)

                        for (let key in data.meta.aggregations[query]) {
                            let link_info = queries[query].parser(key, queries[query].field_name)

                            list.append(`
                                <li
                                    class="tap-artmenu-list-item"
                                    data-param="${link_info.search_param}"
                                    data-value="${link_info.search_value}">
                                  ${link_info.label}
                                </li> 
                            `)
                        }
                    }
                }
            )
        }

        // perform and parse tag aggregations
        const tag_mappings = {
            color: "Palette",
            theme: "Theme",
            setting: "Setting",
            subject: "Subject"
        }

        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/ArtWork/`,
            'GET',
            {a_terms_tags: 'tags.id,tags.label.raw'},
            function(data) {
                if (data.meta && data.meta.aggregations && 'tags' in data.meta.aggregations) {
                    for (let list_name in tag_mappings) {
                        let list = jQuery(`#tap-artmenu-${list_name}-list`)

                        for (let key in data.meta.aggregations['tags']) {
                            let [id, label] = key.split('|||')

                            if (label.startsWith(tag_mappings[list_name])) {
                                list.append(`
                                    <li
                                        class="tap-artmenu-list-item"
                                        data-param="f_tags.id"
                                        data-value="${id}">
                                      ${label.replace(`${tag_mappings[list_name]}: `, '')}
                                    </li>
                                `)
                            }
                        }
                    }
                }
            }
        )

        // exhibitions
        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/Exhibition/`,
            'GET',
            {'page-size': 100, only: 'artwork.id,exhibit.label'},
            function(data) {
                let exhibitions = {}
                let list = jQuery('#tap-artmenu-exhibition-list')

                data.records.forEach(record => {
                    if (!(record.exhibit.label in exhibitions)) exhibitions[record.exhibit.label] = []
                    exhibitions[record.exhibit.label].push(record.artwork.id)
                })

                for (let label in exhibitions) {
                    list.append(`
                        <li
                            class="tap-artmenu-list-item"
                            data-param="f_id|"
                            data-value="${exhibitions[label].join('__')}">
                          ${label}
                        </li>
                    `)
                }
            }
        )

        // prizes
        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/Prize/`,
            'GET',
            {'page-size': 100, 'e_artwork.id': 'y', only: 'artwork.id,name'},
            function(data) {
                let prizes = {}
                let list = jQuery('#tap-artmenu-prize-list')

                data.records.forEach(record => {
                    if (!(record.name in prizes)) prizes[record.name] = []
                    prizes[record.name].push(record.artwork.id)
                })

                for (let label in prizes) {
                    list.append(`
                        <li
                            class="tap-artmenu-list-item"
                            data-param="f_id|"
                            data-value="${prizes[label].join('__')}">
                          ${label}
                        </li>
                    `)
                }
            }
        )

        // handle events

        // search box
        let search_timer = null
        let search_box = jQuery('#tap-artmenu-search-box')
        search_box.on('keydown', function() {
            if (search_box.val()) {
                clearTimeout(search_timer)
                search_timer = setTimeout(function () {
                    sender.grid.criteria = {
                        page: 1,
                        'page-size': 50,
                        q: search_box.val()
                    }
                    sender.grid.load_images(true)
                }, 1000)
            }
        })

        // faceting clicks
        jQuery(document).on('click', '.tap-artmenu-list-item', function() {
            let list_item = jQuery(this)
            let search = {}
            search[list_item.data('param')] = list_item.data('value')
            sender.grid.criteria = Object.assign({page: 1, 'page-size': 50}, search)
            sender.grid.load_images(true)
        })
    }
}


class ArtMap {
    constructor (clo_instance, texas_title, texas_tab, us_title, us_tab) {
        this.clo = clo_instance
        this.criteria = {'page-size': 150, 'page': 1}
        this.metadata = {}
        this.locations = {}
        this.texas_title = texas_title
        this.texas_tab = texas_tab
        this.texas_map = null
        this.texas_cluster = null

        this.us_title = us_title
        this.us_tab = us_tab
        this.us_map = null

        this.current_tab = 'texas'
        this.current_location = null

        this.popup = null

        this.texas_tab.html(`
            <div class="row">
              <div class="col-sm-4" id="tap-texas-artmenu-div">
                <div id="tap-artmenu"></div>
              </div>
              <div class="col-sm-8">
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
                    marks-count="12"
                    marks-values-count="12"
                    marks-values-color="#000000">
                </tc-range-slider>
                <div id="tap-artmap-attribution-div" style="margin-top: 65px;"></div>
              </div>
            </div>
        `)
        this.us_tab.html(`
            <div class="row">
              <div class="col-sm-3" id="tap-us-artmenu-div"></div>
              <div class="col-sm-9" id="tap-us-artmap">US stuff</div>
            </div>
        `)

        this.artslider = jQuery('#tap-artslider')
        this.artslider[0].addCSS(`
            .mark-value {
                font-size: 12px;
            }
        `)

        this.texas_title.addClass('tap-tab')
        this.texas_title.data('tap-tab', 'texas')
        this.us_title.addClass('tap-tab')
        this.us_title.data('tap-tab', 'us')

        let sender = this

        jQuery('.tap-tab').click(function() {
            let clicked_tab = jQuery(this).data('tap-tab')

            if (sender.current_tab !== clicked_tab) {
                sender.current_tab = clicked_tab
                let active_tab = jQuery(`#tap-${sender.current_tab}-artmenu-div`)
                sender.artmenu.element.detach().appendTo(active_tab)
            }
        })

        setTimeout(function() {
            fetch(`${sender.clo.plugin_url}/texas_fixed.json`)
                .then(response => response.json())
                .then(texas_shape => {
                    sender.texas_map = L.map('tap-texas-artmap', { zoomSnap: 0.3 })
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                    }).addTo(sender.texas_map)
                    sender.texas_map.fitBounds([
                        [36.48314061639213,-106.5234375],
                        [25.90864446329127,-93.603515625]
                    ], { padding: [20,20] })

                    let texas_poly = L.polygon(texas_shape, {
                        color: '#d5b09d',
                        fill: true,
                        fillOpacity: 1
                    })
                    texas_poly.addTo(sender.texas_map)
                    texas_poly.bringToFront()

                    sender.texas_map.on('click', e => { console.log(e) })
                    jQuery('.leaflet-control-attribution').detach().appendTo(jQuery('#tap-artmap-attribution-div'))

                    sender.artmenu = new ArtMenu(sender.clo, jQuery('#tap-artmenu'), sender)
                    sender.load_images()

                    sender.popup = L.popup({maxHeight: 300})
                    sender.texas_map.on('popupclose', e => {
                        sender.texas_map.flyTo(sender.locations[sender.current_location].coordinates)
                    })
                })
        }, 1000)
    }

    load_images() {
        let sender = this

        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/ArtWork/`,
            'GET',
            sender.criteria,
            function(artworks) {
                if (artworks.records) {
                    artworks.records.forEach(artwork => {
                        if (!(artwork.id in sender.metadata)) sender.metadata[artwork.id] = Object.assign({}, artwork)

                        if (artwork.location && !(artwork.location.id in sender.locations)) {
                            sender.locations[artwork.location.id] = Object.assign({ marker: null }, artwork.location)
                        }
                    })

                    sender.texas_cluster = L.markerClusterGroup({
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

                    Object.keys(sender.locations).forEach(location_id => {
                        let loc = sender.locations[location_id]
                        if (!loc.marker && loc.coordinates) {
                            loc.coordinates = [loc.coordinates[1], loc.coordinates[0]]
                            loc.marker = new L.Marker(
                                loc.coordinates,
                                {
                                    icon: new L.DivIcon({
                                        className: 'tap-artmap-marker',
                                        iconSize: [100,20],
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
                            loc.marker.on('click', function(e) {
                                sender.display_metadata(location_id)
                            })
                            sender.texas_cluster.addLayer(loc.marker)
                            //loc.marker.addTo(sender.texas_map)
                        }
                    })
                    sender.texas_map.addLayer(sender.texas_cluster)
                }
            }
        )
    }

    display_metadata(location_id) {
        let sender = this
        sender.current_location = location_id
        this.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/ArtWork/`,
            'GET',
            {'f_location.id': location_id, 'page-size': 100},
            function(artworks) {
                let meta = `<div class="accordion" id="tap-artmap-metadata-popup">`
                if (artworks.records) {
                    artworks.records.forEach((artwork, i) => {
                        let tags = []
                        artwork.tags.forEach(tag => {
                            let [key, value] = tag.label.split(': ')
                            tags.push(`<dt>${key}:</dt><dd>${value}</dd>`)
                        })

                        meta += `
                            <div class="card">
                              <div class="card-header" id="heading${i}">
                                <h2 class="mb-0">
                                  <button class="btn btn-link btn-block text-left" type="button" data-toggle="collapse" data-target="#collapse${i}" aria-expanded="${i === 0 ? 'true': 'false'}" aria-controls="collapse${i}">
                                    ${i + 1}. ${artwork.title}
                                  </button>
                                </h2>
                              </div>
                            
                              <div id="collapse${i}" class="collapse${i === 0 ? ' show' : ''}" aria-labelledby="heading${i}" data-parent="#tap-artmap-metadata-popup">
                                <div class="card-body">
                                  <img
                                    id="tap-artgrid-img-${artwork.id}"
                                    src="${sender.clo.plugin_url + '/img/image-loading.svg'}"
                                    class="tap-artgrid-img img-responsive mb-2"
                                    data-artwork-id="${artwork.id}"
                                    data-iiif-identifier="${artwork.iiif_uri}" 
                                  />
                                  <dl>
                                    <dt>Year:</dt><dd>${artwork.year}</dd>
                                    ${artwork.location ? `<dt>Origin:</dt><dd>${artwork.location.label}</dd>` : ''}
                                    ${tags.join('\n')}
                                    <dt>Surface:</dt><dd>${artwork.surface}</dd>
                                    <dt>Medium:</dt><dd>${artwork.medium}</dd>
                                    <dt>Size:</dt><dd>${artwork.size_inches}</dd>
                                    ${artwork.collection ? `<dt>Collection:</dt><dd>${artwork.collection.label}</dd>` : ''}
                                  </dl>
                                </div>
                              </div>
                            </div>
                        `
                    })

                    meta += `</div>`
                    sender.popup
                        .setLatLng(sender.locations[location_id].coordinates)
                        .setContent(meta)
                        .openOn(sender.texas_map)

                    let popup_metadata_pane = jQuery(`#tap-artmap-metadata-popup`)
                    artworks.records.forEach(artwork => {
                        let img = jQuery(`#tap-artgrid-img-${artwork.id}`)
                        sender.clo.inject_iiif_info(img, function() {
                            sender.clo.render_image(img, popup_metadata_pane.width() - 20, false)
                        })
                    })
                }
            }
        )
    }
}


class SiteFooter {
    constructor (clo_instance, element) {
        this.clo = clo_instance
        this.element = element

        this.element.html(`
            <footer class="footer py-4">
              <app-footer>
                <div id="footer_wrapper" class="container-fluid">
                  <div id="footer" class="row align-items-center justify-content-center">
                    <div id="footer_links" class="col-3">
                      <div class="row align-items-center justify-content-center">
                        <a href="https://read.dukeupress.edu/">read.dukeupress.edu</a>
                        &nbsp;<span>|</span>&nbsp
                        <a href="https://www.dukeupress.edu/Legal/Privacy">Policies</a>
                        &nbsp;<span>|</span>&nbsp
                        <a href="mailto:customerrelations@dukepress.edu">Contact Us</a>
                        <div class="w-100"></div>
                        <span>© Duke University Press</span>
                      </div>
                    </div>
                    <div id="footer_logos" class="col-7">
                      <div class="row align-items-center justify-content-center">
                        <a href="https://www.dukeupress.edu/"><img class="mx-3" src="/wp-content/plugins/clo/img/duke_logo.png" alt="Duke University Press" border="0"></a>
                        <a href="https://codhr.tamu.edu"><img class="mx-3" src="/wp-content/plugins/clo/img/CoDHR-logo.png" alt="Center of Digital Humanities Research at Texas A&amp;M University" border="0" style="max-height: 70px;"></a>
                        <a href="https://library.duke.edu/rubenstein/"><img class="mx-3" src="/wp-content/plugins/clo/img/rubenstein-collection.png" alt="Rubenstein Collection" border="0" style="background-color: #000000; padding: 2px;"></a>
                      </div>
                    </div>
                  </div>
                </div>
              </app-footer>
            </footer>
        `)
    }
}


class HomePageWidget {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element
        this.quotes = [
            "What we become depends on what we read after all of the professors are done with us. The greatest university of all is a collection of books.",
            "I've got a great ambition to die of exhaustion rather than boredom.",
            "All that mankind has done, thought, gained, or been; it is lying as in magic preservation in the pages of books.",
            "Go as far as you can see; when you get there, you'll be able to see further.",
            "A loving heart is the beginning of all knowledge.",
            "Conviction is worthless unless it is converted into conduct.",
            "A loving heart is the beginning of all knowledge.",
            "Conviction is worthless unless it is converted into conduct.",
            "Every man is my superior in that I may learn from him.",
            "The tragedy of life is not so much what men suffer, but rather what they miss.",
            "Popular opinion is the greatest lie in the world."
        ]

        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/Photo/`,
            'GET',
            {'e_frontispiece_volume.label': 'y', 'only': 'iiif_url', 'page-size': 60},
            function(photos) {
                if (photos.hasOwnProperty('records') && photos.records.length) {
                    let rand_photo_1 = sender.clo.random_index(photos.records.length)
                    let rand_photo_2 = sender.clo.random_index(photos.records.length)
                    let rand_quote = sender.clo.random_index(sender.quotes.length)
                    while (rand_photo_2 === rand_photo_1) rand_photo_2 = sender.clo.random_index(photos.records.length)

                    rand_photo_1 = `${photos.records[rand_photo_1].iiif_url}/full/,200/0/default.jpg`
                    rand_photo_2 = `${photos.records[rand_photo_2].iiif_url}/full/,200/0/default.jpg`
                    rand_quote = sender.quotes[rand_quote]

                    sender.element.html(`
                        <div class="d-flex flex-column flex-grow-1 justify-content-start align-items-center px-4">
                          <div class="row mt-3 mb-3">
                            <img src="${rand_photo_1}" class="portrait pr-3">
                            <img src="${rand_photo_2}" class="portrait pl-3">
                          </div>
                          <div class="clo-quote-container mt-3">
                            <p>“${rand_quote}”</p>
                          </div>
                        </div>
                    `)
                }
            }
        )
    }
}


class ArtworkViewer {
    constructor(clo_instance, element) {
        this.clo = clo_instance
        this.element = element

        let sender = this

        sender.clo.make_request(
            `/api/corpus/${sender.clo.corpus_id}/PhotoAlbum/`,
            'GET',
            {'s_album_no': 'asc', 'only': 'title,album_no,description'},
            function (albums) {
                if (albums.hasOwnProperty('records') && albums.records.length) {
                    let html = '<div class="container mt-1"><div class="row"><div class="col-sm-6">'

                    albums.records.map((album, index) => {
                        html += `
                            <div class="pl-4">
                              <a class="clo-bold-orange" href="/album-viewer/${album.album_no}">${album.title}</a>
                              <p>${album.description}</p>
                            </div>
                        `

                        if (index === 3) html += '</div><div class="col-sm-6">'
                    })
                    html += '</div></div></div>'
                    sender.element.html(html)
                }
            }
        )
    }
}
