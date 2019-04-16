import { Component, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material';

import { City } from '../classes/city';
import { Station } from '../classes/station';
import { StationTransfer } from '../classes/transfer';

@Component({
  selector: 'app-subway-route-overview-sheet',
  templateUrl: './route-overview-sheet.html',
})
export class RouteOverviewSheetComponent {
  active_route: any[] = [];
  start?: Station;
  finish?: Station;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<RouteOverviewSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public city: City
  ) {
    this.active_route = [];
    if (city) {
      if (city.active_route_group_for_overview.length > 0) {
        for (const item of city.active_route_group_for_overview) {
          if (item instanceof Station) {
            if (item.valid_for_overview()) {
              this.active_route.push(item);
            }
          }
          if (item instanceof StationTransfer) {
            this.active_route.push(item);
          }
        }
      }
      this.start = city.router.from;
      this.finish = city.router.to;
    }
  }

  // openLink(event: MouseEvent) {
  //   this.bottomSheetRef.dismiss();

  //   event.preventDefault();
  // }
}
