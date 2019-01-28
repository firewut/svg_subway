import { dark } from './dark';


export const settings = {
  grid_width: 20,
  grid_height: 20,

  location_marker: {
    from_marker: 'A',
    to_marker: 'B',
    opacity: .5,
    radius: 15,
    text_size: 10,
  },
  line: {
    width: 5,
    name: {
      font_size: 15,
      font_weight: '2em',
      grid_distance: 30,
    }
  },
  station: {
    font_size: 9,
    font_weight: '1.5em',
    grid_distance: 40,
    marker: {
      inner_radius: 5,
      outer_radius: 10,
    }
  },

  themes: [
    dark
  ]
};
