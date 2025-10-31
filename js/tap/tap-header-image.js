export class HeaderImage {
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
            '/events/': {
                src: `${this.tap.plugin_url}/img/events.png`,
                alt: "Events"
            },
            '/contact/': {
                src: `${this.tap.plugin_url}/img/contact-us.png`,
                alt: "Contact Us"
            },
            '/dwg/': {
                src: `${this.tap.plugin_url}/img/dwg-header.png`,
                alt: "Dallas Women's Gallery"
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
        } else {
            Object.keys(this.headers).forEach(path => {
                if (this.tap.path.startsWith(path)) {
                    this.element.append(`
                        <img class="tap-header-image" src="${this.headers[this.tap.path].src}" alt="${this.headers[this.tap.path].alt}" loading="lazy" border="0" />
                    `)
                }
            })
        }
    }
}
