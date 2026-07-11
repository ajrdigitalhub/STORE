import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../services/config';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class FooterComponent {
  configService = inject(ConfigService);
  showMarketingPopup = signal(false);

  toggleMarketingPopup(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.showMarketingPopup.update(val => !val);
  }
}
