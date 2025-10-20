<?php
/**
 * Plugin Name: TAP
 * Plugin URI: https://texasartproject.org/
 * Description: A plugin for allowing a Wordpress frontend to interface with Corpora
 * Author: Bryan Tarpley
 * Author URI: https://codhr.tamu.edu
 * Version: 1.0.4
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
	    $corpora_host = getenv('TAP_CORPORA_HOST');
	    $corpus_id = getenv('TAP_CORPUS_ID');
	    $buck_project_id = getenv('TAP_BUCK_PROJECT_ID');
	    $dwg_project_id = getenv('TAP_DWG_PROJECT_ID');
	    $corpora_token = getenv('TAP_TOKEN');
	    $plugin_path = plugin_dir_url( __FILE__ );

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
		    let projects = {
		        'buck': '<?=$buck_project_id?>',
		        'dwg': '<?=$dwg_project_id?>'
		    }

			jQuery(document).ready(function($)
			{
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

