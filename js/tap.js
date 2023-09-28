class TexasArtProject {
    constructor(corpora_host, corpora_token, clo_corpus_id, plugin_url) {
        this.host = corpora_host
        this.token = corpora_token
        this.corpus_id = clo_corpus_id
        this.path = window.location.pathname
        this.get_params = new URLSearchParams(window.location.search)
        this.plugin_url = plugin_url
        this.site_header = null
        this.header_image = null
        this.artgrid = null
        this.artmenu = null
        this.artmap = null
        this.artdetail = null
        this.artfooter = null

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
        let tap_artmap = jQuery('#tap-artmap')
        if (tap_artmap.length) {
            this.artmap = new ArtMap(this, tap_artmap)
        }
        
        // ARTDETAIL
        let tap_artdetail = jQuery('#tap-artwork-detail-div')
        if (tap_artdetail.length) {
            this.artdetail = new ArtDetail(this, tap_artdetail)
        }

        // rig up the site footer
        let tap_site_footer_div = jQuery('#tap-footer-div')
        if (tap_site_footer_div.length) {
            this.artfooter = new ArtFooter(this, tap_site_footer_div)
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
            if (!img.data('region'))
                img.data('region', `${parseInt(info.width / 2) - 100},${parseInt(info.height / 2) - 100},200,200`)
            callback()
        })
    }

    render_image(img, size, region_only=true) {
        let iiif_src
        let width = size
        let height = size

        if (img.data('display-restriction') === 'No Image') {
            iiif_src = `${this.plugin_url}/img/image-unavailable.png`
            if (!region_only) {
                width = 200
                height = 200
            }
        } else {
            if (img.data('display-restriction') === 'Thumbnail Only' && !region_only) {
                region_only = true
                width = 200
                height = 200
            }

            if (region_only) {
                iiif_src = `${img.data('iiif-identifier')}/${img.data('region')}/${size},${size}/0/default.png`
            } else {
                if (width > img.data('fullwidth')) width = img.data('fullwidth')
                iiif_src = `${img.data('iiif-identifier')}/full/${width},/0/default.png`
                let ratio = width / img.data('fullwidth')
                height = parseInt(ratio * img.data('fullheight'))
                img.css('filter', 'brightness(2)')
                img.on('load', function () {
                    img.css('filter', 'brightness(1.1)')
                })
            }
        }

        img.attr('src', iiif_src)
        img.css('width', `${width}px`)
        img.css('height', `${height}px`)
        img.data('loaded', true)
    }
}

class SiteHeader {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element

        jQuery('head').append(`<link rel="stylesheet" href="https://use.typekit.net/qbi7knm.css">`)

        this.element.html(`
            <nav class="navbar navbar-expand-md navbar-light bg-light" style="background-color: #FFFFFF!important;">
              <a class="navbar-brand" href="#">Texas Art Project</a>
              <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#tap-navbar" aria-controls="tap-navbar" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="tap-navbar">
                <ul class="navbar-nav ml-auto">
                  <li class="nav-item active">
                    <a class="nav-link" href="/">Home <span class="sr-only">(current)</span></a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/about/">About Us</a>
                  </li>
                  <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-expanded="false">
                      Featured Projects
                    </a>
                    <div class="dropdown-menu bg-light">
                      <b>Buck Schiwetz</b>
                      <hr class="dropdown-divider">
                      <a class="dropdown-item" href="/schiwetz/essay/">Introductory Essay</a>
                      <a class="dropdown-item" href="/">Gallery</a>
                      <a class="dropdown-item" href="/schiwetz/map/">Map and Timeline</a>
                    </div>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/contact/">Contact Us</a>
                  </li>
                </ul>
              </div>
            </nav>
        `)
    }
}

