export class ArtDetail {
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
                {},
                function(meta) {

                    sender.tap.make_request(
                        `/api/corpus/${sender.tap.corpus_id}/Exhibition/`,
                        'GET',
                        {'page-size': 100, 'f_artwork.id': sender.artwork_id},
                        function(exhibitions) {
                            meta.exhibits = []
                            if (exhibitions.records) {
                                exhibitions.records.forEach(exhibition => {
                                    meta.exhibits.push(Object.assign({}, exhibition.exhibit))
                                })
                            }

                            sender.tap.make_request(
                                `/api/corpus/${sender.tap.corpus_id}/Prize/`,
                                'GET',
                                {'page-size': 100, 'f_artwork.id': sender.artwork_id},
                                function(prizes) {
                                    meta.prizes = []
                                    if (prizes.records) {
                                        prizes.records.forEach(prize => {
                                            meta.prizes.push({
                                                name: prize.name,
                                                exhibit: prize.exhibit.label
                                            })
                                        })
                                    }

                                    sender.metadata_div.append(`
                                      <div class="tap-artgrid-metadata p-0 m-0">
                                        <h1 class="pt-0">${meta.title}</h1>
                                        ${sender.tap.render_metadata(meta, 'full')}
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
                    )
                }
            )
        }
    }
}
