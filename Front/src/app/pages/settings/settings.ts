import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html'
})
export class SettingsPage implements OnInit, OnDestroy {
  profile: any = { name: '', email: '', currency: 'XOF', locale: 'fr-FR', theme: 'light' };
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { settings?: any };
    if (resolved?.settings) {
      this.profile = resolved.settings;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        if (res['settings']) this.profile = res['settings'];
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  save() {
    this.api.updateProfile(this.profile).then(() => alert('Profil mis à jour !'));
  }
}
