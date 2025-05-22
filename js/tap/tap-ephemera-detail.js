export class EphemeraDetail {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.artID = null
        this.dragon = null

        this.element.html(`
            <div class="row flex-grow-1${window.innerWidth <= 767 ? ' flex-column-reverse' : ''}" style="padding: 20px;">
                <div id="tap-artdetail-metadata-div" class="col-md-4 col-sm-12"></div>
                <div id="tap-artdetail-image-div" class="col-md-8 col-sm-12">  
                </div>
            </div>
        `)

        this.metaDiv = jQuery('#tap-artdetail-metadata-div')
        this.dragonDiv = jQuery('#tap-artdetail-image-div')

        let path_parts = window.location.pathname.split('/')
        if (path_parts.length === 4) {
            this.artID = path_parts[2]
            
            fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Document/${this.artID}/`)
                .then(res => res.json())
                .then(art => {
                    let dragonHeight = parseInt(this.dragonDiv.height() - 40)
                    let iiifIdentifiers = []
    
                    Object.keys(art.pages).forEach(refNo => {
                        Object.keys(art.pages[refNo].files).forEach(fileKey => {
                            let imgPath = art.pages[refNo].files[fileKey].path
                            iiifIdentifiers.push(`${this.tap.host}/iiif/2${imgPath}/info.json`)
                        })
                    })
    
                    if (iiifIdentifiers) {
                        this.dragonDiv.append(`
                            <div id="tap-dragon" class="w-100" style="height: ${dragonHeight}px;"></div>
                        `)

                        this.dragon = OpenSeadragon({
                            id:                 "tap-dragon",
                            prefixUrl:          `${this.tap.plugin_url}/js/openseadragon/images/`,
                            preserveViewport:   false,
                            visibilityRatio:    1,
                            minZoomLevel:       .25,
                            maxZoomLevel:       15,
                            defaultZoomLevel:   0,
                            homeFillsViewer:    false,
                            showRotationControl: true,
                            tileSources:   iiifIdentifiers,
                            sequenceMode: true,
                            showReferenceStrip: true,
                            referenceStripScroll: 'horizontal',
                        })
                    }
    
                    fetch(`${this.tap.host}/api/corpus/${this.tap.corpus_id}/Event/?f_artifacts.id=${this.artID}&only=id,label`)
                        .then(res => res.json())
                        .then(exhibitInfo => {
                            let metas = []

                            if (exhibitInfo.records) {
                                let exhibitLabel = 'Exhibit'
                                if (exhibitInfo.records.length > 1) exhibitLabel += 's'
                                let exhibitLinks = exhibitInfo.records.map(ex => `<a href="/dwg?facet=exhibits&value=${ex.id}">${ex.label}</a>`)

                                metas.push(`<dt>${exhibitLabel}:</dt><dd>${exhibitLinks.join('<br />')}</dd>`)
                            }

                            if (art.agents.length) {
                                let peopleLinks = art.agents.map(agent => `<a href="/dwg?facet=agents&value=${agent.id}">${agent.label}</a>`)
                                metas.push(`<dt>People:</dt><dd>${peopleLinks.join('<br />')}</dd>`)
                            }

                            if (art.collection) metas.push(`<dt>Collection:</dt><dd><a href="/dwg?facet=collections&value=${art.collection.id}">${art.collection.label}</a></dd>`)
                            if (art.media_type) metas.push(`<dt>Media Type:</dt><dd><a href="/dwg?facet=media&value=${art.media_type.id}">${art.media_type.label}</a></dd>`)

                            if (art.themes.length) {
                                let themeLinks = art.themes.map(theme => `<a href="/dwg?facet=themes&value=${theme.id}">${theme.label}</a>`)
                                metas.push(`<dt>Themes:</dt><dd>${themeLinks.join('<br />')}</dd>`)
                            }

                            if (art.year) metas.push(`<dt>Year:</dt><dd><a href="/dwg?facet=years&value=${art.year}">${art.year}</a></dd>`)

                            this.metaDiv.append(`
                                <dl>
                                    ${metas.join('\n')}
                                </dl>
                            `)
                        })
                    // end fetch

                    this.metaDiv.css({
                        'max-height': `${dragonHeight}px`,
                        'overflow-y': 'scroll'
                    })
                })
            // end fetch
        }
    }
}
