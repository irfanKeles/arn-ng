import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'docs-styled-example',
  templateUrl: './styled.example.html',
  styleUrl: './styled.example.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StyledExampleComponent {}
