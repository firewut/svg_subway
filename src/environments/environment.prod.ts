export const environment = {
  production: true,
  debug: false,

  grid_width: 40,
  grid_height: 40,

  station_grid_distance: 80,
  station_line_height: 5,
  station_font_size: 15,
  station_font_weight: '1.5em',
  station_marker_outer_radius: 15,
  station_marker_inner_radius: 7,

  themes: [
    {
      name: 'dark',
      settings: {
        background_color: '#3a3939',
        debug_grid_color: '#fff',
        transfer_outer_color: '#fff',
        transfer_inner_color: '#666',
        station_under_construction_color: '#eee',
        station_font_color: '#fff',
        station_marker_inner_color: '#fff',
      }
    }
  ]
};
