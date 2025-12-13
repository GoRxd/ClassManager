import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'students',
    loadComponent: () => import('./features/students/pages/student-list/student-list.page').then( m => m.StudentListPage)
  },
  {
    path: 'collections',
    loadComponent: () => import('./features/collections/pages/collection-list/collection-list.page').then( m => m.CollectionListPage)
  },
  {
    path: 'collections/:id',
    loadComponent: () => import('./features/collections/pages/collection-details/collection-details.page').then( m => m.CollectionDetailsPage)
  },
];
