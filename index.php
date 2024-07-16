<?php
/**
 * Plugin Name: TAP
 * Plugin URI: https://texasartproject.org/
 * Description: A plugin for allowing a Wordpress frontend to interface with Corpora
 * Author: Bryan Tarpley
 * Author URI: https://codhr.tamu.edu
 * Version: 1.0.0
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
	    $page = get_page_by_path('artwork');
	    $page_id = $page->ID;
	    add_rewrite_rule('^artwork/([^/]*)/?', 'index.php?page_id=' . $page_id . '&artwork=$matches[1]', 'top');
	}
	add_action('init', 'add_tap_rewrite_rules', 10, 0);


	wp_enqueue_style('dashicons');
	add_action('wp_enqueue_scripts','tap_corpora_enqueue_scripts');

	function tap_corpora_enqueue_scripts()
	{
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
		wp_enqueue_script(
		    'tap-script',
		    plugin_dir_url( __FILE__ ).'js/tap.js',
		    array(
		        'jquery',
		        'jquery-mark',
		        'tap-popper',
		        'tap-tippy',
		        'tap-autocomplete',
		        'tap-openseadragon',
		        'tap-rangeslider-marks',
		        'tap-rangeslider',
		        'tap-leaflet',
		        'tap-leaflet-cluster'
            )
        ); //your javascript library

		// Register CSS
		wp_enqueue_style('jquery-ui-css', plugin_dir_url( __FILE__ ).'css/jquery-ui.min.css');
		wp_enqueue_style('tap-autocomplete-css', plugin_dir_url( __FILE__ ).'css/autoComplete.min.css');
		wp_enqueue_style('tap-leaflet-css', plugin_dir_url( __FILE__ ).'css/leaflet/leaflet.css');
		wp_enqueue_style('tap-leaflet-cluster-css', plugin_dir_url( __FILE__ ).'css/MarkerCluster.css');
		wp_enqueue_style('tap-css', plugin_dir_url( __FILE__ ).'css/tap.css');
	}

	function tap_corpora_inject_footer()
	{
	    $corpora_host = getenv('TAP_CORPORA_HOST');
	    $corpus_id = getenv('TAP_CORPUS_ID');
	    $buck_agent_id = getenv('TAP_BUCK_AGENT_ID');
	    $corpora_token = getenv('TAP_TOKEN');

	    if (!$corpora_token) {
	        $corpora_token = '';
	    }

?>
		<script>
		    let tap = null;
		    let plugin_url = "<?php echo plugin_dir_url( __FILE__ ); ?>"

			jQuery(document).ready(function($)
			{
				tap = new TexasArtProject(
				    '<?=$corpora_host?>',
				    '<?=$corpora_token?>',
				    '<?=$corpus_id?>',
				    '<?=$buck_agent_id?>',
				    plugin_url
                )
			});
		</script>	
<?php		
	}
	add_action('wp_footer', 'tap_corpora_inject_footer');

