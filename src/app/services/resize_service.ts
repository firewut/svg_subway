import { EventManager } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class ResizeService {
  get onResize$(): Observable<WheelEvent> {
    return this.resizeSubject.asObservable();
  }

  private resizeSubject: Subject<WheelEvent>;

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
      this.resizeSubject.next(<WheelEvent>event);
    }
  }
}
