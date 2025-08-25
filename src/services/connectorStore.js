'use strict';

const store = {};

function connect(userId, service){
  if(!userId || !service) return;
  if(!store[userId]) store[userId] = {};
  store[userId][service] = { connectedAt: Date.now() };
}

function revoke(userId, service){
  if(store[userId]) delete store[userId][service];
}

function getStatus(userId){
  const s = store[userId] || {};
  return {
    gmail: !!s.gmail,
    calendar: !!s.calendar,
    contacts: !!s.contacts
  };
}

module.exports = { connect, revoke, getStatus };