class HeaderImage {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.headers = {
            '/': {
                src: `${this.tap.plugin_url}/img/home-collage.png`,
                alt: "The Texas Art Project"
            },
            '/about/': {
                src: `${this.tap.plugin_url}/img/about-us.png`,
                alt: "About Us"
            },
            '/contact/': {
                src: `${this.tap.plugin_url}/img/contact-us.png`,
                alt: "Contact Us"
            },
            '/schiwetz/gallery/': {
                src: `${this.tap.plugin_url}/img/home-collage.png`,
                alt: "The Buck Schiwetz Gallery"
            },
            '/schiwetz/essay/': {
                src: `${this.tap.plugin_url}/img/schiwetz-essay.png`,
                alt: "I hope to leave behind me a collection of indigenous paintings which will faithfully portray Texas as it is. - Buck Schiwetz"
            },
            '/schiwetz/map/': {
                src: `${this.tap.plugin_url}/img/map-timeline.png`,
                alt: "Map and Timeline"
            }
        }

        if (this.tap.path in this.headers) {
            this.element.append(`
                <img class="tap-header-image" src="${this.headers[this.tap.path].src}" alt="${this.headers[this.tap.path].alt}" loading="lazy" border="0" />
            `)
        }
    }
}


class ArtGrid {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.criteria = {'page-size': 50, 'page': 1}
        this.grid_width = 600
        this.cell_width = 200
        this.metadata = {}

        // handle any URL GET params passed in and register them as an active filter
        this.initial_filter = null
        if (this.tap.get_params.has('filter_label')
                && this.tap.get_params.has('param')
                && this.tap.get_params.has('value_label')
                && this.tap.get_params.has('value')) {

            this.criteria[this.tap.get_params.get('param')] = this.tap.get_params.get('value')
            this.initial_filter = {
                filter_label: this.tap.get_params.get('filter_label'),
                param: this.tap.get_params.get('param'),
                value_label: this.tap.get_params.get('value_label')
            }
        }

        let sender = this
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    let img = jQuery(entry.target)

