// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  debug: false,
  grid_width: 20,
  grid_height: 20,

  station_grid_distance: 40,
  station_line_width: 5,
  station_font_size: 10,
  station_marker_outer_radius: 10,
  station_marker_inner_radius: 5,

  themes: [
    {
      name: 'dark',
      settings: {
        background_color: '#3a3939',
        debug_grid_color: '#fff',
        transfer_outer_color: '#fff',
        transfer_inner_color: '#000',
        station_under_construction_color: '#eee',
        station_font_color: '#fff',
        station_marker_inner_color: '#fff',
      }
    }
  ]
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
