import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue')
    },
    {
      path: '/create-event',
      name: 'create-event',
      component: () => import('../views/CreateEventView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue')
    },
    {
      path: '/edit-profile',
      name: 'edit-profile',
      component: () => import('../views/EditProfileView.vue')
    },
    {
      path: '/event/:id',
      name: 'eventDetail',
      component: () => import('../views/EventDetailView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/user-management',
      name: 'user-management',
      component: () => import('../views/UserManagementView.vue')
    },
    {
      path: '/event-management',
      name: 'event-management',
      component: () => import('../views/EventManagementView.vue')
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('../views/TestView.vue')
    },
    {
      path: '/organizations',
      name: 'organizations',
      component: () => import('../views/OrganizationsView.vue')
    },
    {
      path: '/my-events',
      name: 'my-events',
      component: () => import('../views/MyEventsView.vue')
    },
    {
      path: '/payment-history',
      name: 'payment-history',
      component: () => import('../views/PaymentHistoryView.vue')
    },
    {
      path: '/attendance-records',
      name: 'attendance-records',
      component: () => import('../views/AttendanceRecordsView.vue')
    },
    {
      path: '/event/:id/manage',
      name: 'eventManage',
      component: () => import('../views/EventManageView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/help',
      name: 'help',
      component: () => import('../views/HelpView.vue')
    },
    {
      path: '/checkin',
      name: 'checkin',
      component: () => import('../views/CheckInView.vue')
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue')
    },
    {
      path: '/payment/success',
      name: 'payment-success',
      component: () => import('../views/PaymentSuccessView.vue')
    },
    {
      path: '/my-likes',
      name: 'my-likes',
      component: () => import('../views/MyLikesView.vue')
    },
    {
      path: '/my-favorites',
      name: 'my-favorites',
      component: () => import('../views/MyFavoritesView.vue')
    },
    {
      path: '/my-ratings',
      name: 'my-ratings',
      component: () => import('../views/MyRatingsView.vue')
    },
    {
      path: '/my-comments',
      name: 'my-comments',
      component: () => import('../views/MyCommentsView.vue')
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: () => import('../views/WalletView.vue')
    },
    {
      path: '/settlement-management',
      name: 'settlement-management',
      component: () => import('../views/SettlementManagement.vue')
    },
    {
      path: '/admin-settlement-review',
      name: 'admin-settlement-review',
      component: () => import('../views/AdminSettlementReview.vue')
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue')
    },
    {
    path: '/change-password',
    name: 'change-password',
    component: () => import('../views/ChangePasswordView.vue')
  },
  {
    path: '/followers',
    name: 'followers',
    component: () => import('../views/FollowersView.vue')
  },
  {
    path: '/user/:id',
    name: 'userProfile',
    component: () => import('../views/UserProfileView.vue')
  }
]
})

export default router
