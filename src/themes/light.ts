export const light = {
  name: 'light',
  settings: {
    overlay_color: '#FFFFFF',
    background_color: '#FFFFFF',
    debug_grid_color: '#000',
    dialog: {
      station_selection: {
        font_color: '#FFFFFF',
        background_color: '#000000',
        button_background_color: '#457AB2',
      }
    },
    line: {
      name: {
        font_color: '#000',
      }
    },
    link: {
      under_construction: {
        connector_color: '#FFEB3A',
        dashed_connector_color: '#000000',
      },
    },
    location_marker: {
      text_color: '#000',
    },
    station: {
      font_color: '#000',
      under_construction: {
        font_color: '#333'
      },
      marker: {
        inner_color: '#FFFFFF',
        under_construction: {
          outer_color: '#000000',
          inner_color: '#FFEB3A',
        }
      },
    },
    transfer: {
      inner_color: '#666',
      outer_color: '#AAA',
    }
  }
};
