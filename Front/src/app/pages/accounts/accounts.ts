import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { formatCFA } from '../../services/format';
import type { Account } from '../../models';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.css']
})
export class AccountsPage implements OnInit, OnDestroy {
  accounts: Account[] = [];
  showForm = false;
  form: Partial<Account> = { name: '', type: 'checking', balance: 0, color: '#0f172a' };

  showTransfer = false;
  transferForm = { fromAccountId: '', toAccountId: '', amount: null as number | null, description: '' };
  transferMsg = '';

  showDeposit = false;
  depositForm = { accountId: null as number | null, amount: null as number | null, description: '', date: new Date().toISOString().slice(0, 10) };
  depositMsg = '';
  private dataSub?: Subscription;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const resolved = this.route.snapshot.data as { accounts?: Account[] };
    if (resolved?.accounts) {
      this.accounts = resolved.accounts;
    } else {
      this.dataSub = this.route.data.subscribe(res => {
        this.accounts = res['accounts'] || [];
      });
    }
  }

  ngOnDestroy() { this.dataSub?.unsubscribe(); }

  load() { this.api.getAccounts().then(d => { this.accounts = d; this.transferForm.fromAccountId = ''; this.transferForm.toAccountId = ''; }); }

  format = formatCFA;

  create() {
    this.api.createAccount(this.form as any).then(() => { this.load(); this.showForm = false; this.form = { name: '', type: 'checking', balance: 0, color: '#0f172a' }; });
  }

  startDeposit(accountId: number) {
    this.depositForm = { accountId, amount: null, description: '', date: new Date().toISOString().slice(0, 10) };
    this.depositMsg = '';
    this.showDeposit = true;
  }

  submitDeposit() {
    const accountId = this.depositForm.accountId;
    const amount = this.depositForm.amount || 0;
    if (!accountId || amount <= 0) {
      this.depositMsg = 'Veuillez saisir un montant valide.';
      return;
    }
    this.api.depositAccount(accountId, amount, { description: this.depositForm.description, date: this.depositForm.date }).then(() => {
      this.load();
      this.showDeposit = false;
      this.depositMsg = 'Approvisionnement effectué.';
      setTimeout(() => this.depositMsg = '', 3000);
    }).catch((err: any) => {
      this.depositMsg = err.message || 'Erreur lors de l\'approvisionnement';
    });
  }

  cancelDeposit() {
    this.showDeposit = false;
    this.depositMsg = '';
  }

  deleteAccount(id: number) {
    if (confirm('Supprimer ce compte ?')) this.api.deleteAccount(id).then(() => this.load());
  }

  doTransfer() {
    const from = Number(this.transferForm.fromAccountId);
    const to = Number(this.transferForm.toAccountId);
    const amount = this.transferForm.amount || 0;
    if (!from || !to || amount <= 0) { this.transferMsg = 'Veuillez remplir tous les champs'; return; }
    if (from === to) { this.transferMsg = 'Comptes source et destination identiques'; return; }
    this.api.transfer(from, to, amount, this.transferForm.description).then(res => {
      this.transferMsg = res.message || 'Virement effectué';
      setTimeout(() => { this.transferMsg = ''; this.showTransfer = false; }, 2000);
      this.load();
    }).catch((err: any) => {
      this.transferMsg = err.message || 'Erreur lors du virement';
    });
  }

  getNonCreditAccounts() { return this.accounts.filter(a => a.type !== 'credit'); }
}
