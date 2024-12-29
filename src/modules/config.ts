import { Module } from './types';

export const moduleConfig: Record<string, Module> = {
  scripture: {
    id: 'scripture',
    name: 'Scripture Memory',
    description: 'Memorize and practice Bible verses',
    enabled: true,
    requiredRole: 'user',
    icon: 'MenuBook',
    routes: ['/verses', '/practice', '/leaderboard']
  },
  acting: {
    id: 'acting',
    name: 'Actor Script Practice',
    description: 'Practice and memorize acting scripts',
    enabled: true,
    requiredRole: 'premium',
    icon: 'TheaterComedy',
    routes: ['/scripts', '/characters', '/practice-lines']
  }
};
