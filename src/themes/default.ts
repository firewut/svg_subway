import { dark } from './dark';


export const settings = {
  grid: {
    width: 20,
    height: 20,
    overlay: {
      color: '#000',
      opacity: 0.66
    },
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
    dark
  ],
};
