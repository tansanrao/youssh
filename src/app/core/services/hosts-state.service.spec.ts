import { TestBed } from '@angular/core/testing';

import { HostsStateService } from './hosts-state.service';

describe('HostsStateService', () => {
  let service: HostsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostsStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
