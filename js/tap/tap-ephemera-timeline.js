export class EphemeraTimeline {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.currentEra = 1
        this.currentDirector = ''
        this.currentYear = ''
        this.eventObserver = null
        this.visibleEvents = new Set()
        this.events = {}
        this.agents = {}
        this.artifacts = {}

        this.agentColors = [
            '#EACFA2',
            '#E1B671',
            '#CDA15E',
            '#D89962',
            '#BF7C51',
            '#BABFA2',
            '#BCAA7A',
            '#ABA771',
            '#BAB8B2',
        ]
        this.agentColorCursor = 0

        // add dwg stylesheet and font styles
        jQuery('head').append(`
            <link rel="stylesheet" href="${this.tap.plugin_url}css/dwg.css" type="text/css" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
        `)


        // empty element and rig up event skeletons
        this.element.empty()
        this.element.append(`
            <div id="ephemera-timeline-top-bar">
                <div id="ephemera-timeline-top-bar-info-container">
                    <h3 id="ephemera-timeline-top-bar-year">1975</h3>
                    <h3 id="ephemera-timeline-top-bar-title">TBD</h3>
                </div>
            </div>
        `)
        this.renderEventSkeletons()
    }

    renderEventSkeletons() {
        this.setupEventObserver()
        let eventQueryParams = [
            'e_timespan.start=y',
            'e_agents.id=y',
            's_timespan.start=asc',
            'page-size=2000',
            'only=id,title,event_type.name,year,timespan,agents.id,artifacts.id,location.name,location.coordinates',
            `f_project.id=${this.tap.projects.dwg}`
        ]
        fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Event/?${eventQueryParams.join('&')}`)
            .then(response => response.json())
            .then(eventInfo => {
                if (eventInfo.records) {
                    eventInfo.records.forEach(event => {
                        this.events[event.id] = event

                        let agentDivs = []
                        event.agents.forEach(agentStub => {
                            let agentColor = this.getAgentColor()
                            agentDivs.push(`
                                <div id="ephemera-timeline-event-${event.id}-agent-${agentStub.id}"
                                    class="ephemera-timeline-event-agent d-none"
                                    data-agent-color="${agentColor}"
                                    style="background-color: ${agentColor};">
                                </div>
                                <div id="ephemera-timeline-event-${event.id}-agent-${agentStub.id}-gallery"
                                    class="ephemera-timeline-event-agent-gallery collapse"
                                    data-artifacts=""
                                    style="background-color: ${agentColor};">
                                    
                                    <div class="gallery-placeholder"></div>
                                </div>
                            `)
                        })

                        this.element.append(`
                            <div id="ephemera-timeline-header-${event.id}" class="ephemera-timeline-header d-none" style="background: ${this.generateBackgroundStripes()}"></div>
                            <div id="ephemera-timeline-era-${event.id}" class="ephemera-timeline-era" style="background: ${this.generateBackgroundStripes()}">
                                <div id="ephemera-timeline-event-${event.id}" class="ephemera-timeline-event skeleton" data-id="${event.id}">
                                    <div id="ephemera-timeline-event-body-${event.id}" class="ephemera-timeline-event-body">
                                        <div id="ephemera-timeline-event-postcard-container-${event.id}" class="ephemera-timeline-event-postcard-container"></div>
                                        <div class="ephemera-timeline-event-header-artists-container">
                                            <div id="ephemera-timeline-event-header-${event.id}" class="ephemera-timeline-event-header"></div>
                                            <div id="ephemera-timeline-event-artists-container-${event.id}" class="ephemera-timeline-event-artists-container">
                                                ${agentDivs.join(' ')}
                                            </div>
                                            <div class="ephemera-timeline-event-header-artists-footer"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `)
                        this.eventObserver.observe(document.getElementById(`ephemera-timeline-event-${event.id}`))
                    })
                    jQuery('.collapse').collapse({toggle: false})
                }
            })
        // end fetch
    }

    setupEventObserver() {
        let sender = this
        this.eventObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, entryIndex) => {
                let eventDiv = jQuery(entry.target)
                let eventID = eventDiv.data('id')

                if (entry.isIntersecting) {
                    this.visibleEvents.add(eventID)
                    if (!eventDiv.data('built')) sender.constructEvent(eventDiv.data('id'))
                } else {
                    this.visibleEvents.delete(eventID)
                }
            })

            let lowestYValue = null
            let yearIndicator = jQuery('#ephemera-timeline-top-bar-year')

            this.visibleEvents.forEach(eventID => {
                if (eventID in this.events) {
                    let event = this.events[eventID]
                    let eventDiv = jQuery(`#ephemera-timeline-event-${eventID}`)
                    let yValue = eventDiv.offset().top

                    if ((lowestYValue === null || yValue < lowestYValue) && event.year) {
                        yearIndicator.html(event.year)
                        lowestYValue = yValue
                    }
                }
            })
        })
    }

    async constructEvent(eventID) {
        let event = this.events[eventID]
        let eventDiv = jQuery(`#ephemera-timeline-event-${eventID}`)
        let eventHeader = jQuery(`#ephemera-timeline-event-header-${eventID}`)
        let agentRequestIDs = []

        eventDiv.data('built', true)

        let dateString = "Date Unknown"
        try {
            let startDate = new Date(event.timespan.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            let endDate = new Date(event.timespan.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

            if (startDate === endDate) dateString = startDate
            else dateString = `${startDate} &ndash; ${endDate}`
        } catch (e) {
            console.log("Unable to parse event date:")
            console.log(event)
        }

        eventHeader.append(`
            <div class="event-header-date-column">
                <h3>${dateString}</h3>
                <span>Opening reception: </span>
            </div>
            <div class="event-header-title-column">
                <h3>${event.title}</h3>
                <span>Guest curator: None</span>
            </div>
        `)

        event.agents.forEach(agent => {
            if(!(agent.id in this.agents)) agentRequestIDs.push(agent.id)
        })

        if (agentRequestIDs.length) {
            let agentRequestParams = [
                `f_id|=${agentRequestIDs.join('__')}`,
                `page-size=${agentRequestIDs.length}`,
            ]
            let agentRequest = await fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Agent/?${agentRequestParams.join('&')}`)
            let agentInfo = await agentRequest.json()

            agentInfo.records.forEach(a => {
                this.agents[a.id] = a
            })
        }

        event.agents.forEach(agentStub => {
            let agent = this.agents[agentStub.id]
            let agentDiv = jQuery(`#ephemera-timeline-event-${eventID}-agent-${agent.id}`)
            let role = null

            if (agentDiv.length) {
                if (agent.role && agent.role.name) role = agent.role.name
                if (role === 'DWG Director') {
                    let headerDiv = jQuery(`#ephemera-timeline-header-${eventID}`)
                    headerDiv.html(`
                        <h3 style="width: 50%" class="ephemera-timeline-header-director">${agent.person.name}</h3>
                        <h3 style="width: 25%" class="ephemera-timeline-header-address">Address of Gallery</h3>
                `)
                    headerDiv.removeClass('d-none')
                    eventDiv.addClass('beneath-header')
                }

                agentDiv.html(`
                    <div class="event-agent-name">
                        ${agent.person.name}
                    </div>
                    <div id="event-${event.id}-agent-${agentStub.id}-artifact-marker-holder" class="artifact-marker-holder">
                        <svg id="event-${event.id}-agent-${agentStub.id}-artifact-tray-expander" class="artifact-tray-expander d-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5.91 4.57">
                            <g style="isolation: isolate;">
                                <g style="mix-blend-mode: multiply;">
                                    <path style="fill: ${agentDiv.data('agent-color')}; stroke-width: 0px;"
                                        d="M3.73,4.57h-1.54L0,0h1.41l1.51,3.32h.09l1.5-3.32h1.41l-2.18,4.57Z"/>
                                </g>
                            </g>
                        </svg>
                    </div>
                `)
                agentDiv.removeClass('d-none')
            }
        })

        // get what we can from listings of artifacts so we can at least know how many
        // each agent has and determine which one is the postcard.
        // show the postcard
        // save getting images for the rest of the documents until a user expands the caret
        if (event.artifacts) {
            let artifactIDs = event.artifacts.map(artifactStub => artifactStub.id)
            let artifactQueryParams = [
                `f_id|=${artifactIDs.join('__')}`,
                `only=agents.id,media_type.name`
            ]
            fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Document/?${artifactQueryParams.join('&')}`)
                .then(response => response.json())
                .then(artInfo => {
                    if (artInfo.records) {
                        artInfo.records.forEach(art => {
                            // #todo: ask if postcard "counts" toward agent markers
                            if (art.media_type && art.media_type.name === 'Postcard') event.postcardID = art.id
                            else if (art.agents) {
                                art.agents.forEach(agent => {
                                    this.addAgentArtfifactMarker(eventID, agent.id, art.id)
                                })
                            }
                        })
                    }

                    if (event.postcardID) {
                        this.showEventPostcard(eventID)
                    }
                })
            // end fetch
        }
    }

    addAgentArtfifactMarker(eventID, agentID, artifactID) {
        let agentDiv = jQuery(`#ephemera-timeline-event-${eventID}-agent-${agentID}`)
        let gallery = jQuery(`#ephemera-timeline-event-${eventID}-agent-${agentID}-gallery`)
        let markerHolder = jQuery(`#event-${eventID}-agent-${agentID}-artifact-marker-holder`)
        let trayExpander = jQuery(`#event-${eventID}-agent-${agentID}-artifact-tray-expander`)

        if (agentDiv.length) {
            let currentArts = gallery.data('artifacts').split(',').filter((e) => e.length)
            let agentColor = agentDiv.data('agent-color')
            currentArts.push(artifactID)
            gallery.data('artifacts', currentArts.join(','))

            markerHolder.append(`
                <span class="artifact-marker" style="background-color: ${agentColor};"></span>
            `)

            if (trayExpander.hasClass('d-none')) {
                trayExpander.removeClass('d-none')
                trayExpander.click(() => this.showEventAgentArtifacts(eventID, agentID))

                gallery.on('shown.bs.collapse', () => {
                    if (!gallery.data('loaded')) {
                        gallery.data('loaded', true)

                        let numCols = 3
                        let gapSize = 3
                        let artIDs = gallery.data('artifacts').split(',').filter((e) => e.length)

                        //if (artIDs.length < numCols) numCols = artIDs.length
                        let maxWidth = parseInt((gallery.width() - (gapSize * (numCols - 1))) / numCols)

                        artIDs.forEach(artID => {
                            this.getArtifact(artID, (art) => {
                                let imgInfo = this.getArtifactImage(art, maxWidth, null, true)
                                if (imgInfo !== null) {
                                    gallery.append(`
                                        <a href="/ephemera-detail/${artID}/" target="_blank">
                                            <img src="${imgInfo.src}" class="ephemera-thumbnail" data-event="${eventID}"
                                                data-artifact="${artID}" />
                                        </a>
                                    `)
                                    gallery.find('.gallery-placeholder').remove()
                                }
                            })
                        })
                    }
                })
            }
        }
    }

    showEventPostcard(eventID) {
        if (eventID in this.events) {
            let event = this.events[eventID]
            if (event.postcardID) {
                this.getArtifact(event.postcardID, (postcard) => {
                    let imgInfo = this.getArtifactImage(postcard, 130)
                    if (imgInfo !== null) {
                        let postcardHolder = jQuery(`#ephemera-timeline-event-postcard-container-${eventID}`)
                        postcardHolder.append(`
                            <a href="/ephemera-detail/${event.postcardID}/" target="_blank">
                                <img id="ephemera-timeline-event-postcard-${eventID}"
                                    src="${imgInfo.src}" class="postcard-image ephemera-thumbnail"
                                    data-event="${eventID}" data-artifact="${event.postcardID}" />
                            </a>
                        `)

                        let postcardImg = jQuery(`#ephemera-timeline-event-postcard-${eventID}`)
                        let artistHolder = jQuery(`#ephemera-timeline-event-artists-container-${eventID}`)

                        if (artistHolder.height() > imgInfo.height) {
                            postcardHolder.css('align-items', 'start')
                            postcardImg.css('margin-top', '55px')
                        }
                    }
                })
            }
        }
    }

    showEventAgentArtifacts(eventID, agentID) {
        let gallery = jQuery(`#ephemera-timeline-event-${eventID}-agent-${agentID}-gallery`)
        gallery.collapse('toggle')
    }

    getArtifact(artID, callback) {
        if (!(artID in this.artifacts)) {
            fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Document/${artID}/`)
                .then(response => response.json())
                .then(artInfo => {
                    this.artifacts[artID] = artInfo
                    callback(this.artifacts[artID])
                })
            // end fetch
        } else callback(this.artifacts[artID])
    }

    getArtifactImage(art, maxWidth=null, maxHeight=null, previewSquare=false) {
        if (art.pages) {
            if (art.pages['1']) {
                if (art.pages['1'].files) {
                    let fileKeys = Object.keys(art.pages['1'].files)
                    if (fileKeys.length > 0) {
                        let filePath = art.pages['1'].files[fileKeys[0]].path
                        let fileWidth = art.pages['1'].files[fileKeys[0]].width
                        let fileHeight = art.pages['1'].files[fileKeys[0]].height
                        let reqSize = 'full'
                        let reqRegion = 'full'

                        if (maxWidth !== null && maxWidth <= fileWidth) {
                            reqSize = `${maxWidth},`
                            let ratio = maxWidth / fileWidth
                            maxHeight = parseInt(fileHeight * ratio)
                        }
                        else if (maxHeight !== null && maxHeight <= fileHeight) {
                            reqSize = `,${maxHeight}`
                            let ratio = maxHeight / fileHeight
                            maxWidth = parseInt(fileWidth * ratio)
                        } else {
                            maxWidth = fileWidth
                            maxHeight = fileHeight
                        }

                        if (previewSquare) {
                            if (fileWidth > fileHeight) reqRegion = `0,0,${fileHeight},${fileHeight}`
                            else reqRegion = `0,0,${fileWidth},${fileWidth}`
                        }

                        return {
                            src: `${this.tap.host}/iiif/2${filePath}/${reqRegion}/${reqSize}/0/default.png`,
                            width: maxWidth,
                            height: maxHeight
                        }
                    }
                }
            }
        }
        return null
    }

    generateBackgroundStripes() {
        let colors = ['#DDDDD5', '#C9C9C2']
        let color = colors[this.currentEra % 2]

        return `linear-gradient(
            to right,
            #FFFFFF calc(50% - 11px),
            ${color} calc(50% - 11px) calc(50% - 1px),
            #000000 calc(50% - 1px) 50%,
            ${color} 50% calc(50% + 10px),
            #FFFFFF calc(50% + 10px) calc(75% - 1px),
            #59554D calc(75% - 1px) 75%,
            #FFFFFF 75%
        )`
    }

    getAgentColor() {
        let agentColor = this.agentColors[this.agentColorCursor]
        this.agentColorCursor += 1
        if (this.agentColorCursor > this.agentColors.length - 1) this.agentColorCursor = 0
        return agentColor
    }
}
