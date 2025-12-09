import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-role-selector',
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.scss']
})
export class RoleSelectorComponent {
  @Output() roleSelected = new EventEmitter<'professional' | 'client'>();

  selectRole(role: 'professional' | 'client') {
    this.roleSelected.emit(role);
  }
}
