import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DocsTocService, type DocsTocEntry } from './docs-toc.service';

describe('DocsTocService', () => {
  function entry(id: string): DocsTocEntry {
    return { id: signal(id), heading: signal(id.toUpperCase()) };
  }

  function ids(service: DocsTocService): string[] {
    return service.sections().map((section) => section.id());
  }

  it('starts empty', () => {
    expect(TestBed.inject(DocsTocService).sections()).toEqual([]);
  });

  it('keeps the registration order', () => {
    const service = TestBed.inject(DocsTocService);

    service.register(entry('a'));
    service.register(entry('b'));
    service.register(entry('c'));

    expect(ids(service)).toEqual(['a', 'b', 'c']);
  });

  it('removes exactly the entry that leaves, even when another has the same id', () => {
    const service = TestBed.inject(DocsTocService);
    const first = entry('same');
    const second = entry('same');

    service.register(first);
    service.register(entry('b'));
    service.register(second);
    service.unregister(first);

    expect(ids(service)).toEqual(['b', 'same']);
    expect(service.sections()[1]).toBe(second);
  });

  it('ignores an entry that is not registered', () => {
    const service = TestBed.inject(DocsTocService);

    service.register(entry('a'));
    service.unregister(entry('a'));

    expect(ids(service)).toEqual(['a']);
  });
});
