import { EventManager } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ResizeService {
  get onResize$(): Observable<Window> {
    return this.resizeSubject.asObservable();
  }

  private resizeSubject: Subject<Window>;

  constructor(private eventManager: EventManager) {
    this.resizeSubject = new Subject();
    this.eventManager.addGlobalEventListener(
      'window',
      'mousewheel',
      this.onResize.bind(this),
    );
  }

  private onResize(event: WheelEvent) {
    if (event.ctrlKey) {
      console.log(event)
      // this.resizeSubject.next(<Window>event.target);
    }
  }
}
