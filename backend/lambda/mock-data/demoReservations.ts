import { Booking, Listing } from '../types';

export const demoListings: Listing[] = [
  { id: '1', name: '1124 Chapman Avenue', thumbnail: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=100&h=100&fit=crop', channels: ['airbnb', 'vrbo'] },
  { id: '2', name: '430 Church Bedford Hills', thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=100&h=100&fit=crop', channels: ['airbnb'] },
  { id: '3', name: '801 Campbell Unit A', thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=100&fit=crop', channels: ['airbnb', 'direct'] },
  { id: '4', name: '801 Campbell Unit B', thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=100&h=100&fit=crop', channels: ['vrbo'] },
  { id: '5', name: '801 Campbell Unit C', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100&h=100&fit=crop', channels: ['airbnb', 'vrbo'] },
  { id: '6', name: 'Montrose Downstairs', thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=100&h=100&fit=crop', channels: ['airbnb'] },
  { id: '7', name: 'Montrose Upstairs', thumbnail: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=100&h=100&fit=crop', channels: ['direct'] },
  { id: '8', name: 'Teardrop Trailer', thumbnail: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=100&h=100&fit=crop', channels: ['airbnb', 'vrbo'] },
  { id: '9', name: 'West End 102', thumbnail: 'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=100&h=100&fit=crop', channels: ['vrbo'] },
  { id: '10', name: 'West End 105', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=100&h=100&fit=crop', channels: ['airbnb'] },
];

export const demoBookings: Booking[] = [
  { id: 'b1', listingId: '1', guestName: 'Richard Thompson', source: 'airbnb', startDate: '2020-09-25T15:00', endDate: '2020-10-05T11:00' },
  { id: 'b2', listingId: '1', guestName: 'Kate Anderson', source: 'airbnb', startDate: '2020-10-06T15:00', endDate: '2020-10-15T11:00' },
  { id: 'b3', listingId: '1', guestName: 'John Smith', source: 'vrbo', startDate: '2020-11-20T15:00', endDate: '2020-12-05T11:00' },
  { id: 'b5', listingId: '2', guestName: 'Christa Lee', source: 'vrbo', startDate: '2020-09-02T16:00', endDate: '2020-09-07T10:00' },
  { id: 'b6', listingId: '2', guestName: 'Jacob Brown', source: 'airbnb', startDate: '2020-09-28T15:00', endDate: '2020-10-10T11:00' },
  { id: 'b7', listingId: '2', guestName: 'Sarah Wilson', source: 'airbnb', startDate: '2020-10-15T15:00', endDate: '2020-10-22T11:00' },
  { id: 'b8', listingId: '3', guestName: 'Francisco Davis', source: 'direct', startDate: '2020-09-02T14:00', endDate: '2020-09-04T11:00' },
  { id: 'b9', listingId: '3', guestName: 'Stacia Miller', source: 'airbnb', startDate: '2020-09-26T16:00', endDate: '2020-10-08T10:00' },
  { id: 'b10', listingId: '3', guestName: 'Mike Johnson', source: 'direct', startDate: '2020-10-10T15:00', endDate: '2020-10-18T11:00' },
  { id: 'b11', listingId: '4', guestName: 'Muhammad Ali', source: 'vrbo', startDate: '2020-09-02T15:00', endDate: '2020-09-25T11:00' },
  { id: 'b12', listingId: '4', guestName: 'Lisa Chen', source: 'vrbo', startDate: '2020-09-27T15:00', endDate: '2020-10-12T11:00' },
  { id: 'b13', listingId: '5', guestName: 'Erin Walsh', source: 'airbnb', startDate: '2020-09-02T16:00', endDate: '2020-09-05T10:00' },
  { id: 'b14', listingId: '5', guestName: 'Michelle Park', source: 'vrbo', startDate: '2020-09-29T15:00', endDate: '2020-10-06T11:00' },
  { id: 'b15', listingId: '5', guestName: 'Bryant Cooper', source: 'airbnb', startDate: '2020-10-08T16:00', endDate: '2020-10-15T10:00' },
  { id: 'b16', listingId: '5', guestName: 'Brad Foster', source: 'direct', startDate: '2020-10-16T15:00', endDate: '2020-10-25T11:00' },
  { id: 'b17', listingId: '6', guestName: 'Dakota Reed', source: 'airbnb', startDate: '2020-09-28T14:00', endDate: '2020-10-04T11:00' },
  { id: 'b18', listingId: '6', guestName: 'Timothy Bell', source: 'vrbo', startDate: '2020-10-05T16:00', endDate: '2020-10-12T10:00' },
  { id: 'b19', listingId: '7', guestName: 'Evan Morris', source: 'direct', startDate: '2020-09-25T15:00', endDate: '2020-10-03T11:00' },
  { id: 'b20', listingId: '7', guestName: 'Daniel Torres', source: 'direct', startDate: '2020-10-05T16:00', endDate: '2020-10-14T10:00' },
  { id: 'b21', listingId: '8', guestName: 'Haley Barnes', source: 'airbnb', startDate: '2020-09-26T14:00', endDate: '2020-10-07T11:00' },
  { id: 'b22', listingId: '8', guestName: 'Lauren Benson', source: 'vrbo', startDate: '2020-10-10T15:00', endDate: '2020-10-18T11:00' },
  { id: 'b23', listingId: '9', guestName: 'Jack Peterson', source: 'vrbo', startDate: '2020-09-27T16:00', endDate: '2020-10-06T10:00' },
  { id: 'b24', listingId: '9', guestName: 'Marlayna Powell', source: 'vrbo', startDate: '2020-10-08T15:00', endDate: '2020-10-17T11:00' },
  { id: 'b25', listingId: '10', guestName: 'Gina Howard', source: 'airbnb', startDate: '2020-09-24T14:00', endDate: '2020-10-02T11:00' },
  { id: 'b26', listingId: '10', guestName: 'Clark Torres', source: 'vrbo', startDate: '2020-10-04T16:00', endDate: '2020-10-11T10:00' },
  { id: 'b27', listingId: '10', guestName: 'Emily Kelly', source: 'airbnb', startDate: '2020-10-13T15:00', endDate: '2020-10-22T11:00' }
];

