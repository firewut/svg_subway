import { dark } from './dark';
import { light } from './light';

export const settings = {
  grid: {
    width: 20,
    height: 20,
    overlay: {
      color: '#000',
      opacity: 0.66,
    },
  },
  dialog: {
    station_selection: {
      width: 150,
      height: 50,
      font_size: 25,
      corner_radius: 5,
      text_from: {
        value: 'From',
      },
      text_to: {
        value: 'To',
      },
      inner: {
        rects_padding: 5,
      },
    }
  },
  location_marker: {
    from_marker: 'A',
    to_marker: 'B',
    opacity: .5,
    radius: 20,
    text_size: 15,
  },
  line: {
    width: 5,
    name: {
      font_size: 20,
      font_weight: '2em',
      grid_distance: 40,
    },
    under_construction: {
      dash_width: 20,
    }
  },
  station: {
    font_size: 15,
    font_weight: '1.5em',
    grid_distance: 40,
    marker: {
      inner_radius: 5,
      outer_radius: 10,
    }
  },
  themes: [
    dark,
    light,
  ],
};
