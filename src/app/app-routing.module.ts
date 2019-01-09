import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router } from '@angular/router';

import { SubwayComponent } from './components/subway';

const routes: Routes = [
  { path: '', component: SubwayComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