                    if (!img.data('loaded')) {
                        let img_rect = entry.target.getBoundingClientRect()
                        let img_width = parseInt(img_rect.width)

                        if (img.data('region')) {
                            sender.tap.render_image(img, img_width)
                        } else {
                            sender.tap.inject_iiif_info(img, function() {
                                sender.tap.render_image(img, img_width)
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
        }, {threshold: 0.3})

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
                sender.tap.render_image(featured_img, parseInt(cell.width()))
                jQuery('.tap-artgrid-metadata').remove()
                featured_cell.removeClass('featured')
                featured_img.removeClass('featured')
            }

            let artwork_id = cell.data('artwork-id')
            let img = jQuery(`#tap-artgrid-img-${artwork_id}`)
            let grid_width = parseInt(sender.element.width())
            if (img.data('fullwidth'))
                sender.tap.render_image(img, grid_width - 10, false)
            else
                sender.tap.inject_iiif_info(img, function() {
                    sender.tap.render_image(img, grid_width - 10, false)
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
                  <div class="col-md-6">
                    <dl>
                      <dt>Year:</dt><dd>${meta.year}</dd>
                      <dt>Medium:</dt><dd>${meta.medium}</dd>
                      <dt>Surface:</dt><dd>${meta.surface}</dd>
                    </dl>
                  </div>
                  <div class="col-md-6 d-flex flex-column">
                    <dl style="flex: 1;">
                      ${meta.collection && !meta.anonymize_collector ? `<dt>Collection:</dt><dd>${meta.collection.label}</dd>` : ''}
                      <dt>Size:</dt><dd>${meta.size_inches}</dd>
                    </dl>
                    <div class="w-100">
                      <a class="float-right" href="/artwork/${meta.id}/" target="_blank">See more...</a>
                    </div>
                  </div>
                </div>
              </div>
            `)

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

        if (reset) {
            sender.element.empty()
            sender.criteria.page = 1
        }

        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/ArtWork/`,
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
                                src="${sender.tap.plugin_url + '/img/image-loading.svg'}"
                                class="tap-artgrid-img img-responsive"
                                data-artwork-id="${artwork.id}"
                                data-iiif-identifier="${artwork.iiif_uri}"
                                data-display-restriction="${artwork.display_restriction ? artwork.display_restriction.label : 'none'}"
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
    constructor(tap_instance, element, grid, search_label='Search', show_year=true, show_origin=true) {
        this.tap = tap_instance
        this.element = element
        this.grid = grid
        this.active_filters = {}

        this.element.html(`
            <div id="tap-artmenu-active-filters"></div>
            <h2 class="tap-menu-heading">${search_label}</h2>
            <div class="form-group">
                <label for="tap-artmenu-search-box" class="sr-only">Search</label>
                <input id="tap-artmenu-search-box" type="text" class="form-control form-control-sm" placeholder="Type here" />
            </div>
            
            ${window.innerWidth <= 767 ? `<details class="tap-artmenu-list"><summary>` : ''}
            <h2 class="tap-menu-heading mt-2">Filter</h2>
            ${window.innerWidth <= 767 ? `</summary>` : ''}
            
            ${show_year ? `
            <details class="tap-artmenu-list">
              <summary>Decade</summary>
              <ul id="tap-artmenu-decade-list"></ul>
            </details>
            ` : '' }
            
            ${show_origin ? `
            <details class="tap-artmenu-list">
              <summary>Depicted Place</summary>
              <ul id="tap-artmenu-origin-list"></ul>
            </details>
            ` : '' }
            
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
            ${window.innerWidth <= 767 ? `</details>` : ''}
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
                filter_label: 'Year',
                parser: function(key, field_name) {
                    return {
                        label: `${parseInt(key)}s`,
                        search_param: `r_year`,
                        search_value: `${parseInt(key)}to${parseInt(key) + 9}`
                    }
                }
            },
            origin: {
                params: { a_terms_origin: "location.id,location.label.raw" },
                field_name: "location",
                filter_label: "Depicted Place",
                parser: generic_xref_parser
            },
            collection: {
                params: { a_terms_collection: "collection.id,collection.label.raw", 'f_anonymize_collector-': 'true' },
                field_name: "collection",
                filter_label: "Collection",
                parser: generic_xref_parser
            },
            surface: {
                params: { a_terms_surface: "surface" },
                field_name: "surface",
                filter_label: "Surface",
                parser: generic_keyword_parser
            },
            medium: {
                params: { a_terms_medium: "medium" },
                field_name: "medium",
                filter_label: "Medium",
                parser: generic_keyword_parser
            },
        }

        let sender = this
        let query_names = Object.keys(queries)
        if (!show_year) query_names = query_names.filter(n => n !== 'decade')
        if (!show_origin) query_names = query_names.filter(n => n !== 'origin')
        query_names.forEach(query => {
            this.tap.make_request(
                `/api/corpus/${sender.tap.corpus_id}/ArtWork/`,
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
                                    data-filter-label="${queries[query].filter_label}"
                                    data-param="${link_info.search_param}"
                                    data-value="${link_info.search_value}">
                                  ${link_info.label}
                                </li> 
                            `)
                        }

                        if (query === 'collection') {
                            list.append(`
                                <li
                                    class="tap-artmenu-list-item"
                                    data-filter-label="Collection"
                                    data-param="f_anonymize_collector"
                                    data-value="true">
                                  Private Collection
                                </li>
                            `)
                        }
                    }
                }
            )
        })

        // perform and parse tag aggregations
        const tag_mappings = {
            color: "Palette",
            theme: "Theme",
            setting: "Setting",
            subject: "Subject"
        }

        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/ArtWork/`,
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
                                        data-filter-label="${tag_mappings[list_name]}"
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
        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/Exhibition/`,
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
                            data-filter-label="Exhibition"
                            data-param="f_id|"
                            data-value="${exhibitions[label].join('__')}">
                          ${label}
                        </li>
                    `)
                }
            }
        )

        // prizes
        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/Prize/`,
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
                            data-filter-label="Prize"
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
                    sender.grid.criteria['q'] = search_box.val()
                    sender.grid.load_images(true)
                    sender.active_filters['Search'] = {
                        param: 'q',
                        value: search_box.val()
                    }
                    sender.show_active_filters()
                }, 1000)
            }
        })

        // faceting clicks
        jQuery(document).on('click', '.tap-artmenu-list-item', function() {
            let list_item = jQuery(this)
            let filter_label = list_item.data('filter-label')
            let param = list_item.data('param')
            let value = list_item.data('value')

            if (filter_label in sender.active_filters) {
                delete sender.grid.criteria[sender.active_filters[filter_label]['param']]
            }

            sender.grid.criteria[param] = value
            sender.grid.load_images(true)
            sender.active_filters[filter_label] = {
                param: param,
                value: list_item.text()
            }
            sender.show_active_filters()
        })

        // active filter deletion
        jQuery(document).on('click', '.tap-artmenu-active-filter-delete-button', function() {
            let badge = jQuery(this).parent()
            let param = badge.data('param')
            let label = badge.data('filter-label')

            delete sender.grid.criteria[param]
            sender.grid.load_images(true)

            delete sender.active_filters[label]
            sender.show_active_filters()

            if (param === 'r_year' && sender.grid.artslider) {
                sender.grid.artslider.value1 = 1880
                sender.grid.artslider.value2 = 1990
            }
        })

        // check if grid is already filtered
        if (this.grid.initial_filter) {
            this.active_filters[this.grid.initial_filter.filter_label] = {
                param: this.grid.initial_filter.param,
                value: this.grid.initial_filter.value_label
            }
            sender.show_active_filters()
        }
    }

    show_active_filters() {
        let filter_div = jQuery('#tap-artmenu-active-filters')
        let filter_labels = Object.keys(this.active_filters)
        filter_div.empty()

        if (filter_labels.length) {
            filter_div.addClass('mt-4')
            filter_labels.forEach(filter_label => {
                let param = this.active_filters[filter_label].param
                let value = this.active_filters[filter_label].value

                filter_div.append(`
                    <span class="badge tap-artmenu-active-filter" data-param="${param}" data-filter-label="${filter_label}">
                      <span class="tap-artmenu-active-filter-label">${filter_label}: ${value}</span> <span class="dashicons dashicons-no-alt tap-artmenu-active-filter-delete-button"></span>
                    </span>
                `)
            })
        } else {
            filter_div.removeClass('mt-4')
        }
    }
}


