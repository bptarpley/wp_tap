// noinspection JSVoidFunctionReturnValueUsed
export class EphemeraMenu {
    constructor(tap_instance, element, grid, search_label='Search', show_interface=true, data_gathered_callback=null) {
        this.tap = tap_instance
        this.element = element
        this.grid = grid
        this.active_filters = {}
        this.data_gathered_callback = data_gathered_callback

        if (!show_interface) this.element = null

        // data structure for filtering
        this.facets = {
            exhibits: {
                label: 'Event',
                byID: {},
                sortedIDs: new Set(),
                selectedIDs: new Set(),
            },
            agents: {
                label: 'Person',
                byID: {},
                sortedIDs: null,
                selectedIDs: new Set(),
            },
            collections: {
                label: 'Collection',
                byID: {},
                sortedIDs: null,
                selectedIDs: new Set(),
            },
            media: {
                label: 'Media',
                byID: {},
                sortedIDs: null,
                selectedIDs: new Set(),
            },
            themes: {
                label: 'Theme',
                byID: {},
                sortedIDs: null,
                selectedIDs: new Set(),
            },
            years: {
                label: 'Year',
                byID: {},
                sortedIDs: new Set(),
                selectedIDs: new Set(),
            }
        }
        this.gather_facet_data()

        if (this.element !== null) {
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
                
                <details class="tap-artmenu-list">
                  <summary>Year</summary>
                  <ul id="tap-artmenu-years-list"></ul>
                </details>
                
                <details class="tap-artmenu-list">
                  <summary>People</summary>
                  <ul id="tap-artmenu-agents-list" class="vertically-scroll"></ul>
                </details>
                
                <details class="tap-artmenu-list">
                  <summary>Collection</summary>
                  <ul id="tap-artmenu-collections-list"></ul>
                </details>
                
                <details class="tap-artmenu-list">
                  <summary>Event</summary>
                  <ul id="tap-artmenu-exhibits-list" class="vertically-scroll"></ul>
                </details>
                
                <details class="tap-artmenu-list">
                  <summary>Media</summary>
                  <ul id="tap-artmenu-media-list"></ul>
                </details>
                
                <details class="tap-artmenu-list">
                  <summary>Theme</summary>
                  <ul id="tap-artmenu-themes-list"></ul>
                </details>
                
                ${window.innerWidth <= 767 ? `</details>` : ''}
            `)

            // handle events
            let sender = this

            this.element.on('dataGathered', function() {
                const urlParams = new URLSearchParams(window.location.search)
                let facetGETParam = urlParams.get('facet')
                let valueGETParam = urlParams.get('value')
                let filtered = false

                if (facetGETParam && (facetGETParam in sender.facets)) {
                    let facLabel = sender.facets[facetGETParam].label
                    let valLabel = sender.facets[facetGETParam].byID[valueGETParam].label
                    let filterLabel = `${facLabel}: ${valLabel}`
                    sender.active_filters[filterLabel] = {
                        param: facetGETParam,
                        value: valueGETParam
                    }
                    filtered = true
                }

                if (filtered) {
                    sender.adjust_artifact_selection()
                    sender.adjust_facets()
                    sender.show_active_filters()
                }

                sender.populate_facet_lists(filtered)
                sender.grid.load_images()
            })

            // search box
            let search_timer = null
            let search_box = jQuery('#tap-artmenu-search-box')
            search_box.on('keydown', function() {
                if (search_box.val()) {
                    let searchTerm = search_box.val().toLowerCase()

                    clearTimeout(search_timer)
                    search_timer = setTimeout(function () {
                        sender.active_filters[`Search: ${search_box.val()}`] = {
                            param: 'search',
                            value: search_box.val()
                        }

                        sender.adjust_artifact_selection()
                        sender.adjust_facets()
                        sender.show_active_filters()
                        sender.populate_facet_lists(true)
                        sender.grid.load_images()
                    }, 1000)
                }
            })

            // faceting clicks
            jQuery(document).on('click', '.tap-artmenu-list-item', function() {
                let list_item = jQuery(this)
                let filter_label = list_item.data('filter-label')
                let param = list_item.data('param')
                let value = list_item.data('value')

                sender.active_filters[filter_label] = {
                    param: param,
                    value: value,
                }

                sender.adjust_artifact_selection()
                sender.adjust_facets()
                sender.show_active_filters()
                sender.populate_facet_lists(true)
                sender.grid.load_images()
            })

            // active filter deletion
            jQuery(document).on('click', '.tap-artmenu-active-filter-delete-button', function() {
                let badge = jQuery(this).parent()
                let label = badge.data('filter-label')

                delete sender.active_filters[label]

                sender.adjust_artifact_selection()
                sender.adjust_facets()
                sender.show_active_filters()
                sender.populate_facet_lists(Object.keys(sender.active_filters).length > 0)
                sender.grid.load_images()
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
    }

    gather_facet_data() {
        let sender = this

        // grab exhibit info
        let exParams = [
            'e_timespan.start=y',
            's_timespan.start=asc',
            'page-size=2000',
            'only=id,label,year,agents.id,agents.label,artifacts.id',
            `f_project.id=${sender.tap.projects.dwg}`
        ]
        fetch(`${sender.tap.host}/api/corpus/${sender.tap.corpus_id}/Event/?${exParams.join('&')}`)
            .then(response => response.json())
            .then(exInfo => {
                exInfo.records.forEach(ex => {
                    sender.facets.exhibits.byID[ex.id] = ex
                    sender.facets.exhibits.byID[ex.id]['artifactIDs'] = new Set()
                    sender.facets.exhibits.sortedIDs.add(ex.id)
                    if (ex.year) {
                        sender.facets.years.byID[ex.year] = { label: ex.year.toString(), artifactIDs: new Set() }
                        sender.facets.years.sortedIDs.add(ex.year)
                    }
                })

                // grab artifact info
                let docParams = [
                    'page-size=2000',
                    'only=id,agents.id,agents.label,artifacts.id,collection,media_type,themes',
                    `f_project.id=${sender.tap.projects.dwg}`
                ]
                fetch(`${sender.tap.host}/api/corpus/${sender.tap.corpus_id}/Document/?${docParams.join('&')}`)
                    .then(response => response.json())
                    .then(docInfo => {
                        docInfo.records.forEach(doc => {
                            sender.grid.artifacts.byID[doc.id] = doc
                            sender.grid.artifacts.byID[doc.id]['facets'] = {
                                exhibits: new Set(),
                                agents: new Set(),
                                collections: new Set(),
                                media: new Set(),
                                themes: new Set(),
                                years: new Set(),
                            }
                        })

                        // iterate over sorted exhibits in order to:
                        // populate exhibit facet list
                        // populate and cross-associate artifacts and agents
                        sender.facets.exhibits.sortedIDs.forEach(ex_id => {
                            let ex = sender.facets.exhibits.byID[ex_id]

                            // associate artifacts with exhibits
                            if (ex.artifacts) {
                                ex.artifacts.forEach(artInfo => {
                                    if (artInfo.id in sender.grid.artifacts.byID) {
                                        let art = sender.grid.artifacts.byID[artInfo.id]
                                        sender.grid.artifacts.sortedIDs.add(art.id)
                                        ex.artifactIDs.add(art.id)
                                        art.facets.exhibits.add(ex.id)
                                        if (ex.year) {
                                            art.facets.years.add(ex.year)
                                            sender.facets.years.byID[ex.year].artifactIDs.add(art.id)
                                        }
                                    }
                                })
                                delete ex.artifacts
                            }

                            // associate artifacts with exhibit agents
                            if (ex.agents) {
                                ex.agents.forEach(agentInfo => {
                                    if (!(agentInfo.id in sender.facets.agents.byID)) {
                                        sender.facets.agents.byID[agentInfo.id] = agentInfo
                                        sender.facets.agents.byID[agentInfo.id]['artifactIDs'] = new Set()
                                    }
                                    let agent = sender.facets.agents.byID[agentInfo.id]

                                    ex.artifactIDs.forEach(artID => {
                                        let art = sender.grid.artifacts.byID[artID]
                                        art.facets.agents.add(agent.id)
                                        agent.artifactIDs.add(artID)
                                    })
                                })
                                delete ex.agents
                            }
                        })

                        // iterate over artifacts in order to:
                        // populate and cross-associate agents, collections, media, and themes
                        sender.grid.artifacts.sortedIDs.forEach(artID => {
                            let art = sender.grid.artifacts.byID[artID]

                            if (art.agents) {
                                // noinspection JSVoidFunctionReturnValueUsed
                                art.agents.forEach(agentInfo => {
                                    if (!(agentInfo.id in sender.facets.agents.byID)) {
                                        sender.facets.agents.byID[agentInfo.id] = agentInfo
                                        sender.facets.agents.byID[agentInfo.id]['artifactIDs'] = new Set()
                                    }
                                    art.facets.agents.add(agentInfo.id)
                                    sender.facets.agents.byID[agentInfo.id].artifactIDs.add(art.id)
                                })
                                delete art.agents
                            }

                            if (art.collection) {
                                if (!(art.collection.id in sender.facets.collections.byID)) {
                                    sender.facets.collections.byID[art.collection.id] = art.collection
                                    sender.facets.collections.byID[art.collection.id]['artifactIDs'] = new Set()
                                }
                                sender.facets.collections.byID[art.collection.id].artifactIDs.add(art.id)
                                art.facets.collections.add(art.collection.id)
                                delete art.collection
                            }

                            if (art.media_type) {
                                if (!(art.media_type.id in sender.facets.media.byID)) {
                                    sender.facets.media.byID[art.media_type.id] = art.media_type
                                    sender.facets.media.byID[art.media_type.id]['artifactIDs'] = new Set()
                                }
                                sender.facets.media.byID[art.media_type.id].artifactIDs.add(art.id)
                                art.facets.media.add(art.media_type.id)
                                delete art.media_type
                            }

                            if (art.themes) {
                                art.themes.forEach(theme => {
                                    if (!(theme.id in sender.facets.themes.byID)) {
                                        sender.facets.themes.byID[theme.id] = theme
                                        sender.facets.themes.byID[theme.id]['artifactIDs'] = new Set()
                                    }
                                    sender.facets.themes.byID[theme.id].artifactIDs.add(art.id)
                                    art.facets.themes.add(theme.id)
                                })
                                delete art.themes
                            }
                        })

                        let dataTypesToSort = ['agents', 'collections', 'media', 'themes']
                        dataTypesToSort.forEach(cachedDataType => {
                            sender.facets[cachedDataType].sortedIDs = new Set(sender.tap.sortObjectByKey(
                                sender.facets[cachedDataType].byID,
                                'label'
                            ))
                        })

                        if (sender.element !== null) sender.element.trigger('dataGathered')
                        if (sender.data_gathered_callback !== null) sender.data_gathered_callback()
                    }) // end of artifact fetching
            }) // end of exhibit fetching
    }

    populate_facet_lists(filtered=false) {
        Object.keys(this.facets).forEach(facet => {
            let facetList = jQuery(`#tap-artmenu-${facet}-list`)
            facetList.empty()

            this.facets[facet].sortedIDs.forEach(facetID => {
                if (!filtered || this.facets[facet].selectedIDs.has(facetID)) {
                    facetList.append(`
                        <li class="tap-artmenu-list-item"
                            data-filter-label="${this.facets[facet].label}: ${this.facets[facet].byID[facetID].label}"
                            data-param="${facet}"
                            data-value="${facetID}">
                        ${this.facets[facet].byID[facetID].label}
                        </li> 
                    `)
                }
            })
        })
    }

    adjust_artifact_selection() {
        this.grid.artifacts.selectedIDs.clear()
        let searchTerm = null

        Object.keys(this.active_filters).forEach(filter => {
            if (this.active_filters[filter].param === 'search') {
                searchTerm = this.active_filters[filter].value
            } else {
                let param = this.active_filters[filter].param
                let value = this.active_filters[filter].value

                if (this.grid.artifacts.selectedIDs.size) {
                    this.grid.artifacts.selectedIDs = this.grid.artifacts.selectedIDs.intersection(
                        this.facets[param].byID[value].artifactIDs
                    )
                } else {
                    this.grid.artifacts.selectedIDs = new Set(this.facets[param].byID[value].artifactIDs)
                }
            }
        })

        if (searchTerm) {
            let artIDList = null
            if (this.grid.artifacts.selectedIDs.size) artIDList = new Set(this.grid.artifacts.selectedIDs)
            else artIDList = new Set(this.grid.artifacts.sortedIDs)

            this.grid.artifacts.selectedIDs.clear()

            artIDList.forEach(artID => {
                let searchMatch = false

                Object.keys(this.grid.artifacts.byID[artID].facets).forEach(facet => {
                    this.grid.artifacts.byID[artID].facets[facet].forEach(facetID => {
                        if (this.facets[facet].byID[facetID].label.toLowerCase().includes(searchTerm)) searchMatch = true
                    })
                })

                if (searchMatch) this.grid.artifacts.selectedIDs.add(artID)
            })
        }
    }

    adjust_facets() {
        Object.keys(this.facets).forEach(facet => this.facets[facet].selectedIDs.clear())
        this.grid.artifacts.selectedIDs.forEach(artID => {
            let art = this.grid.artifacts.byID[artID]
            Object.keys(this.facets).forEach(facet => {
                if (art.facets[facet].size) {
                    if (this.facets[facet].selectedIDs.size)
                        this.facets[facet].selectedIDs = this.facets[facet].selectedIDs.union(art.facets[facet])
                    else this.facets[facet].selectedIDs = new Set(art.facets[facet])
                }
            })
        })
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
                    <span class="badge tap-artmenu-active-filter" data-param="${param}" data-value="${value}" data-filter-label="${filter_label}">
                      <span class="tap-artmenu-active-filter-label">${filter_label}</span> <span class="dashicons dashicons-no-alt tap-artmenu-active-filter-delete-button"></span>
                    </span>
                `)
            })
        } else {
            filter_div.removeClass('mt-4')
        }
    }
}
