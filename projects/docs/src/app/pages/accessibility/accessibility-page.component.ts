import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../code/code-block.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';

/** The focus ring contrast the page states; the page spec recomputes it from the theme. */
export const RING_CONTRAST = { light: '4.7', dark: '4.2' } as const;

const TARGET_CODE = `/* A component's height never drops below 24px, compact included */
:host {
  block-size: max(
    var(--arn-control-min-size),
    calc(var(--arn-control-height-md) * var(--arn-density))
  );
}`;

const FOCUS_CODE = `/* The ring is shown for keyboard focus, not for a mouse click */
:host:focus-visible {
  outline: var(--arn-ring-width) solid var(--arn-ring);
}`;

const MOTION_CODE = `/* An animation can always be turned off by the user's preference */
@media (prefers-reduced-motion: reduce) {
  :host {
    animation: none;
    transition: none;
  }
}`;

const RTL_CODE = `/* Logical properties only: Stylelint rejects margin-left, padding-right, left… */
:host {
  padding-inline-start: var(--arn-spacing);
  text-align: start;
}`;

const AXE_CODE = `// In the library's own specs. The helper wraps axe-core; it is not part of the package.
import { expectNoA11yViolations } from '../../testing/a11y';

it('has no accessibility violations', async () => {
  const fixture = TestBed.createComponent(MyComponent);

  await fixture.whenStable();
  await expectNoA11yViolations(fixture.nativeElement);
});`;

@Component({
  selector: 'docs-accessibility-page',
  imports: [CodeBlockComponent, DocsSectionComponent, RouterLink],
  templateUrl: './accessibility-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class AccessibilityPageComponent {
  protected readonly ring = RING_CONTRAST;
  protected readonly targetCode = TARGET_CODE;
  protected readonly focusCode = FOCUS_CODE;
  protected readonly motionCode = MOTION_CODE;
  protected readonly rtlCode = RTL_CODE;
  protected readonly axeCode = AXE_CODE;
}
