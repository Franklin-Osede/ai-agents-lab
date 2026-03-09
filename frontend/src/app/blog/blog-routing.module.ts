import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogListComponent } from './components/blog-list/blog-list.component';
import { AuthGuard } from '../shared/guards/auth.guard';
import { BlogDetailComponent } from './components/blog-detail/blog-detail.component';
import { BlogDraftsComponent } from './components/blog-drafts/blog-drafts.component';

import { BlogEditorComponent } from './components/blog-editor/blog-editor.component';

const routes: Routes = [
  { path: '', component: BlogListComponent },
  { path: 'admin', component: BlogDraftsComponent, canActivate: [AuthGuard] },
  { path: 'admin/new', component: BlogEditorComponent, canActivate: [AuthGuard] },
  { path: ':slug', component: BlogDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogRoutingModule { }
