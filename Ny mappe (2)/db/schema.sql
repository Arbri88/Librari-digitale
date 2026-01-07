-- Prefer pgcrypto for UUID generation (works well on vanilla Postgres and Supabase)
create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) unique not null,
  description text null,
  created_at timestamp default current_timestamp
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) unique not null,
  password_hash varchar(255) not null,
  full_name varchar(100) not null,
  role varchar(20) not null default 'user',
  phone varchar(20) null,
  address text null,
  is_active boolean not null default true,
  created_at timestamp not null default current_timestamp,
  updated_at timestamp not null default current_timestamp
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  category_id uuid null references categories(id) on delete set null,
  title varchar(255) not null,
  author varchar(255) not null,
  isbn varchar(20) unique null,
  description text null,
  cover_image_url varchar(500) null,
  total_copies integer not null default 1,
  available_copies integer not null default 1,
  published_year integer null,
  pages integer null,
  language varchar(50) null,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp,
  is_deleted boolean not null default false
);

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  book_id uuid not null references books(id) on delete restrict,
  loan_date timestamp not null default current_timestamp,
  due_date timestamp not null,
  return_date timestamp null,
  status varchar(20) not null default 'active',
  notes text null,
  created_at timestamp not null default current_timestamp
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);
create index if not exists idx_books_title on books(title);
create index if not exists idx_books_author on books(author);
create index if not exists idx_books_isbn on books(isbn);
create index if not exists idx_books_category on books(category_id);
create index if not exists idx_loans_user on loans(user_id);
create index if not exists idx_loans_status on loans(status);
create index if not exists idx_loans_due on loans(due_date);
create index if not exists idx_loans_book on loans(book_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_books_updated_at on books;
create trigger trg_books_updated_at
before update on books
for each row execute function set_updated_at();
