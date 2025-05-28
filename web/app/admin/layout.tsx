/**
 * Admin Layout
 * Layout for merchant admin pages with navigation
 */

"use client";

import React from 'react';
import {
  Frame,
  Navigation,
  TopBar,
  Toast,
  Loading
} from '@shopify/polaris';
import {
  HomeIcon,
  SettingsIcon,
  ChartVerticalIcon,
  GiftCardIcon,
  PersonIcon,
  OrderIcon
} from '@shopify/polaris-icons';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [toastActive, setToastActive] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [toastError, setToastError] = React.useState(false);

  // Navigation items for admin
  const navigationMarkup = (
    <Navigation location="/admin">
      <Navigation.Section
        items={[
          {
            url: '/admin',
            label: 'Dashboard',
            icon: HomeIcon,
            exactMatch: true,
          },
          {
            url: '/admin/tiers',
            label: 'Tier Management',
            icon: PersonIcon,
          },
          {
            url: '/admin/rewards',
            label: 'Rewards Catalog',
            icon: GiftCardIcon,
          },
          {
            url: '/admin/analytics',
            label: 'Analytics',
            icon: ChartVerticalIcon,
          },
          {
            url: '/admin/settings',
            label: 'Settings',
            icon: SettingsIcon,
          },
        ]}
      />

      <Navigation.Section
        title="Tools"
        items={[
          {
            url: '/admin/customers',
            label: 'Customer Lookup',
            icon: PersonIcon,
          },
          {
            url: '/admin/transactions',
            label: 'Points History',
            icon: OrderIcon,
          },
          {
            url: '/webhooks-dashboard',
            label: 'Webhook Monitor',
            icon: SettingsIcon,
          },
        ]}
      />
    </Navigation>
  );

  // Top bar with app info
  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      userMenu={
        <TopBar.UserMenu
          actions={[
            {
              items: [
                {
                  content: 'Help & Support',
                  url: '/admin/help',
                },
                {
                  content: 'App Settings',
                  url: '/admin/settings',
                },
              ],
            },
          ]}
          name="Loyalty Admin"
          detail="Comeback Loyalty Program"
          initials="LA"
        />
      }
    />
  );

  // Toast for notifications
  const toastMarkup = toastActive ? (
    <Toast
      content={toastMessage}
      error={toastError}
      onDismiss={() => setToastActive(false)}
    />
  ) : null;

  // Loading indicator
  const loadingMarkup = isLoading ? <Loading /> : null;

  // Context for child components to show toasts and loading
  const adminContext = React.useMemo(() => ({
    showToast: (message: string, isError = false) => {
      setToastMessage(message);
      setToastError(isError);
      setToastActive(true);
    },
    setLoading: setIsLoading,
  }), []);

  return (
    <div style={{ height: '100vh' }}>
      <Frame
        topBar={topBarMarkup}
        navigation={navigationMarkup}
        showMobileNavigation={false}
        skipToContentTarget="main-content"
      >
        <AdminContext.Provider value={adminContext}>
          <main id="main-content">
            {children}
          </main>
        </AdminContext.Provider>
        {toastMarkup}
        {loadingMarkup}
      </Frame>
    </div>
  );
}

// Context for admin functionality
export const AdminContext = React.createContext<{
  showToast: (message: string, isError?: boolean) => void;
  setLoading: (loading: boolean) => void;
}>({
  showToast: () => {},
  setLoading: () => {},
});

// Hook to use admin context
export function useAdmin() {
  const context = React.useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminLayout');
  }
  return context;
}
