export enum Direction {
  NorthWest = 'NorthWest',
  North = 'North',
  NorthEast = 'NorthEast',
  West = 'West',
  East = 'East',
  SouthWest = 'SouthWest',
  South = 'South',
  SouthEast = 'SouthEast',
}

export class VectorDirection {
  direction: Direction;

  constructor(direction: Direction) {
    this.direction = direction;
  }

  get_opposite_direction(direction?: Direction) {
    let opposite_direction: Direction;

    switch (direction || this.direction) {
      case Direction.NorthWest:
        opposite_direction = Direction.SouthEast;
        break;
      case Direction.North:
        opposite_direction = Direction.South;
        break;
      case Direction.NorthEast:
        opposite_direction = Direction.SouthWest;
        break;
      case Direction.West:
        opposite_direction = Direction.East;
        break;
      case Direction.East:
        opposite_direction = Direction.West;
        break;
      case Direction.SouthWest:
        opposite_direction = Direction.NorthEast;
        break;
      case Direction.South:
        opposite_direction = Direction.North;
        break;
      case Direction.SouthEast:
        opposite_direction = Direction.NorthWest;
        break;
    }

    return opposite_direction;
  }
}
