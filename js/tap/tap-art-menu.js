export class ArtMenu {
    constructor(tap_instance, element, grid, search_label='Search', show_year=true, show_origin=true) {
        this.tap = tap_instance
        this.element = element
        this.grid = grid
        this.active_filters = {}
        this.show_year = show_year
        this.show_origin = show_origin

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

        // handle events
        let sender = this

        this.grid.element.on('images_loaded', function() { sender.populate_facets() })

        // search box
        let search_timer = null
        let search_box = jQuery('#tap-artmenu-search-box')
        search_box.on('keydown', function() {
            if (search_box.val()) {
                clearTimeout(search_timer)
                search_timer = setTimeout(function () {
                    sender.grid.criteria['q'] = search_box.val()
                    sender.grid.load_images(true, function() {
                        sender.active_filters['Search'] = {
                            param: 'q',
                            value: search_box.val()
                        }
                        sender.populate_facets()
                        sender.show_active_filters()
                    })
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

            delete sender.active_filters[label]
            sender.show_active_filters()

            delete sender.grid.criteria[param]
            sender.grid.load_images(true)

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

    populate_facets() {
        jQuery('.tap-artmenu-list-item').remove()
        jQuery('.tap-artmenu-list.empty').removeClass('empty')

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
        if (!sender.show_year) query_names = query_names.filter(n => n !== 'decade')
        if (!sender.show_origin) query_names = query_names.filter(n => n !== 'origin')

        let existing_criteria = Object.assign({}, sender.grid.criteria)
        delete existing_criteria['page-size']
        delete existing_criteria['page']

        query_names.forEach(query => {
            this.tap.make_request(
                `/api/corpus/${sender.tap.corpus_id}/ArtWork/`,
                'GET',
                Object.assign(
                    {'page-size': 0},
                    queries[query].params,
                    { 'f_artists.id': sender.tap.buck_agent_id },
                    existing_criteria
                ),
                function(data) {
                    if (data.meta && data.meta.aggregations && query in data.meta.aggregations) {
                        let list = jQuery(`#tap-artmenu-${query}-list`)
                        let aggregation_keys = Object.keys(data.meta.aggregations[query]).filter(function(key) {
                            return data.meta.aggregations[query][key] > 0
                        })

                        if (aggregation_keys.length > 0) {
                            aggregation_keys.forEach(key => {
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
                            })

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
                        } else {
                            list.parent().addClass('empty').removeAttr('open')
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
            Object.assign({a_terms_tags: 'tags.id,tags.label.raw'}, existing_criteria),
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
        let existing_artwork_filter = {}
        if (Object.keys(existing_criteria).length > 1) {
            let filtered_artworks = jQuery('.tap-artgrid-img')
            let filtered_ids = []

            filtered_artworks.each(function() {
                filtered_ids.push(jQuery(this).data('artwork-id'))
            })

            existing_artwork_filter['f_artwork.id|'] = filtered_ids.join('__')
        }

        this.tap.make_request(
            `/api/corpus/${sender.tap.corpus_id}/Exhibition/`,
            'GET',
            Object.assign({'page-size': 100, only: 'artwork.id,exhibit.label', 'content_view': 'corpus_6328b1338170d921f63fc09d_buck_exhibitions' }, existing_artwork_filter),
            function(data) {
                let exhibitions = {}
                let list = jQuery('#tap-artmenu-exhibition-list')
                let has_results = false

                data.records.forEach(record => {
                    if (!(record.exhibit.label in exhibitions)) exhibitions[record.exhibit.label] = []
                    exhibitions[record.exhibit.label].push(record.artwork.id)
                    has_results = true
                })

                if (!has_results) list.parent().addClass('empty')

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
            Object.assign({'page-size': 100, 'e_artwork.id': 'y', only: 'artwork.id,name', content_view: 'corpus_6328b1338170d921f63fc09d_buck_prizes'}, existing_artwork_filter),
            function(data) {
                let prizes = {}
                let list = jQuery('#tap-artmenu-prize-list')
                let has_results = false

                data.records.forEach(record => {
                    if (!(record.name in prizes)) prizes[record.name] = []
                    prizes[record.name].push(record.artwork.id)
                    has_results = true
                })

                if (!has_results) list.parent().addClass('empty')

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
