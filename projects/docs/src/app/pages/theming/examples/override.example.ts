import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'docs-theming-override-example',
  templateUrl: './override.example.html',
  styleUrl: './override.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingOverrideExampleComponent {}
