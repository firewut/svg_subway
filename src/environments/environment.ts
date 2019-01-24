export const environment = {
  production: false,
  debug: true,

  grid_width: 40,
  grid_height: 40,

  line_name_font_size: 25,
  line_name_font_weight: '2em',
  line_name_grid_distance: 50,
  location_marker_radius: 30,
  location_marker_text_size: 20,
  station_font_size: 15,
  station_font_weight: '1.5em',
  station_grid_distance: 80,
  station_line_height: 5,
  station_marker_inner_radius: 7,
  station_marker_outer_radius: 15,

  themes: [
    {
      name: 'dark',
      settings: {
        background_color: '#3a3939',
        debug_grid_color: '#fff',
        transfer_outer_color: '#fff',
        transfer_inner_color: '#666',
        link_under_construction_color: '#aaa',
        link_under_construction_opacity: 0.75,
        line_name_font_color: '#fff',
        station_font_color: '#fff',
        station_marker_inner_color: '#fff',
      }
    }
  ]
};
