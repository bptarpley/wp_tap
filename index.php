<?php
/**
 * Plugin Name: TAP
 * Plugin URI: https://texasartproject.org/
 * Description: A plugin for allowing a Wordpress frontend to interface with Corpora
 * Author: Bryan Tarpley
 * Author URI: https://codhr.tamu.edu
 * Version: 1.2.0
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 *
 * @package CGB
 */

// Exit if accessed directly.
	if (! defined( 'ABSPATH' ) ) 
	{
		exit;
	}

    // -------------------------- //
    // FRONT FACING SITE          //
    // -------------------------- //

	function add_tap_rewrite_rules() {
	    $artwork_page = get_page_by_path('artwork');
	    $artwork_page_id = $artwork_page->ID;
	    add_rewrite_rule('^artwork/([^/]*)/?', 'index.php?page_id=' . $artwork_page_id . '&artwork=$matches[1]', 'top');

	    $ephemera_page = get_page_by_path('ephemera-detail');
        $ephemera_page_id = $ephemera_page->ID;
        add_rewrite_rule('^ephemera-detail/([^/]*)/?', 'index.php?page_id=' . $ephemera_page_id . '&ephemera=$matches[1]', 'top');
	}
	add_action('init', 'add_tap_rewrite_rules', 10, 0);


	wp_enqueue_style('dashicons');
	add_action('wp_enqueue_scripts','tap_corpora_enqueue_scripts');

	function tap_corpora_enqueue_scripts()
	{
	    // Get plugin version for cache busting
        if (!function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        $plugin_data = get_plugin_data(__FILE__);
        $plugin_version = $plugin_data['Version'];

		// Register Javascript
		wp_enqueue_script('jquery');
		wp_enqueue_script('jquery-mark', plugin_dir_url(__FILE__).'js/jquery.mark.min.js');
		wp_enqueue_script('tap-popper', plugin_dir_url(__FILE__).'js/popper.min.js');
		wp_enqueue_script('tap-tippy', plugin_dir_url(__FILE__).'js/tippy-bundle.umd.min.js', array('tap-popper'));
		wp_enqueue_script('tap-autocomplete', plugin_dir_url(__FILE__).'js/autoComplete.min.js');
		wp_enqueue_script('tap-openseadragon', plugin_dir_url(__FILE__).'js/openseadragon/openseadragon.min.js');
		wp_enqueue_script('tap-rangeslider-marks', plugin_dir_url(__FILE__).'js/tcrs-marks.min.js');
		wp_enqueue_script('tap-rangeslider', plugin_dir_url(__FILE__).'js/toolcool-range-slider.min.js');
		wp_enqueue_script('tap-leaflet', plugin_dir_url(__FILE__).'js/leaflet.js');
		wp_enqueue_script('tap-leaflet-cluster', plugin_dir_url(__FILE__).'js/leaflet.markercluster.js');

		// Register CSS
		wp_enqueue_style('jquery-ui-css', plugin_dir_url( __FILE__ ).'css/jquery-ui.min.css');
		wp_enqueue_style('tap-autocomplete-css', plugin_dir_url( __FILE__ ).'css/autoComplete.min.css');
		wp_enqueue_style('tap-leaflet-css', plugin_dir_url( __FILE__ ).'css/leaflet/leaflet.css');
		wp_enqueue_style('tap-leaflet-cluster-css', plugin_dir_url( __FILE__ ).'css/MarkerCluster.css');
		wp_enqueue_style('tap-css', plugin_dir_url( __FILE__ ).'css/tap.css', array(), $plugin_version);
	}

	function tap_corpora_inject_footer()
	{
	    $corpora_host = get_option('corpora_host_field');
	    $corpus_id = get_option('corpora_corpus_field');
	    $corpora_token = getenv('TAP_TOKEN');
	    $plugin_path = plugin_dir_url( __FILE__ );

	    $saved_projects = get_option( 'corpora_projects_field' );
        if (empty($saved_projects)) {
            $saved_projects = "{}";
        } else {
            $saved_projects = str_replace('"', '\"', $saved_projects);
        }

	    // Get plugin version for cache busting
        if (!function_exists('get_plugin_data')) {
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        $plugin_data = get_plugin_data(__FILE__);
        $plugin_version = $plugin_data['Version'];

	    if (!$corpora_token) {
	        $corpora_token = '';
	    }

?>
        <script type="importmap">
            {
              "imports": {
                "tap": "<?=$plugin_path?>/js/tap/tap.js?v=<?=$plugin_version?>",
                "tap-site-header": "<?=$plugin_path?>/js/tap/tap-site-header.js?v=<?=$plugin_version?>",
                "tap-header-image": "<?=$plugin_path?>/js/tap/tap-header-image.js?v=<?=$plugin_version?>",
                "tap-art-grid": "<?=$plugin_path?>/js/tap/tap-art-grid.js?v=<?=$plugin_version?>",
                "tap-art-menu": "<?=$plugin_path?>/js/tap/tap-art-menu.js?v=<?=$plugin_version?>",
                "tap-art-map": "<?=$plugin_path?>/js/tap/tap-art-map.js?v=<?=$plugin_version?>",
                "tap-art-detail": "<?=$plugin_path?>/js/tap/tap-art-detail.js?v=<?=$plugin_version?>",
                "tap-ephemera-menu": "<?=$plugin_path?>/js/tap/tap-ephemera-menu.js?v=<?=$plugin_version?>",
                "tap-ephemera-grid": "<?=$plugin_path?>/js/tap/tap-ephemera-grid.js?v=<?=$plugin_version?>",
                "tap-ephemera-timeline": "<?=$plugin_path?>/js/tap/tap-ephemera-timeline.js?v=<?=$plugin_version?>",
                "tap-ephemera-detail": "<?=$plugin_path?>/js/tap/tap-ephemera-detail.js?v=<?=$plugin_version?>",
                "tap-art-footer": "<?=$plugin_path?>/js/tap/tap-art-footer.js?v=<?=$plugin_version?>"
              }
            }
        </script>
		<script type="module">
            import { TexasArtProject } from '<?=$plugin_path?>js/tap/tap.js'
		    window.tap = null
		    let plugin_url = '<?=$plugin_path?>'
		    let projectsJSON = "<?php echo $saved_projects; ?>"
		    let projects = {}

			jQuery(document).ready(function($)
			{
			    if (projectsJSON) projects = JSON.parse(projectsJSON)

				window.tap = new TexasArtProject(
				    '<?=$corpora_host?>',
				    '<?=$corpora_token?>',
				    '<?=$corpus_id?>',
				    projects,
				    plugin_url
                )
			})
		</script>	
<?php		
	}
	add_action('wp_footer', 'tap_corpora_inject_footer');

    // -------------------------- //
    // ADMIN SIDE OF FENCE        //
    // -------------------------- //

    // Add Corpora page to WP settings in Dashboard
    function corpora_setup_config_menu() {
        add_menu_page(
            'Corpora Configuration',
            'Corpora',
            'manage_options',
            'corpora-config',
            'corpora_render_config_page',
            plugin_dir_url( __FILE__ ).'img/corpora-config.png'
        );
    }
    add_action('admin_menu', 'corpora_setup_config_menu');

    // Render settings page
    function corpora_render_config_page() {
        ?>
            <h1> <?php esc_html_e( 'Corpora Settings', 'corpora-textdomain' ); ?> </h1>
            <form method="POST" action="options.php">
            <?php
            settings_fields( 'corpora-config' );
            do_settings_sections( 'corpora-config' );
            submit_button();
            ?>
            </form>
        <?php
    }

    // Initialize the various settings on the settings page so they can be saved to the WP database
    function corpora_setup_config_settings() {
        add_settings_section(
            'corpora_config_host_section',
            '',
            'corpora_render_config_host_section',
            'corpora-config'
        );

        add_settings_field(
            'corpora_host_field',
            __('Corpora Host', 'corpora-textdomain'),
            'corpora_render_config_host_field',
            'corpora-config',
            'corpora_config_host_section'
        );
        register_setting('corpora-config', 'corpora_host_field');

        add_settings_field(
            'corpora_corpus_field',
            __('Corpus', 'corpora-textdomain'),
            'corpora_render_config_corpus_field',
            'corpora-config',
            'corpora_config_host_section'
        );
        register_setting('corpora-config', 'corpora_corpus_field');

        add_settings_field(
            'corpora_projects_field',
            __('Projects', 'corpora-textdomain'),
            'corpora_render_config_projects_field',
            'corpora-config',
            'corpora_config_host_section'
        );
        register_setting('corpora-config', 'corpora_projects_field');
    }
    add_action( 'admin_init', 'corpora_setup_config_settings' );

    // Render host field
    function corpora_render_config_host_field () {
        ?>
        <input type="text" id="corpora_host_field" name="corpora_host_field" value="<?php echo get_option( 'corpora_host_field' ); ?>" style="width: 100%">
        <div id="corpora_host_field_error_message" style="display: none; font-style: italic;">
            The current value for the Corpora host field is either incorrect or the Corpora host is unreachable.
        </div>
        <?php
    }

    // Render corpus field
    function corpora_render_config_corpus_field () {
        ?><select id="corpora_corpus_field" name="corpora_corpus_field" disabled></select><?php
    }

    // Render projects field
    function corpora_render_config_projects_field () {
        ?>
        <table class="wp-list-table widefat fixed striped table-view-list" style="margin-bottom: 10px;">
            <thead>
                <tr>
                    <th scope="col" class="sortable" style="vertical-align: middle; padding-left: 10px; font-weight: bold;">Project</th>
                    <th scope="col" class="sortable" style="vertical-align: middle; padding-left: 10px; font-weight: bold;">ID</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody id="corpora_projects_table">
                <tr>
                    <td colspan="3">
                        No projects have been defined yet.
                    </td>
                </tr>
            </tbody>
        </table>
        <a href="javascript:corpora_create_project();" class="button button-primary">Create a Project</a>
        <input type="hidden" id="corpora_projects_field" name="corpora_projects_field">
        <?php
    }

    // Render host config section
    function corpora_render_config_host_section() {
        $saved_projects = get_option( 'corpora_projects_field' );
        if (empty($saved_projects)) {
            $saved_projects = "{}";
        } else {
            $saved_projects = str_replace('"', '\"', $saved_projects);
        }

        ?>
        <script type="application/javascript">
            let corporaHostTimer = null
            let corporaHost = "<?php echo get_option( 'corpora_host_field' ); ?>"
            let corpusID = "<?php echo get_option( 'corpora_corpus_field' ); ?>"
            let projects = "<?php echo $saved_projects; ?>"
            let projectCounter = 0

            document.addEventListener('DOMContentLoaded', function() {
                let corporaHostBox = document.getElementById('corpora_host_field')

                corporaHostBox.addEventListener('input', function(event) {
                    clearTimeout(corporaHostTimer)
                    corporaHostTimer = setTimeout(() => {
                        corporaHost = event.target.value
                        setupCorpusBox()
                    }, 2000)
                })

                if (corporaHost) setupCorpusBox()
                if (projects) {
                    projects = JSON.parse(projects)
                    Object.keys(projects).forEach(projName => {
                        corpora_create_project(projName, projects[projName])
                    })
                }
                corpora_serialize_projects()
            })

            function setupCorpusBox() {
                let corporaHostErrorMsgDiv = document.getElementById('corpora_host_field_error_message')
                let corpusBox = document.getElementById('corpora_corpus_field')

                fetch(`${corporaHost}/api/corpus/`)
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok')
                        return response.json()
                    })
                    .then(corporaData => {
                        if (corporaData.records) {
                            corporaData.records.forEach(corpus => {
                                corpusBox.add(new Option(corpus.name, corpus.id, false, corpus.id === corpusID))
                            })

                            corporaHostErrorMsgDiv.style.display = 'none'
                            corpusBox.disabled = false
                        }
                    })
                    .catch(error => {
                        corporaHostErrorMsgDiv.style.display = 'block'
                        corpusBox.disabled = true
                    })
            }

            function corpora_create_project(project_name=null, project_id=null) {
                let projectTable = document.getElementById('corpora_projects_table')
                let projectRow = document.createElement('tr')

                if (projectCounter === 0) projectTable.innerHTML = ''

                projectRow.id = `corpora-project-row-${projectCounter}`
                projectRow.classList.add('corpora-project-config')
                projectRow.setAttribute('data-project_num', projectCounter)
                projectRow.innerHTML = `
                    <td><input type="text" id="corpora-project-name-${projectCounter}" class="corpora-project-config-field" value="${ project_name === null ? '' : project_name }" /></td>
                    <td><input type="text" id="corpora-project-id-${projectCounter}" class="corpora-project-config-field" value="${ project_id === null ? '' : project_id }" /></td>
                    <td>
                        <a href="javascript:corpora_delete_project(${projectCounter});" class="button button-danger">
                            <span class="dashicons dashicons-trash" style="margin-top: 4px;"></span>
                        </a>
                    </td>
                `
                projectTable.appendChild(projectRow)

                let projectFields = document.querySelectorAll('.corpora-project-config-field:not(data-listening)')
                projectFields.forEach(projectField => {
                    projectField.addEventListener('input', corpora_serialize_projects)
                    projectField.setAttribute('data-listening', 'y')
                })

                projectCounter += 1
            }

            function corpora_delete_project(projectNum) {
                let projectRow = document.getElementById(`corpora-project-row-${projectNum}`)
                if (projectRow) projectRow.remove()
                corpora_serialize_projects()
            }

            function corpora_serialize_projects() {
                let projectsField = document.getElementById('corpora_projects_field')
                let projectRows = document.querySelectorAll('.corpora-project-config')
                let projectDict = {}

                projectRows.forEach(projectRow => {
                    let projectNum = projectRow.getAttribute('data-project_num')
                    let projNameBox = document.getElementById(`corpora-project-name-${projectNum}`)
                    let projIDBox = document.getElementById(`corpora-project-id-${projectNum}`)

                    projectDict[projNameBox.value.trim()] = projIDBox.value.trim()
                })

                projectsField.value = JSON.stringify(projectDict)
            }
        </script>
        <?php
    }
