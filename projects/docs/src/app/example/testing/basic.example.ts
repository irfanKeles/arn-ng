import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'docs-basic-example',
  templateUrl: './basic.example.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicExampleComponent {
  protected readonly count = signal(0);

  protected increment(): void {
    this.count.update((count) => count + 1);
  }
}
