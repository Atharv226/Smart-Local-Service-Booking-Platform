import CustomerBookings from './CustomerBookings';

// Simple wrapper so history has its own route while reusing the bookings list.
function CustomerHistory() {
  return <CustomerBookings />;
}

export default CustomerHistory;


