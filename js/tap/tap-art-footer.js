export class ArtFooter {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element

        this.element.html(`
            <div id="tap-footer-row" class="d-flex flex-wrap">
              <div class="tap-footer-cell">
                Texas Art Project © <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" class="tap-footer-link" target="_blank">CC BY-NC-SA 4.0</a>
              </div>
              <div class="tap-footer-cell">
                <img src="${this.tap.plugin_url}/img/codhr-footer-logo.png"
                  style="height: 50px; width: auto; background-color: #FFFFFF; padding: 5px;"
                  alt="The Center of Digital Humanities Research at Texas A&M University" />
              </div>
              <div class="tap-footer-cell">
                <img src="${this.tap.plugin_url}/img/pvfa-footer-logo.png"
                  style="height: 50px; width: auto; background-color: #FFFFFF; padding: 5px; padding-right: 17px;"
                  alt="The School of Performance, Visualization & Fine Arts Texas A&M University" />
              </div>
              <div class="tap-footer-cell">
                <a href="#tap-header-div" class="tap-footer-link ml-auto">^ Back to Top</a>
              </div>
            </div>
        `)
    }
}
