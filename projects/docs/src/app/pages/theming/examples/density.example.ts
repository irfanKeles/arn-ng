import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArnConfigDirective } from '@arn-ng/ui/core';
// The boxes of the previous example: their height comes from the size tokens and density
import { ThemingSizesExampleComponent } from './sizes.example';

@Component({
  selector: 'docs-theming-density-example',
  imports: [ArnConfigDirective, ThemingSizesExampleComponent],
  templateUrl: './density.example.html',
  styleUrl: './density.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingDensityExampleComponent {}
