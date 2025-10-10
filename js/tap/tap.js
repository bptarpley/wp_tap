import { SiteHeader } from 'tap-site-header'
import { HeaderImage } from 'tap-header-image'
import { ArtGrid } from 'tap-art-grid'
import { ArtMenu } from 'tap-art-menu'
import { ArtMap } from 'tap-art-map'
import { ArtDetail } from 'tap-art-detail'
import { EphemeraMenu } from 'tap-ephemera-menu'
import { EphemeraGrid } from 'tap-ephemera-grid'
import { EphemeraTimeline } from 'tap-ephemera-timeline'
import { EphemeraDetail } from 'tap-ephemera-detail'
import { ArtFooter } from 'tap-art-footer'


export class TexasArtProject {
    constructor(corpora_host, corpora_token, tap_corpus_id, projects, plugin_url) {
        this.host = corpora_host
        this.token = corpora_token
        this.corpus_id = tap_corpus_id
        this.projects = Object.assign({}, projects)
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

        // EPHEMERA GRID
        let tap_ephemera_grid = jQuery('#tap-ephemera-grid')
        if (tap_ephemera_grid.length) {
            this.ephemeraGrid = new EphemeraGrid(this, tap_ephemera_grid)
        }

        // EPHEMERA MENU
        let tap_ephemera_menu = jQuery('#tap-ephemera-menu')
        if (tap_ephemera_menu.length) {
            this.ephemeraMenu = new EphemeraMenu(this, tap_ephemera_menu, this.ephemeraGrid, "Search DWG Ephemera")
        }

        // EPHEMERA TIMELINE
        let tap_ephemera_timeline = jQuery('#tap-ephemera-timeline')
        if (tap_ephemera_timeline.length) {
            this.ephemeraTimeline = new EphemeraTimeline(this, tap_ephemera_timeline)
        }

        // EPHEMERA DETAIL
        let tap_ephemera_detail = jQuery('#tap-ephemera-detail-div')
        if (tap_ephemera_detail.length) {
            this.ephemeraDetail = new EphemeraDetail(this, tap_ephemera_detail)
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

    sortObjectByKey(obj, nestedKey) {
        return Object.keys(obj).sort((keyA, keyB) => {
            // Get the nested values
            const valueA = obj[keyA][nestedKey]
            const valueB = obj[keyB][nestedKey]

            // Handle cases where the nested key doesn't exist
            if (valueA === undefined && valueB === undefined) return 0;
            if (valueA === undefined) return 1
            if (valueB === undefined) return -1

            // Compare the values
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return valueA.localeCompare(valueB) // For string comparison
            } else {
                return valueA - valueB // For numeric comparison
            }
        })
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
        let width = parseInt(size)
        let height = parseInt(size)

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
    
    render_metadata(artwork, style='vertical') {
        if (style === 'vertical') {
            return `
              <dl>
                <dt>Year:</dt><dd>${artwork.year}</dd>
                ${artwork.collection && !artwork.anonymize_collector ? `<dt>Collection:</dt><dd>${artwork.collection.label}</dd>` : ''}
                ${artwork.anonymize_collector ? `<dt>Collection:</dt><dd>Private Collection</dd>` : ''}
                <dt>Medium:</dt><dd>${artwork.medium}</dd>
                <dt>Surface:</dt><dd>${artwork.surface}</dd>
                <dt>Size:</dt><dd>${artwork.size_inches}</dd>
              </dl>
              <a class="mt-2" href="/artwork/${artwork.id}/" target="_blank">See more...</a>
            `
        } else if (style === 'horizontal') {
            return `
                <div class="row">
                  <div class="col-md-6">
                    <dl>
                      <dt>Year:</dt><dd>${artwork.year}</dd>
                      <dt>Medium:</dt><dd>${artwork.medium}</dd>
                      <dt>Surface:</dt><dd>${artwork.surface}</dd>
                    </dl>
                  </div>
                  <div class="col-md-6 d-flex flex-column">
                    <dl style="flex: 1;">
                      ${artwork.collection && !artwork.anonymize_collector ? `<dt>Collection:</dt><dd>${artwork.collection.label}</dd>` : ''}
                      ${artwork.anonymize_collector ? `<dt>Collection:</dt><dd>Private Collection</dd>` : ''}
                      <dt>Size:</dt><dd>${artwork.size_inches}</dd>
                    </dl>
                    <div class="w-100">
                      <a class="float-right" href="/artwork/${artwork.id}/" target="_blank">See more...</a>
                    </div>
                  </div>
                </div>
            `
        } else if (style === 'full') {
            let tags = []
            artwork.tags.forEach(tag => {
                let [key, value] = tag.label.split(': ')
                tags.push(`<dt>${key}:</dt><dd>${value}</dd>`)
            })

            let exhibits = []
            artwork.exhibits.forEach(exhibit => {
                exhibits.push(`<p>${exhibit.label}</p>`)
            })

            let prizes = []
            artwork.prizes.forEach(prize => {
                prizes.push(`<p><i>${prize.name}</i> awarded at ${prize.exhibit}</p>`)
            })

            return `
                <dl>
                  ${artwork.caption ? `<dt>Caption:</dt><dd>${artwork.caption}</dd>` : ''}
                  ${artwork.alt_title ? `<dt>Alternate Title</dt><dd>${artwork.alt_title}</dd>` : ''}
                  <dt>Creator:</dt><dd>${artwork.artists[0].label}</dd>
                  <dt>Year:</dt><dd>${artwork.year}</dd>
                  ${artwork.location ? `<dt>Depicted Place:</dt><dd><a href="/schiwetz/home/?filter_label=Depicted Place&param=f_location.id&value_label=${artwork.location.label}&value=${artwork.location.id}">${artwork.location.label}</a></dd>` : ''}
                  ${artwork.edition ? `<dt>Edition</dt><dd>${artwork.edition}</dd>` : ''}
                  ${tags.join('\n')}
                  <dt>Medium:</dt><dd><a href="/schiwetz/home/?filter_label=Medium&param=f_medium&value_label=${artwork.medium}&value=${artwork.medium}">${artwork.medium}</a></dd>
                  ${artwork.surface ? `<dt>Surface:</dt><dd><a href="/schiwetz/home/?filter_label=Surface&param=f_surface&value_label=${artwork.surface}&value=${artwork.surface}">${artwork.surface}</a></dd>` : ''}
                  <dt>Size:</dt><dd>${artwork.size_inches}</dd>
                  ${artwork.inscriptions ? `<dt>Inscriptions</dt><dd>${artwork.inscriptions}</dd>` : ''}
                  ${artwork.collection && !artwork.anonymize_collector ? `<dt>Collection:</dt><dd><a href="/schiwetz/home/?filter_label=Collection&param=f_collection.id&value_label=${artwork.collection.label}&value=${artwork.collection.id}">${artwork.collection.label}</a></dd>` : ''}
                  ${artwork.anonymize_collector ? `<dt>Collection:</dt><dd><a href="/schiwetz/home/?filter_label=Collection&param=f_anonymize_collector&value_label=Private Collection&value=true">Private Collection</a></dd>` : ''}
                </dl>
                
                ${exhibits.length ? `
                    <h2>Exhibits</h2>
                    ${exhibits.join('\n')}
                ` : ''}
                
                ${prizes.length ? `
                    <h2>Prizes</h2>
                    ${prizes.join('\n')}
                ` : ''}
            `
        }
    }
}
