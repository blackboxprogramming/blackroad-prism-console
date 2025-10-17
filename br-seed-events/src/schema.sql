create schema if not exists app;

create table if not exists app.events (
  id          text primary key,
  occurred_at timestamp with time zone not null,
  user_id     text,
  event_name  text not null,              -- e.g., LOGIN, SIGNUP, PAGEVIEW, CLICK, PURCHASE
  payload     jsonb
);

create index if not exists idx_events_occurred_at on app.events(occurred_at);
create index if not exists idx_events_user on app.events(user_id);
create index if not exists idx_events_event on app.events(event_name);
