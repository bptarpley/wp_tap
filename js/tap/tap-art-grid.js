export class ArtGrid {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.criteria = {'page-size': 5000, 'page': 1}
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
                            sender.load_images(false)
                        }
                    }
                }
            })
        }, {threshold: 0.3})

        this.load_images(true)

        jQuery(document).on('click', 'div.tap-artgrid-cell', function() {
            let cell = jQuery(this)
            if (!cell.hasClass('featured')) {
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
                    sender.tap.inject_iiif_info(img, function () {
                        sender.tap.render_image(img, grid_width - 10, false)
                    })

                let meta = sender.metadata[artwork_id]

                cell.append(`
                  <div class="tap-artgrid-metadata">
                    <h1>${meta.title}</h1>
                    ${sender.tap.render_metadata(meta, 'horizontal')}
                  </div>
                `)

                cell.removeClass('col-md-4')
                cell.addClass('col-sm-12')
                cell.addClass('featured')
                img.addClass('featured')
                setTimeout(function () {
                    cell[0].scrollIntoView({behavior: "smooth"})
                }, 1500)
            }
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
            Object.assign(sender.criteria, { 'f_artists.id': sender.tap.buck_agent_id }),
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

                    sender.element.trigger('images_loaded', {num_images: artworks.records.length})
                }
            }
        )
    }
}
