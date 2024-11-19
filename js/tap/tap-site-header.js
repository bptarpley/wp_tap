export class SiteHeader {
    constructor(tap_instance, element) {
        this.tap = tap_instance
        this.element = element

        jQuery('head').append(`<link rel="stylesheet" href="https://use.typekit.net/qbi7knm.css">`)

        this.element.html(`
            <nav class="navbar navbar-expand-md navbar-light bg-light" style="background-color: #FFFFFF!important;">
              <a class="navbar-brand" href="/">Texas Art Project</a>
              <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#tap-navbar" aria-controls="tap-navbar" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="tap-navbar">
                <ul class="navbar-nav ml-auto">
                  <li class="nav-item active">
                    <a class="nav-link" href="/">Home <span class="sr-only">(current)</span></a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/about/">About Us</a>
                  </li>
                  <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-expanded="false">
                      Featured Projects
                    </a>
                    <div class="dropdown-menu bg-light">
                      <b>Buck Schiwetz</b>
                      <hr class="dropdown-divider">
                      <a class="dropdown-item" href="/schiwetz/essay/">Introductory Essay</a>
                      <a class="dropdown-item" href="/">Gallery</a>
                      <a class="dropdown-item" href="/schiwetz/map/">Map and Timeline</a>
                    </div>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="/contact/">Contact Us</a>
                  </li>
                </ul>
              </div>
            </nav>
        `)
    }
}
