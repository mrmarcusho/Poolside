# Poolside
A social media app for your cruise

Poolside
Overview

Poolside is a cruise-specific social media application.

Each cruise acts as its own isolated social network.
Users can only see content created by other people on the same cruise.

There is no global feed and no cross-cruise visibility.

Core Concept

A cruise = a temporary social space

Content exists only for the duration of the cruise

Users join exactly one cruise at a time

When the cruise ends, the feed and events expire

What the App Allows Users to Do
1. Create an Account

Users must create an account before accessing any content

Age must be collected at signup

Age is required for content filtering and safety

Age should be stored as either:

date of birth (preferred), or

age range (fallback)

2. Join a Specific Cruise

Each user is associated with a specific cruise ID

Users can only:

see content from that cruise

post content to that cruise

Cruises are isolated from each other

Feed Functionality
Cruise Feed

The feed is shared among all users on the same cruise

Feed items can be:

text posts

event posts (see below)

Visibility Rules

Feed items are only visible to:

users on the same cruise

users within the allowed age range for that content

Events (Core Feature)
Creating an Event

Users can post an event card to the cruise feed.

Example:

“Meet by the pool at 4 PM”

An event includes:

Title

Description

Date & time

Optional location (e.g., pool, bar, deck)

Creator user ID

Cruise ID

Target age range

Event Age Filtering

Every event has an intended age range

Example: 18–22, 21–25, 25–30

Only users whose age falls within that range can see the event

Users outside the range:

should not see the event at all

should not be able to RSVP

This filtering must happen:

server-side (required)

optionally client-side (for UX)

RSVP System

Users who can see an event can:

RSVP “Going”

RSVP “Interested” (optional)

RSVP list is visible only to:

the event creator

other eligible users (same cruise + age range)

Age Handling (Important)
Why Age Is Required

Safety

Social comfort

Preventing inappropriate interactions

Requirements

Age must be collected at signup

Age must be verified to a reasonable degree (exact method TBD)

Age must be used to:

filter events

filter feed visibility when applicable

Data Handling

Age data should be:

minimally stored

not publicly displayed unless needed

Prefer date of birth → computed age, not raw age input

Privacy & Scope Rules

Users cannot see:

content from other cruises

content outside their age range

No follower system

No public profiles

No search across cruises

High-Level Data Model (Conceptual)

User

id

cruise_id

date_of_birth

age (derived)

created_at

Cruise

id

name

start_date

end_date

Post

id

cruise_id

creator_user_id

content

created_at

Event

id

cruise_id

creator_user_id

title

description

event_time

age_min

age_max

created_at

RSVP

user_id

event_id

status

Non-Goals (Explicitly Out of Scope)

Global social feed

Permanent social graph

Influencer metrics

Likes, followers, or algorithms

Cross-cruise discovery

Design Philosophy

Temporary, not permanent

Location-based, not global

Low-pressure, not performative

Safety-first by default

Status

Poolside is an early-stage project.
This README defines product behavior, not final UI or infrastructure.

If you want, next I can:

Convert this into a technical spec

Add API endpoint definitions

Add database schema (SQL)

Write acceptance criteria / invariants

Add a Claude-friendly TODO roadmap

Just tell me what the next step is.
