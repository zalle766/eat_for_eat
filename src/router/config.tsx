import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import RestaurantsPage from "../pages/restaurants/page";
import RestaurantPage from "../pages/restaurant/page";
import ProductPage from "../pages/product/page";
import OffersPage from "../pages/offers/page";
import TrackOrderPage from "../pages/track-order/page";
import CartPage from "../pages/cart/page";
import AuthPage from "../pages/auth/page";
import CheckoutPage from '../pages/checkout/page';
import ProfilePage from '../pages/profile/page';
import OrdersPage from '../pages/orders/page';
import FavoritesPage from '../pages/favorites/page';
import RestaurantSignupPage from '../pages/restaurant-signup/page';
import RestaurantLoginPage from '../pages/restaurant-login/page';
import AdminPage from '../pages/admin/page';
import AdminLoginPage from '../pages/admin-login/page';
import RestaurantDashboardPage from '../pages/restaurant-dashboard/page';
import DriverSignupPage from '../pages/driver-signup/page';
import DriverLoginPage from '../pages/driver-login/page';
import DriverDashboardPage from '../pages/driver-dashboard/page';

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/restaurants",
    element: <RestaurantsPage />,
  },
  {
    path: "/restaurant",
    element: <RestaurantPage />,
  },
  {
    path: "/product",
    element: <ProductPage />,
  },
  {
    path: "/offers",
    element: <OffersPage />,
  },
  {
    path: "/track-order",
    element: <TrackOrderPage />,
  },
  {
    path: "/cart",
    element: <CartPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/checkout",
    element: <CheckoutPage />
  },
  {
    path: "/profile",
    element: <ProfilePage />
  },
  {
    path: "/orders",
    element: <OrdersPage />
  },
  {
    path: "/favorites",
    element: <FavoritesPage />
  },
  {
    path: "/restaurant-signup",
    element: <RestaurantSignupPage />
  },
  {
    path: "/restaurant-login",
    element: <RestaurantLoginPage />
  },
  {
    path: "/admin",
    element: <AdminPage />
  },
  {
    path: "/admin-login",
    element: <AdminLoginPage />
  },
  {
    path: '/restaurant-dashboard',
    element: <RestaurantDashboardPage />
  },
  {
    path: '/driver-signup',
    element: <DriverSignupPage />
  },
  {
    path: '/driver-login',
    element: <DriverLoginPage />
  },
  {
    path: '/driver-dashboard',
    element: <DriverDashboardPage />
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
