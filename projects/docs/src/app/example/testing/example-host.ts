import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleComponent } from '../example.component';
import { BasicExampleComponent } from './basic.example';
import html from './basic.example.html?source' with { loader: 'text' };
import ts from './basic.example.ts?source' with { loader: 'text' };
import { StyledExampleComponent } from './styled.example';
import styledCss from './styled.example.css?source' with { loader: 'text' };
import styledHtml from './styled.example.html?source' with { loader: 'text' };
import styledTs from './styled.example.ts?source' with { loader: 'text' };

// Used in specs only: example blocks around real examples, written the way a page writes them.

export const BASIC_EXAMPLE_HTML = html;
export const BASIC_EXAMPLE_TS = ts;
export const STYLED_EXAMPLE_HTML = styledHtml;
export const STYLED_EXAMPLE_TS = styledTs;
export const STYLED_EXAMPLE_CSS = styledCss;

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

/** An example with a stylesheet: the block gets a third tab. */
@Component({
  selector: 'docs-styled-example-host',
  imports: [ExampleComponent, StyledExampleComponent],
  template: `
    <docs-example [html]="html" [ts]="ts" [css]="css"><docs-styled-example /></docs-example>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class StyledExampleHostComponent {
  protected readonly html = styledHtml;
  protected readonly ts = styledTs;
  protected readonly css = styledCss;
}
