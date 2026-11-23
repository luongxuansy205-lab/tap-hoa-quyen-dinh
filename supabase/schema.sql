-- Chạy toàn bộ nội dung này trong Supabase > SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Khác',
  price numeric(12,0) not null default 0,
  image text default '',
  description text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  note text default '',
  delivery_zone text not null default 'near',
  subtotal numeric(12,0) not null,
  shipping numeric(12,0) not null,
  total numeric(12,0) not null,
  items jsonb not null,
  status text not null default 'Mới',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (true) with check (true);

drop policy if exists "Customers can submit orders" on public.orders;
create policy "Customers can submit orders" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "Admins read and manage orders" on public.orders;
create policy "Admins read and manage orders" on public.orders for select, update, delete to authenticated using (true) with check (true);

-- Tạo bucket ảnh công khai trong Storage với tên: product-images.
-- Sau đó tạo policy cho phép đọc công khai và chỉ người dùng đăng nhập được tải/sửa/xóa ảnh.