class ArtMap {
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
                sender.load_images()
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
                sender.load_images()
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
                sender.texas_map = L.map('tap-texas-artmap', {zoomSnap: 0.3})
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19,
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
                }).addTo(sender.texas_map)
                sender.texas_map.fitBounds([
                    [36.48314061639213, -106.5234375],
                    [25.90864446329127, -93.603515625]
                ], {padding: [20, 20]})

                let texas_poly = L.polygon(texas_shape, {
                    color: '#d5b09d',
                    fill: true,
                    fillOpacity: 1,
                    interactive: false
                })
                texas_poly.addTo(sender.texas_map)
                texas_poly.bringToFront()

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
                    {'page-size': 500},
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
                                {'page-size': 1000, 'only': 'exhibit.id,artwork.id'},
                                function(exhibitions) {
                                    if (exhibitions.records) {
                                        exhibitions.records.forEach(exhibition => {
                                            if (!(exhibition.artwork.id in sender.artwork_exhibit_map)) {
                                                sender.artwork_exhibit_map[exhibition.artwork.id] = []
                                            }
                                            sender.artwork_exhibit_map[exhibition.artwork.id].push(exhibition.exhibit.id)
                                        })
                                    }

                                    sender.load_images()
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
                sender.us_map = L.map('tap-us-artmap', { zoomSnap: 0.3, attributionControl: false })
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(sender.us_map)

                sender.us_map.fitBounds([
                    [49.12081854517537,-125.84908980237064],
                    [24.581804314541866,-65.87274522302415]
                ], { padding: [20,20] })

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
            sender.criteria,
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
                      <dl>
                        <dt>Year:</dt><dd>${artwork.year}</dd>
                        ${artwork.collection && !artwork.anonymize_collector ? `<dt>Collection:</dt><dd>${artwork.collection.label}</dd>` : ''}
                        <dt>Medium:</dt><dd>${artwork.medium}</dd>
                        <dt>Surface:</dt><dd>${artwork.surface}</dd>
                        <dt>Size:</dt><dd>${artwork.size_inches}</dd>
                      </dl>
                      <a class="mt-2" href="/artwork/${artwork.id}/" target="_blank">See more...</a>
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
                          <dl>
                            <dt>Year:</dt><dd>${artwork.year}</dd>
                            ${artwork.collection && !artwork.anonymize_collector ? `<dt>Collection:</dt><dd>${artwork.collection.label}</dd>` : ''}
                            <dt>Medium:</dt><dd>${artwork.medium}</dd>
                            <dt>Surface:</dt><dd>${artwork.surface}</dd>
                            <dt>Size:</dt><dd>${artwork.size_inches}</dd>
                          </dl>
                          <a class="mt-2" href="/artwork/${artwork.id}/" target="_blank">See more...</a>
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


class ArtDetail {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.artwork_id = null
        this.dragon = null

        this.element.html(`
            <div class="row flex-grow-1${window.innerWidth <= 767 ? ' flex-column-reverse' : ''}" style="padding: 20px;">
              <div id="tap-artdetail-metadata-div" class="col-md-4 col-sm-12"></div>
              <div id="tap-artdetail-image-div" class="col-md-8 col-sm-12"></div>
            </div>
        `)

        this.metadata_div = jQuery('#tap-artdetail-metadata-div')
        this.image_div = jQuery('#tap-artdetail-image-div')

        let path_parts = window.location.pathname.split('/')
        if (path_parts.length === 4) {
            this.artwork_id = path_parts[2]

            let sender = this
            this.tap.make_request(
                `/api/corpus/${sender.tap.corpus_id}/ArtWork/${sender.artwork_id}/`,
                'GET',
                sender.criteria,
                function(meta) {
                    let tags = []
                    meta.tags.forEach(tag => {
                        let [key, value] = tag.label.split(': ')
                        tags.push(`<dt>${key}:</dt><dd><a href="/?filter_label=${key}&param=f_tags.id&value_label=${value}&value=${tag.id}">${value}</a></dd>`)
                    })

                    sender.metadata_div.append(`
                      <div class="tap-artgrid-metadata p-0 m-0">
                        <h1 class="pt-0">${meta.title}</h1>
                        <dl>
                          ${meta.caption ? `<dt>Caption:</dt><dd>${meta.caption}</dd>` : ''}
                          ${meta.alt_title ? `<dt>Alternate Title</dt><dd>${meta.alt_title}</dd>` : ''}
                          <dt>Creator:</dt><dd>${meta.artists[0].label}</dd>
                          <dt>Year:</dt><dd>${meta.year}</dd>
                          ${meta.location ? `<dt>Depicted Place:</dt><dd><a href="/?filter_label=Depicted Place&param=f_location.id&value_label=${meta.location.label}&value=${meta.location.id}">${meta.location.label}</a></dd>` : ''}
                          ${meta.edition ? `<dt>Edition</dt><dd>${meta.edition}</dd>` : ''}
                          ${tags.join('\n')}
                          <dt>Medium:</dt><dd><a href="/?filter_label=Medium&param=f_medium&value_label=${meta.medium}&value=${meta.medium}">${meta.medium}</a></dd>
                          <dt>Surface:</dt><dd><a href="/?filter_label=Surface&param=f_surface&value_label=${meta.surface}&value=${meta.surface}">${meta.surface}</a></dd>
                          <dt>Size:</dt><dd>${meta.size_inches}</dd>
                          ${meta.inscriptions ? `<dt>Inscriptions</dt><dd>${meta.inscriptions}</dd>` : ''}
                          ${meta.collection && !meta.anonymize_collector ? `<dt>Collection:</dt><dd><a href="/?filter_label=Collection&param=f_collection.id&value_label=${meta.collection.label}&value=${meta.collection.id}">${meta.collection.label}</a></dd>` : ''}
                        </dl>
                      </div>
                    `)

                    if (meta.display_restriction && ['Thumbnail Only', 'No Image'].includes(meta.display_restriction.label)) {
                        let art_region = null
                        if (meta.hasOwnProperty('featured_region_x') && meta.featured_region_x) {
                            art_region = `${meta.featured_region_x},${meta.featured_region_y},${meta.featured_region_width},${meta.featured_region_width}`;
                        }
                        sender.image_div.append(`
                            <img
                                id="tap-artgrid-img-${meta.id}"
                                src="${sender.tap.plugin_url + '/img/image-loading.svg'}"
                                class="tap-artgrid-img img-responsive mt-4"
                                data-artwork-id="${meta.id}"
                                data-iiif-identifier="${meta.iiif_uri}"
                                data-display-restriction="${meta.display_restriction ? meta.display_restriction.label : 'none'}"
                                ${art_region ? `data-region="${art_region}"` : ''}
                                style="display: block; margin: auto;"
                            />
                            <div class="text-center text-muted mt-2">The display of this image has been restricted.</div>
                        `)
                        let img = jQuery(`#tap-artgrid-img-${meta.id}`)
                        sender.tap.inject_iiif_info(img, function() {
                            sender.tap.render_image(img, 200, true)
                        })
                    } else {
                        let dragon_height = `${sender.image_div.height() - 40}px`
                        if (window.innerWidth <= 767) dragon_height = '50vh';
                        sender.image_div.append(`
                            <div id="tap-dragon" class="w-100" style="height: ${dragon_height};"></div>
                        `)

                        sender.dragon = OpenSeadragon({
                            id:                 "tap-dragon",
                            prefixUrl:          `${sender.tap.plugin_url}/js/openseadragon/images/`,
                            preserveViewport:   false,
                            visibilityRatio:    1,
                            minZoomLevel:       .50,
                            maxZoomLevel:       15,
                            defaultZoomLevel:   0,
                            //homeFillsViewer:    true,
                            showRotationControl: true,
                            tileSources:   [meta.iiif_uri],
                        })
                    }
                }
            )
        }
    }
}


class ArtFooter {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element

        this.element.html(`
            <div id="tap-footer-row" class="d-flex flex-wrap">
              <div class="tap-footer-cell">
                Texas Art Project © <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" class="tap-footer-link" target="_blank">CC BY-NC-SA 4.0</a>
              </div>
              <div class="tap-footer-cell">
                <img src="http://liberalarts.tamu.edu/codhr/wp-content/uploads/sites/34/2023/07/Logo-white-bg-left-align.png"
                  style="height: 50px; width: auto; background-color: #FFFFFF; padding: 5px;"
                  alt="The Center of Digital Humanities Research at Texas A&M University" />
              </div>
              <div class="tap-footer-cell">
                <img src="https://tamupvfa.b-cdn.net/app/uploads/2022/06/PVFA-logo-Maroon-Horizontal.png"
                  style="height: 50px; width: auto; background-color: #FFFFFF; padding: 5px; padding-right: 17px;"
                  alt="The Center of Digital Humanities Research at Texas A&M University" />
              </div>
              <div class="tap-footer-cell">
                <a href="#tap-header-div" class="tap-footer-link ml-auto">^ Back to Top</a>
              </div>
            </div>
        `)
    }
}
