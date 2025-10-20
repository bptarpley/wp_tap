export class EphemeraGrid {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element
        this.grid_width = 600
        this.cell_width = 200
        this.artifacts = {
            byID: {},
            sortedIDs: new Set(),
            selectedIDs: new Set(),
        }
        this.dragon = null

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

        // add dwg stylesheet
        jQuery('head').append(`<link rel="stylesheet" href="${this.tap.plugin_url}css/dwg.css" type="text/css" />`)

        let sender = this
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry && entry.isIntersecting && entry.intersectionRatio >= 0.3) {
                    let img = jQuery(entry.target)
                    let artID = img.data('artifact-id')

                    if (artID in sender.artifacts.byID) {
                        let art = sender.artifacts.byID[artID]
                        if (!art.hasOwnProperty('page_image')) {
                            fetch(`${sender.tap.host}/api/corpus/${sender.tap.corpus_id}/Document/${artID}/?only=pages,uri`)
                                .then(resp => resp.json())
                                .then(artInfo => {
                                    sender.artifacts.byID[artID].pages = artInfo.pages

                                    if (artInfo.pages && ('1' in artInfo.pages) && ('files' in artInfo.pages['1'])) {
                                        let file_keys = Object.keys(artInfo.pages['1'].files)
                                        if (file_keys.length) {
                                            let img_path = artInfo.pages['1'].files[file_keys[0]].path
                                            let width = artInfo.pages['1'].files[file_keys[0]].width
                                            let height = artInfo.pages['1'].files[file_keys[0]].height
                                            let img_bounds = entry.target.getBoundingClientRect()
                                            let target_width = parseInt(img_bounds.width)
                                            let target_height = parseInt(img_bounds.height)
                                            let iiifIdentifier = `${sender.tap.host}/iiif/2${img_path}`
                                            let imgSrc = `${iiifIdentifier}/full/max/0/default.png`

                                            if (width > height) {
                                                if (height > target_height) {
                                                    imgSrc = `${iiifIdentifier}/0,0,${height},${height}/,${target_height}/0/default.png`
                                                }
                                            } else {
                                                if (width > target_width) {
                                                    imgSrc = `${iiifIdentifier}/0,0,${width},${width}/${target_width},/0/default.png`
                                                }
                                            }

                                            img.data('iiif-identifier', iiifIdentifier)
                                            img.attr('src', imgSrc)
                                        }
                                        // get the file path and format accordingly: https://corpora.dh.tamu.edu/iiif/2/corpora/6328b1338170d921f63fc09d/Document/ed08/668dae6e92198acb28ed08fe/pages/1/dwg_dpl022_1.png/full/max/0/default.png
                                    }
                                })
                        }
                    }
                }
            })
        }, {threshold: 0.3})
    }

    load_images() {
        let sender = this
        sender.element.empty()

        sender.artifacts.sortedIDs.forEach(artID => {
            if (sender.artifacts.selectedIDs.has(artID) || sender.artifacts.selectedIDs.size === 0) {
                let art_region = null

                sender.element.append(`
                <div id="tap-artgrid-cell-${artID}" class="col-md-4 tap-artgrid-cell" data-artifact-id="${artID}">
                  <a href="/ephemera-detail/${artID}/" target="_blank">
                      <img
                        id="tap-artgrid-img-${artID}"
                        src="${sender.tap.plugin_url}/img/image-loading.svg"
                        class="tap-artgrid-img img-responsive"
                        data-artifact-id="${artID}"
                        data-iiif-identifier=""
                        ${art_region ? `data-region="${art_region}"` : ''}
                      />
                  </a>
                </div>
            `)
            }
        })

        jQuery(`img.tap-artgrid-img:not([data-observed])`).each(function () {
            jQuery(this).on('load', function () {
                sender.observer.observe(this)
                jQuery(this).data('observed', true)
            })
        })
    }
}
