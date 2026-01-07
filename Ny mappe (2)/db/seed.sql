insert into categories (name, description) values
('Romane', 'Letërsi artistike dhe romane.'),
('Shkencë', 'Libra shkencorë dhe pop-shkencë.'),
('Teknologji', 'Programim, rrjete, databaza, siguri.')
on conflict (name) do nothing;

-- Admin: Admin123!
insert into users (email, password_hash, full_name, role, is_active)
values ('admin@lms.local',
'$2b$12$TyE7jZO84a1MPrDM7opQTOEguZn/pu1CxFvpd9wNBY8kofJeTK5x.',
'Administrator', 'admin', true)
on conflict (email) do nothing;

-- Users: User123!
insert into users (email, password_hash, full_name, role, is_active) values
('user1@lms.local', '$2b$12$zohqj/JE.eVkgLAc0fDukeqkFvfelMrzd4JSKvQY3Cmhpf0Z7ILUu', 'Arta Hoxha', 'user', true),
('user2@lms.local', '$2b$12$zohqj/JE.eVkgLAc0fDukeqkFvfelMrzd4JSKvQY3Cmhpf0Z7ILUu', 'Erion Dema', 'user', true)
on conflict (email) do nothing;

insert into books (category_id, title, author, isbn, description, total_copies, available_copies, published_year, pages, language)
values
((select id from categories where name='Teknologji'), 'React në Praktikë', 'S. P', null, 'Komponentë, state, hooks.', 5, 5, 2023, 330, 'Shqip'),
((select id from categories where name='Teknologji'), 'PostgreSQL Praktik', 'Eni S', null, 'SQL, indekse, transaksione.', 4, 4, 2021, 380, 'Shqip'),
((select id from categories where name='Romane'), 'Prilli i Thyer', 'Ismail Kadare', '9789994300028', 'Letërsi dhe traditë.', 4, 4, 1978, 210, 'Shqip')
on conflict do nothing;

with u as (select id from users where email='user1@lms.local'),
     b1 as (select id from books where title='React në Praktikë')
insert into loans (user_id, book_id, loan_date, due_date, return_date, status, notes)
select (select id from u), (select id from b1),
       now() - interval '3 days',
       (now() - interval '3 days') + interval '14 days',
       null, 'active', null;

update books set available_copies = greatest(available_copies - 1, 0)
where title in ('React në Praktikë');
