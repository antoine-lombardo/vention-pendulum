export default {
  Base: '/api',
  Users: {
    Base: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Simulation: {
    Base: '/simulation',
    Start: '/start',
    Stop: '/stop',
    Pause: '/pause',
    Resume: '/resume',
    Get: '/',
  },
} as const;
