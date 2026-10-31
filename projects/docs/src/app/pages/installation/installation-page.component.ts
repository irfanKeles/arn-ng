import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '../../code/code-block.component';
import { DocsSectionComponent } from '../../toc/docs-section.component';
import {
  CONFIG_CODE,
  IMPORT_CODE,
  INSTALL_COMMAND,
  LIBRARY_PEERS,
  LOCALE_CODE,
  THEME_CODE,
} from './installation.data';

@Component({
  selector: 'docs-installation-page',
  imports: [CodeBlockComponent, DocsSectionComponent],
  templateUrl: './installation-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'docs-page' },
})
export class InstallationPageComponent {
  protected readonly peers = LIBRARY_PEERS;
  protected readonly installCommand = INSTALL_COMMAND;
  protected readonly themeCode = THEME_CODE;
  protected readonly configCode = CONFIG_CODE;
  protected readonly localeCode = LOCALE_CODE;
  protected readonly importCode = IMPORT_CODE;
}
