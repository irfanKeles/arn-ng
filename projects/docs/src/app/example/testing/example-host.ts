import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleComponent } from '../example.component';
import { BasicExampleComponent } from './basic.example';
import html from './basic.example.html?source' with { loader: 'text' };
import ts from './basic.example.ts?source' with { loader: 'text' };

// Used in specs only: an example block around a real example, written the way a page writes it.

export const BASIC_EXAMPLE_HTML = html;
export const BASIC_EXAMPLE_TS = ts;

@Component({
  selector: 'docs-example-host',
  imports: [ExampleComponent, BasicExampleComponent],
  template: `<docs-example [html]="html" [ts]="ts"><docs-basic-example /></docs-example>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class ExampleHostComponent {
  protected readonly html = html;
  protected readonly ts = ts;
}
